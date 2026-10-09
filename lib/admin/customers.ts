/**
 * Customers, the way a shopkeeper thinks of them: everyone who has bought from
 * us (matched by email, guest checkout or not) plus anyone who made an account
 * without buying yet. The `users` table alone misses every guest buyer.
 */
import { sql, type SQL } from "drizzle-orm";
import { db } from "lib/db";

const num = (v: unknown) => {
  const n = typeof v === "number" ? v : Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
};
const utcDate = (v: unknown) =>
  v ? new Date(String(v).replace(" ", "T") + "Z") : null;

/** One row per email across orders and accounts. */
const CUSTOMERS = sql`
  with buyers as (
    select lower(email) as email,
      (array_agg(customer_name order by created_at desc))[1] as name,
      (array_agg(phone order by created_at desc) filter (where phone is not null))[1] as phone,
      (array_agg(shipping_address->>'state' order by created_at desc)
         filter (where coalesce(shipping_address->>'state', '') <> ''))[1] as state,
      count(*) filter (where status <> 'cancelled') as orders,
      coalesce(sum(total_amount) filter (where status <> 'cancelled'), 0) as spent,
      min(created_at) as first_order,
      max(created_at) as last_order
    from orders group by lower(email)
  ),
  accounts as (
    select id, lower(email) as email, name, phone, created_at, last_login_at, is_active from users
  ),
  subs as (
    select lower(email) as email from newsletter_subscribers where status = 'active'
  )
  select
    coalesce(b.email, a.email) as email,
    coalesce(nullif(a.name, ''), b.name) as name,
    coalesce(a.phone, b.phone) as phone,
    b.state,
    coalesce(b.orders, 0) as orders,
    coalesce(b.spent, 0) as spent,
    b.first_order::text as first_order,
    b.last_order::text as last_order,
    a.id as user_id,
    a.created_at::text as signed_up,
    a.last_login_at::text as last_login,
    coalesce(a.is_active, true) as active,
    (s.email is not null) as subscribed
  from buyers b
  full outer join accounts a on a.email = b.email
  left join subs s on s.email = coalesce(b.email, a.email)
`;

export const SEGMENTS = [
  { key: "all", label: "All", where: sql`true` },
  { key: "repeat", label: "Repeat buyers", where: sql`c.orders >= 2` },
  { key: "once", label: "Bought once", where: sql`c.orders = 1` },
  {
    key: "lapsed",
    label: "Haven't bought in 90 days",
    where: sql`c.orders > 0 and c.last_order::timestamp < (now() at time zone 'UTC') - interval '90 days'`,
  },
  {
    key: "no-orders",
    label: "Signed up, never bought",
    where: sql`c.orders = 0`,
  },
  { key: "subscribed", label: "Newsletter", where: sql`c.subscribed` },
] as const;

export const CUSTOMER_SORTS = {
  recent: sql`c.last_order desc nulls last, c.signed_up desc nulls last`,
  spent: sql`c.spent desc`,
  orders: sql`c.orders desc, c.spent desc`,
  newest: sql`coalesce(c.first_order, c.signed_up) desc nulls last`,
  name: sql`lower(c.name) asc nulls last`,
} as const;

export type CustomerRow = {
  key: string;
  email: string;
  name: string | null;
  phone: string | null;
  state: string | null;
  orders: number;
  spent: number;
  firstOrder: Date | null;
  lastOrder: Date | null;
  userId: string | null;
  signedUp: Date | null;
  lastLogin: Date | null;
  active: boolean;
  subscribed: boolean;
};

function toRow(r: Record<string, unknown>): CustomerRow {
  const email = String(r.email);
  return {
    key: r.user_id ? String(r.user_id) : encodeURIComponent(email),
    email,
    name: (r.name as string | null) ?? null,
    phone: (r.phone as string | null) ?? null,
    state: (r.state as string | null) ?? null,
    orders: num(r.orders),
    spent: num(r.spent),
    firstOrder: utcDate(r.first_order),
    lastOrder: utcDate(r.last_order),
    userId: (r.user_id as string | null) ?? null,
    signedUp: utcDate(r.signed_up),
    lastLogin: utcDate(r.last_login),
    active: Boolean(r.active),
    subscribed: Boolean(r.subscribed),
  };
}

