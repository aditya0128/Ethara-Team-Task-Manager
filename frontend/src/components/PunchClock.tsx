import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { api, formatApiError } from "../lib/api";
import { Play, Stop, ClockClockwise } from "@phosphor-icons/react";
import { formatHours } from "../lib/utils";
import type { AttendanceRecord } from "../types";

export function PunchClock() {
  const [active, setActive] = useState<AttendanceRecord | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const timerRef = useRef<number | null>(null);

  const refresh = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/attendance/active");
      setActive(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refresh(); }, []);

  useEffect(() => {
    if (active && !active.punch_out) {
      const start = new Date(active.punch_in).getTime();
      const tick = () => setElapsed(Math.floor((Date.now() - start) / 1000));
      tick();
      timerRef.current = window.setInterval(tick, 1000);
      return () => { if (timerRef.current) window.clearInterval(timerRef.current); };
    } else {
      setElapsed(0);
    }
  }, [active]);

  const punchIn = async () => {
    setBusy(true);
    try {
      await api.post("/attendance/punch-in", { note: null });
      toast.success("Punched in");
      await refresh();
    } catch (err) { toast.error(formatApiError(err)); }
    finally { setBusy(false); }
  };

  const punchOut = async () => {
    setBusy(true);
    try {
      const { data } = await api.post("/attendance/punch-out");
      toast.success(`Punched out · ${formatHours(data.duration_seconds)}`);
      await refresh();
    } catch (err) { toast.error(formatApiError(err)); }
    finally { setBusy(false); }
  };

  return (
    <div
      className="panel-flat p-6 flex flex-col sm:flex-row items-start sm:items-center gap-6 justify-between"
      data-testid="punch-clock"
    >
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-md flex items-center justify-center ${active ? "bg-success/15 text-success" : "bg-bg-panel text-ink-muted"}`}>
          <ClockClockwise size={24} weight="duotone" />
        </div>
        <div>
          <p className="overline">{active ? "Active session" : "Off the clock"}</p>
          <p className="h-display text-3xl font-bold font-mono mt-0.5 tracking-tight2" data-testid="punch-timer">
            {active ? formatHours(elapsed) : "00:00:00"}
          </p>
          {active && (
            <p className="text-xs text-ink-muted">Started {new Date(active.punch_in).toLocaleTimeString()}</p>
          )}
        </div>
      </div>

      <div className="flex gap-2">
        {!loading && !active && (
          <button
            className="btn-success px-6 py-3 text-base"
            onClick={punchIn}
            disabled={busy}
            data-testid="punch-in-button"
          >
            <Play size={16} weight="fill" /> Punch in
          </button>
        )}
        {!loading && active && (
          <button
            className="btn-danger px-6 py-3 text-base"
            onClick={punchOut}
            disabled={busy}
            data-testid="punch-out-button"
          >
            <Stop size={16} weight="fill" /> Punch out
          </button>
        )}
      </div>
    </div>
  );
}
