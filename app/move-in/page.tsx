import { PageHeader, EmptyState, DbNotConfigured } from "@/components/ui";
import { isDbConfigured } from "@/lib/db";
import { MoveInClient } from "@/components/move-in/move-in-client";
import { getMoveTasks, loadDefaultMoveTasks } from "./actions";

export const dynamic = "force-dynamic";

export default async function MoveInPage() {
  if (!isDbConfigured) {
    return (
      <>
        <PageHeader
          title="Move-In Prep"
          description="Everything to get the new house ready — utilities, safety, unpacking, and more."
        />
        <DbNotConfigured />
      </>
    );
  }

  const tasks = await getMoveTasks();

  return (
    <>
      <PageHeader
        title="Move-In Prep 📦"
        description="Everything to get the new house ready — utilities, safety, unpacking, and more."
      />
      {tasks.length === 0 ? (
        <EmptyState
          emoji="🏡"
          title="Start your move-in checklist"
          description="Load our curated starter list (50+ tasks tailored for a family with little ones), then customize it."
          action={
            <form action={loadDefaultMoveTasks}>
              <button
                type="submit"
                className="rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-white hover:opacity-90"
              >
                Load starter checklist
              </button>
            </form>
          }
        />
      ) : (
        <MoveInClient tasks={tasks} />
      )}
    </>
  );
}
