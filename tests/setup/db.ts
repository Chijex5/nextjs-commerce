import postgres from "postgres";

/** Connection to the throwaway test database. */
export function testSql() {
  const url = process.env.TEST_DATABASE_URL;
  if (!url) throw new Error("TEST_DATABASE_URL is not set");
  const host = new URL(url).hostname;
  const isLocal = ["localhost", "127.0.0.1", "postgres"].includes(host);
  if (!isLocal && process.env.ALLOW_REMOTE_TEST_DB !== "1") {
    // The suite wipes the database. Never let it near Neon by accident.
    throw new Error(
      `Refusing to run integration tests against ${host}. Use a local Postgres, or set ALLOW_REMOTE_TEST_DB=1 for a disposable Neon branch.`,
    );
  }
  return postgres(url, {
    max: 1,
    ssl: process.env.DATABASE_SSL === "disable" ? false : "require",
    onnotice: () => {},
  });
}
