"use server";

import { revalidatePath } from "next/cache";
import { eq, asc, and, gte, lte } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { meals, mealPlanEntries } from "@/lib/db/schema";
import type { Meal, MealPlanEntry } from "@/lib/db/schema";

/** Format a Date into a "YYYY-MM-DD" string (local). */
function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Compute the 7 ISO dates starting at startISO (inclusive). */
function weekDates(startISO: string): string[] {
  const start = new Date(startISO + "T00:00:00");
  const dates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    dates.push(toISODate(d));
  }
  return dates;
}

function pickRandom<T>(items: T[]): T | null {
  if (items.length === 0) return null;
  return items[Math.floor(Math.random() * items.length)];
}

export async function getMeals(): Promise<Meal[]> {
  const db = getDb();
  return db.select().from(meals).orderBy(asc(meals.name));
}

export async function addMeal(formData: FormData) {
  const db = getDb();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;

  const mealType = String(formData.get("mealType") ?? "dinner");
  const cuisine = String(formData.get("cuisine") ?? "").trim() || null;

  const prepRaw = String(formData.get("prepMinutes") ?? "").trim();
  const prepParsed = parseInt(prepRaw, 10);
  const prepMinutes = Number.isNaN(prepParsed) ? null : prepParsed;

  const ingredients = String(formData.get("ingredients") ?? "")
    .split(/[\n,]/)
    .map((s) => s.trim())
    .filter(Boolean);

  const tags = String(formData.get("tags") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  await db.insert(meals).values({
    name,
    mealType,
    cuisine,
    prepMinutes,
    ingredients,
    tags,
  });
  revalidatePath("/meals");
  revalidatePath("/");
}

export async function deleteMeal(id: number) {
  const db = getDb();
  await db.delete(meals).where(eq(meals.id, id));
  revalidatePath("/meals");
  revalidatePath("/");
}

export type WeekDay = {
  date: string;
  entry: MealPlanEntry | null;
  meal: Meal | null;
};

export async function getWeekPlan(startISO: string): Promise<WeekDay[]> {
  const db = getDb();
  const dates = weekDates(startISO);
  const start = dates[0];
  const end = dates[dates.length - 1];

  const rows = await db
    .select({ entry: mealPlanEntries, meal: meals })
    .from(mealPlanEntries)
    .leftJoin(meals, eq(mealPlanEntries.mealId, meals.id))
    .where(
      and(
        gte(mealPlanEntries.planDate, start),
        lte(mealPlanEntries.planDate, end),
        eq(mealPlanEntries.mealType, "dinner"),
      ),
    );

  const byDate = new Map<string, { entry: MealPlanEntry; meal: Meal | null }>();
  for (const row of rows) {
    byDate.set(row.entry.planDate, { entry: row.entry, meal: row.meal });
  }

  return dates.map((date) => {
    const hit = byDate.get(date);
    return {
      date,
      entry: hit?.entry ?? null,
      meal: hit?.meal ?? null,
    };
  });
}

/** Get a pool of candidate dinner meals (fall back to any meal). */
async function dinnerPool(): Promise<Meal[]> {
  const db = getDb();
  const dinners = await db.select().from(meals).where(eq(meals.mealType, "dinner"));
  if (dinners.length > 0) return dinners;
  return db.select().from(meals);
}

export async function generateWeekPlan(startISO: string) {
  const db = getDb();
  const dates = weekDates(startISO);
  const start = dates[0];
  const end = dates[dates.length - 1];

  const pool = await dinnerPool();
  if (pool.length === 0) return;

  // Clear existing dinner entries in range.
  await db
    .delete(mealPlanEntries)
    .where(
      and(
        gte(mealPlanEntries.planDate, start),
        lte(mealPlanEntries.planDate, end),
        eq(mealPlanEntries.mealType, "dinner"),
      ),
    );

  const values = dates.map((date) => {
    const meal = pickRandom(pool);
    return {
      planDate: date,
      mealType: "dinner",
      mealId: meal ? meal.id : null,
    };
  });
  await db.insert(mealPlanEntries).values(values);

  revalidatePath("/meals");
  revalidatePath("/");
}

export async function rerollDay(dateISO: string) {
  const db = getDb();

  await db
    .delete(mealPlanEntries)
    .where(
      and(eq(mealPlanEntries.planDate, dateISO), eq(mealPlanEntries.mealType, "dinner")),
    );

  const pool = await dinnerPool();
  if (pool.length === 0) {
    revalidatePath("/meals");
    return;
  }

  const meal = pickRandom(pool);
  await db.insert(mealPlanEntries).values({
    planDate: dateISO,
    mealType: "dinner",
    mealId: meal ? meal.id : null,
  });

  revalidatePath("/meals");
  revalidatePath("/");
}

export async function setDayMeal(dateISO: string, mealId: number) {
  const db = getDb();

  await db
    .delete(mealPlanEntries)
    .where(
      and(eq(mealPlanEntries.planDate, dateISO), eq(mealPlanEntries.mealType, "dinner")),
    );

  await db.insert(mealPlanEntries).values({
    planDate: dateISO,
    mealType: "dinner",
    mealId,
  });

  revalidatePath("/meals");
  revalidatePath("/");
}

export async function clearWeekPlan(startISO: string) {
  const db = getDb();
  const dates = weekDates(startISO);
  const start = dates[0];
  const end = dates[dates.length - 1];

  await db
    .delete(mealPlanEntries)
    .where(
      and(
        gte(mealPlanEntries.planDate, start),
        lte(mealPlanEntries.planDate, end),
        eq(mealPlanEntries.mealType, "dinner"),
      ),
    );

  revalidatePath("/meals");
  revalidatePath("/");
}
