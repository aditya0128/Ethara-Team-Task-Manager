import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { api, formatApiError } from "../../lib/api";
import { PageHeader, Panel, PRIORITY_COLORS } from "../../components/Primitives";
import { Modal } from "../../components/Modal";
import { Avatar } from "../../components/Topbar";
import { Plus, PencilSimple, Trash, FolderOpen } from "@phosphor-icons/react";
import { formatDate } from "../../lib/utils";
import type { Project, Team, User } from "../../types";

interface PForm {
  name: string;
  description?: string;
  status: string;
  priority: string;
  progress: number;
  team_id?: string;
  due_date?: string;
  member_ids: string[];
}

export function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);

  const form = useForm<PForm>({
    defaultValues: { name: "", description: "", status: "active", priority: "medium", progress: 0, team_id: "", due_date: "", member_ids: [] },
  });

  const load = async () => {
    const [p, t, u] = await Promise.all([api.get("/projects"), api.get("/teams"), api.get("/users")]);
    setProjects(p.data);
    setTeams(t.data);
    setUsers(u.data);
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditing(null);
    form.reset({ name: "", description: "", status: "active", priority: "medium", progress: 0, team_id: "", due_date: "", member_ids: [] });
    setOpen(true);
  };

  const openEdit = (p: Project) => {
    setEditing(p);
    form.reset({
      name: p.name,
      description: p.description || "",
      status: p.status,
      priority: p.priority,
      progress: p.progress,
      team_id: p.team_id || "",
      due_date: p.due_date ? p.due_date.slice(0, 10) : "",
      member_ids: p.members.map((m) => m.id),
    });
    setOpen(true);
  };

  const onSubmit = async (vals: PForm) => {
    const payload: any = { ...vals };
    if (!payload.due_date) delete payload.due_date;
    else payload.due_date = new Date(payload.due_date).toISOString();
    if (!payload.team_id) delete payload.team_id;
    payload.progress = Number(payload.progress) || 0;
    try {
      if (editing) {
        await api.patch(`/projects/${editing.id}`, payload);
        toast.success("Project updated");
      } else {
        await api.post("/projects", payload);
        toast.success("Project created");
      }
      setOpen(false);
      await load();
    } catch (err) {
      toast.error(formatApiError(err));
    }
  };

  const remove = async (p: Project) => {
    if (!confirm(`Delete project "${p.name}"?`)) return;
    try {
      await api.delete(`/projects/${p.id}`);
      toast.success("Project deleted");
      await load();
    } catch (err) {
      toast.error(formatApiError(err));
    }
  };

  return (
    <div data-testid="projects-page">
      <PageHeader
        overline="Admin · Projects"
        title="Project management"
        subtitle="Plan timelines, assign teams and track progress end-to-end."
        actions={
          <button className="btn-primary" onClick={openCreate} data-testid="create-project-button">
            <Plus size={14} weight="bold" /> New project
          </button>
        }
      />

      <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {projects.map((p) => (
          <Panel key={p.id} className="p-5">
            <div className="flex items-start justify-between">
              <div className="min-w-0">
                <p className="overline">
                  {p.status} · <span className={PRIORITY_COLORS[p.priority] + " ml-1"}>{p.priority}</span>
                </p>
                <h3 className="h-display text-lg font-bold mt-1 truncate">{p.name}</h3>
              </div>
              <FolderOpen size={20} weight="duotone" className="text-brand shrink-0" />
            </div>
            <p className="text-sm text-ink-secondary mt-2 line-clamp-2 min-h-[2.5rem]">{p.description || "—"}</p>

            <div className="mt-4">
              <div className="flex items-center justify-between text-xs text-ink-muted mb-1.5">
                <span>Progress</span>
                <span className="text-white font-medium">{p.progress}%</span>
              </div>
              <div className="h-1.5 bg-bg-panel rounded-sm overflow-hidden">
                <div className="h-full bg-brand transition-all" style={{ width: `${p.progress}%` }} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-4 text-xs">
              <div>
                <p className="overline">Due</p>
                <p className="text-white mt-0.5">{formatDate(p.due_date)}</p>
              </div>
              <div>
                <p className="overline">Tasks</p>
                <p className="text-white mt-0.5">{p.completed_task_count}/{p.task_count}</p>
              </div>
            </div>

            <div className="flex -space-x-2 mt-4">
              {p.members.slice(0, 5).map((m) => (
                <div key={m.id} className="ring-2 ring-bg-panel rounded-md">
                  <Avatar name={m.name} url={m.avatar_url} size={24} />
                </div>
              ))}
            </div>

            <div className="flex gap-2 mt-5 pt-4 border-t border-line">
              <button className="btn-outline flex-1" onClick={() => openEdit(p)} data-testid={`edit-project-${p.id}`}>
                <PencilSimple size={14} /> Edit
              </button>
              <button className="btn-danger" onClick={() => remove(p)} data-testid={`delete-project-${p.id}`}>
                <Trash size={14} />
              </button>
            </div>
          </Panel>
        ))}
        {projects.length === 0 && (
          <p className="col-span-full text-sm text-ink-muted py-12 text-center">No projects yet.</p>
        )}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? "Edit project" : "New project"} size="lg" testid="project-modal">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="label">Name</label>
            <input className="input" {...form.register("name", { required: true })} data-testid="project-name-input" />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input min-h-20" {...form.register("description")} data-testid="project-description-input" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="label">Status</label>
              <select className="input" {...form.register("status")}>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            <div>
              <label className="label">Priority</label>
              <select className="input" {...form.register("priority")}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div>
              <label className="label">Progress %</label>
              <input className="input" type="number" min={0} max={100} {...form.register("progress", { valueAsNumber: true })} />
            </div>
            <div>
              <label className="label">Due date</label>
              <input className="input" type="date" {...form.register("due_date")} />
            </div>
          </div>
          <div>
            <label className="label">Team</label>
            <select className="input" {...form.register("team_id")}>
              <option value="">No team</option>
              {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Members</label>
            <div className="panel-flat p-3 max-h-40 overflow-auto space-y-1.5">
              {users.map((u) => (
                <label key={u.id} className="flex items-center gap-2.5 text-sm text-ink-secondary hover:text-white cursor-pointer">
                  <input type="checkbox" value={u.id} {...form.register("member_ids")} className="accent-brand" />
                  <Avatar name={u.name} url={u.avatar_url} size={22} />
                  <span>{u.name}</span>
                  <span className="text-xs text-ink-muted ml-auto">{u.role}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-ghost" onClick={() => setOpen(false)}>Cancel</button>
            <button type="submit" className="btn-primary" data-testid="project-submit-button">
              {editing ? "Save changes" : "Create project"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
