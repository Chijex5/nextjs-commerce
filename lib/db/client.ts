import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const {
  AMAZON_DB_HOST,
  AMAZON_DB_PORT,
  AMAZON_DB_NAME,
  AMAZON_DB_USER,
  AMAZON_DB_PASSWORD,
  AMAZON_DB_SSL = "require",
  AMAZON_DB_CA,
  NODE_ENV,
} = process.env;

if (!AMAZON_DB_HOST) throw new Error("AMAZON_DB_HOST is not set");
if (!AMAZON_DB_PORT) throw new Error("AMAZON_DB_PORT is not set");
if (!AMAZON_DB_NAME) throw new Error("AMAZON_DB_NAME is not set");
if (!AMAZON_DB_USER) throw new Error("AMAZON_DB_USER is not set");
if (!AMAZON_DB_PASSWORD) throw new Error("AMAZON_DB_PASSWORD is not set");

const port = Number(AMAZON_DB_PORT);
if (!Number.isFinite(port)) throw new Error("AMAZON_DB_PORT must be a number");

const ssl = { rejectUnauthorized: false };

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
  postgres({
    host: AMAZON_DB_HOST,
    port,
    database: AMAZON_DB_NAME,
    username: AMAZON_DB_USER,
    password: AMAZON_DB_PASSWORD,
    ssl,
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
