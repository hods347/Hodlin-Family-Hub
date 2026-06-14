"use server";

import { revalidatePath } from "next/cache";
import { eq, asc } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { moveTasks } from "@/lib/db/schema";
import { DEFAULT_MOVE_TASKS } from "@/lib/data/move-in-defaults";

export async function getMoveTasks() {
  const db = getDb();
  return db.select().from(moveTasks).orderBy(asc(moveTasks.sortOrder), asc(moveTasks.id));
}

export async function addMoveTask(formData: FormData) {
  const db = getDb();
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return;
  const category = String(formData.get("category") ?? "General");
  const priority = String(formData.get("priority") ?? "medium");
  const assignee = String(formData.get("assignee") ?? "").trim() || null;
  const dueDate = String(formData.get("dueDate") ?? "").trim() || null;

  await db.insert(moveTasks).values({
    title,
    category,
    priority,
    assignee,
    dueDate,
    sortOrder: Date.now() % 1_000_000,
  });
  revalidatePath("/move-in");
  revalidatePath("/");
}

export async function toggleMoveTask(id: number, completed: boolean) {
  const db = getDb();
  await db
    .update(moveTasks)
    .set({ completed, updatedAt: new Date() })
    .where(eq(moveTasks.id, id));
  revalidatePath("/move-in");
  revalidatePath("/");
}

export async function setMoveTaskPriority(id: number, priority: string) {
  const db = getDb();
  await db
    .update(moveTasks)
    .set({ priority, updatedAt: new Date() })
    .where(eq(moveTasks.id, id));
  revalidatePath("/move-in");
}

export async function deleteMoveTask(id: number) {
  const db = getDb();
  await db.delete(moveTasks).where(eq(moveTasks.id, id));
  revalidatePath("/move-in");
  revalidatePath("/");
}

export async function loadDefaultMoveTasks() {
  const db = getDb();
  const existing = await db.select({ id: moveTasks.id }).from(moveTasks).limit(1);
  if (existing.length > 0) return;
  await db.insert(moveTasks).values(
    DEFAULT_MOVE_TASKS.map((t, i) => ({
      title: t.title,
      category: t.category,
      priority: t.priority,
      notes: t.notes ?? null,
      sortOrder: i,
    })),
  );
  revalidatePath("/move-in");
  revalidatePath("/");
}

export async function clearCompletedMoveTasks() {
  const db = getDb();
  await db.delete(moveTasks).where(eq(moveTasks.completed, true));
  revalidatePath("/move-in");
  revalidatePath("/");
}
