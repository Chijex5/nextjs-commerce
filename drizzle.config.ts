import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { defineConfig } from "drizzle-kit";

const {
  AMAZON_DB_HOST,
  AMAZON_DB_PORT,
  AMAZON_DB_USER,
  AMAZON_DB_PASSWORD,
  AMAZON_DB_NAME,
  AMAZON_DB_CA_PATH,
  NODE_ENV,
} = process.env;

if (!AMAZON_DB_HOST) throw new Error("AMAZON_DB_HOST missing");
if (!AMAZON_DB_PORT) throw new Error("AMAZON_DB_PORT missing");
if (!AMAZON_DB_USER) throw new Error("AMAZON_DB_USER missing");
if (!AMAZON_DB_PASSWORD) throw new Error("AMAZON_DB_PASSWORD missing");
if (!AMAZON_DB_NAME) throw new Error("AMAZON_DB_NAME missing");

const useStrictSSL = NODE_ENV === "production" && !!AMAZON_DB_CA_PATH;

export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    host: AMAZON_DB_HOST,
    port: Number(AMAZON_DB_PORT),
    user: AMAZON_DB_USER,
    password: AMAZON_DB_PASSWORD,
    database: AMAZON_DB_NAME,
    ssl: {
      rejectUnauthorized: false,
    },
  },
  strict: true,
});