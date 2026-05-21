import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { api, formatApiError } from "../../lib/api";
import { PageHeader, PRIORITY_COLORS, STATUS_LABEL } from "../../components/Primitives";
import { Modal } from "../../components/Modal";
import { formatDate } from "../../lib/utils";
import { Plus, MagnifyingGlass } from "@phosphor-icons/react";
import type { Project, Task, TaskStatus } from "../../types";

const STATUSES: TaskStatus[] = ["todo", "in_progress", "review", "done"];

export function MyTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);

  const form = useForm<any>({
    defaultValues: { title: "", description: "", status: "todo", priority: "medium", project_id: "", due_date: "" },
  });

  const load = async () => {
    const params: any = {};
    if (q) params.q = q;
    const [t, p] = await Promise.all([api.get("/tasks", { params }), api.get("/projects")]);
    setTasks(t.data);
    setProjects(p.data);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [q]);

  const grouped = useMemo(() => {
    const g: Record<string, Task[]> = { todo: [], in_progress: [], review: [], done: [] };
    tasks.forEach((t) => g[t.status]?.push(t));
    return g;
  }, [tasks]);

  const onSubmit = async (vals: any) => {
    const payload: any = { ...vals };
    if (!payload.project_id) delete payload.project_id;
    if (!payload.due_date) delete payload.due_date;
    else payload.due_date = new Date(payload.due_date).toISOString();
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
    } catch (err) { toast.error(formatApiError(err)); }
  };

  const openCreate = () => {
    setEditing(null);
    form.reset({ title: "", description: "", status: "todo", priority: "medium", project_id: "", due_date: "" });
    setOpen(true);
  };

  const openEdit = (t: Task) => {
    setEditing(t);
    form.reset({
      title: t.title, description: t.description || "",
      status: t.status, priority: t.priority,
      project_id: t.project_id || "",
      due_date: t.due_date ? t.due_date.slice(0, 10) : "",
    });
    setOpen(true);
  };

  const updateStatus = async (t: Task, status: TaskStatus) => {
    try {
      await api.patch(`/tasks/${t.id}`, { status });
      await load();
    } catch (err) { toast.error(formatApiError(err)); }
  };

  return (
    <div data-testid="my-tasks-page">
      <PageHeader
        overline="Member · Tasks"
        title="My tasks"
        subtitle="Stay focused on what's yours."
        actions={
          <button className="btn-primary" onClick={openCreate} data-testid="member-create-task">
            <Plus size={14} weight="bold" /> New task
          </button>
        }
      />

      <div className="px-4 sm:px-6 py-4 border-b border-line flex items-center gap-2">
        <div className="flex items-center gap-2 px-3 py-1.5 border border-line rounded-md bg-bg-surface w-72">
          <MagnifyingGlass size={14} className="text-ink-muted" />
          <input
            value={q} onChange={(e) => setQ(e.target.value)}
            className="bg-transparent flex-1 outline-none text-sm" placeholder="Search…"
            data-testid="member-task-search"
          />
        </div>
      </div>

      <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {STATUSES.map((status) => (
          <div key={status} className="panel-flat min-h-72" data-testid={`my-column-${status}`}>
            <div className="px-4 py-3 border-b border-line flex items-center justify-between">
              <p className="text-sm font-medium">{STATUS_LABEL[status]}</p>
              <span className="chip-muted">{grouped[status].length}</span>
            </div>
            <div className="p-3 space-y-2">
              {grouped[status].map((t) => (
                <div key={t.id} onClick={() => openEdit(t)}
                     className="panel-flat p-3 cursor-pointer hover:border-brand/50 hover:-translate-y-0.5 transition-all"
                     data-testid={`my-task-${t.id}`}>
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-white line-clamp-2">{t.title}</p>
                    <span className={PRIORITY_COLORS[t.priority]}>{t.priority}</span>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-ink-muted">{formatDate(t.due_date)}</span>
                    <select
                      value={t.status}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => updateStatus(t, e.target.value as TaskStatus)}
                      className="bg-bg-panel border border-line text-xs px-1 py-0.5 rounded text-ink-secondary"
                      data-testid={`status-select-${t.id}`}
                    >
                      {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                    </select>
                  </div>
                </div>
              ))}
              {grouped[status].length === 0 && (
                <p className="text-xs text-ink-muted text-center py-6">Nothing here</p>
              )}
            </div>
          </div>
        ))}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? "Edit task" : "New personal task"} size="lg">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="label">Title</label>
            <input className="input" {...form.register("title", { required: true })} />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input min-h-20" {...form.register("description")} />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <label className="label">Status</label>
              <select className="input" {...form.register("status")}>
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
          </div>
          <div>
            <label className="label">Project</label>
            <select className="input" {...form.register("project_id")}>
              <option value="">No project</option>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-ghost" onClick={() => setOpen(false)}>Cancel</button>
            <button type="submit" className="btn-primary">{editing ? "Save" : "Create"}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
