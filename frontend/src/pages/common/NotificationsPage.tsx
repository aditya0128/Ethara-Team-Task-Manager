import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { PageHeader, Panel } from "../../components/Primitives";
import { Avatar } from "../../components/Topbar";
import { formatRelative } from "../../lib/utils";
import { Bell } from "@phosphor-icons/react";

export function NotificationsPage() {
  const [activity, setActivity] = useState<any[]>([]);
  useEffect(() => {
    api.get("/analytics/activity").then((r) => setActivity(r.data));
  }, []);

  return (
    <div data-testid="notifications-page">
      <PageHeader
        overline="Inbox"
        title="Notifications & activity"
        subtitle="What's happening across your workspace, in real time."
      />

      <div className="p-4 sm:p-6 lg:p-8 max-w-3xl">
        <Panel>
          <div className="divider-grid">
            {activity.map((a) => (
              <div key={a.id} className="px-4 py-3 flex items-start gap-3" data-testid={`activity-${a.id}`}>
                <Avatar name={a.user.name} url={a.user.avatar_url} size={32} />
                <div className="flex-1">
                  <p className="text-sm text-white">{a.description}</p>
                  <p className="text-xs text-ink-muted">{a.user.name} · {formatRelative(a.created_at)}</p>
                </div>
                <Bell size={14} className="text-ink-muted mt-1" />
              </div>
            ))}
            {activity.length === 0 && (
              <p className="px-4 py-8 text-sm text-ink-muted text-center">Inbox zero. Nothing to show.</p>
            )}
          </div>
        </Panel>
      </div>
    </div>
  );
}
