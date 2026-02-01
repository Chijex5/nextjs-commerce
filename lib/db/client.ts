import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";

const connectionString = process.env.AMAZON_DATABASE_URL;

if (!connectionString) {
  throw new Error("AMAZON_DATABASE_URL is not set");
}

const globalForDb = globalThis as unknown as {
  drizzleClient?: ReturnType<typeof drizzle>;
  drizzleSql?: ReturnType<typeof postgres>;
};

const sql =
  globalForDb.drizzleSql ??
  postgres(connectionString, {
    max: 10,
    prepare: false,
  });

export const db =
  globalForDb.drizzleClient ??
  drizzle(sql, {
    schema,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.drizzleClient = db;
  globalForDb.drizzleSql = sql;
}
