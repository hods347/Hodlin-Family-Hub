import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  date,
  timestamp,
  jsonb,
} from "drizzle-orm/pg-core";

/**
 * Move-in preparer — the family's checklist of everything to do for the new
 * house. Designed around a simple "check it off" interaction with light
 * structure (category / priority / who's responsible / due date).
 */
export const moveTasks = pgTable("move_tasks", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  notes: text("notes"),
  category: text("category").notNull().default("General"),
  // high | medium | low
  priority: text("priority").notNull().default("medium"),
  completed: boolean("completed").notNull().default(false),
  dueDate: date("due_date"),
  // Greg | Lauren | Both — free text so it stays flexible
  assignee: text("assignee"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

/**
 * Favorite meals the family rotates through. The meal plan generator draws
 * from this pool.
 */
export const meals = pgTable("meals", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  // breakfast | lunch | dinner | snack
  mealType: text("meal_type").notNull().default("dinner"),
  cuisine: text("cuisine"),
  ingredients: jsonb("ingredients").$type<string[]>().default([]).notNull(),
  tags: jsonb("tags").$type<string[]>().default([]).notNull(),
  prepMinutes: integer("prep_minutes"),
  isFavorite: boolean("is_favorite").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

/**
 * A scheduled meal on a given day — the output of the weekly generator, but
 * also editable by hand.
 */
export const mealPlanEntries = pgTable("meal_plan_entries", {
  id: serial("id").primaryKey(),
  planDate: date("plan_date").notNull(),
  // breakfast | lunch | dinner
  mealType: text("meal_type").notNull().default("dinner"),
  mealId: integer("meal_id").references(() => meals.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

/**
 * Home improvement projects. Seeded from the inspection report and added to
 * by hand. Each can be exported to Google Calendar via .ics.
 */
export const improvementProjects = pgTable("improvement_projects", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  area: text("area"),
  // inspection | manual
  source: text("source").notNull().default("manual"),
  // urgent | high | medium | low
  priority: text("priority").notNull().default("medium"),
  // not_started | in_progress | done
  status: text("status").notNull().default("not_started"),
  estimatedCost: integer("estimated_cost"),
  estimatedHours: integer("estimated_hours"),
  targetDate: date("target_date"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

/**
 * The kids. Parker (born 2023-12-24) and the new baby (due 2026-09-09).
 */
export const children = pgTable("children", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  birthDate: date("birth_date"),
  color: text("color").notNull().default("#6366f1"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

/**
 * A reusable daily schedule for a child — what the babysitter follows.
 */
export const babyScheduleTemplates = pgTable("baby_schedule_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  childId: integer("child_id").references(() => children.id, { onDelete: "cascade" }),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

/**
 * A single block within a schedule template (a nap, a feed, playtime, etc.).
 */
export const babyScheduleBlocks = pgTable("baby_schedule_blocks", {
  id: serial("id").primaryKey(),
  templateId: integer("template_id")
    .references(() => babyScheduleTemplates.id, { onDelete: "cascade" })
    .notNull(),
  // sleep | feed | play | diaper | bath | other
  kind: text("kind").notNull().default("other"),
  title: text("title").notNull(),
  // stored as "HH:MM" 24h strings for simplicity
  startTime: text("start_time").notNull(),
  endTime: text("end_time"),
  notes: text("notes"),
  sortOrder: integer("sort_order").notNull().default(0),
});

export type MoveTask = typeof moveTasks.$inferSelect;
export type NewMoveTask = typeof moveTasks.$inferInsert;
export type Meal = typeof meals.$inferSelect;
export type MealPlanEntry = typeof mealPlanEntries.$inferSelect;
export type ImprovementProject = typeof improvementProjects.$inferSelect;
export type Child = typeof children.$inferSelect;
export type BabyScheduleTemplate = typeof babyScheduleTemplates.$inferSelect;
export type BabyScheduleBlock = typeof babyScheduleBlocks.$inferSelect;
