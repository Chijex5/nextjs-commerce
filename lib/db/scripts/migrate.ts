import "../network";
import { config } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

/**
 * Apply pending migrations from ./drizzle. This is the only supported way to
 * change the database schema (no `drizzle-kit push`): every change is a
 * reviewed SQL file, recorded in drizzle.__drizzle_migrations.
 *
 *   pnpm db:migrate
 *
 * Uses the direct (unpooled) URL when present; migrations can't run through
 * PgBouncer. DATABASE_SSL=disable for a local/CI Postgres.
 */
config({ path: ".env.local", quiet: true });
config({ quiet: true });

export async function runMigrations(url: string) {
  const client = postgres(url, {
    max: 1,
    ssl: process.env.DATABASE_SSL === "disable" ? false : "require",
    onnotice: () => {},
  });
  try {
    await migrate(drizzle(client), { migrationsFolder: "./drizzle" });
  } finally {
    await client.end();
  }
}

const isCli = process.argv[1]?.endsWith("migrate.ts");
if (isCli) {
  const url =
    process.env.NEON_DATABASE_URL_UNPOOLED ?? process.env.NEON_DATABASE_URL;
  if (!url) {
    console.error("Set NEON_DATABASE_URL_UNPOOLED (or NEON_DATABASE_URL)");
    process.exit(1);
  }
  runMigrations(url)
    .then(() => {
      console.log("Migrations applied");
      process.exit(0);
    })
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
