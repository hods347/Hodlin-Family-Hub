"use client";

import { useMemo, useState, useTransition } from "react";
import type {
  BabyScheduleTemplate,
  BabyScheduleBlock,
  Child,
} from "@/lib/db/schema";
import { Card } from "@/components/ui";
import { formatTime, formatDate, cn } from "@/lib/utils";
import {
  addChild,
  createTemplate,
  deleteTemplate,
  addBlock,
  deleteBlock,
} from "@/app/baby/actions";

type TemplateWithBlocks = BabyScheduleTemplate & { blocks: BabyScheduleBlock[] };

const KINDS = ["sleep", "feed", "play", "diaper", "bath", "other"] as const;

const KIND_EMOJI: Record<string, string> = {
  sleep: "😴",
  feed: "🍼",
  play: "🧸",
  diaper: "🧷",
  bath: "🛁",
  other: "⭐",
};

const KIND_COLOR: Record<string, string> = {
  sleep: "#6366f1",
  feed: "#10b981",
  play: "#f59e0b",
  diaper: "#06b6d4",
  bath: "#3b82f6",
  other: "#94a3b8",
};

function kindEmoji(kind: string) {
  return KIND_EMOJI[kind] ?? KIND_EMOJI.other;
}
function kindColor(kind: string) {
  return KIND_COLOR[kind] ?? KIND_COLOR.other;
}

