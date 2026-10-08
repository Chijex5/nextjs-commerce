/**
 * Move all data from the current Postgres database to the Neon database
 * provisioned through the Vercel marketplace.
 *
 * Source: SOURCE_DATABASE_URL, or the AMAZON_DB_* vars the app uses today.
 * Target: TARGET_DATABASE_URL, or NEON_DATABASE_URL_UNPOOLED (written to
 *         .env.local by `vercel integration add neon --prefix NEON_`).
 *
 * Usage:
 *   pnpm db:migrate-neon --check        report status of both DBs, change nothing
 *   pnpm db:migrate-neon                migrate (fails fast if source is down)
 *   pnpm db:migrate-neon --wait         keep polling the source until it is up
 *   pnpm db:migrate-neon --truncate     wipe target tables that already hold rows
 *
 * Other flags:
 *   --interval=<seconds>   poll interval for --wait (default 30)
 *   --timeout=<minutes>    give up waiting after this long (default 60)
 *   --skip-schema          target schema already exists; copy data only
 *   --no-provision         don't create a Neon DB if none is configured
 */
import { execSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";
import postgres from "postgres";

const ROOT = path.resolve(__dirname, "..");
const ENV_LOCAL = path.join(ROOT, ".env.local");

const args = process.argv.slice(2);
const flag = (name: string) => args.includes(`--${name}`);
const option = (name: string, fallback: number) => {
  const raw = args.find((a) => a.startsWith(`--${name}=`))?.split("=")[1];
  const n = Number(raw);
  return raw && Number.isFinite(n) && n > 0 ? n : fallback;
};

const CHECK_ONLY = flag("check");
const WAIT = flag("wait");
const TRUNCATE = flag("truncate");
const SKIP_SCHEMA = flag("skip-schema");
const NO_PROVISION = flag("no-provision");
const INTERVAL_MS = option("interval", 30) * 1000;
const TIMEOUT_MS = option("timeout", 60) * 60 * 1000;

function loadEnv() {
  // .env.local wins over .env, matching Next.js precedence.
  dotenv.config({ path: ENV_LOCAL, quiet: true, override: true });
  dotenv.config({ path: path.join(ROOT, ".env"), quiet: true });
}

const log = (msg: string) =>
  console.log(`[${new Date().toLocaleTimeString()}] ${msg}`);
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const q = (ident: string) => `"${ident.replace(/"/g, '""')}"`;

// ---------------------------------------------------------------------------
// Connections
// ---------------------------------------------------------------------------

function sourceClient() {
  const opts = {
    ssl: { rejectUnauthorized: false },
    connect_timeout: 15,
    max: 2,
  };
  if (process.env.SOURCE_DATABASE_URL) {
    return postgres(process.env.SOURCE_DATABASE_URL, opts);
  }
  const e = process.env;
  if (!e.AMAZON_DB_HOST || !e.AMAZON_DB_USER || !e.AMAZON_DB_NAME) {
    throw new Error("Set SOURCE_DATABASE_URL or the AMAZON_DB_* variables");
  }
  return postgres({
    ...opts,
    host: e.AMAZON_DB_HOST,
    port: Number(e.AMAZON_DB_PORT ?? 5432),
    database: e.AMAZON_DB_NAME,
    username: e.AMAZON_DB_USER,
    password: e.AMAZON_DB_PASSWORD,
  });
}

function targetUrl() {
  return (
    process.env.TARGET_DATABASE_URL ||
    process.env.NEON_DATABASE_URL_UNPOOLED ||
    process.env.NEON_POSTGRES_URL_NON_POOLING
  );
}

function targetClient() {
  // Unpooled endpoint: DDL and long transactions don't belong on PgBouncer.
  return postgres(targetUrl()!, {
    connect_timeout: 15,
    max: 2,
    onnotice: () => {},
  });
}

async function ping(sql: postgres.Sql) {
  try {
    await sql`select 1`;
    return null;
  } catch (err) {
    return (
      (err as Error).message || (err as { code?: string }).code || String(err)
    );
  }
}

// ---------------------------------------------------------------------------
// Step 1: make sure a Neon database exists
// ---------------------------------------------------------------------------

function ensureNeon() {
  if (targetUrl()) {
    log(`Neon target found (${new URL(targetUrl()!).host})`);
    return;
  }
  if (NO_PROVISION || CHECK_ONLY) {
    throw new Error(
      "No Neon database configured (NEON_DATABASE_URL_UNPOOLED missing)",
    );
  }
  log("No Neon database configured — provisioning one with the Vercel CLI…");
  execSync(
    "vercel integration add neon --name nextjs-commerce-neon --prefix NEON_ --non-interactive",
    { cwd: ROOT, stdio: "inherit" },
  );
  if (
    !fs.existsSync(ENV_LOCAL) ||
    !/NEON_DATABASE_URL_UNPOOLED/.test(fs.readFileSync(ENV_LOCAL, "utf8"))
  ) {
    execSync(`vercel env pull "${ENV_LOCAL}" --yes`, {
      cwd: ROOT,
      stdio: "inherit",
    });
  }
  loadEnv();
  if (!targetUrl())
    throw new Error(
      "Neon provisioned but NEON_DATABASE_URL_UNPOOLED still missing",
    );
}

// ---------------------------------------------------------------------------
// Step 2: wait for the source to be reachable
// ---------------------------------------------------------------------------

async function waitForSource(src: postgres.Sql) {
  const started = Date.now();
  for (let attempt = 1; ; attempt++) {
    const err = await ping(src);
    if (!err) {
      log("Source database is reachable");
      return true;
    }
    log(`Source unreachable (attempt ${attempt}): ${err}`);
    if (!WAIT) return false;
    if (Date.now() - started > TIMEOUT_MS) {
      log(`Gave up after ${Math.round(TIMEOUT_MS / 60000)} min`);
      return false;
    }
    log(`Retrying in ${INTERVAL_MS / 1000}s… (Ctrl+C to stop)`);
    await sleep(INTERVAL_MS);
  }
}

// ---------------------------------------------------------------------------
// Introspection helpers
// ---------------------------------------------------------------------------

async function listTables(sql: postgres.Sql) {
  const rows = await sql<{ name: string }[]>`
    select c.relname as name from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind in ('r', 'p')
    order by 1`;
  return rows.map((r) => r.name);
}

async function rowCounts(sql: postgres.Sql, tables: string[]) {
  const counts: Record<string, number> = {};
  for (const t of tables) {
    const [row] = await sql.unsafe(
      `select count(*)::int as n from public.${q(t)}`,
    );
    counts[t] = row!.n;
  }
  return counts;
}

type Column = {
  name: string;
  type: string;
  generated: boolean;
  identityAlways: boolean;
};

async function listColumns(
  sql: postgres.Sql,
  table: string,
): Promise<Column[]> {
  const rows = await sql<
    { name: string; type: string; attgenerated: string; attidentity: string }[]
  >`
    select a.attname as name, format_type(a.atttypid, a.atttypmod) as type,
           a.attgenerated, a.attidentity
    from pg_attribute a
    where a.attrelid = ${`public.${q(table)}`}::regclass
      and a.attnum > 0 and not a.attisdropped
    order by a.attnum`;
  return rows.map((r) => ({
    name: r.name,
    type: r.type,
    generated: r.attgenerated !== "",
    identityAlways: r.attidentity === "a",
  }));
}

// ---------------------------------------------------------------------------
// Step 3: schema
// ---------------------------------------------------------------------------

async function createSchema(src: postgres.Sql, dst: postgres.Sql) {
  const exts = await src<{ extname: string }[]>`
    select extname from pg_extension where extname <> 'plpgsql'`;
  for (const { extname } of exts) {
    try {
      await dst.unsafe(`create extension if not exists ${q(extname)}`);
      log(`  extension ${extname} ✓`);
    } catch (err) {
      log(
        `  extension ${extname} not available on Neon: ${(err as Error).message}`,
      );
    }
  }

  if ((await listTables(dst)).length > 0) {
    log("  target already has tables — skipping DDL from lib/db/schema.ts");
  } else {
    log("  generating DDL from lib/db/schema.ts (drizzle-kit export)…");
    const ddl = spawnSync("npx drizzle-kit export", {
      cwd: ROOT,
      encoding: "utf8",
      shell: true,
      maxBuffer: 64 * 1024 * 1024,
    });
    if (ddl.status !== 0 || !ddl.stdout.includes("CREATE TABLE")) {
      throw new Error(
        `drizzle-kit export failed:\n${ddl.stderr || ddl.stdout}`,
      );
    }
    await dst.unsafe(ddl.stdout);
    log(`  created ${(await listTables(dst)).length} tables`);
  }

  // Indexes added outside drizzle (e.g. scripts/search-indexes.sql) only live
  // in the source, so recreate any the target is missing.
  const srcIdx = await src<{ name: string; def: string }[]>`
    select indexname as name, indexdef as def from pg_indexes where schemaname = 'public'`;
  const dstIdx = new Set(
    (
      await dst<{ name: string }[]>`
      select indexname as name from pg_indexes where schemaname = 'public'`
    ).map((r) => r.name),
  );
  for (const idx of srcIdx) {
    if (dstIdx.has(idx.name)) continue;
    try {
      await dst.unsafe(
        idx.def.replace(
          /^CREATE (UNIQUE )?INDEX /,
          "CREATE $1INDEX IF NOT EXISTS ",
        ),
      );
      log(`  index ${idx.name} ✓`);
    } catch (err) {
      log(`  index ${idx.name} skipped: ${(err as Error).message}`);
    }
  }
}

// ---------------------------------------------------------------------------
// Step 4: data
// ---------------------------------------------------------------------------

type ForeignKey = { table: string; name: string; def: string };

async function dropForeignKeys(dst: postgres.Sql): Promise<ForeignKey[]> {
  const fks = await dst<ForeignKey[]>`
    select c.conrelid::regclass::text as table, c.conname as name,
           pg_get_constraintdef(c.oid) as def
    from pg_constraint c
    join pg_namespace n on n.oid = c.connamespace
    where c.contype = 'f' and n.nspname = 'public'`;
  for (const fk of fks) {
    await dst.unsafe(`alter table ${fk.table} drop constraint ${q(fk.name)}`);
  }
  return fks;
}

async function restoreForeignKeys(dst: postgres.Sql, fks: ForeignKey[]) {
  const failed: string[] = [];
  for (const fk of fks) {
    try {
      await dst.unsafe(
        `alter table ${fk.table} add constraint ${q(fk.name)} ${fk.def}`,
      );
    } catch (err) {
      failed.push(`${fk.table}.${fk.name}: ${(err as Error).message}`);
    }
  }
  return failed;
}

async function copyTable(
  src: postgres.Sql,
  dst: postgres.Sql,
  table: string,
  total: number,
) {
  const srcCols = await listColumns(src, table);
  const dstCols = new Map(
    (await listColumns(dst, table)).map((c) => [c.name, c]),
  );

  const missing = srcCols
    .filter((c) => !dstCols.has(c.name))
    .map((c) => c.name);
  if (missing.length) {
    log(
      `  ⚠ ${table}: source columns not in target, NOT copied: ${missing.join(", ")}`,
    );
  }
  const cols = srcCols.filter(
    (c) => dstCols.has(c.name) && !dstCols.get(c.name)!.generated,
  );
  if (!cols.length || total === 0) return 0;

  const overriding = cols.some((c) => dstCols.get(c.name)!.identityAlways)
    ? " overriding system value"
    : "";
  const colList = cols.map((c) => q(c.name)).join(", ");
  // Read every value as text and send it back as an explicit text parameter
  // cast to the column type. Without the ::text, postgres.js serializes by the
  // inferred column type (booleans become 'f', jsonb gets double-encoded,
  // timestamps lose microseconds), so the cast must happen server-side.
  const casts = cols.map((c) => `::text::${dstCols.get(c.name)!.type}`);
  const select = `select ${cols.map((c) => `${q(c.name)}::text`).join(", ")} from public.${q(table)}`;
  const batchSize = Math.max(
    1,
    Math.min(1000, Math.floor(60000 / cols.length)),
  );

  let copied = 0;
  await src.begin(async (tx) => {
    const cursor = tx.unsafe(select).values().cursor(batchSize);
    for await (const rows of cursor) {
      const params: (string | null)[] = [];
      const tuples = rows.map((row: (string | null)[]) => {
        const start = params.length;
        params.push(...row);
        return `(${row.map((_, i) => `$${start + i + 1}${casts[i]}`).join(", ")})`;
      });
      await dst.unsafe(
        `insert into public.${q(table)} (${colList})${overriding} values ${tuples.join(", ")}`,
        params,
      );
      copied += rows.length;
      process.stdout.write(`\r  ${table}: ${copied}/${total} rows`);
    }
  });
  process.stdout.write("\n");
  return copied;
}

async function resetSequences(dst: postgres.Sql) {
  const seqs = await dst<{ seq: string; table: string; column: string }[]>`
    select s.oid::regclass::text as seq, d.refobjid::regclass::text as table, a.attname as column
    from pg_class s
    join pg_depend d on d.objid = s.oid and d.deptype in ('a', 'i')
    join pg_attribute a on a.attrelid = d.refobjid and a.attnum = d.refobjsubid
    where s.relkind = 'S'`;
  for (const s of seqs) {
    await dst.unsafe(
      `select setval('${s.seq}', coalesce((select max(${q(s.column)}) from ${s.table}), 0) + 1, false)`,
    );
  }
  return seqs.length;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function printComparison(
  tables: string[],
  a: Record<string, number>,
  b: Record<string, number>,
) {
  const w = Math.max(5, ...tables.map((t) => t.length));
  console.log(
    `\n  ${"table".padEnd(w)}  ${"source".padStart(8)}  ${"neon".padStart(8)}`,
  );
  let mismatches = 0;
  for (const t of tables) {
    const ok = a[t] === b[t];
    if (!ok) mismatches++;
    console.log(
      `  ${t.padEnd(w)}  ${String(a[t] ?? "-").padStart(8)}  ${String(b[t] ?? "-").padStart(8)}  ${ok ? "✓" : "✗"}`,
    );
  }
  console.log();
  return mismatches;
}

async function main() {
  loadEnv();
  ensureNeon();

  const src = sourceClient();
  const dst = targetClient();
  try {
    const dstErr = await ping(dst);
    if (dstErr) throw new Error(`Neon unreachable: ${dstErr}`);
    log("Neon database is reachable");

    if (!(await waitForSource(src))) {
      if (CHECK_ONLY) {
        const tables = await listTables(dst);
        log(
          `Neon has ${tables.length} tables; source can't be compared while it's down`,
        );
        return;
      }
      throw new Error(
        "Source database is down. If it's a free Aiven service, power it on in the Aiven console, " +
          "or re-run with --wait to keep polling.",
      );
    }

    const srcTables = await listTables(src);
    const srcCounts = await rowCounts(src, srcTables);
    log(
      `Source has ${srcTables.length} tables, ${Object.values(srcCounts).reduce((a, b) => a + b, 0)} rows`,
    );

    if (CHECK_ONLY) {
      const dstTables = new Set(await listTables(dst));
      const dstCounts = await rowCounts(
        dst,
        srcTables.filter((t) => dstTables.has(t)),
      );
      const mismatches = printComparison(srcTables, srcCounts, dstCounts);
      log(
        mismatches
          ? `${mismatches} table(s) differ — migration needed`
          : "Neon is in sync with source",
      );
      return;
    }

    log("Step 1/4: schema");
    if (!SKIP_SCHEMA) await createSchema(src, dst);

    const dstTables = new Set(await listTables(dst));
    const tables = srcTables.filter((t) => {
      if (!dstTables.has(t))
        log(`  ⚠ table ${t} does not exist in target — skipped`);
      return dstTables.has(t);
    });

    const existing = Object.entries(await rowCounts(dst, tables)).filter(
      ([, n]) => n > 0,
    );
    if (existing.length) {
      if (!TRUNCATE) {
        throw new Error(
          `Target already has data in: ${existing.map(([t, n]) => `${t} (${n})`).join(", ")}. ` +
            "Re-run with --truncate to replace it.",
        );
      }
      log(`Truncating ${existing.length} non-empty target table(s)…`);
      await dst.unsafe(
        `truncate ${tables.map((t) => `public.${q(t)}`).join(", ")} cascade`,
      );
    }

    log("Step 2/4: copying data");
    const fks = await dropForeignKeys(dst);
    try {
      for (const t of tables) await copyTable(src, dst, t, srcCounts[t]!);
    } finally {
      log("Step 3/4: restoring foreign keys and sequences");
      const failed = await restoreForeignKeys(dst, fks);
      failed.forEach((f) => log(`  ⚠ could not restore FK ${f}`));
      log(
        `  ${fks.length - failed.length}/${fks.length} foreign keys, ${await resetSequences(dst)} sequences`,
      );
    }

    log("Step 4/4: verifying row counts");
    const mismatches = printComparison(
      tables,
      srcCounts,
      await rowCounts(dst, tables),
    );
    if (mismatches) {
      process.exitCode = 1;
      log(`${mismatches} table(s) don't match — check the warnings above`);
    } else {
      log(
        "Migration complete ✓  Point AMAZON_DB_* (or the db client) at Neon when ready.",
      );
    }
  } finally {
    await Promise.allSettled([
      src.end({ timeout: 5 }),
      dst.end({ timeout: 5 }),
    ]);
  }
}

main().catch((err) => {
  console.error(`\n✗ ${err instanceof Error ? err.message : err}`);
  process.exit(1);
});
