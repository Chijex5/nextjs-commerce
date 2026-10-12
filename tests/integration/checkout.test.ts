import { createHmac, randomUUID } from "crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { testSql } from "../setup/db";
import { api } from "./helpers";

/**
 * Checkout end to end: the bag guard, live quotes, server-side validation,
 * the price lock (snapshot), coupon claiming, stock and the webhook.
 */

const sql = testSql();
const ids = {
  product: randomUUID(),
  madeToOrder: randomUUID(),
  stocked: randomUUID(),
  offSale: randomUUID(),
};

const details = {
  email: "buyer@example.com",
  phone1: "0803 123 4567",
  address: {
    firstName: "Ada",
    lastName: "Okafor",
    state: "Lagos",
    lga: "Eti-Osa",
    streetAddress: "14 Admiralty Way",
    landmark: "Opposite the filling station",
  },
};

/** All cookies a response sets, as one Cookie header. */
const cookiesFrom = (res: Response) =>
  res.headers
    .getSetCookie()
    .map((c) => c.split(";")[0])
    .join("; ");

/** A fresh bag holding the given variants. */
async function bag(items: { merchandiseId: string; quantity: number }[]) {
  const res = await api("/api/cart/sync", { method: "POST", json: { items } });
  expect(res.status).toBe(200);
  const body = await res.json();
  return { cookie: cookiesFrom(res), cart: body.cart };
}

const sign = (body: string) =>
  createHmac("sha512", process.env.PAYSTACK_SECRET_KEY!)
    .update(body)
    .digest("hex");

function webhook(event: unknown, signature?: string) {
  const body = JSON.stringify(event);
  return api("/api/webhooks/paystack", {
    method: "POST",
    body,
    headers: {
      "content-type": "application/json",
      "x-paystack-signature": signature ?? sign(body),
    },
  });
}

beforeAll(async () => {
  if (!process.env.PAYSTACK_SECRET_KEY) {
    throw new Error(
      "PAYSTACK_SECRET_KEY must match the app's (see tests/README.md)",
    );
  }
  await sql`
    insert into products (id, handle, title, production_days)
    values (${ids.product}, 'test-loafer', 'Test Loafer', 5)
  `;
  await sql`
    insert into product_variants (id, product_id, title, price, available_for_sale, track_inventory, stock_quantity)
    values
      (${ids.madeToOrder}, ${ids.product}, 'EU 43', 50000, true, false, null),
      (${ids.stocked}, ${ids.product}, 'EU 42', 30000, true, true, 2),
      (${ids.offSale}, ${ids.product}, 'EU 41', 30000, false, false, null)
  `;
  await sql`
    insert into coupons (code, discount_type, discount_value, is_active, include_shipping_in_discount)
    values ('ALLFREE', 'percentage', 100, true, true)
  `;
  await sql`
    insert into coupons (code, discount_type, discount_value, is_active, max_uses, used_count)
    values ('LASTONE', 'fixed', 1000, true, 1, 1)
  `;
});

afterAll(async () => {
  await sql.end();
});

describe("bag guard", () => {
  it("leaves off-sale variants out and clamps stocked ones to what's left", async () => {
    const { cart } = await bag([
      { merchandiseId: ids.offSale, quantity: 1 },
      { merchandiseId: ids.stocked, quantity: 5 },
    ]);
    const lines = cart.lines as {
      quantity: number;
      merchandise: { id: string };
    }[];
    expect(lines.map((l) => l.merchandise.id)).toEqual([ids.stocked]);
    expect(lines[0]!.quantity).toBe(2);
  });
});

describe("checkout quote", () => {
  it("prices the bag with shipping, delivery date and coupon errors", async () => {
    const { cookie } = await bag([
      { merchandiseId: ids.madeToOrder, quantity: 1 },
    ]);

    const res = await api("/api/checkout/quote", {
      method: "POST",
      cookie,
      json: { address: { state: "Lagos", lga: "Ikeja" }, couponCode: "NOPE" },
    });
    expect(res.status).toBe(200);
    const { quote } = await res.json();
    expect(quote.subtotal).toBe(50000);
    expect(quote.shipping).toBe(4000);
    expect(quote.total).toBe(54000);
    expect(quote.amountInKobo).toBe(5_400_000);
    expect(quote.couponError).toBeTruthy();
    expect(quote.delivery.productionDays).toBe(5);
  });

  it("shows no shipping until there's a state", async () => {
    const { cookie } = await bag([
      { merchandiseId: ids.madeToOrder, quantity: 1 },
    ]);
    const res = await api("/api/checkout/quote", {
      method: "POST",
      cookie,
      json: {},
    });
    const { quote } = await res.json();
    expect(quote.shipping).toBeNull();
    expect(quote.total).toBe(50000);
  });
});

