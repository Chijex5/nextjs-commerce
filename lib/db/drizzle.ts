import "dotenv/config";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";

const connectionString = process.env.AMAZON_DATABASE_URL;

if (!connectionString) {
  throw new Error("AMAZON_DATABASE_URL is not set");
}

const globalForDrizzle = globalThis as unknown as {
  drizzleSql?: ReturnType<typeof postgres>;
};

const sql =
  globalForDrizzle.drizzleSql ?? postgres(connectionString, { prepare: false });

if (process.env.NODE_ENV !== "production") {
  globalForDrizzle.drizzleSql = sql;
}

export const db = drizzle(sql, { schema });
