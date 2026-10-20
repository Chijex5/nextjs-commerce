import { inArray } from "drizzle-orm";
import { db } from "lib/db";
import { storeSettings } from "lib/db/schema";
import type { CronRun } from "lib/admin/health-checks";

const keyFor = (name: string) => `cron:${name}`;

/**
 * Note that a scheduled job ran, so store health can tell when one stops.
 * Never throws: a failed heartbeat mustn't fail the job itself.
 */
export async function recordCronRun(
  name: string,
  ok: boolean,
  message?: string,
) {
  const value = {
    lastRunAt: new Date().toISOString(),
    ok,
    ...(message ? { message: message.slice(0, 200) } : {}),
  };
  try {
    await db
      .insert(storeSettings)
      .values({ key: keyFor(name), value })
      .onConflictDoUpdate({
        target: storeSettings.key,
        set: { value, updatedAt: new Date() },
      });
  } catch (error) {
    console.error(`Failed to record cron run for ${name}:`, error);
  }
}

export async function getCronRuns(
  names: string[],
): Promise<Record<string, CronRun | null>> {
  const rows = names.length
    ? await db
        .select({ key: storeSettings.key, value: storeSettings.value })
        .from(storeSettings)
        .where(inArray(storeSettings.key, names.map(keyFor)))
    : [];
  const byKey = new Map(rows.map((r) => [r.key, r.value]));
  return Object.fromEntries(
    names.map((name) => {
      const v = byKey.get(keyFor(name)) as
        | { lastRunAt?: unknown; ok?: unknown; message?: unknown }
        | undefined;
      const lastRunAt =
        typeof v?.lastRunAt === "string" ? new Date(v.lastRunAt) : null;
      return [
        name,
        lastRunAt && !Number.isNaN(lastRunAt.getTime())
          ? {
              lastRunAt,
              ok: v?.ok !== false,
              message: typeof v?.message === "string" ? v.message : undefined,
            }
          : null,
      ];
    }),
  );
}
