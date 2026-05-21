import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { PageHeader, Panel } from "../../components/Primitives";
import { Avatar } from "../../components/Topbar";
import { formatRelative, formatHours } from "../../lib/utils";
import type { AttendanceRecord, User } from "../../types";

export function AttendanceAdminPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);

  useEffect(() => {
    api.get("/users").then((r) => {
      setUsers(r.data);
      if (r.data.length) setSelected(r.data[0].id);
    });
  }, []);

  useEffect(() => {
    if (!selected) return;
    api.get("/attendance", { params: { user_id: selected, limit: 50 } }).then((r) => setRecords(r.data));
  }, [selected]);

  const selectedUser = users.find((u) => u.id === selected);

  return (
    <div data-testid="attendance-admin-page">
      <PageHeader
        overline="Admin · Attendance"
        title="Attendance overview"
        subtitle="Track punch-ins, working hours and sessions across the workspace."
      />

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-px bg-line">
        <div className="bg-bg-surface max-h-[70vh] overflow-auto">
          <p className="overline px-4 py-3 border-b border-line">People</p>
          {users.map((u) => (
            <button
              key={u.id}
              onClick={() => setSelected(u.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 border-b border-line text-left transition-colors ${selected === u.id ? "bg-bg-panel" : "hover:bg-bg-panel/60"}`}
              data-testid={`attendance-user-${u.id}`}
            >
              <Avatar name={u.name} url={u.avatar_url} size={28} />
              <div className="min-w-0">
                <p className="text-sm text-white truncate">{u.name}</p>
                <p className="text-xs text-ink-muted">{u.role}</p>
              </div>
            </button>
          ))}
        </div>

        <div className="bg-bg-surface p-6">
          {selectedUser && (
            <div className="mb-4">
              <p className="overline">{selectedUser.role}</p>
              <h2 className="h-display text-2xl font-bold mt-1">{selectedUser.name}</h2>
              <p className="text-sm text-ink-secondary">{selectedUser.email}</p>
            </div>
          )}
          <Panel title={`Recent sessions (${records.length})`}>
            <div className="divider-grid">
              {records.map((r) => (
                <div key={r.id} className="px-4 py-3 flex items-center justify-between text-sm" data-testid={`attendance-record-${r.id}`}>
                  <div>
                    <p className="text-white">Punched in {formatRelative(r.punch_in)}</p>
                    <p className="text-xs text-ink-muted">{new Date(r.punch_in).toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    {r.punch_out ? (
                      <>
                        <p className="font-mono text-brand">{formatHours(r.duration_seconds)}</p>
                        <p className="text-xs text-ink-muted">Punched out</p>
                      </>
                    ) : (
                      <span className="chip-green">Active</span>
                    )}
                  </div>
                </div>
              ))}
              {records.length === 0 && <p className="px-4 py-6 text-sm text-ink-muted">No attendance records.</p>}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
