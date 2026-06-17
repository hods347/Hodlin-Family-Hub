import { neon } from "@neondatabase/serverless";
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const databaseUrl = process.env.DATABASE_URL;

/**
 * Whether a Neon connection string is configured. Pages use this to show a
 * friendly "connect your database" state instead of crashing before the user
 * has set up Neon.
 */
export const isDbConfigured = Boolean(databaseUrl);

let _db: NeonHttpDatabase<typeof schema> | null = null;

if (databaseUrl) {
  _db = drizzle(neon(databaseUrl), { schema });
}

/**
 * Returns the Drizzle client, throwing a clear error if DATABASE_URL is not
 * set. Use `isDbConfigured` to guard reads in server components.
 */
export function getDb(): NeonHttpDatabase<typeof schema> {
  if (!_db) {
    throw new Error(
      "DATABASE_URL is not set. Add your Neon connection string to .env.local (see README).",
    );
  }
  return _db;
}

export { schema };
