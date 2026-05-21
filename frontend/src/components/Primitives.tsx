import { cn } from "../lib/utils";

export function PageHeader({
  overline,
  title,
  subtitle,
  actions,
  className,
}: {
  overline?: string;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("px-4 sm:px-6 lg:px-8 pt-8 pb-6 border-b border-line flex flex-wrap items-end justify-between gap-4", className)}>
      <div>
        {overline && <p className="overline mb-2">{overline}</p>}
        <h1 className="h-display text-3xl sm:text-4xl font-bold text-white">{title}</h1>
        {subtitle && <p className="text-sm text-ink-secondary mt-1.5 max-w-2xl">{subtitle}</p>}
      </div>
      {actions && <div className="flex gap-2 items-center">{actions}</div>}
    </div>
  );
}

export function StatCell({
  label,
  value,
  delta,
  accent,
  testid,
}: {
  label: string;
  value: string | number;
  delta?: string;
  accent?: "orange" | "green" | "muted";
  testid?: string;
}) {
  return (
    <div
      className="p-6 hover:bg-bg-surface transition-colors"
      data-testid={testid}
    >
      <p className="overline">{label}</p>
      <p
        className={cn(
          "h-display text-4xl font-bold mt-3",
          accent === "orange" && "text-brand",
          accent === "green" && "text-success",
          (!accent || accent === "muted") && "text-white"
        )}
      >
        {value}
      </p>
      {delta && <p className="text-xs text-ink-muted mt-1">{delta}</p>}
    </div>
  );
}

export function Panel({ children, className, title, actions, testid }: {
  children: React.ReactNode;
  className?: string;
  title?: string;
  actions?: React.ReactNode;
  testid?: string;
}) {
  return (
    <div className={cn("panel-flat", className)} data-testid={testid}>
      {(title || actions) && (
        <div className="px-4 py-3 border-b border-line flex items-center justify-between">
          {title && <p className="text-sm font-medium text-white">{title}</p>}
          {actions}
        </div>
      )}
      <div>{children}</div>
    </div>
  );
}

export const STATUS_COLORS: Record<string, string> = {
  todo: "chip-muted",
  in_progress: "chip-orange",
  review: "chip border-yellow-400/30 text-yellow-300 bg-yellow-300/10",
  done: "chip-green",
};

export const PRIORITY_COLORS: Record<string, string> = {
  low: "chip-muted",
  medium: "chip border-blue-400/30 text-blue-300 bg-blue-300/10",
  high: "chip-orange",
  urgent: "chip-red",
};

export const STATUS_LABEL: Record<string, string> = {
  todo: "To Do",
  in_progress: "In Progress",
  review: "Review",
  done: "Done",
};
