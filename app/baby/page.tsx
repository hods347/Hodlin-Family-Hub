import { PageHeader, EmptyState, DbNotConfigured } from "@/components/ui";
import { isDbConfigured } from "@/lib/db";
import { BabyClient } from "@/components/baby/baby-client";
import { getChildren, getTemplatesWithBlocks } from "./actions";

export const dynamic = "force-dynamic";

const DESCRIPTION =
  "Build sleep & feeding schedules you can print and hand to a babysitter.";

export default async function BabyPage() {
  if (!isDbConfigured) {
    return (
      <>
        <PageHeader title="Baby Scheduler 🍼" description={DESCRIPTION} />
        <DbNotConfigured />
      </>
    );
  }

  const [children, templates] = await Promise.all([
    getChildren(),
    getTemplatesWithBlocks(),
  ]);

  return (
    <>
      <PageHeader title="Baby Scheduler 🍼" description={DESCRIPTION} />
      {templates.length === 0 && (
        <div className="no-print mb-6">
          <EmptyState
            emoji="🍼"
            title="No schedules yet"
            description="Create a daily schedule below — add naps, feeds, and play time, then print a clean copy for your sitter."
          />
        </div>
      )}
      <BabyClient templates={templates} children={children} />
    </>
  );
}
