# Drizzle Migration Plan (No Data Loss)

Source of truth: `AMAZON_DATABASE_URL`

## ✅ Safe baseline checklist (do this once)

1. **Back up the database** (RDS snapshot or `pg_dump`).
2. **Confirm schema parity**: our Drizzle schema lives in `lib/db/schema.ts` and mirrors the existing tables.
3. **Optional verification**:
   - `pnpm db:drizzle:introspect` (snapshot the live schema into `drizzle/` for comparison)
   - `pnpm db:drizzle:check` (ensure config + migrations folder are valid)

## Baseline options

### A) Fresh database (empty)
- `pnpm db:drizzle:generate --name init`
- `pnpm db:drizzle:migrate`

### B) Existing database (current production)
- **Do not run `migrate` yet.** It would try to recreate existing tables.
- We will create a one-time baseline that is **marked as applied** without touching data.
- After baseline is marked, future migrations are safe to apply.

## Future schema changes (after baseline)

1. Update `lib/db/schema.ts`
2. `pnpm db:drizzle:generate --name <change>`
3. `pnpm db:drizzle:migrate`

## Dev-only shortcut (not for production)

- `pnpm db:drizzle:push` (direct sync, skip migrations)
