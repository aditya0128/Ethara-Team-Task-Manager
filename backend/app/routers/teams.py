"""Team management endpoints (admin only for create/update/delete)."""
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Team, User, Activity
from ..schemas import TeamCreate, TeamUpdate, TeamOut
from ..deps import get_current_user, require_admin

router = APIRouter(prefix="/teams", tags=["teams"])


def _assign_members(db: Session, team: Team, member_ids: List[str]):
    members = db.query(User).filter(User.id.in_(member_ids)).all() if member_ids else []
    team.members = members


@router.get("", response_model=List[TeamOut])
def list_teams(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    if user.role == "admin":
        return db.query(Team).order_by(Team.created_at.desc()).limit(500).all()
    return [t for t in user.teams]


@router.post("", response_model=TeamOut)
def create_team(payload: TeamCreate, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    team = Team(
        name=payload.name,
        description=payload.description,
        color=payload.color or "#F97316",
        created_by=admin.id,
    )
    db.add(team)
    db.flush()
    _assign_members(db, team, payload.member_ids)
    db.add(Activity(user_id=admin.id, action="created_team", entity_type="team",
                    entity_id=team.id, description=f"Created team '{team.name}'"))
    db.commit()
    db.refresh(team)
    return team


@router.get("/{team_id}", response_model=TeamOut)
def get_team(team_id: str, db: Session = Depends(get_db), _user: User = Depends(get_current_user)):
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    return team


@router.patch("/{team_id}", response_model=TeamOut)
def update_team(team_id: str, payload: TeamUpdate, db: Session = Depends(get_db),
                _admin: User = Depends(require_admin)):
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    data = payload.model_dump(exclude_unset=True)
    member_ids = data.pop("member_ids", None)
    for field, value in data.items():
        setattr(team, field, value)
    if member_ids is not None:
        _assign_members(db, team, member_ids)
    db.commit()
    db.refresh(team)
    return team


@router.delete("/{team_id}")
def delete_team(team_id: str, db: Session = Depends(get_db), _admin: User = Depends(require_admin)):
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    db.delete(team)
    db.commit()
    return {"ok": True}
