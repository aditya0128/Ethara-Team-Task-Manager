export type Role = "admin" | "member";

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  avatar_url?: string | null;
  job_title?: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Team {
  id: string;
  name: string;
  description?: string | null;
  color: string;
  created_by: string;
  created_at: string;
  members: User[];
}

export interface Project {
  id: string;
  name: string;
  description?: string | null;
  status: string;
  priority: string;
  progress: number;
  start_date?: string | null;
  due_date?: string | null;
  team_id?: string | null;
  created_by: string;
  created_at: string;
  members: User[];
  task_count?: number;
  completed_task_count?: number;
}

export type TaskStatus = "todo" | "in_progress" | "review" | "done";
export type TaskPriority = "low" | "medium" | "high" | "urgent";

export interface Task {
  id: string;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  due_date?: string | null;
  project_id?: string | null;
  assignee_id?: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  assignee?: User | null;
}

export interface AttendanceRecord {
  id: string;
  user_id: string;
  punch_in: string;
  punch_out?: string | null;
  duration_seconds: number;
  note?: string | null;
}

export interface ActivityItem {
  id: string;
  action: string;
  entity_type?: string | null;
  entity_id?: string | null;
  description?: string | null;
  created_at: string;
  user: { id: string; name: string; avatar_url?: string | null };
}
