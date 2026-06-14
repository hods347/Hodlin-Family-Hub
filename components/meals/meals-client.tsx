"use client";

import { useMemo, useState, useTransition } from "react";
import type { Meal } from "@/lib/db/schema";
import { Badge, Card } from "@/components/ui";
import { formatDate, cn } from "@/lib/utils";
import {
  addMeal,
  deleteMeal,
  generateWeekPlan,
  rerollDay,
  setDayMeal,
  clearWeekPlan,
} from "@/app/meals/actions";

const MEAL_TYPES = ["breakfast", "lunch", "dinner", "snack"] as const;

type WeekDay = { date: string; meal: Meal | null };

export function MealsClient({
  meals,
  week,
  weekStartISO,
}: {
  meals: Meal[];
  week: WeekDay[];
  weekStartISO: string;
}) {
  const [, startTransition] = useTransition();
  const [showAdd, setShowAdd] = useState(false);
  const [showShopping, setShowShopping] = useState(false);

  // Aggregate + de-duplicate ingredients across this week's assigned meals.
  const shoppingList = useMemo(() => {
    const set = new Set<string>();
    for (const day of week) {
      if (!day.meal) continue;
      for (const ing of day.meal.ingredients) {
        const trimmed = ing.trim();
        if (trimmed) set.add(trimmed);
      }
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [week]);

  return (
    <div className="space-y-8">
      {/* This Week's Dinners */}
      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">This Week&apos;s Dinners</h2>
          <div className="flex gap-2">
            <button
              onClick={() => startTransition(() => generateWeekPlan(weekStartISO))}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90"
            >
              🎲 Generate week
            </button>
            <button
              onClick={() => startTransition(() => clearWeekPlan(weekStartISO))}
              className="rounded-lg border border-border bg-card px-4 py-2 text-sm hover:bg-black/5"
            >
              Clear
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
          {week.map((day) => (
            <DayCard key={day.date} day={day} meals={meals} />
          ))}
        </div>
      </section>

      {/* Shopping list */}
      <section>
        <button
          onClick={() => setShowShopping((v) => !v)}
          className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-black/5"
        >
          🛒 {showShopping ? "Hide" : "Show"} shopping list ({shoppingList.length})
        </button>
        {showShopping && (
          <Card className="mt-3 p-5">
            {shoppingList.length === 0 ? (
              <p className="text-sm text-muted">
                No ingredients yet — assign some meals to this week first.
              </p>
            ) : (
              <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {shoppingList.map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      className="h-4 w-4 cursor-pointer accent-indigo-500"
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        )}
      </section>

      {/* Favorite Meals */}
      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Favorite Meals</h2>
          <button
            onClick={() => setShowAdd((v) => !v)}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            {showAdd ? "Close" : "+ Add meal"}
          </button>
        </div>

        {showAdd && (
          <Card className="mb-4 p-5">
            <form
              action={async (fd) => {
                await addMeal(fd);
                setShowAdd(false);
              }}
              className="grid gap-3 sm:grid-cols-2"
            >
              <input
                name="name"
                required
                placeholder="Meal name"
                className="rounded-lg border border-border px-3 py-2 text-sm sm:col-span-2"
              />
              <select
                name="mealType"
                defaultValue="dinner"
                className="rounded-lg border border-border bg-card px-3 py-2 text-sm capitalize"
              >
                {MEAL_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <input
                name="cuisine"
                placeholder="Cuisine (e.g. Italian)"
                className="rounded-lg border border-border px-3 py-2 text-sm"
              />
              <input
                name="prepMinutes"
                type="number"
                min="0"
                placeholder="Prep minutes"
                className="rounded-lg border border-border px-3 py-2 text-sm"
              />
              <input
                name="tags"
                placeholder="Tags (comma separated)"
                className="rounded-lg border border-border px-3 py-2 text-sm"
              />
              <textarea
                name="ingredients"
                rows={3}
                placeholder="Ingredients (one per line or comma separated)"
                className="rounded-lg border border-border px-3 py-2 text-sm sm:col-span-2"
              />
              <button
                type="submit"
                className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90 sm:col-span-2"
              >
                Add meal
              </button>
            </form>
          </Card>
        )}

        {meals.length === 0 ? (
          <p className="py-10 text-center text-muted">
            No meals yet. Add your family favorites to get started.
          </p>
        ) : (
          <Card className="divide-y divide-border">
            {meals.map((meal) => (
              <MealRow key={meal.id} meal={meal} />
            ))}
          </Card>
        )}
      </section>
    </div>
  );
}

function DayCard({ day, meals }: { day: WeekDay; meals: Meal[] }) {
  const [, startTransition] = useTransition();
  const d = new Date(day.date + "T00:00:00");
  const weekday = d.toLocaleDateString("en-US", { weekday: "short" });

  return (
    <Card className="flex flex-col gap-2 p-3">
      <div className="flex items-baseline justify-between">
        <div className="text-sm font-semibold">{weekday}</div>
        <div className="text-xs text-muted">{formatDate(day.date)}</div>
      </div>
      <div className={cn("min-h-[2.5rem] text-sm font-medium", !day.meal && "text-muted")}>
        {day.meal ? day.meal.name : "—"}
      </div>
      <div className="mt-auto flex flex-col gap-2">
        <button
          onClick={() => startTransition(() => rerollDay(day.date))}
          className="rounded-lg border border-border bg-card px-2 py-1 text-xs hover:bg-black/5"
        >
          🎲 re-roll
        </button>
        <select
          value=""
          onChange={(e) => {
            const id = Number(e.target.value);
            if (id) startTransition(() => setDayMeal(day.date, id));
          }}
          className="rounded-lg border border-border bg-card px-2 py-1 text-xs"
        >
          <option value="">Pick a meal…</option>
          {meals.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      </div>
    </Card>
  );
}

function MealRow({ meal }: { meal: Meal }) {
  const [, startTransition] = useTransition();

  return (
    <div className="flex items-start gap-3 p-3">
      <div className="min-w-0 flex-1">
        <div className="font-medium">{meal.name}</div>
        {meal.description && (
          <div className="mt-0.5 text-sm text-muted">{meal.description}</div>
        )}
        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          <Badge>{meal.mealType}</Badge>
          {meal.cuisine && <span className="text-xs text-muted">{meal.cuisine}</span>}
          {meal.prepMinutes != null && (
            <span className="text-xs text-muted">⏱ {meal.prepMinutes} min</span>
          )}
          {meal.tags.map((tag) => (
            <Badge key={tag}>{tag}</Badge>
          ))}
        </div>
      </div>
      <button
        onClick={() => startTransition(() => deleteMeal(meal.id))}
        className="shrink-0 rounded-lg p-1.5 text-muted hover:bg-black/5 hover:text-red-600"
        aria-label="Delete meal"
        title="Delete meal"
      >
        ✕
      </button>
    </div>
  );
}
