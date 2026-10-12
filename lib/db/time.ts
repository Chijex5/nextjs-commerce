import { sql, type SQL } from "drizzle-orm";

/** The shop's local time zone, used for reporting buckets ("today", per day). */
export const SHOP_TIME_ZONE = "Africa/Lagos";

const TIMESTAMP_TEXT =
  /^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?)(?:(Z)|([+-]\d{2})(?::?(\d{2}))?)?$/;

/**
 * Parse a timestamp Postgres rendered as text (`col::text` in raw SQL).
 *
 * `timestamptz` text carries an offset ("2026-10-12 09:00:00.12+00"); legacy
 * `timestamp` text has none and was always stored as UTC. Both parse to the
 * right instant. Returns null for empty or unparseable values.
 */
export function parseDbTimestamp(value: unknown): Date | null {
  if (value === null || value === undefined || value === "") return null;
  if (value instanceof Date)
    return Number.isNaN(value.getTime()) ? null : value;

  const match = TIMESTAMP_TEXT.exec(String(value).trim());
  if (!match) return null;
  const [, date, time, zulu, offsetHours, offsetMinutes] = match;
  const zone = zulu
    ? "Z"
    : offsetHours
      ? `${offsetHours}:${offsetMinutes ?? "00"}`
      : "Z";
  const parsed = new Date(`${date}T${time}${zone}`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/** Shop-local wall-clock time of a `timestamptz` column, for bucketing. */
export const shopLocalTime = (column: SQL) =>
  sql`(${column}) at time zone ${sql.raw(`'${SHOP_TIME_ZONE}'`)}`;
