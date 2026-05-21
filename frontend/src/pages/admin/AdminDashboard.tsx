import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { PageHeader, StatCell, Panel } from "../../components/Primitives";
import { Avatar } from "../../components/Topbar";
import { formatRelative } from "../../lib/utils";
import {
  BarChart, Bar, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { Pulse, ListChecks, FolderOpen, UsersThree } from "@phosphor-icons/react";

const COLORS = { todo: "#71717A", in_progress: "#F97316", review: "#FACC15", done: "#22C55E" };

export function AdminDashboard() {
  const [data, setData] = useState<any>(null);
  const [activity, setActivity] = useState<any[]>([]);

  useEffect(() => {
    api.get("/analytics/admin").then((r) => setData(r.data));
    api.get("/analytics/activity").then((r) => setActivity(r.data));
  }, []);

  if (!data) {
    return (
      <div className="p-8 text-ink-muted overline" data-testid="admin-dashboard-loading">Loading dashboard…</div>
    );
  }

  const taskData = Object.entries(data.task_by_status).map(([k, v]) => ({ name: k, value: v as number, key: k }));

  return (
    <div data-testid="admin-dashboard">
      <PageHeader
        overline="Admin · Overview"
        title="Productivity command center"
        subtitle="Everything happening across teams, projects, attendance and execution."
      />

      <div className="grid grid-cols-2 md:grid-cols-4 grid-borders border-b border-line">
        <StatCell label="Total Members" value={data.totals.users} accent="muted" delta={`${data.totals.admins} admins · ${data.totals.members} members`} testid="stat-users" />
        <StatCell label="Active Projects" value={data.totals.active_projects} accent="orange" delta={`${data.totals.projects} total`} testid="stat-projects" />
        <StatCell label="Tasks Completed" value={data.totals.completed_tasks} accent="green" delta={`of ${data.totals.tasks} tasks`} testid="stat-tasks-done" />
        <StatCell label="Completion Rate" value={`${data.totals.completion_rate}%`} accent="orange" delta="across the platform" testid="stat-completion" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-px bg-line">
        <div className="lg:col-span-2 bg-bg-surface p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="overline">Last 7 days</p>
              <h2 className="h-display text-xl font-semibold mt-1">Working hours · entire workspace</h2>
            </div>
            <Pulse size={20} weight="duotone" className="text-brand" />
          </div>
          <div className="h-64" data-testid="weekly-hours-chart">
            <ResponsiveContainer>
              <BarChart data={data.weekly_hours}>
                <CartesianGrid stroke="#27272A" vertical={false} />
                <XAxis dataKey="day" stroke="#71717A" fontSize={12} />
                <YAxis stroke="#71717A" fontSize={12} />
                <Tooltip
                  cursor={{ fill: "#18181B" }}
                  contentStyle={{ background: "#09090B", border: "1px solid #27272A", borderRadius: 6, color: "#fff" }}
                />
                <Bar dataKey="hours" fill="#F97316" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-bg-surface p-6">
          <p className="overline">Task distribution</p>
          <h2 className="h-display text-xl font-semibold mt-1 mb-4">By status</h2>
          <div className="h-56" data-testid="task-distribution-chart">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={taskData} dataKey="value" outerRadius={80} innerRadius={50} stroke="none">
                  {taskData.map((d) => (
                    <Cell key={d.key} fill={COLORS[d.key as keyof typeof COLORS]} />
                  ))}
                </Pie>
                <Legend wrapperStyle={{ color: "#A1A1AA", fontSize: 11 }} />
                <Tooltip contentStyle={{ background: "#09090B", border: "1px solid #27272A", borderRadius: 6 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-px bg-line">
        <div className="bg-bg-surface p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="overline">Leaderboard</p>
              <h2 className="h-display text-xl font-semibold mt-1">Top performers</h2>
            </div>
            <UsersThree size={20} weight="duotone" className="text-brand" />
          </div>
          <div className="divider-grid" data-testid="top-performers-list">
            {data.top_performers.map((u: any, i: number) => (
              <div key={u.id} className="flex items-center gap-3 py-2.5">
                <span className="font-mono text-ink-muted text-xs w-5">{String(i + 1).padStart(2, "0")}</span>
                <Avatar name={u.name} url={u.avatar_url} />
                <div className="flex-1">
                  <p className="text-sm text-white">{u.name}</p>
                  <p className="text-xs text-ink-muted">{u.completed_tasks} tasks completed</p>
                </div>
                <div className="h-1 w-24 bg-bg-panel rounded overflow-hidden">
                  <div className="h-full bg-brand" style={{ width: `${Math.min(100, u.completed_tasks * 25)}%` }} />
                </div>
              </div>
            ))}
            {data.top_performers.length === 0 && <p className="text-sm text-ink-muted py-4">No data yet.</p>}
          </div>
        </div>

        <div className="bg-bg-surface p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="overline">Recent activity</p>
              <h2 className="h-display text-xl font-semibold mt-1">Timeline</h2>
            </div>
            <ListChecks size={20} weight="duotone" className="text-brand" />
          </div>
          <div className="divider-grid max-h-72 overflow-auto pr-1" data-testid="activity-timeline">
            {activity.map((a) => (
              <div key={a.id} className="flex items-start gap-3 py-2.5">
                <Avatar name={a.user.name} url={a.user.avatar_url} size={28} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{a.description}</p>
                  <p className="text-xs text-ink-muted">{a.user.name} · {formatRelative(a.created_at)}</p>
                </div>
              </div>
            ))}
            {activity.length === 0 && <p className="text-sm text-ink-muted py-4">No recent activity.</p>}
          </div>
        </div>
      </div>

      <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        <QuickStat label="Total teams" value={data.totals.teams} icon={UsersThree} />
        <QuickStat label="Active projects" value={data.totals.active_projects} icon={FolderOpen} />
        <QuickStat label="Tasks in flight" value={data.totals.tasks - data.totals.completed_tasks} icon={ListChecks} />
        <QuickStat label="Members" value={data.totals.members} icon={UsersThree} />
      </div>
    </div>
  );
}

function QuickStat({ label, value, icon: Icon }: any) {
  return (
    <Panel className="p-4">
      <div className="flex items-center justify-between">
        <p className="overline">{label}</p>
        <Icon size={16} className="text-ink-muted" />
      </div>
      <p className="h-display text-2xl font-bold mt-1.5">{value}</p>
    </Panel>
  );
}
