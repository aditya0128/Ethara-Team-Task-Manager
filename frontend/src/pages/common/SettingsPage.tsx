import { useState } from "react";
import { useAuth } from "../../store/auth";
import { PageHeader, Panel } from "../../components/Primitives";
import toast from "react-hot-toast";

export function SettingsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState(true);
  const [reduceMotion, setReduceMotion] = useState(false);

  return (
    <div data-testid="settings-page">
      <PageHeader overline="Settings" title="Preferences" subtitle="Personalize how ETHARA behaves for you." />

      <div className="p-4 sm:p-6 lg:p-8 max-w-3xl grid gap-6">
        <Panel title="Account">
          <div className="p-5 space-y-3 text-sm">
            <Row label="Email" value={user?.email} />
            <Row label="Role" value={user?.role} />
            <Row label="Member since" value={user ? new Date(user.created_at).toLocaleDateString() : "—"} />
          </div>
        </Panel>

        <Panel title="Notifications">
          <div className="p-5 space-y-3">
            <Toggle
              label="In-app notifications"
              hint="Receive activity updates inside the app."
              checked={notifications}
              onChange={(v) => { setNotifications(v); toast.success(`Notifications ${v ? "enabled" : "disabled"}`); }}
              testid="setting-notifications"
            />
            <Toggle
              label="Reduce motion"
              hint="Minimize animations and transitions."
              checked={reduceMotion}
              onChange={(v) => { setReduceMotion(v); toast.success(`Motion ${v ? "reduced" : "restored"}`); }}
              testid="setting-motion"
            />
          </div>
        </Panel>

        <Panel title="Danger zone" className="border-danger/30">
          <div className="p-5 flex items-center justify-between">
            <div>
              <p className="text-sm text-white">Delete account</p>
              <p className="text-xs text-ink-muted">Demo-only — contact admin in production.</p>
            </div>
            <button className="btn-danger" onClick={() => toast.error("Disabled in demo")} data-testid="setting-delete-account">
              Request deletion
            </button>
          </div>
        </Panel>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-line last:border-0">
      <span className="text-ink-secondary">{label}</span>
      <span className="text-white font-mono">{value || "—"}</span>
    </div>
  );
}

function Toggle({ label, hint, checked, onChange, testid }: any) {
  return (
    <label className="flex items-center justify-between gap-3 cursor-pointer">
      <div>
        <p className="text-sm text-white">{label}</p>
        <p className="text-xs text-ink-muted">{hint}</p>
      </div>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="sr-only peer" data-testid={testid} />
      <span className="w-9 h-5 bg-bg-panel border border-line rounded-full peer-checked:bg-brand peer-checked:border-brand relative transition-colors">
        <span className="absolute top-0.5 left-0.5 w-3.5 h-3.5 bg-white rounded-full transition-transform peer-checked:translate-x-4" />
      </span>
    </label>
  );
}
