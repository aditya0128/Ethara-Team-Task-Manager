"""Task management endpoints (Kanban-friendly)."""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from ..database import get_db
from ..models import Task, User, Activity, Project
from ..schemas import TaskCreate, TaskUpdate, TaskOut
from ..deps import get_current_user

router = APIRouter(prefix="/tasks", tags=["tasks"])


@router.get("", response_model=List[TaskOut])
def list_tasks(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
    project_id: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    assignee_id: Optional[str] = Query(None),
    q: Optional[str] = Query(None),
):
    query = db.query(Task)
    if user.role != "admin":
        query = query.filter(or_(Task.assignee_id == user.id, Task.created_by == user.id))
    if project_id:
        query = query.filter(Task.project_id == project_id)
    if status:
        query = query.filter(Task.status == status)
    if assignee_id:
        query = query.filter(Task.assignee_id == assignee_id)
    if q:
        like = f"%{q}%"
        query = query.filter(or_(Task.title.ilike(like), Task.description.ilike(like)))
    return query.order_by(Task.created_at.desc()).all()


@router.post("", response_model=TaskOut)
def create_task(payload: TaskCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    if payload.project_id:
        proj = db.query(Project).filter(Project.id == payload.project_id).first()
        if not proj:
            raise HTTPException(status_code=400, detail="Project not found")
    task = Task(
        title=payload.title,
        description=payload.description,
        status=payload.status or "todo",
        priority=payload.priority or "medium",
        due_date=payload.due_date,
        project_id=payload.project_id,
        assignee_id=payload.assignee_id or user.id,
        created_by=user.id,
    )
    db.add(task)
    db.flush()
    db.add(Activity(user_id=user.id, action="created_task", entity_type="task",
                    entity_id=task.id, description=f"Created task '{task.title}'"))
    db.commit()
    db.refresh(task)
    return task


@router.get("/{task_id}", response_model=TaskOut)
def get_task(task_id: str, db: Session = Depends(get_db), _user: User = Depends(get_current_user)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task


@router.patch("/{task_id}", response_model=TaskOut)
def update_task(task_id: str, payload: TaskUpdate, db: Session = Depends(get_db),
                user: User = Depends(get_current_user)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    if user.role != "admin" and task.assignee_id != user.id and task.created_by != user.id:
        raise HTTPException(status_code=403, detail="Not allowed to edit this task")
    prev_status = task.status
    data = payload.model_dump(exclude_unset=True)
    for field, value in data.items():
        setattr(task, field, value)
    if "status" in data and data["status"] == "done" and prev_status != "done":
        db.add(Activity(user_id=user.id, action="completed_task", entity_type="task",
                        entity_id=task.id, description=f"Completed task '{task.title}'"))
    db.commit()
    db.refresh(task)
    return task


@router.delete("/{task_id}")
def delete_task(task_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    if user.role != "admin" and task.created_by != user.id:
        raise HTTPException(status_code=403, detail="Not allowed to delete this task")
    db.delete(task)
    db.commit()
    return {"ok": True}
