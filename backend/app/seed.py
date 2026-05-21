"""Seed demo data: admin + member users, teams, projects, tasks."""
import os
from datetime import datetime, timezone, timedelta
from sqlalchemy.orm import Session
from .models import User, Team, Project, Task, Attendance, Activity
from .auth import hash_password


def seed_database(db: Session):
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@ethara.ai")
    admin_password = os.environ.get("ADMIN_PASSWORD", "Admin@123")
    member_email = os.environ.get("DEMO_MEMBER_EMAIL", "member@ethara.ai")
    member_password = os.environ.get("DEMO_MEMBER_PASSWORD", "Member@123")

    admin = db.query(User).filter(User.email == admin_email).first()
    if not admin:
        admin = User(
            email=admin_email, name="Aditya Pratap Singh",
            password_hash=hash_password(admin_password), role="admin",
            job_title="Platform Administrator",
            avatar_url="https://images.unsplash.com/photo-1651684215020-f7a5b6610f23?w=200",
        )
        db.add(admin)

    member = db.query(User).filter(User.email == member_email).first()
    if not member:
        member = User(
            email=member_email, name="Rahul Verma",
            password_hash=hash_password(member_password), role="member",
            job_title="Senior Engineer",
            avatar_url="https://images.unsplash.com/photo-1612608793250-bc47d93e6178?w=200",
        )
        db.add(member)

    # Extra demo members
    demo_members = [
        ("priya@ethara.ai", "Priya Patel", "Designer",
         "https://images.unsplash.com/photo-1767880239595-f4ea13b5c78c?w=200"),
        ("vikram@ethara.ai", "Vikram Reddy", "Product Manager",
         "https://images.unsplash.com/photo-1758598305593-7c12d15687be?w=200"),
    ]
    for email, name, title, avatar in demo_members:
        if not db.query(User).filter(User.email == email).first():
            db.add(User(
                email=email, name=name,
                password_hash=hash_password("Member@123"), role="member",
                job_title=title, avatar_url=avatar,
            ))
    db.flush()

    # Rename legacy seed names to Indian-style names
    rename_map = {
        "Ada Cole": "Aditya Pratap Singh",
        "Alex Carter": "Aditya Pratap Singh",
        "Arjun Sharma": "Aditya Pratap Singh",
        "Mason Riley": "Rahul Verma",
        "Jordan Miles": "Rahul Verma",
        "Priya Shah": "Priya Patel",
        "Sarah Wilson": "Priya Patel",
        "Kenji Watanabe": "Vikram Reddy",
        "Mike Johnson": "Vikram Reddy",
    }
    for old_name, new_name in rename_map.items():
        u = db.query(User).filter(User.name == old_name).first()
        if u:
            u.name = new_name
    # Migrate legacy emails to current ones
    legacy_email_map = {
        "kenji@ethara.ai": "vikram@ethara.ai",
        "mike@ethara.ai": "vikram@ethara.ai",
        "sarah@ethara.ai": "priya@ethara.ai",
    }
    for old_email, new_email in legacy_email_map.items():
        old = db.query(User).filter(User.email == old_email).first()
        new = db.query(User).filter(User.email == new_email).first()
        if old and not new:
            old.email = new_email
        elif old and new and old.id != new.id:
            db.delete(old)
    db.flush()

    # Skip remaining seed if data already exists
    if db.query(Team).count() > 0:
        db.commit()
        return

    all_users = db.query(User).all()
    members_only = [u for u in all_users if u.role == "member"]

    # Teams
    t1 = Team(name="Core Engineering", description="Platform engineering team",
              color="#F97316", created_by=admin.id, members=all_users)
    t2 = Team(name="Design Studio", description="Product design and UX",
              color="#22C55E", created_by=admin.id, members=members_only[:2] + [admin])
    db.add_all([t1, t2])
    db.flush()

    # Projects
    p1 = Project(
        name="Platform v2 Launch", description="Major platform overhaul for Q1",
        status="active", priority="high", progress=62,
        start_date=datetime.now(timezone.utc) - timedelta(days=20),
        due_date=datetime.now(timezone.utc) + timedelta(days=18),
        team_id=t1.id, created_by=admin.id, members=all_users,
    )
    p2 = Project(
        name="Brand Refresh", description="New design system and marketing site",
        status="active", priority="medium", progress=35,
        start_date=datetime.now(timezone.utc) - timedelta(days=8),
        due_date=datetime.now(timezone.utc) + timedelta(days=30),
        team_id=t2.id, created_by=admin.id, members=members_only[:2] + [admin],
    )
    p3 = Project(
        name="Internal Dashboard", description="Analytics dashboard for operations",
        status="active", priority="medium", progress=10,
        due_date=datetime.now(timezone.utc) + timedelta(days=45),
        team_id=t1.id, created_by=admin.id, members=[admin, member],
    )
    db.add_all([p1, p2, p3])
    db.flush()

    # Tasks
    task_seeds = [
        (p1, "Design new onboarding flow", "todo", "high", member),
        (p1, "Migrate auth to JWT", "in_progress", "urgent", member),
        (p1, "Set up CI/CD pipeline", "done", "high", admin),
        (p1, "Write API documentation", "review", "medium", members_only[1] if len(members_only) > 1 else member),
        (p2, "Define color tokens", "done", "medium", members_only[0]),
        (p2, "Create component library", "in_progress", "high", members_only[0]),
        (p2, "Marketing landing page", "todo", "medium", members_only[1] if len(members_only) > 1 else member),
        (p3, "Define KPIs", "todo", "low", admin),
        (p3, "Wireframes for dashboard", "in_progress", "medium", member),
    ]
    for proj, title, status, priority, assignee in task_seeds:
        db.add(Task(
            title=title, description=f"{title} for {proj.name}",
            status=status, priority=priority,
            project_id=proj.id, assignee_id=assignee.id,
            created_by=admin.id,
            due_date=datetime.now(timezone.utc) + timedelta(days=7),
        ))

    # Attendance: past 5 days for member
    for offset in range(5, 0, -1):
        day = datetime.now(timezone.utc) - timedelta(days=offset)
        start = day.replace(hour=9, minute=0, second=0, microsecond=0)
        end = day.replace(hour=17, minute=30, second=0, microsecond=0)
        db.add(Attendance(
            user_id=member.id, punch_in=start, punch_out=end,
            duration_seconds=int((end - start).total_seconds()),
            note="Daily work session",
        ))

    db.add(Activity(user_id=admin.id, action="seeded", entity_type="system",
                    description="Demo data seeded"))
    db.commit()
