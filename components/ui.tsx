import { cn } from "@/lib/utils";

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("rounded-2xl border border-border bg-card shadow-sm", className)}>
      {children}
    </div>
  );
}

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}

const badgeColors: Record<string, string> = {
  urgent: "bg-red-100 text-red-700",
  high: "bg-orange-100 text-orange-700",
  medium: "bg-amber-100 text-amber-700",
  low: "bg-slate-100 text-slate-600",
  done: "bg-emerald-100 text-emerald-700",
  in_progress: "bg-sky-100 text-sky-700",
  not_started: "bg-slate-100 text-slate-600",
  inspection: "bg-violet-100 text-violet-700",
  manual: "bg-slate-100 text-slate-600",
  default: "bg-slate-100 text-slate-600",
};

export function Badge({ variant, children }: { variant?: string; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
        badgeColors[variant ?? "default"] ?? badgeColors.default,
      )}
    >
      {children}
    </span>
  );
}

export function EmptyState({
  emoji,
  title,
  description,
  action,
}: {
  emoji: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <Card className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="text-5xl">{emoji}</div>
      <h3 className="mt-4 text-lg font-semibold">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-muted">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </Card>
  );
}

/**
 * Shown on data pages when DATABASE_URL is not configured yet, so the app is
 * useful as a preview before Neon is connected.
 */
export function DbNotConfigured() {
  return (
    <Card className="border-amber-200 bg-amber-50 p-6">
      <h3 className="flex items-center gap-2 font-semibold text-amber-900">
        <span>⚙️</span> Connect your database to get started
      </h3>
      <p className="mt-2 text-sm text-amber-800">
        This feature stores data in Neon Postgres. Add your{" "}
        <code className="rounded bg-amber-100 px-1">DATABASE_URL</code> to{" "}
        <code className="rounded bg-amber-100 px-1">.env.local</code>, then run{" "}
        <code className="rounded bg-amber-100 px-1">npm run db:push</code> and{" "}
        <code className="rounded bg-amber-100 px-1">npm run db:seed</code>. See the README
        for the full setup.
      </p>
    </Card>
  );
}
