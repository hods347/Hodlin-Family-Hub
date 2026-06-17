import { PageHeader, EmptyState, DbNotConfigured, DbError } from "@/components/ui";
import { isDbConfigured } from "@/lib/db";
import { ImprovementsClient } from "@/components/improvements/improvements-client";
import { getProjects, addProject } from "./actions";

export const dynamic = "force-dynamic";

const DESCRIPTION =
  "Turn the inspection report into a plan — track each project by priority, cost, and timing, then add calendar reminders.";

export default async function ImprovementsPage() {
  if (!isDbConfigured) {
    return (
      <>
        <PageHeader title="Home Projects 🛠️" description={DESCRIPTION} />
        <DbNotConfigured />
      </>
    );
  }

  let projects;
  try {
    projects = await getProjects();
  } catch (err) {
    return (
      <>
        <PageHeader title="Home Projects 🛠️" description={DESCRIPTION} />
        <DbError message={err instanceof Error ? err.message : undefined} />
      </>
    );
  }

  return (
    <>
      <PageHeader title="Home Projects 🛠️" description={DESCRIPTION} />
      {projects.length === 0 ? (
        <EmptyState
          emoji="🛠️"
          title="Add your first home project"
          description="Paste items from your inspection report (one per line) or add a project by hand to start planning."
          action={
            <form
              action={addProject}
              className="flex flex-col items-stretch gap-3 text-left sm:w-80"
            >
              <input
                name="title"
                required
                placeholder="Project title (e.g. Repair deck railing)"
                className="rounded-lg border border-border px-3 py-2 text-sm"
              />
              <button
                type="submit"
                className="rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-white hover:opacity-90"
              >
                Add project
              </button>
            </form>
          }
        />
      ) : (
        <ImprovementsClient projects={projects} />
      )}
    </>
  );
}