export async function listCustomers({
  segment,
  q,
  sort,
  limit,
  offset,
}: {
  segment: (typeof SEGMENTS)[number];
  q: string;
  sort: keyof typeof CUSTOMER_SORTS;
  limit: number;
  offset: number;
}) {
  const search: SQL = q
    ? sql`(c.email ilike ${`%${q}%`} or c.name ilike ${`%${q}%`} or c.phone ilike ${`%${q}%`})`
    : sql`true`;

  const [rows, counts, summary] = await Promise.all([
    db.execute(sql`
      select * from (${CUSTOMERS}) c
      where ${segment.where} and ${search}
      order by ${CUSTOMER_SORTS[sort]}
      limit ${limit} offset ${offset}
    `) as unknown as Promise<Record<string, unknown>[]>,
    db.execute(sql`
      select ${sql.join(
        SEGMENTS.map(
          (s) =>
            sql`count(*) filter (where ${s.where}) as ${sql.identifier(s.key)}`,
        ),
        sql`, `,
      )}
      from (${CUSTOMERS}) c where ${search}
    `) as unknown as Promise<Record<string, unknown>[]>,
    db.execute(sql`
      select count(*) filter (where c.orders > 0) as buyers,
        count(*) filter (where c.orders >= 2) as repeat,
        coalesce(sum(c.spent), 0) as spent,
        coalesce(sum(c.orders), 0) as orders
      from (${CUSTOMERS}) c
    `) as unknown as Promise<Record<string, unknown>[]>,
  ]);

  const countRow = counts[0] ?? {};
  const s = summary[0] ?? {};
  const buyers = num(s.buyers);
  return {
    rows: rows.map(toRow),
    counts: Object.fromEntries(
      SEGMENTS.map((seg) => [seg.key, num(countRow[seg.key])]),
    ) as Record<string, number>,
    summary: {
      buyers,
      repeatRate: buyers > 0 ? (num(s.repeat) / buyers) * 100 : null,
      avgSpend: buyers > 0 ? num(s.spent) / buyers : 0,
      avgOrders: buyers > 0 ? num(s.orders) / buyers : 0,
    },
  };
}

/** Look up by account id, or by URL-encoded email for guest buyers. */
export async function getCustomer(key: string) {
  const isUuid = /^[0-9a-f-]{36}$/i.test(key);
  const where = isUuid
    ? sql`c.user_id = ${key}::uuid`
    : sql`c.email = lower(${decodeURIComponent(key)})`;
  const [row] = (await db.execute(
    sql`select * from (${CUSTOMERS}) c where ${where} limit 1`,
  )) as unknown as Record<string, unknown>[];
  if (!row) return null;
  const customer = toRow(row);

  const [orderRows, products, addressRows] = await Promise.all([
    db.execute(sql`
      select o.id, o.order_number, o.total_amount, o.status, o.delivery_status, o.order_type, o.created_at::text as created_at,
        (select coalesce(sum(quantity), 0) from order_items oi where oi.order_id = o.id) as units
      from orders o where lower(o.email) = ${customer.email}
      order by o.created_at desc limit 50
    `) as unknown as Promise<Record<string, unknown>[]>,
    db.execute(sql`
      select oi.product_id, max(oi.product_title) as title, sum(oi.quantity) as units, sum(oi.total_amount) as spent
      from order_items oi join orders o on o.id = oi.order_id
      where lower(o.email) = ${customer.email} and o.status <> 'cancelled'
      group by oi.product_id order by units desc limit 5
    `) as unknown as Promise<Record<string, unknown>[]>,
    db.execute(sql`
      select shipping_address from orders
      where lower(email) = ${customer.email} and shipping_address <> '{}'::jsonb
      order by created_at desc limit 1
    `) as unknown as Promise<
      Array<{ shipping_address: Record<string, string> }>
    >,
  ]);

  return {
    customer,
    address: addressRows[0]?.shipping_address ?? null,
    orders: orderRows.map((o) => ({
      id: String(o.id),
      orderNumber: String(o.order_number),
      total: num(o.total_amount),
      status: String(o.status),
      deliveryStatus: String(o.delivery_status),
      orderType: String(o.order_type),
      createdAt: utcDate(o.created_at)!,
      units: num(o.units),
    })),
    products: products.map((p) => ({
      id: String(p.product_id),
      label: String(p.title),
      value: num(p.units),
      secondary: num(p.spent),
      href: `/admin/products/${p.product_id}/edit`,
    })),
  };
}
