import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { PageHeader, Panel } from "../../components/Primitives";
import { PunchClock } from "../../components/PunchClock";
import { formatHours, formatRelative } from "../../lib/utils";
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import type { AttendanceRecord } from "../../types";

export function MyAttendance() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [summary, setSummary] = useState<any>(null);

  useEffect(() => {
    api.get("/attendance").then((r) => setRecords(r.data));
    api.get("/attendance/summary").then((r) => setSummary(r.data));
  }, []);

  return (
    <div data-testid="my-attendance-page">
      <PageHeader
        overline="Member · Attendance"
        title="Attendance & hours"
        subtitle="Manage your work sessions, review your week, see your trend."
      />

      <div className="px-4 sm:px-6 lg:px-8 py-6">
        <PunchClock />
      </div>

      {summary && (
        <div className="px-4 sm:px-6 lg:px-8 pb-6">
          <Panel className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="overline">This week</p>
                <h3 className="h-display text-xl font-semibold mt-1">
                  {summary.total_hours_week.toFixed(2)} <span className="text-ink-muted">hrs</span>
                </h3>
              </div>
            </div>
            <div className="h-64" data-testid="weekly-summary-chart">
              <ResponsiveContainer>
                <BarChart data={summary.days}>
                  <CartesianGrid stroke="#27272A" vertical={false} />
                  <XAxis dataKey="day" stroke="#71717A" fontSize={12} />
                  <YAxis stroke="#71717A" fontSize={12} />
                  <Tooltip contentStyle={{ background: "#09090B", border: "1px solid #27272A", borderRadius: 6, color: "#fff" }} />
                  <Bar dataKey="hours" fill="#22C55E" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>
      )}

      <div className="px-4 sm:px-6 lg:px-8 pb-10">
        <Panel title={`Session history (${records.length})`} testid="attendance-history">
          <div className="divider-grid">
            {records.map((r) => (
              <div key={r.id} className="px-4 py-3 flex items-center justify-between text-sm">
                <div>
                  <p className="text-white">{new Date(r.punch_in).toLocaleString()}</p>
                  <p className="text-xs text-ink-muted">{formatRelative(r.punch_in)}</p>
                </div>
                <div className="text-right">
                  {r.punch_out ? (
                    <p className="font-mono text-brand">{formatHours(r.duration_seconds)}</p>
                  ) : (
                    <span className="chip-green">Active</span>
                  )}
                </div>
              </div>
            ))}
            {records.length === 0 && (
              <p className="px-4 py-6 text-sm text-ink-muted">Punch in to start logging hours.</p>
            )}
          </div>
        </Panel>
      </div>
    </div>
  );
}
