import { config } from "dotenv";
config({ path: ".env.local" });
config();

import { getDb } from "./index";
import {
  moveTasks,
  meals,
  improvementProjects,
  children,
  babyScheduleTemplates,
  babyScheduleBlocks,
} from "./schema";
import { DEFAULT_MOVE_TASKS } from "../data/move-in-defaults";

async function main() {
  const db = getDb();
  console.log("Seeding Hodlin Family Hub…");

  // Move-in checklist
  const existingTasks = await db.select().from(moveTasks).limit(1);
  if (existingTasks.length === 0) {
    await db.insert(moveTasks).values(
      DEFAULT_MOVE_TASKS.map((t, i) => ({
        title: t.title,
        category: t.category,
        priority: t.priority,
        notes: t.notes ?? null,
        sortOrder: i,
      })),
    );
    console.log(`  ✓ Inserted ${DEFAULT_MOVE_TASKS.length} move-in tasks`);
  } else {
    console.log("  • Move-in tasks already exist, skipping");
  }

  // A few starter favorite meals
  const existingMeals = await db.select().from(meals).limit(1);
  if (existingMeals.length === 0) {
    await db.insert(meals).values([
      { name: "Sheet-pan chicken & veggies", mealType: "dinner", prepMinutes: 40, tags: ["easy", "kid-friendly"], ingredients: ["chicken thighs", "broccoli", "potatoes", "olive oil"] },
      { name: "Spaghetti & turkey meatballs", mealType: "dinner", prepMinutes: 35, tags: ["kid-friendly"], ingredients: ["spaghetti", "ground turkey", "marinara", "parmesan"] },
      { name: "Taco night", mealType: "dinner", prepMinutes: 25, tags: ["quick", "kid-friendly"], ingredients: ["ground beef", "tortillas", "cheese", "lettuce", "salsa"] },
      { name: "Salmon, rice & green beans", mealType: "dinner", prepMinutes: 30, tags: ["healthy"], ingredients: ["salmon", "rice", "green beans", "lemon"] },
      { name: "Breakfast-for-dinner (eggs & pancakes)", mealType: "dinner", prepMinutes: 25, tags: ["kid-friendly", "quick"], ingredients: ["eggs", "pancake mix", "fruit", "syrup"] },
      { name: "Stir-fry with rice", mealType: "dinner", prepMinutes: 30, tags: ["quick"], ingredients: ["chicken", "mixed vegetables", "soy sauce", "rice"] },
      { name: "Homemade pizza", mealType: "dinner", prepMinutes: 45, tags: ["fun", "kid-friendly"], ingredients: ["pizza dough", "sauce", "mozzarella", "toppings"] },
    ]);
    console.log("  ✓ Inserted starter meals");
  } else {
    console.log("  • Meals already exist, skipping");
  }

  // A couple of example improvement projects
  const existingProjects = await db.select().from(improvementProjects).limit(1);
  if (existingProjects.length === 0) {
    await db.insert(improvementProjects).values([
      { title: "Service HVAC system", area: "Whole house", source: "inspection", priority: "high", status: "not_started", estimatedCost: 250, estimatedHours: 2 },
      { title: "Re-caulk master bathroom", area: "Master bath", source: "inspection", priority: "medium", status: "not_started", estimatedCost: 30, estimatedHours: 2 },
      { title: "Paint nursery before baby arrives", area: "Nursery", source: "manual", priority: "high", status: "not_started", estimatedCost: 150, estimatedHours: 8 },
    ]);
    console.log("  ✓ Inserted example improvement projects");
  } else {
    console.log("  • Improvement projects already exist, skipping");
  }

  // Children + a sample babysitter schedule
  const existingChildren = await db.select().from(children).limit(1);
  if (existingChildren.length === 0) {
    const inserted = await db
      .insert(children)
      .values([
        { name: "Parker", birthDate: "2023-12-24", color: "#ec4899" },
        { name: "Baby (due Sep 2026)", birthDate: "2026-09-09", color: "#8b5cf6" },
      ])
      .returning();

    const parker = inserted.find((c) => c.name === "Parker");
    if (parker) {
      const [template] = await db
        .insert(babyScheduleTemplates)
        .values({
          name: "Parker — Typical Day",
          childId: parker.id,
          notes: "Comfort item: blanket. Allergies: none. Emergency: call/text us anytime.",
        })
        .returning();

      await db.insert(babyScheduleBlocks).values([
        { templateId: template.id, kind: "feed", title: "Breakfast", startTime: "07:30", endTime: "08:00", sortOrder: 0 },
        { templateId: template.id, kind: "play", title: "Morning play", startTime: "08:00", endTime: "09:30", sortOrder: 1 },
        { templateId: template.id, kind: "feed", title: "Morning snack", startTime: "09:30", endTime: "09:45", sortOrder: 2 },
        { templateId: template.id, kind: "sleep", title: "Morning nap", startTime: "10:00", endTime: "11:30", notes: "Sound machine on, lights off.", sortOrder: 3 },
        { templateId: template.id, kind: "feed", title: "Lunch", startTime: "12:00", endTime: "12:30", sortOrder: 4 },
        { templateId: template.id, kind: "sleep", title: "Afternoon nap", startTime: "13:30", endTime: "15:00", sortOrder: 5 },
        { templateId: template.id, kind: "feed", title: "Afternoon snack", startTime: "15:15", endTime: "15:30", sortOrder: 6 },
        { templateId: template.id, kind: "play", title: "Afternoon play", startTime: "15:30", endTime: "17:30", sortOrder: 7 },
        { templateId: template.id, kind: "feed", title: "Dinner", startTime: "17:30", endTime: "18:00", sortOrder: 8 },
        { templateId: template.id, kind: "bath", title: "Bath & pajamas", startTime: "18:30", endTime: "19:00", sortOrder: 9 },
        { templateId: template.id, kind: "sleep", title: "Bedtime", startTime: "19:30", notes: "Two books, then lights out.", sortOrder: 10 },
      ]);
      console.log("  ✓ Inserted children + sample babysitter schedule");
    }
  } else {
    console.log("  • Children already exist, skipping");
  }

  console.log("Done!");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
