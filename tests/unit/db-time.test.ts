import { PgDialect } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { parseDbTimestamp, shopLocalTime } from "lib/db/time";

describe("parseDbTimestamp", () => {
  it.each([
    ["2026-10-12 09:00:00+00", "2026-10-12T09:00:00.000Z"],
    ["2026-10-12 09:00:00.123+00", "2026-10-12T09:00:00.123Z"],
    ["2026-10-12 10:00:00+01", "2026-10-12T09:00:00.000Z"],
    ["2026-10-12 04:30:00-04:30", "2026-10-12T09:00:00.000Z"],
    ["2026-10-12T09:00:00Z", "2026-10-12T09:00:00.000Z"],
    // Legacy timestamp-without-zone text was always UTC.
    ["2026-10-12 09:00:00", "2026-10-12T09:00:00.000Z"],
  ])("parses %s", (input, iso) => {
    expect(parseDbTimestamp(input)?.toISOString()).toBe(iso);
  });

  it.each([null, undefined, "", "not a date", "2026-10-12"])(
    "returns null for %j",
    (input) => expect(parseDbTimestamp(input)).toBeNull(),
  );

  it("passes Dates through", () => {
    const d = new Date("2026-01-01T00:00:00Z");
    expect(parseDbTimestamp(d)).toBe(d);
  });
});

describe("shopLocalTime", () => {
  it("converts a timestamptz once, to Lagos time", () => {
    const query = new PgDialect().sqlToQuery(shopLocalTime(sql`o.created_at`));
    expect(query.sql).toBe("(o.created_at) at time zone 'Africa/Lagos'");
  });
});
