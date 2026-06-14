"use server";

import { revalidatePath } from "next/cache";
import { eq, asc } from "drizzle-orm";
import { getDb } from "@/lib/db";
import {
  children,
  babyScheduleTemplates,
  babyScheduleBlocks,
} from "@/lib/db/schema";
import type {
  BabyScheduleTemplate,
  BabyScheduleBlock,
} from "@/lib/db/schema";

export async function getChildren() {
  const db = getDb();
  return db.select().from(children).orderBy(asc(children.id));
}

export async function addChild(formData: FormData) {
  const db = getDb();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  const birthDate = String(formData.get("birthDate") ?? "").trim() || null;
  const color = String(formData.get("color") ?? "").trim() || "#6366f1";

  await db.insert(children).values({ name, birthDate, color });
  revalidatePath("/baby");
}

export async function getTemplatesWithBlocks(): Promise<
  Array<BabyScheduleTemplate & { blocks: BabyScheduleBlock[] }>
> {
  const db = getDb();
  const templates = await db
    .select()
    .from(babyScheduleTemplates)
    .orderBy(asc(babyScheduleTemplates.id));
  const blocks = await db.select().from(babyScheduleBlocks);

  return templates.map((t) => ({
    ...t,
    blocks: blocks
      .filter((b) => b.templateId === t.id)
      .sort((a, b) => {
        if (a.startTime !== b.startTime) {
          return a.startTime < b.startTime ? -1 : 1;
        }
        return a.sortOrder - b.sortOrder;
      }),
  }));
}

export async function createTemplate(formData: FormData) {
  const db = getDb();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  const childIdRaw = String(formData.get("childId") ?? "").trim();
  const parsed = Number.parseInt(childIdRaw, 10);
  const childId = Number.isNaN(parsed) ? null : parsed;
  const notes = String(formData.get("notes") ?? "").trim() || null;

  await db.insert(babyScheduleTemplates).values({ name, childId, notes });
  revalidatePath("/baby");
}

export async function deleteTemplate(id: number) {
  const db = getDb();
  await db.delete(babyScheduleTemplates).where(eq(babyScheduleTemplates.id, id));
  revalidatePath("/baby");
}

export async function addBlock(formData: FormData) {
  const db = getDb();
  const templateIdRaw = String(formData.get("templateId") ?? "").trim();
  const templateId = Number.parseInt(templateIdRaw, 10);
  if (Number.isNaN(templateId)) return;
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return;
  const startTime = String(formData.get("startTime") ?? "").trim();
  if (!startTime) return;
  const kind = String(formData.get("kind") ?? "other").trim() || "other";
  const endTime = String(formData.get("endTime") ?? "").trim() || null;
  const notes = String(formData.get("notes") ?? "").trim() || null;

  await db.insert(babyScheduleBlocks).values({
    templateId,
    kind,
    title,
    startTime,
    endTime,
    notes,
    sortOrder: 0,
  });
  revalidatePath("/baby");
}

export async function deleteBlock(id: number) {
  const db = getDb();
  await db.delete(babyScheduleBlocks).where(eq(babyScheduleBlocks.id, id));
  revalidatePath("/baby");
}
