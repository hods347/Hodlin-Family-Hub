"use client";

import { useMemo, useState, useTransition } from "react";
import type { ImprovementProject } from "@/lib/db/schema";
import { Badge, Card } from "@/components/ui";
import { formatDate, formatMoney, cn } from "@/lib/utils";
import {
  addProject,
  importInspectionItems,
  updateProject,
  updateProjectStatus,
  updateProjectPriority,
  deleteProject,
} from "@/app/improvements/actions";

/** Rank used to sort by priority (higher = more urgent). */
const PRIORITY_RANK: Record<string, number> = {
  urgent: 3,
  high: 2,
  medium: 1,
  low: 0,
};

const PRIORITIES = ["urgent", "high", "medium", "low"] as const;
const STATUSES = ["not_started", "in_progress", "done"] as const;

const STATUS_LABELS: Record<string, string> = {
  not_started: "Not started",
  in_progress: "In progress",
  done: "Done",
};

type StatusFilter = "all" | (typeof STATUSES)[number];

/** "YYYY-MM-DD" -> "YYYYMMDD" */
function toCalDate(value: string): string {
  return value.replace(/-/g, "");
}

/** Add one day to a "YYYY-MM-DD" string, returning "YYYYMMDD". */
function nextCalDate(value: string): string {
  const d = new Date(value + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + 1);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}${m}${day}`;
}

function googleCalendarUrl(project: ImprovementProject): string {
  if (!project.targetDate) return "";
  const start = toCalDate(project.targetDate);
  const end = nextCalDate(project.targetDate);

  const detailParts: string[] = [];
  if (project.area) detailParts.push(`Area: ${project.area}`);
  if (project.priority) detailParts.push(`Priority: ${project.priority}`);
  if (project.estimatedCost != null)
    detailParts.push(`Estimated cost: ${formatMoney(project.estimatedCost)}`);
  if (project.estimatedHours != null)
    detailParts.push(`Estimated hours: ${project.estimatedHours}h`);
  if (project.description) detailParts.push(project.description);
  const details = detailParts.join("\n");

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: project.title,
    dates: `${start}/${end}`,
    details,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function ImprovementsClient({ projects }: { projects: ImprovementProject[] }) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortByPriority, setSortByPriority] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [showImport, setShowImport] = useState(false);

  const counts = useMemo(() => {
    const byStatus: Record<string, number> = {
      not_started: 0,
      in_progress: 0,
      done: 0,
    };
    let totalCost = 0;
    let inspectionCount = 0;
    for (const p of projects) {
      byStatus[p.status] = (byStatus[p.status] ?? 0) + 1;
      totalCost += p.estimatedCost ?? 0;
      if (p.source === "inspection") inspectionCount += 1;
    }
    return { byStatus, totalCost, inspectionCount };
  }, [projects]);

  const visible = useMemo(() => {
    let list = projects.filter((p) => statusFilter === "all" || p.status === statusFilter);
    if (sortByPriority) {
      list = [...list].sort(
        (a, b) => (PRIORITY_RANK[b.priority] ?? 0) - (PRIORITY_RANK[a.priority] ?? 0),
      );
    }
    return list;
  }, [projects, statusFilter, sortByPriority]);

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-5">
          <div className="text-sm text-muted">Not started</div>
          <div className="mt-1 text-2xl font-bold">{counts.byStatus.not_started}</div>
        </Card>
        <Card className="p-5">
          <div className="text-sm text-muted">In progress</div>
          <div className="mt-1 text-2xl font-bold">{counts.byStatus.in_progress}</div>
        </Card>
        <Card className="p-5">
          <div className="text-sm text-muted">Done</div>
          <div className="mt-1 text-2xl font-bold">{counts.byStatus.done}</div>
        </Card>
        <Card className="p-5">
          <div className="text-sm text-muted">Est. total cost</div>
          <div className="mt-1 text-2xl font-bold text-accent">
            {formatMoney(counts.totalCost)}
          </div>
          <div className="mt-1 text-xs text-muted">
            {counts.inspectionCount} from inspection
          </div>
        </Card>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex overflow-hidden rounded-lg border border-border">
          {(["all", ...STATUSES] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                "px-3 py-2 text-sm",
                statusFilter === s ? "bg-accent text-white" : "bg-card hover:bg-black/5",
              )}
            >
              {s === "all" ? "All" : STATUS_LABELS[s]}
            </button>
          ))}
        </div>
        <button
          onClick={() => setSortByPriority((v) => !v)}
          className={cn(
            "rounded-lg border border-border px-3 py-2 text-sm",
            sortByPriority ? "bg-accent text-white" : "bg-card hover:bg-black/5",
          )}
        >
          {sortByPriority ? "✓ Sorted by priority" : "Sort by priority"}
        </button>
        <div className="ml-auto flex gap-2">
          <button
            onClick={() => {
              setShowImport((v) => !v);
              setShowAdd(false);
            }}
            className="rounded-lg border border-border bg-card px-4 py-2 text-sm hover:bg-black/5"
          >
            {showImport ? "Close" : "📋 Import inspection items"}
          </button>
          <button
            onClick={() => {
              setShowAdd((v) => !v);
              setShowImport(false);
            }}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            {showAdd ? "Close" : "+ Add project"}
          </button>
        </div>
      </div>

      {/* Add form */}
      {showAdd && (
        <Card className="p-5">
          <form
            action={async (fd) => {
              await addProject(fd);
              setShowAdd(false);
            }}
            className="grid gap-3 sm:grid-cols-2"
          >
            <input
              name="title"
              required
              placeholder="Project title"
              className="rounded-lg border border-border px-3 py-2 text-sm sm:col-span-2"
            />
            <input
              name="area"
              placeholder="Area (e.g. Kitchen, Roof, Basement)"
              className="rounded-lg border border-border px-3 py-2 text-sm"
            />
            <select
              name="priority"
              defaultValue="medium"
              className="rounded-lg border border-border bg-card px-3 py-2 text-sm capitalize"
            >
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {p} priority
                </option>
              ))}
            </select>
            <select
              name="status"
              defaultValue="not_started"
              className="rounded-lg border border-border bg-card px-3 py-2 text-sm"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s]}
                </option>
              ))}
            </select>
            <input
              name="estimatedCost"
              type="number"
              min="0"
              placeholder="Estimated cost ($)"
              className="rounded-lg border border-border px-3 py-2 text-sm"
            />
            <input
              name="estimatedHours"
              type="number"
              min="0"
              placeholder="Estimated hours"
              className="rounded-lg border border-border px-3 py-2 text-sm"
            />
            <input
              name="targetDate"
              type="date"
              className="rounded-lg border border-border bg-card px-3 py-2 text-sm"
            />
            <textarea
              name="description"
              placeholder="Description / notes"
              rows={3}
              className="rounded-lg border border-border px-3 py-2 text-sm sm:col-span-2"
            />
            <button
              type="submit"
              className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90 sm:col-span-2"
            >
              Add project
            </button>
          </form>
        </Card>
      )}

      {/* Import inspection items */}
      {showImport && (
        <Card className="p-5">
          <form
            action={async (fd) => {
              await importInspectionItems(fd);
              setShowImport(false);
            }}
            className="space-y-3"
          >
            <p className="text-sm text-muted">
              Paste items from your inspection report, one per line. Each becomes a
              project tagged <Badge variant="inspection">inspection</Badge>. To set
              priority and cost, use{" "}
              <code className="rounded bg-border/40 px-1">Title | priority | cost | area</code>{" "}
              — priority is one of urgent/high/medium/low, and the trailing fields
              are optional (a plain title still works).
            </p>
            <textarea
              name="items"
              required
              rows={8}
              placeholder={"Replace heating systems before heating season | urgent | 12000 | Heating\nFix gutter/downspout drainage | high | 2500 | Gutters\nRegrade soil away from foundation | low | 1000 | Grounds"}
              className="w-full rounded-lg border border-border px-3 py-2 text-sm"
            />
            <button
              type="submit"
              className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90"
            >
              Import items
            </button>
          </form>
        </Card>
      )}

      {/* Project list */}
      {visible.length === 0 ? (
        <p className="py-10 text-center text-muted">No projects match this filter.</p>
      ) : (
        <Card className="divide-y divide-border">
          {visible.map((project) => (
            <ProjectRow key={project.id} project={project} />
          ))}
        </Card>
      )}
    </div>
  );
}

function ProjectRow({ project }: { project: ImprovementProject }) {
  const [, startTransition] = useTransition();
  const [isEditing, setIsEditing] = useState(false);
  const calUrl = googleCalendarUrl(project);

  if (isEditing) {
    return (
      <div className="p-4">
        <form
          action={async (fd) => {
            await updateProject(fd);
            setIsEditing(false);
          }}
          className="grid gap-3 sm:grid-cols-2"
        >
          <input type="hidden" name="id" value={project.id} />
          <input
            name="title"
            required
            defaultValue={project.title}
            placeholder="Project title"
            className="rounded-lg border border-border px-3 py-2 text-sm sm:col-span-2"
          />
          <input
            name="area"
            defaultValue={project.area ?? ""}
            placeholder="Area (e.g. Kitchen, Roof, Basement)"
            className="rounded-lg border border-border px-3 py-2 text-sm"
          />
          <select
            name="priority"
            defaultValue={project.priority}
            className="rounded-lg border border-border bg-card px-3 py-2 text-sm capitalize"
          >
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {p} priority
              </option>
            ))}
          </select>
          <select
            name="status"
            defaultValue={project.status}
            className="rounded-lg border border-border bg-card px-3 py-2 text-sm"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
          <input
            name="targetDate"
            type="date"
            defaultValue={project.targetDate ?? ""}
            className="rounded-lg border border-border bg-card px-3 py-2 text-sm"
          />
          <input
            name="estimatedCost"
            type="number"
            min="0"
            defaultValue={project.estimatedCost ?? ""}
            placeholder="Estimated cost ($)"
            className="rounded-lg border border-border px-3 py-2 text-sm"
          />
          <input
            name="estimatedHours"
            type="number"
            min="0"
            defaultValue={project.estimatedHours ?? ""}
            placeholder="Estimated hours"
            className="rounded-lg border border-border px-3 py-2 text-sm"
          />
          <textarea
            name="description"
            defaultValue={project.description ?? ""}
            placeholder="Description / notes"
            rows={3}
            className="rounded-lg border border-border px-3 py-2 text-sm sm:col-span-2"
          />
          <div className="flex gap-2 sm:col-span-2">
            <button
              type="submit"
              className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90"
            >
              Save changes
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="rounded-lg border border-border bg-card px-4 py-2 text-sm hover:bg-black/5"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3 p-4">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={cn(
              "font-medium",
              project.status === "done" && "text-muted line-through",
            )}
          >
            {project.title}
          </span>
          {project.area && <span className="text-sm text-muted">· {project.area}</span>}
        </div>

        {project.description && (
          <div className="mt-0.5 text-sm text-muted">{project.description}</div>
        )}

        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Badge variant={project.priority}>{project.priority}</Badge>
          <Badge variant={project.status}>{STATUS_LABELS[project.status] ?? project.status}</Badge>
          <Badge variant={project.source}>{project.source}</Badge>
          <span className="text-xs text-muted">{formatMoney(project.estimatedCost)}</span>
          {project.estimatedHours != null && (
            <span className="text-xs text-muted">· {project.estimatedHours}h</span>
          )}
          {project.targetDate && (
            <span className="text-xs text-muted">· 📅 {formatDate(project.targetDate)}</span>
          )}
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-2">
          <select
            value={project.status}
            onChange={(e) =>
              startTransition(() => updateProjectStatus(project.id, e.target.value))
            }
            className="rounded-full border border-border bg-card px-2 py-0.5 text-xs"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
          <select
            value={project.priority}
            onChange={(e) =>
              startTransition(() => updateProjectPriority(project.id, e.target.value))
            }
            className="rounded-full border border-border bg-card px-2 py-0.5 text-xs capitalize"
          >
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>

          {project.targetDate && (
            <>
              <a
                href={calUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-border bg-card px-2.5 py-0.5 text-xs hover:bg-black/5"
              >
                📅 Google Calendar
              </a>
              <a
                href={`/api/improvements/${project.id}/ics`}
                className="rounded-full border border-border bg-card px-2.5 py-0.5 text-xs hover:bg-black/5"
              >
                ⬇️ .ics
              </a>
            </>
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <button
          onClick={() => setIsEditing(true)}
          className="rounded-lg p-1.5 text-muted hover:bg-black/5 hover:text-accent"
          aria-label="Edit project"
          title="Edit project"
        >
          ✏️
        </button>
        <button
          onClick={() => startTransition(() => deleteProject(project.id))}
          className="rounded-lg p-1.5 text-muted hover:bg-black/5 hover:text-red-600"
          aria-label="Delete project"
          title="Delete project"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