describe("checkout initialize", () => {
  it("names the fields that need fixing", async () => {
    const { cookie } = await bag([
      { merchandiseId: ids.madeToOrder, quantity: 1 },
    ]);
    const res = await api("/api/checkout/initialize", {
      method: "POST",
      cookie,
      json: {
        ...details,
        phone1: "0803",
        address: { ...details.address, landmark: "" },
      },
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(Object.keys(body.fieldErrors).sort()).toEqual([
      "landmark",
      "phone1",
    ]);
  });

  it("stops and re-quotes when the total moved since the page showed it", async () => {
    const { cookie } = await bag([
      { merchandiseId: ids.madeToOrder, quantity: 1 },
    ]);
    const res = await api("/api/checkout/initialize", {
      method: "POST",
      cookie,
      json: { ...details, expectedAmountInKobo: 100 },
    });
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.code).toBe("price_changed");
    expect(body.quote.amountInKobo).toBe(5_400_000);
  });

  it("completes a fully discounted bag without Paystack", async () => {
    const { cookie } = await bag([
      { merchandiseId: ids.madeToOrder, quantity: 1 },
      { merchandiseId: ids.stocked, quantity: 1 },
    ]);
    const res = await api("/api/checkout/initialize", {
      method: "POST",
      cookie,
      json: { ...details, couponCode: "allfree", expectedAmountInKobo: 0 },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.freeCheckout).toBe(true);
    expect(body.orderNumber).toMatch(/^DFP-\d{5,}$/);

    const [order] = await sql`
      select id, total_amount, coupon_id, shipping_address
      from orders where order_number = ${body.orderNumber}
    `;
    expect(Number(order!.total_amount)).toBe(0);
    expect(order!.coupon_id).toBeTruthy();
    expect(order!.shipping_address.landmark).toBe(details.address.landmark);

    const items =
      await sql`select product_variant_id from order_items where order_id = ${order!.id}`;
    expect(items).toHaveLength(2);

    const [coupon] =
      await sql`select used_count from coupons where code = 'ALLFREE'`;
    expect(coupon!.used_count).toBe(1);

    // One stocked pair went out.
    const [variant] =
      await sql`select stock_quantity from product_variants where id = ${ids.stocked}`;
    expect(variant!.stock_quantity).toBe(1);
  });
});

describe("paystack webhook", () => {
  /** A payment as initialize would have stored it, priced at `price`. */
  async function storedPayment(
    reference: string,
    price: number,
    couponCode?: string,
  ) {
    const [coupon] = couponCode
      ? await sql`select id from coupons where code = ${couponCode}`
      : [];
    const discount = coupon ? 1000 : 0;
    const total = price + 4000 - discount;
    const snapshot = {
      version: 1,
      cartId: randomUUID(),
      lines: [
        {
          lineId: randomUUID(),
          variantId: ids.madeToOrder,
          productId: ids.product,
          productTitle: "Test Loafer",
          productHandle: "test-loafer",
          variantTitle: "EU 43",
          quantity: 1,
          unitPrice: price,
          lineTotal: price,
          currencyCode: "NGN",
          image: null,
        },
      ],
      subtotal: price,
      shipping: 4000,
      productDiscount: discount,
      shippingDiscount: 0,
      discount,
      couponId: coupon?.id ?? null,
      couponCode: couponCode ?? null,
      total,
      amountInKobo: total * 100,
    };
    await sql`
      insert into payment_transactions (reference, source, status, amount, metadata)
      values (${reference}, 'catalog_checkout', 'initialized', ${total * 100}, ${sql.json(
        {
          source: "catalog_checkout",
          checkout_email: "locked@example.com",
          customer_name: "Locked Price",
          phone: "8031234567",
          checkout_shipping_address: details.address,
          ...(couponCode ? { coupon_code: couponCode } : {}),
          checkout_snapshot: snapshot,
        },
      )})
    `;
    return snapshot;
  }

  const charge = (
    reference: string,
    amount: number,
    metadata: object = {},
  ) => ({
    event: "charge.success",
    data: { reference, amount, currency: "NGN", status: "success", metadata },
  });

  it("rejects unsigned events", async () => {
    const res = await webhook(charge("REF-UNSIGNED", 100), "bad");
    expect(res.status).toBe(400);
  });

  it("creates the order at the price the customer saw, even after a price change", async () => {
    const reference = `REF-${randomUUID()}`;
    const snapshot = await storedPayment(reference, 50000);
    await sql`update product_variants set price = 65000 where id = ${ids.madeToOrder}`;

    // The browser-supplied echo can't change the stored price or email.
    const res = await webhook(
      charge(reference, snapshot.amountInKobo, {
        checkout_email: "attacker@example.com",
      }),
    );
    expect(res.status).toBe(200);
    expect((await res.json()).status).toBe("paid");

    const [order] = await sql`
      select o.email, o.subtotal_amount, i.price
      from orders o join order_items i on i.order_id = o.id
      where o.payment_reference = ${reference}
    `;
    expect(order!.email).toBe("locked@example.com");
    expect(Number(order!.subtotal_amount)).toBe(50000);
    expect(Number(order!.price)).toBe(50000);

    // Paystack retries are harmless.
    const again = await webhook(charge(reference, snapshot.amountInKobo));
    expect((await again.json()).status).toBe("paid");
    const [countRow] =
      await sql`select count(*)::int from orders where payment_reference = ${reference}`;
    expect(countRow!.count).toBe(1);

    await sql`update product_variants set price = 50000 where id = ${ids.madeToOrder}`;
  });

  it("flags a payment for the wrong amount instead of creating an order", async () => {
    const reference = `REF-${randomUUID()}`;
    await storedPayment(reference, 50000);
    const res = await webhook(charge(reference, 100));
    expect(res.status).toBe(200);
    expect((await res.json()).status).toBe("conflict");
    const [countRow] =
      await sql`select count(*)::int from orders where payment_reference = ${reference}`;
    expect(countRow!.count).toBe(0);
  });

  it("honours a coupon whose last use went while the customer was paying", async () => {
    const reference = `REF-${randomUUID()}`;
    const snapshot = await storedPayment(reference, 50000, "LASTONE");
    const res = await webhook(charge(reference, snapshot.amountInKobo));
    expect((await res.json()).status).toBe("paid");

    const [coupon] =
      await sql`select used_count from coupons where code = 'LASTONE'`;
    expect(coupon!.used_count).toBe(2);
    const [event] = await sql`
      select message from payment_events
      where reference = ${reference} and status = 'paid'
    `;
    expect(event!.message).toMatch(/usage limit/);
  });
});
