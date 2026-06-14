"use client";

import { useMemo, useState, useTransition } from "react";
import type { MoveTask } from "@/lib/db/schema";
import { MOVE_IN_CATEGORIES } from "@/lib/data/move-in-defaults";
import { Badge, Card } from "@/components/ui";
import { formatDate, daysUntil, cn } from "@/lib/utils";
import {
  addMoveTask,
  toggleMoveTask,
  deleteMoveTask,
  setMoveTaskPriority,
  clearCompletedMoveTasks,
} from "@/app/move-in/actions";

const PRIORITIES = ["high", "medium", "low"] as const;

export function MoveInClient({ tasks }: { tasks: MoveTask[] }) {
  const [, startTransition] = useTransition();
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "done">("all");
  const [showAdd, setShowAdd] = useState(false);

  const done = tasks.filter((t) => t.completed).length;
  const total = tasks.length;
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);

  // Category list = canonical order first, then any custom categories.
  const categories = useMemo(() => {
    const set = new Set<string>(MOVE_IN_CATEGORIES);
    tasks.forEach((t) => set.add(t.category));
    return Array.from(set);
  }, [tasks]);

  const visible = tasks.filter((t) => {
    if (categoryFilter !== "all" && t.category !== categoryFilter) return false;
    if (statusFilter === "active" && t.completed) return false;
    if (statusFilter === "done" && !t.completed) return false;
    return true;
  });

  const grouped = categories
    .map((cat) => ({ cat, items: visible.filter((t) => t.category === cat) }))
    .filter((g) => g.items.length > 0);

  return (
    <div className="space-y-6">
      {/* Progress */}
      <Card className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-muted">Overall progress</div>
            <div className="text-2xl font-bold">
              {done} / {total} done
            </div>
          </div>
          <div className="text-3xl font-bold text-accent">{pct}%</div>
        </div>
        <div className="mt-3 h-3 w-full overflow-hidden rounded-full bg-black/5">
          <div
            className="h-full rounded-full bg-accent transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted">
          {categories.map((cat) => {
            const items = tasks.filter((t) => t.category === cat);
            if (items.length === 0) return null;
            const d = items.filter((t) => t.completed).length;
            return (
              <span key={cat} className="rounded-full bg-black/5 px-2.5 py-1">
                {cat}: {d}/{items.length}
              </span>
            );
          })}
        </div>
      </Card>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="rounded-lg border border-border bg-card px-3 py-2 text-sm"
        >
          <option value="all">All categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <div className="flex overflow-hidden rounded-lg border border-border">
          {(["all", "active", "done"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                "px-3 py-2 text-sm capitalize",
                statusFilter === s ? "bg-accent text-white" : "bg-card hover:bg-black/5",
              )}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="ml-auto flex gap-2">
          <button
            onClick={() => setShowAdd((v) => !v)}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            {showAdd ? "Close" : "+ Add task"}
          </button>
          {done > 0 && (
            <button
              onClick={() => {
                if (confirm(`Delete ${done} completed task(s)?`)) {
                  startTransition(() => clearCompletedMoveTasks());
                }
              }}
              className="rounded-lg border border-border bg-card px-4 py-2 text-sm hover:bg-black/5"
            >
              Clear completed
            </button>
          )}
        </div>
      </div>

      {/* Add form */}
      {showAdd && (
        <Card className="p-5">
          <form
            action={async (fd) => {
              await addMoveTask(fd);
              setShowAdd(false);
            }}
            className="grid gap-3 sm:grid-cols-2"
          >
            <input
              name="title"
              required
              placeholder="Task title"
              className="rounded-lg border border-border px-3 py-2 text-sm sm:col-span-2"
            />
            <select
              name="category"
              defaultValue="General"
              className="rounded-lg border border-border bg-card px-3 py-2 text-sm"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
              <option value="General">General</option>
            </select>
            <select
              name="priority"
              defaultValue="medium"
              className="rounded-lg border border-border bg-card px-3 py-2 text-sm"
            >
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {p} priority
                </option>
              ))}
            </select>
            <input
              name="assignee"
              placeholder="Assignee (e.g. Greg, Lauren, Both)"
              className="rounded-lg border border-border px-3 py-2 text-sm"
            />
            <input
              name="dueDate"
              type="date"
              className="rounded-lg border border-border bg-card px-3 py-2 text-sm"
            />
            <button
              type="submit"
              className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90 sm:col-span-2"
            >
              Add task
            </button>
          </form>
        </Card>
      )}

      {/* Grouped list */}
      {grouped.length === 0 ? (
        <p className="py-10 text-center text-muted">No tasks match this filter.</p>
      ) : (
        grouped.map(({ cat, items }) => (
          <div key={cat}>
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted">
              {cat}
            </h2>
            <Card className="divide-y divide-border">
              {items.map((task) => (
                <TaskRow key={task.id} task={task} />
              ))}
            </Card>
          </div>
        ))
      )}
    </div>
  );
}

function TaskRow({ task }: { task: MoveTask }) {
  const [, startTransition] = useTransition();
  const due = task.dueDate ? daysUntil(task.dueDate) : null;

  return (
    <div className="flex items-start gap-3 p-3">
      <input
        type="checkbox"
        checked={task.completed}
        onChange={(e) => startTransition(() => toggleMoveTask(task.id, e.target.checked))}
        className="mt-1 h-5 w-5 shrink-0 cursor-pointer accent-indigo-500"
      />
      <div className="min-w-0 flex-1">
        <div className={cn("font-medium", task.completed && "text-muted line-through")}>
          {task.title}
        </div>
        {task.notes && <div className="mt-0.5 text-sm text-muted">{task.notes}</div>}
        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          <select
            value={task.priority}
            onChange={(e) => startTransition(() => setMoveTaskPriority(task.id, e.target.value))}
            className="rounded-full border border-border bg-card px-2 py-0.5 text-xs capitalize"
          >
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          {task.assignee && <Badge>{task.assignee}</Badge>}
          {task.dueDate && (
            <span
              className={cn(
                "text-xs",
                due !== null && due < 0 && !task.completed
                  ? "font-medium text-red-600"
                  : "text-muted",
              )}
            >
              📅 {formatDate(task.dueDate)}
              {due !== null && !task.completed && due >= 0 && due <= 14 && ` · ${due}d left`}
            </span>
          )}
        </div>
      </div>
      <button
        onClick={() => startTransition(() => deleteMoveTask(task.id))}
        className="shrink-0 rounded-lg p-1.5 text-muted hover:bg-black/5 hover:text-red-600"
        aria-label="Delete task"
        title="Delete task"
      >
        ✕
      </button>
    </div>
  );
}
