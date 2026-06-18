"use server";

import { revalidatePath } from "next/cache";
import { eq, asc, inArray, sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { improvementProjects } from "@/lib/db/schema";

/** Rank used when (re)sorting by priority — higher = more urgent. */
const PRIORITY_RANK: Record<string, number> = {
  urgent: 3,
  high: 2,
  medium: 1,
  low: 0,
};

export async function getProjects() {
  const db = getDb();
  return db
    .select()
    .from(improvementProjects)
    .orderBy(asc(improvementProjects.sortOrder), asc(improvementProjects.id));
}

function parseIntOrNull(value: FormDataEntryValue | null): number | null {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  const n = parseInt(raw, 10);
  return Number.isNaN(n) ? null : n;
}

/** Returns the next sort_order value so new rows append to the end of the list. */
async function nextSortOrder(
  db: ReturnType<typeof getDb>,
): Promise<number> {
  const [row] = await db
    .select({ max: sql<number>`coalesce(max(${improvementProjects.sortOrder}), -1)` })
    .from(improvementProjects);
  return Number(row?.max ?? -1) + 1;
}

export async function addProject(formData: FormData) {
  const db = getDb();
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return;

  const description = String(formData.get("description") ?? "").trim() || null;
  const area = String(formData.get("area") ?? "").trim() || null;
  const source = String(formData.get("source") ?? "manual").trim() || "manual";
  const priority = String(formData.get("priority") ?? "medium").trim() || "medium";
  const status = String(formData.get("status") ?? "not_started").trim() || "not_started";
  const estimatedCost = parseIntOrNull(formData.get("estimatedCost"));
  const estimatedHours = parseIntOrNull(formData.get("estimatedHours"));
  const targetDate = String(formData.get("targetDate") ?? "").trim() || null;

  await db.insert(improvementProjects).values({
    title,
    description,
    area,
    source,
    priority,
    status,
    estimatedCost,
    estimatedHours,
    targetDate,
    sortOrder: await nextSortOrder(db),
  });
  revalidatePath("/improvements");
  revalidatePath("/");
}

export async function updateProjectStatus(id: number, status: string) {
  const db = getDb();
  await db
    .update(improvementProjects)
    .set({ status, updatedAt: new Date() })
    .where(eq(improvementProjects.id, id));
  revalidatePath("/improvements");
  revalidatePath("/");
}

export async function updateProjectPriority(id: number, priority: string) {
  const db = getDb();
  await db
    .update(improvementProjects)
    .set({ priority, updatedAt: new Date() })
    .where(eq(improvementProjects.id, id));
  revalidatePath("/improvements");
  revalidatePath("/");
}

export async function updateProject(formData: FormData) {
  const db = getDb();
  const id = parseIntOrNull(formData.get("id"));
  if (id == null) return;

  const title = String(formData.get("title") ?? "").trim();
  if (!title) return;

  await db
    .update(improvementProjects)
    .set({
      title,
      description: String(formData.get("description") ?? "").trim() || null,
      area: String(formData.get("area") ?? "").trim() || null,
      priority: String(formData.get("priority") ?? "medium").trim() || "medium",
      status: String(formData.get("status") ?? "not_started").trim() || "not_started",
      estimatedCost: parseIntOrNull(formData.get("estimatedCost")),
      estimatedHours: parseIntOrNull(formData.get("estimatedHours")),
      targetDate: String(formData.get("targetDate") ?? "").trim() || null,
      updatedAt: new Date(),
    })
    .where(eq(improvementProjects.id, id));
  revalidatePath("/improvements");
  revalidatePath("/");
}

export async function deleteProject(id: number) {
  const db = getDb();
  await db.delete(improvementProjects).where(eq(improvementProjects.id, id));
  revalidatePath("/improvements");
  revalidatePath("/");
}

const VALID_PRIORITIES = new Set(["urgent", "high", "medium", "low"]);

/**
 * Parses one pasted line into a project. Supports an optional pipe-delimited
 * format so priority/cost/area can be set on import:
 *
 *   Title | priority | cost | area
 *
 * Only the title is required; any trailing fields can be omitted or left blank
 * (e.g. `Fix gutters | high` or `Fix gutters | | 2500`). A plain title with no
 * pipes still works and defaults to medium priority.
 */
function parseImportLine(line: string) {
  const [titlePart, priorityPart, costPart, areaPart] = line
    .split("|")
    .map((p) => p.trim());

  const title = titlePart;
  if (!title) return null;

  const priority = VALID_PRIORITIES.has((priorityPart ?? "").toLowerCase())
    ? priorityPart.toLowerCase()
    : "medium";

  const costDigits = (costPart ?? "").replace(/[^0-9]/g, "");
  const estimatedCost = costDigits ? parseInt(costDigits, 10) : null;

  const area = areaPart ? areaPart : null;

  return {
    title,
    area,
    source: "inspection" as const,
    priority,
    status: "not_started" as const,
    estimatedCost,
  };
}

export async function importInspectionItems(formData: FormData) {
  const db = getDb();
  const raw = String(formData.get("items") ?? "");
  const rows = raw
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map(parseImportLine)
    .filter((row): row is NonNullable<typeof row> => row !== null);
  if (rows.length === 0) return;

  // Land the imported batch already sorted by priority, appended after any
  // existing projects. The user can then drag individual items to fine-tune.
  const start = await nextSortOrder(db);
  rows.sort((a, b) => (PRIORITY_RANK[b.priority] ?? 0) - (PRIORITY_RANK[a.priority] ?? 0));

  await db.insert(improvementProjects).values(
    rows.map((row, i) => ({ ...row, sortOrder: start + i })),
  );
  revalidatePath("/improvements");
  revalidatePath("/");
}

/**
 * Persist a new manual order. `orderedIds` is the full list of project ids in
 * the desired top-to-bottom order; each row's sort_order is set to its index.
 */
export async function reorderProjects(orderedIds: number[]) {
  const db = getDb();
  if (orderedIds.length === 0) return;

  const cases = sql.join(
    orderedIds.map((id, i) => sql`when ${id} then ${i}`),
    sql` `,
  );
  await db
    .update(improvementProjects)
    .set({
      sortOrder: sql`case ${improvementProjects.id} ${cases} end`,
      updatedAt: new Date(),
    })
    .where(inArray(improvementProjects.id, orderedIds));
  revalidatePath("/improvements");
  revalidatePath("/");
}

/** Reorder every project by priority (urgent → low) and persist the result. */
export async function sortProjectsByPriority() {
  const db = getDb();
  const rows = await db
    .select({
      id: improvementProjects.id,
      priority: improvementProjects.priority,
      sortOrder: improvementProjects.sortOrder,
    })
    .from(improvementProjects);

  const ordered = rows
    .sort(
      (a, b) =>
        (PRIORITY_RANK[b.priority] ?? 0) - (PRIORITY_RANK[a.priority] ?? 0) ||
        a.sortOrder - b.sortOrder,
    )
    .map((r) => r.id);

  await reorderProjects(ordered);
}
