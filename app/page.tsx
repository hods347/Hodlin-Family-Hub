import Link from "next/link";
import { Card } from "@/components/ui";
import { NAV_ITEMS } from "@/lib/nav";
import { isDbConfigured, getDb } from "@/lib/db";
import { moveTasks } from "@/lib/db/schema";
import { daysUntil } from "@/lib/utils";

export const dynamic = "force-dynamic";

// Family milestones
const BABY_DUE = "2026-09-09";

async function getMoveProgress() {
  if (!isDbConfigured) return null;
  try {
    const rows = await getDb().select({ completed: moveTasks.completed }).from(moveTasks);
    if (rows.length === 0) return { done: 0, total: 0 };
    return { done: rows.filter((r) => r.completed).length, total: rows.length };
  } catch {
    return null;
  }
}

export default async function Home() {
  const progress = await getMoveProgress();
  const daysToBaby = daysUntil(BABY_DUE);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Welcome home, Hodlins 👋</h1>
        <p className="mt-1 text-muted">Your family&apos;s home base. Pick up where you left off.</p>
      </header>

      {/* Milestones */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="bg-gradient-to-br from-pink-500 to-rose-500 p-5 text-white">
          <div className="text-sm opacity-90">Baby #2 due</div>
          <div className="mt-1 text-2xl font-bold">
            {daysToBaby > 0 ? `${daysToBaby} days to go` : "She's here! 🎉"}
          </div>
          <div className="mt-1 text-sm opacity-90">September 9, 2026</div>
        </Card>
        <Card className="bg-gradient-to-br from-indigo-500 to-violet-500 p-5 text-white">
          <div className="text-sm opacity-90">Move-in progress</div>
          {progress && progress.total > 0 ? (
            <>
              <div className="mt-1 text-2xl font-bold">
                {Math.round((progress.done / progress.total) * 100)}% complete
              </div>
              <div className="mt-1 text-sm opacity-90">
                {progress.done} of {progress.total} tasks done
              </div>
            </>
          ) : (
            <>
              <div className="mt-1 text-2xl font-bold">Let&apos;s get started</div>
              <Link href="/move-in" className="mt-1 inline-block text-sm underline opacity-90">
                Open the move-in checklist →
              </Link>
            </>
          )}
        </Card>
      </div>

      {/* Feature grid */}
      <div className="grid gap-4 sm:grid-cols-2">
        {NAV_ITEMS.map((item) => (
          <Link key={item.href} href={item.href} className="group">
            <Card className="h-full p-5 transition-shadow group-hover:shadow-md">
              <div
                className={`mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${item.accent} text-2xl`}
              >
                {item.emoji}
              </div>
              <h2 className="text-lg font-semibold">{item.name}</h2>
              <p className="mt-1 text-sm text-muted">{item.description}</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
