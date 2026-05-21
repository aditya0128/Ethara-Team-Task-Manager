"""Pydantic schemas for request/response."""
from datetime import datetime
from typing import Optional, List, Literal
from pydantic import BaseModel, EmailStr, Field, ConfigDict


# ---------- Auth ----------
class RegisterIn(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(min_length=6, max_length=100)
    role: Literal["admin", "member"] = "member"


class LoginIn(BaseModel):
    email: EmailStr
    password: str
    role: Optional[Literal["admin", "member"]] = None  # optional gate


class ForgotPasswordIn(BaseModel):
    email: EmailStr


class ResetPasswordIn(BaseModel):
    token: str
    new_password: str = Field(min_length=6, max_length=100)


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserOut"


# ---------- User ----------
class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    email: EmailStr
    name: str
    role: str
    avatar_url: Optional[str] = None
    job_title: Optional[str] = None
    is_active: bool
    created_at: datetime


class UserUpdate(BaseModel):
    name: Optional[str] = None
    job_title: Optional[str] = None
    avatar_url: Optional[str] = None
    role: Optional[Literal["admin", "member"]] = None


# ---------- Team ----------
class TeamCreate(BaseModel):
    name: str
    description: Optional[str] = None
    color: Optional[str] = "#F97316"
    member_ids: List[str] = []


class TeamUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    color: Optional[str] = None
    member_ids: Optional[List[str]] = None


class TeamOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    name: str
    description: Optional[str] = None
    color: str
    created_by: str
    created_at: datetime
    members: List[UserOut] = []


# ---------- Project ----------
class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = None
    status: Optional[str] = "active"
    priority: Optional[str] = "medium"
    progress: Optional[int] = 0
    start_date: Optional[datetime] = None
    due_date: Optional[datetime] = None
    team_id: Optional[str] = None
    member_ids: List[str] = []


class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    progress: Optional[int] = None
    start_date: Optional[datetime] = None
    due_date: Optional[datetime] = None
    team_id: Optional[str] = None
    member_ids: Optional[List[str]] = None


class ProjectOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    name: str
    description: Optional[str] = None
    status: str
    priority: str
    progress: int
    start_date: Optional[datetime] = None
    due_date: Optional[datetime] = None
    team_id: Optional[str] = None
    created_by: str
    created_at: datetime
    members: List[UserOut] = []
    task_count: Optional[int] = 0
    completed_task_count: Optional[int] = 0


# ---------- Task ----------
class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    status: Optional[str] = "todo"
    priority: Optional[str] = "medium"
    due_date: Optional[datetime] = None
    project_id: Optional[str] = None
    assignee_id: Optional[str] = None


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    due_date: Optional[datetime] = None
    project_id: Optional[str] = None
    assignee_id: Optional[str] = None


class TaskOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    title: str
    description: Optional[str] = None
    status: str
    priority: str
    due_date: Optional[datetime] = None
    project_id: Optional[str] = None
    assignee_id: Optional[str] = None
    created_by: str
    created_at: datetime
    updated_at: datetime
    assignee: Optional[UserOut] = None


# ---------- Attendance ----------
class AttendanceOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    user_id: str
    punch_in: datetime
    punch_out: Optional[datetime] = None
    duration_seconds: int
    note: Optional[str] = None


class AttendanceCreate(BaseModel):
    note: Optional[str] = None


# ---------- Activity / Notification ----------
class ActivityOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    user_id: str
    action: str
    entity_type: Optional[str] = None
    entity_id: Optional[str] = None
    description: Optional[str] = None
    created_at: datetime


class NotificationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    title: str
    message: Optional[str] = None
    is_read: bool
    link: Optional[str] = None
    created_at: datetime


TokenOut.model_rebuild()
