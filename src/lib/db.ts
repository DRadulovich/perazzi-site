import { Pool } from "pg";
import { logTlsDiagForDb } from "@/lib/tlsDiag";

/**
 * In dev, Next's hot reload can cause module re-evaluation and create many Pools.
 * This keeps a single Pool instance across reloads.
 *
 * In production, this still creates one pool per runtime instance (expected).
 */
declare global {
  var __perazziPgPool: Pool | undefined;
}

export const pool =
  global.__perazziPgPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
  });

logTlsDiagForDb("pg.shared.pool", process.env.DATABASE_URL);

if (process.env.NODE_ENV !== "production") {
  global.__perazziPgPool = pool;
}
