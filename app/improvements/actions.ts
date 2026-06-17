"use server";

import { revalidatePath } from "next/cache";
import { eq, desc } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { improvementProjects } from "@/lib/db/schema";

export async function getProjects() {
  const db = getDb();
  return db
    .select()
    .from(improvementProjects)
    .orderBy(desc(improvementProjects.createdAt));
}

function parseIntOrNull(value: FormDataEntryValue | null): number | null {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  const n = parseInt(raw, 10);
  return Number.isNaN(n) ? null : n;
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

  await db.insert(improvementProjects).values(rows);
  revalidatePath("/improvements");
  revalidatePath("/");
}
