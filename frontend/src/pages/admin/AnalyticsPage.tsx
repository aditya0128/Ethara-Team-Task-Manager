import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { PageHeader, StatCell } from "../../components/Primitives";
import {
  LineChart, Line, BarChart, Bar, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip,
} from "recharts";

export function AnalyticsPage() {
  const [data, setData] = useState<any>(null);
  useEffect(() => {
    api.get("/analytics/admin").then((r) => setData(r.data));
  }, []);

  if (!data) {
    return <p className="p-8 text-ink-muted overline">Loading analytics…</p>;
  }

  const statusBars = Object.entries(data.task_by_status).map(([k, v]) => ({
    status: k.replace("_", " "), value: v as number,
  }));

  return (
    <div data-testid="analytics-page">
      <PageHeader
        overline="Admin · Analytics"
        title="Performance analytics"
        subtitle="Deep view into hours, tasks and project velocity."
      />

      <div className="grid grid-cols-2 md:grid-cols-4 grid-borders border-b border-line">
        <StatCell label="Total Hours (7d)" value={data.weekly_hours.reduce((s: number, d: any) => s + d.hours, 0).toFixed(1)} accent="orange" />
        <StatCell label="Tasks Done" value={data.totals.completed_tasks} accent="green" />
        <StatCell label="Completion %" value={`${data.totals.completion_rate}%`} accent="orange" />
        <StatCell label="Active Projects" value={data.totals.active_projects} accent="muted" />
      </div>

      <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="panel-flat p-6">
          <p className="overline">Workspace hours</p>
          <h3 className="h-display text-xl font-semibold mt-1 mb-4">Last 7 days</h3>
          <div className="h-72">
            <ResponsiveContainer>
              <LineChart data={data.weekly_hours}>
                <CartesianGrid stroke="#27272A" vertical={false} />
                <XAxis dataKey="day" stroke="#71717A" fontSize={12} />
                <YAxis stroke="#71717A" fontSize={12} />
                <Tooltip contentStyle={{ background: "#09090B", border: "1px solid #27272A", borderRadius: 6, color: "#fff" }} />
                <Line type="monotone" dataKey="hours" stroke="#F97316" strokeWidth={2} dot={{ fill: "#F97316", r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="panel-flat p-6">
          <p className="overline">Task volume</p>
          <h3 className="h-display text-xl font-semibold mt-1 mb-4">By status</h3>
          <div className="h-72">
            <ResponsiveContainer>
              <BarChart data={statusBars}>
                <CartesianGrid stroke="#27272A" vertical={false} />
                <XAxis dataKey="status" stroke="#71717A" fontSize={12} />
                <YAxis stroke="#71717A" fontSize={12} />
                <Tooltip contentStyle={{ background: "#09090B", border: "1px solid #27272A", borderRadius: 6, color: "#fff" }} />
                <Bar dataKey="value" fill="#22C55E" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
