import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { api, formatApiError } from "../../lib/api";
import { PageHeader, Panel, PRIORITY_COLORS, STATUS_LABEL } from "../../components/Primitives";
import { Modal } from "../../components/Modal";
import { Avatar } from "../../components/Topbar";
import { formatDate } from "../../lib/utils";
import { Plus, MagnifyingGlass, Trash, PencilSimple } from "@phosphor-icons/react";
import type { Project, Task, TaskStatus, User } from "../../types";

const STATUSES: TaskStatus[] = ["todo", "in_progress", "review", "done"];

interface TForm {
  title: string;
  description?: string;
  status: string;
  priority: string;
  project_id?: string;
  assignee_id?: string;
  due_date?: string;
}

export function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);

  const form = useForm<TForm>({
    defaultValues: { title: "", description: "", status: "todo", priority: "medium", project_id: "", assignee_id: "", due_date: "" },
  });

  const load = async () => {
    const params: any = {};
    if (q) params.q = q;
    const [t, p, u] = await Promise.all([
      api.get("/tasks", { params }),
      api.get("/projects"),
      api.get("/users"),
    ]);
    setTasks(t.data);
    setProjects(p.data);
    setUsers(u.data);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [q]);

  const grouped = useMemo(() => {
    const g: Record<string, Task[]> = { todo: [], in_progress: [], review: [], done: [] };
    tasks.forEach((t) => g[t.status]?.push(t));
    return g;
  }, [tasks]);

  const openCreate = () => {
    setEditing(null);
    form.reset({ title: "", description: "", status: "todo", priority: "medium", project_id: "", assignee_id: "", due_date: "" });
    setOpen(true);
  };

  const openEdit = (t: Task) => {
    setEditing(t);
    form.reset({
      title: t.title,
      description: t.description || "",
      status: t.status,
      priority: t.priority,
      project_id: t.project_id || "",
      assignee_id: t.assignee_id || "",
      due_date: t.due_date ? t.due_date.slice(0, 10) : "",
    });
    setOpen(true);
  };

  const onSubmit = async (vals: TForm) => {
    const payload: any = { ...vals };
    if (!payload.due_date) delete payload.due_date;
    else payload.due_date = new Date(payload.due_date).toISOString();
    if (!payload.project_id) delete payload.project_id;
    if (!payload.assignee_id) delete payload.assignee_id;
    try {
      if (editing) {
        await api.patch(`/tasks/${editing.id}`, payload);
        toast.success("Task updated");
      } else {
        await api.post("/tasks", payload);
        toast.success("Task created");
      }
      setOpen(false);
      await load();
    } catch (err) {
      toast.error(formatApiError(err));
    }
  };

  const remove = async (t: Task) => {
    if (!confirm(`Delete task "${t.title}"?`)) return;
    try {
      await api.delete(`/tasks/${t.id}`);
      toast.success("Task deleted");
      await load();
    } catch (err) {
      toast.error(formatApiError(err));
    }
  };

  const onDrop = async (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/task-id");
    if (!id) return;
    const t = tasks.find((x) => x.id === id);
    if (!t || t.status === status) return;
    try {
      await api.patch(`/tasks/${id}`, { status });
      await load();
    } catch (err) {
      toast.error(formatApiError(err));
    }
  };

  return (
    <div data-testid="tasks-page">
      <PageHeader
        overline="Admin · Tasks"
        title="Kanban board"
        subtitle="Drag and drop to update status. Click any task to edit details."
        actions={
          <button className="btn-primary" onClick={openCreate} data-testid="create-task-button">
            <Plus size={14} weight="bold" /> New task
          </button>
        }
      />

      <div className="px-4 sm:px-6 py-4 border-b border-line flex items-center gap-2">
        <div className="flex items-center gap-2 px-3 py-1.5 border border-line rounded-md bg-bg-surface w-72">
          <MagnifyingGlass size={14} className="text-ink-muted" />
          <input
            placeholder="Search tasks…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="bg-transparent flex-1 outline-none text-sm"
            data-testid="task-search"
          />
        </div>
        <span className="text-xs text-ink-muted">{tasks.length} tasks</span>
      </div>

      <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {STATUSES.map((status) => (
          <div
            key={status}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => onDrop(e, status)}
            className="panel-flat min-h-96 transition-colors"
            data-testid={`kanban-column-${status}`}
          >
            <div className="px-4 py-3 border-b border-line flex items-center justify-between">
              <p className="text-sm font-medium text-white flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${status === "todo" ? "bg-ink-muted" : status === "in_progress" ? "bg-brand" : status === "review" ? "bg-yellow-400" : "bg-success"}`} />
                {STATUS_LABEL[status]}
              </p>
              <span className="chip-muted">{grouped[status].length}</span>
            </div>
            <div className="p-3 space-y-2">
              {grouped[status].map((t) => (
                <div
                  key={t.id}
                  draggable
                  onDragStart={(e) => e.dataTransfer.setData("text/task-id", t.id)}
                  onClick={() => openEdit(t)}
                  className="panel-flat p-3 cursor-grab active:cursor-grabbing hover:border-brand/50 hover:-translate-y-0.5 transition-all"
                  data-testid={`task-card-${t.id}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-white line-clamp-2">{t.title}</p>
                    <span className={PRIORITY_COLORS[t.priority]}>{t.priority}</span>
                  </div>
                  {t.description && <p className="text-xs text-ink-muted mt-1.5 line-clamp-2">{t.description}</p>}
                  <div className="flex items-center justify-between mt-3">
                    {t.assignee ? (
                      <div className="flex items-center gap-1.5">
                        <Avatar name={t.assignee.name} url={t.assignee.avatar_url} size={20} />
                        <span className="text-xs text-ink-secondary">{t.assignee.name.split(" ")[0]}</span>
                      </div>
                    ) : <span className="text-xs text-ink-muted">Unassigned</span>}
                    <span className="text-xs text-ink-muted">{formatDate(t.due_date)}</span>
                  </div>
                </div>
              ))}
              {grouped[status].length === 0 && (
                <p className="text-xs text-ink-muted text-center py-6">Drop tasks here</p>
              )}
            </div>
          </div>
        ))}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? "Edit task" : "New task"} size="lg" testid="task-modal">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <label className="label">Title</label>
              <input className="input" {...form.register("title", { required: true })} data-testid="task-title-input" />
            </div>
            {editing && (
              <button type="button" className="btn-danger mt-6" onClick={() => { remove(editing); setOpen(false); }}>
                <Trash size={14} />
              </button>
            )}
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input min-h-20" {...form.register("description")} data-testid="task-description-input" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="label">Status</label>
              <select className="input" {...form.register("status")} data-testid="task-status-select">
                {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Priority</label>
              <select className="input" {...form.register("priority")}>
                <option value="low">Low</option><option value="medium">Medium</option>
                <option value="high">High</option><option value="urgent">Urgent</option>
              </select>
            </div>
            <div>
              <label className="label">Due date</label>
              <input className="input" type="date" {...form.register("due_date")} />
            </div>
            <div>
              <label className="label">Project</label>
              <select className="input" {...form.register("project_id")}>
                <option value="">No project</option>
                {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="label">Assignee</label>
            <select className="input" {...form.register("assignee_id")} data-testid="task-assignee-select">
              <option value="">Unassigned</option>
              {users.map((u) => <option key={u.id} value={u.id}>{u.name} · {u.role}</option>)}
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-ghost" onClick={() => setOpen(false)}>Cancel</button>
            <button type="submit" className="btn-primary" data-testid="task-submit-button">
              <PencilSimple size={14} /> {editing ? "Save" : "Create"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
