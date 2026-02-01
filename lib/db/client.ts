import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";

const {
  AMAZON_DB_HOST,
  AMAZON_DB_PORT,
  AMAZON_DB_NAME,
  AMAZON_DB_USER,
  AMAZON_DB_PASSWORD,
  AMAZON_DB_SSL = "require",
  AMAZON_DB_CA_PATH,
  NODE_ENV,
} = process.env;

if (!AMAZON_DB_HOST) throw new Error("AMAZON_DB_HOST is not set");
if (!AMAZON_DB_PORT) throw new Error("AMAZON_DB_PORT is not set");
if (!AMAZON_DB_NAME) throw new Error("AMAZON_DB_NAME is not set");
if (!AMAZON_DB_USER) throw new Error("AMAZON_DB_USER is not set");
if (!AMAZON_DB_PASSWORD) throw new Error("AMAZON_DB_PASSWORD is not set");

const port = Number(AMAZON_DB_PORT);
if (!Number.isFinite(port)) throw new Error("AMAZON_DB_PORT must be a number");

const isVerifyFull = AMAZON_DB_SSL === "verify-full";
const isRequire = AMAZON_DB_SSL === "require";

if (!isVerifyFull && !isRequire) {
  throw new Error('AMAZON_DB_SSL must be "require" or "verify-full"');
}

// If you set verify-full, you MUST provide the CA bundle,
// and you SHOULD use hostname (not IP) to avoid hostname mismatch.
const ssl =
  AMAZON_DB_SSL === "require"
    ? { rejectUnauthorized: false }
    : {
        rejectUnauthorized: true,
        ca: AMAZON_DB_CA_PATH
          ? fs.readFileSync(path.resolve(AMAZON_DB_CA_PATH), "utf8")
          : undefined,
      };

if (AMAZON_DB_SSL === "verify-full" && !ssl.ca) {
  throw new Error(
    "AMAZON_DB_CA_PATH is required when AMAZON_DB_SSL=verify-full"
  );
}

const globalForDb = globalThis as unknown as {
  drizzleClient?: ReturnType<typeof drizzle>;
  drizzleSql?: ReturnType<typeof postgres>;
};

const sql =
  globalForDb.drizzleSql ??
  postgres({
    host: AMAZON_DB_HOST,
    port,
    database: AMAZON_DB_NAME,
    username: AMAZON_DB_USER,
    password: AMAZON_DB_PASSWORD,
    ssl,
    max: 10,
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