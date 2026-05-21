"""Project management endpoints."""
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Project, User, Activity, Task
from ..schemas import ProjectCreate, ProjectUpdate, ProjectOut
from ..deps import get_current_user, require_admin

router = APIRouter(prefix="/projects", tags=["projects"])


def _serialize(project: Project, db: Session) -> ProjectOut:
    total = db.query(Task).filter(Task.project_id == project.id).count()
    done = db.query(Task).filter(Task.project_id == project.id, Task.status == "done").count()
    out = ProjectOut.model_validate(project)
    out.task_count = total
    out.completed_task_count = done
    return out


@router.get("", response_model=List[ProjectOut])
def list_projects(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    if user.role == "admin":
        projects = db.query(Project).order_by(Project.created_at.desc()).limit(500).all()
    else:
        # member sees projects they're a member of OR created
        projects = [p for p in user.projects]
        owned = db.query(Project).filter(Project.created_by == user.id).all()
        ids = {p.id for p in projects}
        for p in owned:
            if p.id not in ids:
                projects.append(p)
    return [_serialize(p, db) for p in projects]


@router.post("", response_model=ProjectOut)
def create_project(payload: ProjectCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    # Members can create their own personal projects too
    project = Project(
        name=payload.name,
        description=payload.description,
        status=payload.status or "active",
        priority=payload.priority or "medium",
        progress=payload.progress or 0,
        start_date=payload.start_date,
        due_date=payload.due_date,
        team_id=payload.team_id,
        created_by=user.id,
    )
    db.add(project)
    db.flush()
    member_ids = list(payload.member_ids or [])
    if user.id not in member_ids:
        member_ids.append(user.id)
    project.members = db.query(User).filter(User.id.in_(member_ids)).all()
    db.add(Activity(user_id=user.id, action="created_project", entity_type="project",
                    entity_id=project.id, description=f"Created project '{project.name}'"))
    db.commit()
    db.refresh(project)
    return _serialize(project, db)


@router.get("/{project_id}", response_model=ProjectOut)
def get_project(project_id: str, db: Session = Depends(get_db), _user: User = Depends(get_current_user)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return _serialize(project, db)


@router.patch("/{project_id}", response_model=ProjectOut)
def update_project(project_id: str, payload: ProjectUpdate, db: Session = Depends(get_db),
                   user: User = Depends(get_current_user)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    if user.role != "admin" and project.created_by != user.id:
        raise HTTPException(status_code=403, detail="Not allowed to edit this project")
    data = payload.model_dump(exclude_unset=True)
    member_ids = data.pop("member_ids", None)
    for field, value in data.items():
        setattr(project, field, value)
    if member_ids is not None:
        project.members = db.query(User).filter(User.id.in_(member_ids)).all()
    db.commit()
    db.refresh(project)
    return _serialize(project, db)


@router.delete("/{project_id}")
def delete_project(project_id: str, db: Session = Depends(get_db), _admin: User = Depends(require_admin)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    db.delete(project)
    db.commit()
    return {"ok": True}
