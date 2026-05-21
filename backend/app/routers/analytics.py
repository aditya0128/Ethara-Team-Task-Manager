"""Analytics endpoints (admin dashboard and member dashboard)."""
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from ..database import get_db
from ..models import User, Team, Project, Task, Attendance, Activity
from ..deps import get_current_user, require_admin

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/admin")
def admin_overview(db: Session = Depends(get_db), _admin: User = Depends(require_admin)):
    total_users = db.query(User).count()
    total_admins = db.query(User).filter(User.role == "admin").count()
    total_members = db.query(User).filter(User.role == "member").count()
    total_teams = db.query(Team).count()
    total_projects = db.query(Project).count()
    active_projects = db.query(Project).filter(Project.status == "active").count()
    total_tasks = db.query(Task).count()
    done_tasks = db.query(Task).filter(Task.status == "done").count()

    # Task status distribution
    statuses = ["todo", "in_progress", "review", "done"]
    task_by_status = {}
    for s in statuses:
        task_by_status[s] = db.query(Task).filter(Task.status == s).count()

    # Last 7 days attendance hours (sum across all users)
    today = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    weekly = []
    for offset in range(6, -1, -1):
        day_start = today - timedelta(days=offset)
        day_end = day_start + timedelta(days=1)
        total = db.query(func.coalesce(func.sum(Attendance.duration_seconds), 0)).filter(
            Attendance.punch_in >= day_start, Attendance.punch_in < day_end
        ).scalar() or 0
        weekly.append({
            "day": day_start.strftime("%a"),
            "date": day_start.date().isoformat(),
            "hours": round(total / 3600, 2),
        })

    # Top performers (by completed tasks)
    top_users_raw = (
        db.query(User.id, User.name, User.avatar_url, func.count(Task.id).label("completed"))
        .outerjoin(Task, (Task.assignee_id == User.id) & (Task.status == "done"))
        .group_by(User.id, User.name, User.avatar_url)
        .order_by(func.count(Task.id).desc())
        .limit(5).all()
    )
    top_users = [
        {"id": u.id, "name": u.name, "avatar_url": u.avatar_url, "completed_tasks": u.completed}
        for u in top_users_raw
    ]

    return {
        "totals": {
            "users": total_users, "admins": total_admins, "members": total_members,
            "teams": total_teams, "projects": total_projects, "active_projects": active_projects,
            "tasks": total_tasks, "completed_tasks": done_tasks,
            "completion_rate": round((done_tasks / total_tasks * 100) if total_tasks else 0, 1),
        },
        "task_by_status": task_by_status,
        "weekly_hours": weekly,
        "top_performers": top_users,
    }


@router.get("/member")
def member_overview(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    my_tasks = db.query(Task).filter(Task.assignee_id == user.id).count()
    done = db.query(Task).filter(Task.assignee_id == user.id, Task.status == "done").count()
    in_progress = db.query(Task).filter(Task.assignee_id == user.id, Task.status == "in_progress").count()
    todo = db.query(Task).filter(Task.assignee_id == user.id, Task.status == "todo").count()
    review = db.query(Task).filter(Task.assignee_id == user.id, Task.status == "review").count()
    my_projects = len(user.projects)
    my_teams = len(user.teams)

    today = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    weekly = []
    for offset in range(6, -1, -1):
        day_start = today - timedelta(days=offset)
        day_end = day_start + timedelta(days=1)
        total = db.query(func.coalesce(func.sum(Attendance.duration_seconds), 0)).filter(
            Attendance.user_id == user.id,
            Attendance.punch_in >= day_start, Attendance.punch_in < day_end
        ).scalar() or 0
        weekly.append({
            "day": day_start.strftime("%a"),
            "date": day_start.date().isoformat(),
            "hours": round(total / 3600, 2),
        })

    return {
        "totals": {
            "my_tasks": my_tasks, "completed": done, "in_progress": in_progress,
            "todo": todo, "review": review,
            "my_projects": my_projects, "my_teams": my_teams,
            "completion_rate": round((done / my_tasks * 100) if my_tasks else 0, 1),
        },
        "task_by_status": {"todo": todo, "in_progress": in_progress, "review": review, "done": done},
        "weekly_hours": weekly,
    }


@router.get("/activity")
def recent_activity(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    query = db.query(Activity, User).join(User, User.id == Activity.user_id)
    if user.role != "admin":
        query = query.filter(Activity.user_id == user.id)
    rows = query.order_by(Activity.created_at.desc()).limit(20).all()
    return [
        {
            "id": a.id,
            "action": a.action,
            "entity_type": a.entity_type,
            "entity_id": a.entity_id,
            "description": a.description,
            "created_at": a.created_at,
            "user": {"id": u.id, "name": u.name, "avatar_url": u.avatar_url},
        }
        for a, u in rows
    ]
