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

export async function importInspectionItems(formData: FormData) {
  const db = getDb();
  const raw = String(formData.get("items") ?? "");
  const titles = raw
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  if (titles.length === 0) return;

  await db.insert(improvementProjects).values(
    titles.map((title) => ({
      title,
      source: "inspection",
      priority: "medium",
      status: "not_started",
    })),
  );
  revalidatePath("/improvements");
  revalidatePath("/");
}
