import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { api, formatApiError } from "../../lib/api";
import { useAuth } from "../../store/auth";
import { PageHeader, Panel } from "../../components/Primitives";
import { Avatar } from "../../components/Topbar";

export function ProfilePage() {
  const { user, setUser } = useAuth();
  const form = useForm({
    defaultValues: {
      name: user?.name || "",
      job_title: user?.job_title || "",
      avatar_url: user?.avatar_url || "",
    },
  });

  const onSubmit = async (vals: any) => {
    try {
      const { data } = await api.patch("/users/me", vals);
      setUser(data);
      toast.success("Profile updated");
    } catch (err) {
      toast.error(formatApiError(err));
    }
  };

  return (
    <div data-testid="profile-page">
      <PageHeader overline="Account" title="Your profile" subtitle="How you show up across the workspace." />

      <div className="p-4 sm:p-6 lg:p-8 max-w-3xl grid gap-6">
        <Panel className="p-6 flex items-center gap-5">
          <Avatar name={user?.name} url={user?.avatar_url} size={72} />
          <div>
            <h2 className="h-display text-2xl font-bold">{user?.name}</h2>
            <p className="text-sm text-ink-secondary">{user?.email}</p>
            <p className="overline mt-2">{user?.role}</p>
          </div>
        </Panel>

        <Panel title="Update details">
          <form onSubmit={form.handleSubmit(onSubmit)} className="p-5 space-y-4" data-testid="profile-form">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="label">Display name</label>
                <input className="input" {...form.register("name")} data-testid="profile-name-input" />
              </div>
              <div>
                <label className="label">Job title</label>
                <input className="input" {...form.register("job_title")} data-testid="profile-jobtitle-input" />
              </div>
            </div>
            <div>
              <label className="label">Avatar URL</label>
              <input className="input" placeholder="https://…" {...form.register("avatar_url")} data-testid="profile-avatar-input" />
            </div>
            <div className="flex justify-end">
              <button className="btn-primary" data-testid="profile-save-button">Save changes</button>
            </div>
          </form>
        </Panel>
      </div>
    </div>
  );
}
