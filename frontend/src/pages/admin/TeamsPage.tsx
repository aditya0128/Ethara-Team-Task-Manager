import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { api, formatApiError } from "../../lib/api";
import { PageHeader, Panel } from "../../components/Primitives";
import { Modal } from "../../components/Modal";
import { Avatar } from "../../components/Topbar";
import { Plus, PencilSimple, Trash, UsersThree } from "@phosphor-icons/react";
import type { Team, User } from "../../types";

interface TeamForm {
  name: string;
  description?: string;
  color?: string;
  member_ids: string[];
}

export function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);

  const form = useForm<TeamForm>({ defaultValues: { name: "", description: "", color: "#F97316", member_ids: [] } });

  const load = async () => {
    setLoading(true);
    const [t, u] = await Promise.all([api.get("/teams"), api.get("/users")]);
    setTeams(t.data);
    setUsers(u.data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditing(null);
    form.reset({ name: "", description: "", color: "#F97316", member_ids: [] });
    setModalOpen(true);
  };

  const openEdit = (team: Team) => {
    setEditing(team);
    form.reset({
      name: team.name,
      description: team.description || "",
      color: team.color,
      member_ids: team.members.map((m) => m.id),
    });
    setModalOpen(true);
  };

  const onSubmit = async (vals: TeamForm) => {
    try {
      if (editing) {
        await api.patch(`/teams/${editing.id}`, vals);
        toast.success("Team updated");
      } else {
        await api.post("/teams", vals);
        toast.success("Team created");
      }
      setModalOpen(false);
      await load();
    } catch (err) {
      toast.error(formatApiError(err));
    }
  };

  const remove = async (team: Team) => {
    if (!confirm(`Delete team "${team.name}"?`)) return;
    try {
      await api.delete(`/teams/${team.id}`);
      toast.success("Team deleted");
      await load();
    } catch (err) {
      toast.error(formatApiError(err));
    }
  };

  return (
    <div data-testid="teams-page">
      <PageHeader
        overline="Admin · Teams"
        title="Team management"
        subtitle="Organize people, distribute ownership and run projects through teams."
        actions={
          <button className="btn-primary" onClick={openCreate} data-testid="create-team-button">
            <Plus size={14} weight="bold" /> New team
          </button>
        }
      />

      {loading ? (
        <p className="p-8 text-ink-muted overline">Loading teams…</p>
      ) : teams.length === 0 ? (
        <EmptyState onCreate={openCreate} />
      ) : (
        <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {teams.map((team) => (
            <Panel key={team.id} className="overflow-hidden">
              <div className="h-1.5" style={{ background: team.color }} />
              <div className="p-5">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="overline">{team.members.length} members</p>
                    <h3 className="h-display text-xl font-bold mt-1">{team.name}</h3>
                  </div>
                  <UsersThree size={20} weight="duotone" className="text-brand shrink-0" />
                </div>
                <p className="text-sm text-ink-secondary line-clamp-2 min-h-[2.5rem]">{team.description || "—"}</p>
                <div className="flex -space-x-2 mt-4">
                  {team.members.slice(0, 6).map((m) => (
                    <div key={m.id} className="ring-2 ring-bg-panel rounded-md">
                      <Avatar name={m.name} url={m.avatar_url} size={28} />
                    </div>
                  ))}
                  {team.members.length > 6 && (
                    <span className="chip-muted ml-2">+{team.members.length - 6}</span>
                  )}
                </div>
                <div className="flex gap-2 mt-5 pt-4 border-t border-line">
                  <button className="btn-outline flex-1" onClick={() => openEdit(team)} data-testid={`edit-team-${team.id}`}>
                    <PencilSimple size={14} /> Edit
                  </button>
                  <button className="btn-danger" onClick={() => remove(team)} data-testid={`delete-team-${team.id}`}>
                    <Trash size={14} />
                  </button>
                </div>
              </div>
            </Panel>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Edit team" : "Create team"}
        testid="team-modal"
      >
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="label">Team name</label>
            <input className="input" placeholder="e.g. Platform Engineering" {...form.register("name", { required: true })} data-testid="team-name-input" />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input min-h-20" {...form.register("description")} data-testid="team-description-input" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Accent color</label>
              <input className="input h-10 p-1" type="color" {...form.register("color")} data-testid="team-color-input" />
            </div>
          </div>
          <div>
            <label className="label">Members</label>
            <div className="panel-flat p-3 max-h-48 overflow-auto space-y-1.5" data-testid="team-members-list">
              {users.map((u) => (
                <label key={u.id} className="flex items-center gap-2.5 text-sm text-ink-secondary hover:text-white cursor-pointer">
                  <input
                    type="checkbox" value={u.id}
                    {...form.register("member_ids")}
                    className="accent-brand"
                  />
                  <Avatar name={u.name} url={u.avatar_url} size={22} />
                  <span>{u.name}</span>
                  <span className="text-xs text-ink-muted ml-auto">{u.role}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-ghost" onClick={() => setModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn-primary" data-testid="team-submit-button">
              {editing ? "Save changes" : "Create team"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-24 px-4">
      <UsersThree size={48} weight="duotone" className="text-brand mb-4" />
      <h3 className="h-display text-2xl font-bold">No teams yet</h3>
      <p className="text-sm text-ink-secondary mt-1 max-w-sm">
        Group people by function, project or studio. Teams power assignment and reporting.
      </p>
      <button className="btn-primary mt-5" onClick={onCreate} data-testid="empty-create-team-button">
        <Plus size={14} weight="bold" /> Create your first team
      </button>
    </div>
  );
}