export function BabyClient({
  templates,
  children,
}: {
  templates: TemplateWithBlocks[];
  children: Child[];
}) {
  const [selectedId, setSelectedId] = useState<number | null>(
    templates[0]?.id ?? null,
  );
  const [showNewTemplate, setShowNewTemplate] = useState(false);
  const [showAddChild, setShowAddChild] = useState(false);
  const [showAddBlock, setShowAddBlock] = useState(false);

  const childById = useMemo(() => {
    const map = new Map<number, Child>();
    children.forEach((c) => map.set(c.id, c));
    return map;
  }, [children]);

  const selected =
    templates.find((t) => t.id === selectedId) ?? templates[0] ?? null;
  const selectedChild =
    selected?.childId != null ? childById.get(selected.childId) ?? null : null;

  return (
    <div className="space-y-6">
      {/* ---- Editing chrome (never printed) ---- */}
      <div className="no-print space-y-6">
        {/* Manage row */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowNewTemplate((v) => !v)}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            {showNewTemplate ? "Close" : "+ New schedule"}
          </button>
          <button
            onClick={() => setShowAddChild((v) => !v)}
            className="rounded-lg border border-border bg-card px-4 py-2 text-sm hover:bg-black/5"
          >
            {showAddChild ? "Close" : "+ Add child"}
          </button>
          {selected && (
            <button
              onClick={() => window.print()}
              className="ml-auto rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-black/5"
            >
              🖨️ Print for babysitter
            </button>
          )}
        </div>

        {/* New schedule form */}
        {showNewTemplate && (
          <Card className="p-5">
            <form
              action={async (fd) => {
                await createTemplate(fd);
                setShowNewTemplate(false);
              }}
              className="grid gap-3 sm:grid-cols-2"
            >
              <input
                name="name"
                required
                placeholder="Schedule name (e.g. Parker's Weekday)"
                className="rounded-lg border border-border px-3 py-2 text-sm sm:col-span-2"
              />
              <select
                name="childId"
                defaultValue=""
                className="rounded-lg border border-border bg-card px-3 py-2 text-sm"
              >
                <option value="">No specific child</option>
                {children.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <input
                name="notes"
                placeholder="Notes for the sitter (optional)"
                className="rounded-lg border border-border px-3 py-2 text-sm"
              />
              <button
                type="submit"
                className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90 sm:col-span-2"
              >
                Create schedule
              </button>
            </form>
          </Card>
        )}

        {/* Add child form */}
        {showAddChild && (
          <Card className="p-5">
            <form
              action={async (fd) => {
                await addChild(fd);
                setShowAddChild(false);
              }}
              className="grid gap-3 sm:grid-cols-3"
            >
              <input
                name="name"
                required
                placeholder="Child's name"
                className="rounded-lg border border-border px-3 py-2 text-sm"
              />
              <input
                name="birthDate"
                type="date"
                className="rounded-lg border border-border bg-card px-3 py-2 text-sm"
              />
              <input
                name="color"
                type="color"
                defaultValue="#6366f1"
                className="h-10 w-full cursor-pointer rounded-lg border border-border bg-card px-1 py-1"
              />
              <button
                type="submit"
                className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90 sm:col-span-3"
              >
                Add child
              </button>
            </form>
          </Card>
        )}

        {/* Template selector */}
        {templates.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {templates.map((t) => {
              const c = t.childId != null ? childById.get(t.childId) : null;
              const active = selected?.id === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setSelectedId(t.id)}
                  className={cn(
                    "flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm",
                    active
                      ? "border-accent bg-accent text-white"
                      : "border-border bg-card hover:bg-black/5",
                  )}
                >
                  {c && (
                    <span
                      className="inline-block h-2.5 w-2.5 rounded-full"
                      style={{ background: c.color }}
                    />
                  )}
                  <span className="font-medium">{t.name}</span>
                  {c && (
                    <span
                      className={cn(
                        "text-xs",
                        active ? "text-white/80" : "text-muted",
                      )}
                    >
                      {c.name}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {templates.length === 0 && (
          <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted">
            No schedules yet — use “+ New schedule” above to create one for your
            babysitter.
          </p>
        )}
      </div>

      {/* ---- Printable schedule area ---- */}
      {selected && (
        <div className="space-y-4">
          <Card className="p-6">
            {/* Header */}
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                {selectedChild && (
                  <div className="flex items-center gap-2 text-sm text-muted">
                    <span
                      className="inline-block h-3 w-3 rounded-full"
                      style={{ background: selectedChild.color }}
                    />
                    <span>{selectedChild.name}</span>
                    {selectedChild.birthDate && (
                      <span>· born {formatDate(selectedChild.birthDate)}</span>
                    )}
                  </div>
                )}
                <h2 className="text-2xl font-bold tracking-tight">
                  {selected.name}
                </h2>
                {selected.notes && (
                  <p className="mt-1 max-w-2xl text-sm text-muted">
                    {selected.notes}
                  </p>
                )}
              </div>
              <div className="no-print flex gap-2">
                <button
                  onClick={() => setShowAddBlock((v) => !v)}
                  className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90"
                >
                  {showAddBlock ? "Close" : "+ Add block"}
                </button>
                <button
                  onClick={() => {
                    if (
                      confirm(`Delete schedule “${selected.name}”?`)
                    ) {
                      deleteTemplate(selected.id);
                    }
                  }}
                  className="rounded-lg border border-border bg-card px-3 py-2 text-sm hover:bg-black/5 hover:text-red-600"
                >
                  Delete schedule
                </button>
              </div>
            </div>

            {/* Add block form */}
            {showAddBlock && (
              <form
                action={async (fd) => {
                  await addBlock(fd);
                  setShowAddBlock(false);
                }}
                className="no-print mt-4 grid gap-3 rounded-xl border border-border p-4 sm:grid-cols-2"
              >
                <input type="hidden" name="templateId" value={selected.id} />
                <select
                  name="kind"
                  defaultValue="sleep"
                  className="rounded-lg border border-border bg-card px-3 py-2 text-sm"
                >
                  {KINDS.map((k) => (
                    <option key={k} value={k}>
                      {kindEmoji(k)} {k}
                    </option>
                  ))}
                </select>
                <input
                  name="title"
                  required
                  placeholder="Title (e.g. Morning nap)"
                  className="rounded-lg border border-border px-3 py-2 text-sm"
                />
                <label className="flex items-center gap-2 text-sm text-muted">
                  Start
                  <input
                    name="startTime"
                    type="time"
                    required
                    className="flex-1 rounded-lg border border-border bg-card px-3 py-2 text-sm"
                  />
                </label>
                <label className="flex items-center gap-2 text-sm text-muted">
                  End
                  <input
                    name="endTime"
                    type="time"
                    className="flex-1 rounded-lg border border-border bg-card px-3 py-2 text-sm"
                  />
                </label>
                <input
                  name="notes"
                  placeholder="Notes (optional)"
                  className="rounded-lg border border-border px-3 py-2 text-sm sm:col-span-2"
                />
                <button
                  type="submit"
                  className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90 sm:col-span-2"
                >
                  Add block
                </button>
              </form>
            )}

            {/* Timeline */}
            <div className="mt-5 space-y-2">
              {selected.blocks.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted">
                  No blocks yet. Add naps, feeds, and play time to build the
                  day.
                </p>
              ) : (
                selected.blocks.map((b) => (
                  <div
                    key={b.id}
                    className="flex items-start gap-3 rounded-xl border border-border bg-card p-3"
                    style={{ borderLeft: `4px solid ${kindColor(b.kind)}` }}
                  >
                    <span className="text-2xl leading-none">
                      {kindEmoji(b.kind)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold text-muted">
                        {formatTime(b.startTime)}
                        {b.endTime ? ` – ${formatTime(b.endTime)}` : ""}
                      </div>
                      <div className="font-medium">{b.title}</div>
                      {b.notes && (
                        <div className="mt-0.5 text-sm text-muted">
                          {b.notes}
                        </div>
                      )}
                    </div>
                    <DeleteBlockButton id={b.id} />
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

function DeleteBlockButton({ id }: { id: number }) {
  const [, startTransition] = useTransition();
  return (
    <button
      onClick={() => startTransition(() => deleteBlock(id))}
      className="no-print shrink-0 rounded-lg p-1.5 text-muted hover:bg-black/5 hover:text-red-600"
      aria-label="Delete block"
      title="Delete block"
    >
      ✕
    </button>
  );
}
