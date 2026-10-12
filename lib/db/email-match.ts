import { sql, type SQL } from "drizzle-orm";
import type { AnyPgColumn } from "drizzle-orm/pg-core";
import { normalizeEmail } from "../user-utils";

/**
 * Exact, case-insensitive email comparison.
 *
 * Never use `ilike(column, email)` for this: `ilike` treats `%` and `_` in
 * the value as wildcards, so an "email" of `%` matches every row.
 */
export function emailEquals(column: AnyPgColumn, email: string): SQL {
  return sql`lower(${column}) = ${normalizeEmail(email)}`;
}
