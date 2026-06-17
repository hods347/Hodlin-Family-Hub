import { PageHeader, DbNotConfigured, DbError } from "@/components/ui";
import { isDbConfigured } from "@/lib/db";
import { MealsClient } from "@/components/meals/meals-client";
import { getMeals, getWeekPlan } from "./actions";

export const dynamic = "force-dynamic";

/** Format a Date into a "YYYY-MM-DD" string (local). */
function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default async function MealsPage() {
  if (!isDbConfigured) {
    return (
      <>
        <PageHeader
          title="Meal Planner 🍽️"
          description="Plan the week's dinners, build a shopping list, and keep your family favorites."
        />
        <DbNotConfigured />
      </>
    );
  }

  const weekStartISO = toISODate(new Date());
  let meals, weekPlan;
  try {
    [meals, weekPlan] = await Promise.all([getMeals(), getWeekPlan(weekStartISO)]);
  } catch (err) {
    return (
      <>
        <PageHeader
          title="Meal Planner 🍽️"
          description="Plan the week's dinners, build a shopping list, and keep your family favorites."
        />
        <DbError message={err instanceof Error ? err.message : undefined} />
      </>
    );
  }

  const week = weekPlan.map((d) => ({ date: d.date, meal: d.meal }));

  return (
    <>
      <PageHeader
        title="Meal Planner 🍽️"
        description="Plan the week's dinners, build a shopping list, and keep your family favorites."
      />
      <MealsClient meals={meals} week={week} weekStartISO={weekStartISO} />
    </>
  );
}
