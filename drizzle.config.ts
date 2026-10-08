import "dotenv/config";
import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

// Neon writes its vars to .env.local (via `vercel env pull`); load it too.
config({ path: ".env.local", quiet: true });

// Migrations need the direct (unpooled) endpoint, not PgBouncer.
const url =
  process.env.NEON_DATABASE_URL_UNPOOLED ?? process.env.NEON_DATABASE_URL;
if (!url) throw new Error("NEON_DATABASE_URL_UNPOOLED missing");

export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url },
  strict: true,
});
