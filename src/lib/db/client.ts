import { neon } from "@neondatabase/serverless";
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString && process.env.NODE_ENV !== "test") {
  // Intentionally loud: this project never silently no-ops on a missing
  // credential. Callers see this in server logs immediately rather than a
  // confusing downstream query failure. Every server component/route in
  // this app already guards DB access behind `process.env.DATABASE_URL`
  // (see docs/SECURITY.md), so `db` below is only ever touched when a real
  // connection string exists — this proxy exists purely so importing this
  // module (which many files do transitively) never throws at build time
  // when the credential simply hasn't been provisioned yet.
  console.warn(
    "[db] DATABASE_URL is not set — database-backed features will fail until it's configured. See .env.example."
  );
}

function unconfiguredDb(): NeonHttpDatabase<typeof schema> {
  return new Proxy(
    {},
    {
      get() {
        throw new Error(
          "Database was accessed but DATABASE_URL is not set. Callers must guard db access behind process.env.DATABASE_URL — see docs/SECURITY.md."
        );
      },
    }
  ) as NeonHttpDatabase<typeof schema>;
}

export const db: NeonHttpDatabase<typeof schema> = connectionString
  ? drizzle(neon(connectionString), { schema })
  : unconfiguredDb();

/**
 * Wraps a *read* query so a Neon hiccup (quota, connection drop) degrades to
 * a safe empty value instead of throwing an uncaught error that crashes the
 * whole page with a 500. Logs server-side so the failure is still visible.
 * Distinct from `unconfiguredDb()` above (missing credential, a config
 * error that should stay loud) -- this is for a query that fails at
 * runtime against a properly configured database. Never wrap a write
 * (insert/update/delete) with this -- a failed mutation must still surface
 * to the caller.
 */
export async function safeQuery<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    console.error("[db] query failed, returning fallback:", error);
    return fallback;
  }
}
