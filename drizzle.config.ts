import "dotenv/config";
import { defineConfig } from "drizzle-kit";

const databaseUrl = process.env.AMAZON_DATABASE_URL;

if (!databaseUrl) {
  throw new Error("AMAZON_DATABASE_URL is not set");
}

export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: databaseUrl,
  },
});
