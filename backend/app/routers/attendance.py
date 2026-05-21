"""Attendance endpoints: punch in/out, history, summary."""
from datetime import datetime, timezone, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_
from ..database import get_db
from ..models import Attendance, User, Activity
from ..schemas import AttendanceOut, AttendanceCreate
from ..deps import get_current_user

router = APIRouter(prefix="/attendance", tags=["attendance"])


@router.post("/punch-in", response_model=AttendanceOut)
def punch_in(payload: AttendanceCreate, db: Session = Depends(get_db),
             user: User = Depends(get_current_user)):
    active = db.query(Attendance).filter(
        and_(Attendance.user_id == user.id, Attendance.punch_out.is_(None))
    ).first()
    if active:
        raise HTTPException(status_code=400, detail="Already punched in")
    record = Attendance(user_id=user.id, punch_in=datetime.now(timezone.utc), note=payload.note)
    db.add(record)
    db.add(Activity(user_id=user.id, action="punched_in", entity_type="attendance",
                    entity_id=record.id, description="Punched in"))
    db.commit()
    db.refresh(record)
    return record


@router.post("/punch-out", response_model=AttendanceOut)
def punch_out(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    active = db.query(Attendance).filter(
        and_(Attendance.user_id == user.id, Attendance.punch_out.is_(None))
    ).order_by(Attendance.punch_in.desc()).first()
    if not active:
        raise HTTPException(status_code=400, detail="Not currently punched in")
    now = datetime.now(timezone.utc)
    active.punch_out = now
    pin = active.punch_in
    if pin.tzinfo is None:
        pin = pin.replace(tzinfo=timezone.utc)
    active.duration_seconds = int((now - pin).total_seconds())
    db.add(Activity(user_id=user.id, action="punched_out", entity_type="attendance",
                    entity_id=active.id,
                    description=f"Punched out ({active.duration_seconds // 60} min)"))
    db.commit()
    db.refresh(active)
    return active


@router.get("/active", response_model=Optional[AttendanceOut])
def get_active(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return db.query(Attendance).filter(
        and_(Attendance.user_id == user.id, Attendance.punch_out.is_(None))
    ).order_by(Attendance.punch_in.desc()).first()


@router.get("", response_model=List[AttendanceOut])
def history(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
    user_id: Optional[str] = Query(None),
    limit: int = Query(50, le=200),
):
    query = db.query(Attendance)
    if user.role == "admin" and user_id:
        query = query.filter(Attendance.user_id == user_id)
    else:
        query = query.filter(Attendance.user_id == user.id)
    return query.order_by(Attendance.punch_in.desc()).limit(limit).all()


@router.get("/summary")
def summary(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """Last 7 days summary for the current user."""
    today = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    days = []
    for offset in range(6, -1, -1):
        day_start = today - timedelta(days=offset)
        day_end = day_start + timedelta(days=1)
        records = db.query(Attendance).filter(
            Attendance.user_id == user.id,
            Attendance.punch_in >= day_start,
            Attendance.punch_in < day_end,
        ).all()
        total_seconds = sum(r.duration_seconds or 0 for r in records)
        days.append({
            "date": day_start.date().isoformat(),
            "day": day_start.strftime("%a"),
            "hours": round(total_seconds / 3600, 2),
            "sessions": len(records),
        })
    return {"days": days, "total_hours_week": round(sum(d["hours"] for d in days), 2)}
