import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { isMockData } from "../data/source";
import * as schema from "./schema";

const { NEON_DATABASE_URL, NODE_ENV } = process.env;

// In mock mode (DATA_SOURCE=mock) the storefront never queries Postgres, so
// the connection settings may be absent. postgres() connects lazily, so the
// client below is created but never opens a connection.
if (!isMockData && !NEON_DATABASE_URL) {
  throw new Error("NEON_DATABASE_URL is not set");
}

const globalForDb = globalThis as unknown as {
  drizzleClient?: PostgresJsDatabase<typeof schema>;
  drizzleSql?: ReturnType<typeof postgres>;
};

// On serverless each warm instance opens its own pool, so a high `max`
// multiplied across instances can exhaust Postgres connections. Keep it small
// per instance (override with DB_POOL_MAX when running behind a pooler).
const poolMax = Number(process.env.DB_POOL_MAX ?? 5);

const sql =
  globalForDb.drizzleSql ??
  // Pooled Neon endpoint (PgBouncer in transaction mode) — hence prepare: false.
  postgres(NEON_DATABASE_URL ?? "", {
    ssl: "require",
    max: Number.isFinite(poolMax) && poolMax > 0 ? poolMax : 5,
    idle_timeout: 20,
    prepare: false,
  });

export const db =
  globalForDb.drizzleClient ??
  drizzle(sql, {
    schema,
  });

if (NODE_ENV !== "production") {
  globalForDb.drizzleClient = db;
  globalForDb.drizzleSql = sql;
}
