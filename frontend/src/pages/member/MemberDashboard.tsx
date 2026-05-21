import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { PageHeader, StatCell, Panel } from "../../components/Primitives";
import { PunchClock } from "../../components/PunchClock";
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { useAuth } from "../../store/auth";

export function MemberDashboard() {
  const [data, setData] = useState<any>(null);
  const { user } = useAuth();

  useEffect(() => { api.get("/analytics/member").then((r) => setData(r.data)); }, []);

  if (!data) {
    return <p className="p-8 text-ink-muted overline">Loading…</p>;
  }

  return (
    <div data-testid="member-dashboard">
      <PageHeader
        overline={`Welcome back, ${user?.name?.split(" ")[0]}`}
        title="Your day, at a glance"
        subtitle="Track your tasks, hours and progress in one place."
      />

      <div className="px-4 sm:px-6 lg:px-8 py-6">
        <PunchClock />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 grid-borders border-y border-line">
        <StatCell label="My Tasks" value={data.totals.my_tasks} accent="muted" testid="m-stat-tasks" />
        <StatCell label="In Progress" value={data.totals.in_progress} accent="orange" testid="m-stat-progress" />
        <StatCell label="Completed" value={data.totals.completed} accent="green" testid="m-stat-done" />
        <StatCell label="Completion %" value={`${data.totals.completion_rate}%`} accent="orange" testid="m-stat-rate" />
      </div>

      <div className="p-4 sm:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 panel-flat p-6">
          <p className="overline">Last 7 days</p>
          <h3 className="h-display text-xl font-semibold mt-1 mb-4">Working hours</h3>
          <div className="h-64" data-testid="member-weekly-chart">
            <ResponsiveContainer>
              <BarChart data={data.weekly_hours}>
                <CartesianGrid stroke="#27272A" vertical={false} />
                <XAxis dataKey="day" stroke="#71717A" fontSize={12} />
                <YAxis stroke="#71717A" fontSize={12} />
                <Tooltip contentStyle={{ background: "#09090B", border: "1px solid #27272A", borderRadius: 6, color: "#fff" }} />
                <Bar dataKey="hours" fill="#F97316" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <Panel className="p-6">
          <p className="overline">Workspace</p>
          <h3 className="h-display text-xl font-semibold mt-1 mb-4">My footprint</h3>
          <div className="space-y-3">
            <Row label="Projects" value={data.totals.my_projects} />
            <Row label="Teams" value={data.totals.my_teams} />
            <Row label="In review" value={data.totals.review} />
            <Row label="Backlog" value={data.totals.todo} />
          </div>
        </Panel>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-line last:border-0">
      <span className="text-sm text-ink-secondary">{label}</span>
      <span className="text-sm font-mono text-white">{value}</span>
    </div>
  );
}
