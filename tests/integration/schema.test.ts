import { PgDialect } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import crypto from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { shopLocalTime } from "lib/db/time";
import { testSql } from "../setup/db";
import { SUPER_ADMIN_ID, VICTIM_ORDER } from "../setup/fixtures";
import { adminCookie, api, cookieFrom } from "./helpers";

const db = testSql();
afterAll(() => db.end());

/** Expect a statement to be rejected by the named constraint. */
async function rejects(statement: Promise<unknown>, constraint: string) {
  await expect(statement).rejects.toMatchObject({
    constraint_name: constraint,
  });
}

describe("database rules", () => {
  it("rejects unknown order statuses", async () => {
    await rejects(
      db`update orders set status = 'shipped' where id = ${VICTIM_ORDER.id}`,
      "orders_status_check",
    );
  });

  it("rejects unknown delivery statuses", async () => {
    await rejects(
      db`update orders set delivery_status = 'lost' where id = ${VICTIM_ORDER.id}`,
      "orders_delivery_status_check",
    );
  });

  it("rejects mixed-case customer emails", async () => {
    await rejects(
      db`insert into users (email, password_hash) values ('Mixed@Case.com', 'x')`,
      "users_email_lowercase_check",
    );
  });

  it("rejects ratings outside 1–5", async () => {
    const [p] =
      await db`insert into products (handle, title) values ('rating-test', 'R') returning id`;
    await rejects(
      db`insert into reviews (product_id, rating) values (${p!.id}, 6)`,
      "reviews_rating_check",
    );
  });

  it("rejects percentage coupons over 100%", async () => {
    await rejects(
      db`insert into coupons (code, discount_type, discount_value) values ('BIG', 'percentage', 150)`,
      "coupons_discount_type_check",
    );
  });

  it("rejects lower-case coupon codes", async () => {
    await rejects(
      db`insert into coupons (code, discount_type, discount_value) values ('lower', 'fixed', 10)`,
      "coupons_code_uppercase_check",
    );
  });

  it("rejects a payment reference used by two orders", async () => {
    const ref = `ref_${crypto.randomUUID()}`;
    const order = (n: string) => db`
      insert into orders (order_number, email, customer_name, shipping_address, subtotal_amount, total_amount, payment_reference)
      values (${n}, 'a@b.co', 'A', '{}', 1, 1, ${ref})`;
    await order(`ORD-${crypto.randomUUID().slice(0, 8)}`);
    await rejects(
      order(`ORD-${crypto.randomUUID().slice(0, 8)}`),
      "orders_payment_reference_unique",
    );
  });

  it("requires a stock count for stock-tracked variants", async () => {
    const [p] =
      await db`insert into products (handle, title) values ('stock-test', 'S') returning id`;
    await rejects(
      db`insert into product_variants (product_id, title, price, track_inventory) values (${p!.id}, 'One', 100, true)`,
      "product_variants_stock_check",
    );
  });
});

describe("deleting things keeps history intact", () => {
  it("deleting a product keeps the order line, without the link", async () => {
    const [p] =
      await db`insert into products (handle, title) values ('gone-soon', 'Gone') returning id`;
    const [v] =
      await db`insert into product_variants (product_id, title, price) values (${p!.id}, 'One', 100) returning id`;
    const [item] = await db`
      insert into order_items (order_id, product_id, product_variant_id, product_title, variant_title, quantity, price, total_amount)
      values (${VICTIM_ORDER.id}, ${p!.id}, ${v!.id}, 'Gone', 'One', 1, 100, 100) returning id`;

    await db`delete from products where id = ${p!.id}`;

    const [after] =
      await db`select product_id, product_variant_id, product_title from order_items where id = ${item!.id}`;
    expect(after).toEqual({
      product_id: null,
      product_variant_id: null,
      product_title: "Gone",
    });
  });

  it("removing an admin keeps their campaigns", async () => {
    const [admin] =
      await db`insert into admin_users (email, password_hash) values ('leaver@test.dev', 'x') returning id`;
    const [c] = await db`
      insert into email_campaigns (name, type, subject, created_by)
      values ('Spring', 'SALE', 'Hi', ${admin!.id}) returning id, status`;
    expect(c!.status).toBe("DRAFT");

    await db`delete from admin_users where id = ${admin!.id}`;

    const [after] =
      await db`select created_by from email_campaigns where id = ${c!.id}`;
    expect(after!.created_by).toBeNull();
  });
});

describe("shop-time reporting", () => {
  it("buckets 23:30 UTC into the next Lagos day", async () => {
    const query = new PgDialect().sqlToQuery(
      sql`select to_char(${shopLocalTime(sql`timestamptz '2026-01-15 23:30:00+00'`)}, 'YYYY-MM-DD HH24:MI') as local`,
    );
    const [row] = await db.unsafe(query.sql, query.params as never[]);
    expect(row!.local).toBe("2026-01-16 00:30");
  });
});

describe("admin input validation", () => {
  it.each([
    [{ status: "shipped" }, "Invalid order status"],
    [{ deliveryStatus: "lost" }, "Invalid delivery status"],
  ])("rejects %j with a 400", async (body, message) => {
    const res = await api(`/api/admin/orders/${VICTIM_ORDER.id}`, {
      method: "PUT",
      cookie: await adminCookie(SUPER_ADMIN_ID, "super_admin"),
      json: body,
    });
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe(message);
  });
});

describe("email verification is remembered", () => {
  it("a password login after a magic-link sign-in can link guest orders", async () => {
    const email = `verified-${crypto.randomUUID().slice(0, 8)}@example.com`;
    await db`
      insert into orders (order_number, email, customer_name, shipping_address, subtotal_amount, total_amount)
      values (${`ORD-${crypto.randomUUID().slice(0, 8)}`}, ${email}, 'V', '{}', 1, 1)`;
    const reg = await api("/api/user-auth/register", {
      method: "POST",
      json: { email, password: "longpassword1" },
    });
    expect(reg.status).toBe(201);

    const login = () =>
      api("/api/user-auth/login", {
        method: "POST",
        json: { email, password: "longpassword1" },
      });
    const before = await api("/api/user-auth/order-links", {
      cookie: cookieFrom(await login()),
    });
    expect((await before.json()).orders).toHaveLength(0);

    const token = crypto.randomBytes(32).toString("hex");
    await db`
      insert into magic_link_tokens (email, token_hash, expires_at)
      values (${email}, ${crypto.createHash("sha256").update(token).digest("hex")}, now() + interval '10 minutes')`;
    await api(
      `/api/user-auth/magic-link/verify?${new URLSearchParams({ email, token })}`,
    );

    const after = await api("/api/user-auth/order-links", {
      cookie: cookieFrom(await login()),
    });
    expect((await after.json()).orders).toHaveLength(1);
  });
});
