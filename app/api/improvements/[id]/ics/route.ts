import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { improvementProjects } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

/** "YYYY-MM-DD" -> "YYYYMMDD" */
function toIcsDate(value: string): string {
  return value.replace(/-/g, "");
}

/** Add one day to a "YYYY-MM-DD" string, returning "YYYYMMDD". */
function nextDayIcsDate(value: string): string {
  const d = new Date(value + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + 1);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}${m}${day}`;
}

/** Today as "YYYY-MM-DD" in UTC. */
function todayDate(): string {
  const d = new Date();
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Escape special characters per RFC 5545 text values. */
function escapeIcs(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const numericId = parseInt(id, 10);

  const db = getDb();
  const rows = await db
    .select()
    .from(improvementProjects)
    .where(eq(improvementProjects.id, numericId))
    .limit(1);

  const project = rows[0];
  if (!project) {
    return new Response("Project not found", { status: 404 });
  }

  const startSource = project.targetDate ?? todayDate();
  const dtStart = toIcsDate(startSource);
  const dtEnd = nextDayIcsDate(startSource);

  const descriptionParts: string[] = [];
  if (project.area) descriptionParts.push(`Area: ${project.area}`);
  if (project.priority) descriptionParts.push(`Priority: ${project.priority}`);
  if (project.estimatedCost != null)
    descriptionParts.push(`Estimated cost: $${project.estimatedCost.toLocaleString("en-US")}`);
  if (project.estimatedHours != null)
    descriptionParts.push(`Estimated hours: ${project.estimatedHours}h`);
  if (project.description) descriptionParts.push(project.description);
  const description = descriptionParts.join("\n");

  const dtStamp = new Date()
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Hodlin Family Hub//Home Improvement Planner//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:improvement-${project.id}@hodlin-family-hub`,
    `DTSTAMP:${dtStamp}`,
    `DTSTART;VALUE=DATE:${dtStart}`,
    `DTEND;VALUE=DATE:${dtEnd}`,
    `SUMMARY:${escapeIcs(project.title)}`,
    ...(description ? [`DESCRIPTION:${escapeIcs(description)}`] : []),
    "END:VEVENT",
    "END:VCALENDAR",
  ];

  const ics = lines.join("\r\n");

  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="project-${id}.ics"`,
    },
  });
}
