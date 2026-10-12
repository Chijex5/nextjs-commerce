import { hash } from "bcryptjs";
import { runMigrations } from "../../lib/db/scripts/migrate";
import { testSql } from "./db";
import {
  OTHER_ORDER,
  PASSWORD,
  PLAIN_ADMIN_ID,
  SUPER_ADMIN_ID,
  VICTIM_EMAIL,
  VICTIM_ORDER,
  VICTIM_REQUEST_NUMBER,
  baseUrl,
} from "./fixtures";

/**
 * Rebuild the test database from ./drizzle (proving the migrations apply
 * cleanly from zero) and seed the fixtures the suite relies on.
 */
export default async function setup() {
  const sql = testSql();
  await sql`drop schema if exists drizzle cascade`;
  await sql`drop schema public cascade`;
  await sql`create schema public`;
  await sql.end();

  await runMigrations(process.env.TEST_DATABASE_URL!);

  const db = testSql();
  const passwordHash = await hash(PASSWORD, 10);
  await db`
    insert into admin_users (id, email, password_hash, role, name) values
      (${SUPER_ADMIN_ID}, 'super@test.dev', ${passwordHash}, 'super_admin', 'Super'),
      (${PLAIN_ADMIN_ID}, 'plain@test.dev', ${passwordHash}, 'admin', 'Plain')
  `;
  await db`
    insert into orders (id, order_number, email, customer_name, shipping_address, subtotal_amount, total_amount, phone) values
      (${VICTIM_ORDER.id}, ${VICTIM_ORDER.number}, ${VICTIM_ORDER.email}, 'Victim',
       ${db.json({ address1: "1 Secret St", city: "Lagos" })}, 10000, 10000, '08011112222'),
      (${OTHER_ORDER.id}, ${OTHER_ORDER.number}, ${OTHER_ORDER.email}, 'Other',
       ${db.json({ address1: "2 Hidden Rd", city: "Abuja" })}, 20000, 20000, '08033334444')
  `;
  await db`
    insert into custom_order_requests (request_number, email, customer_name, title, description)
    values (${VICTIM_REQUEST_NUMBER}, ${VICTIM_EMAIL}, 'Victim', 'Boots', 'private description')
  `;
  await db`
    insert into coupons (code, discount_type, discount_value, is_active)
    values ('SAVE20', 'percentage', 20, true)
  `;
  await db.end();

  // Fail fast with a clear message if the app isn't running.
  const res = await fetch(`${baseUrl()}/api/health`, {
    headers: { "x-forwarded-proto": "https" },
  }).catch(() => null);
  if (!res?.ok) {
    throw new Error(
      `App not reachable at ${baseUrl()}. Start it against TEST_DATABASE_URL first (see tests/README.md).`,
    );
  }
}
