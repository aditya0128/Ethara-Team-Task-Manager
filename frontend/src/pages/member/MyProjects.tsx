import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { api, formatApiError } from "../../lib/api";
import { PageHeader, Panel, PRIORITY_COLORS } from "../../components/Primitives";
import { Modal } from "../../components/Modal";
import { Avatar } from "../../components/Topbar";
import { formatDate } from "../../lib/utils";
import { Plus, FolderOpen } from "@phosphor-icons/react";
import type { Project } from "../../types";

export function MyProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [open, setOpen] = useState(false);
  const form = useForm<any>({
    defaultValues: { name: "", description: "", priority: "medium", progress: 0, due_date: "" },
  });

  const load = async () => {
    const { data } = await api.get("/projects");
    setProjects(data);
  };
  useEffect(() => { load(); }, []);

  const onSubmit = async (vals: any) => {
    const payload: any = { ...vals, progress: Number(vals.progress) || 0 };
    if (!payload.due_date) delete payload.due_date;
    else payload.due_date = new Date(payload.due_date).toISOString();
    try {
      await api.post("/projects", payload);
      toast.success("Project added");
      setOpen(false);
      await load();
    } catch (err) { toast.error(formatApiError(err)); }
  };

  return (
    <div data-testid="my-projects-page">
      <PageHeader
        overline="Member · Projects"
        title="My projects"
        subtitle="Projects you're contributing to, plus personal initiatives."
        actions={
          <button className="btn-primary" onClick={() => setOpen(true)} data-testid="member-create-project">
            <Plus size={14} weight="bold" /> New personal project
          </button>
        }
      />

      <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {projects.map((p) => (
          <Panel key={p.id} className="p-5">
            <div className="flex items-start justify-between">
              <div className="min-w-0">
                <p className="overline">{p.status} · <span className={PRIORITY_COLORS[p.priority] + " ml-1"}>{p.priority}</span></p>
                <h3 className="h-display text-lg font-bold mt-1 truncate">{p.name}</h3>
              </div>
              <FolderOpen size={20} weight="duotone" className="text-brand shrink-0" />
            </div>
            <p className="text-sm text-ink-secondary mt-2 line-clamp-2 min-h-[2.5rem]">{p.description || "—"}</p>
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs text-ink-muted mb-1.5">
                <span>Progress</span><span className="text-white font-medium">{p.progress}%</span>
              </div>
              <div className="h-1.5 bg-bg-panel rounded-sm overflow-hidden">
                <div className="h-full bg-brand transition-all" style={{ width: `${p.progress}%` }} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-4 text-xs">
              <div><p className="overline">Due</p><p className="text-white mt-0.5">{formatDate(p.due_date)}</p></div>
              <div><p className="overline">Tasks</p><p className="text-white mt-0.5">{p.completed_task_count}/{p.task_count}</p></div>
            </div>
            <div className="flex -space-x-2 mt-4">
              {p.members.slice(0, 5).map((m) => (
                <div key={m.id} className="ring-2 ring-bg-panel rounded-md">
                  <Avatar name={m.name} url={m.avatar_url} size={24} />
                </div>
              ))}
            </div>
          </Panel>
        ))}
        {projects.length === 0 && (
          <p className="col-span-full text-sm text-ink-muted py-12 text-center">You have no projects yet.</p>
        )}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="New personal project">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="label">Name</label>
            <input className="input" {...form.register("name", { required: true })} />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input min-h-20" {...form.register("description")} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="label">Priority</label>
              <select className="input" {...form.register("priority")}>
                <option value="low">Low</option><option value="medium">Medium</option>
                <option value="high">High</option><option value="urgent">Urgent</option>
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
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-ghost" onClick={() => setOpen(false)}>Cancel</button>
            <button type="submit" className="btn-primary">Create project</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
