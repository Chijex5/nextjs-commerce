/**
 * Campaign audiences. Every audience is a subset of *active newsletter
 * subscribers* (people who said yes to marketing), filtered by what we know
 * about them from their orders. Segments are evaluated at send time, so they
 * always reflect the latest orders, like Shopify/Klaviyo dynamic segments.
 */
import { sql, type SQL } from "drizzle-orm";
import { db } from "lib/db";
import { DEFAULT_VIP_SPEND, type Audience } from "./segment-defs";

export * from "./segment-defs";

/** Subscribers with order facts, one row per email. */
const CONTACTS = sql`
  select s.email, s.name, s.source,
    coalesce(f.orders, 0) as orders,
    coalesce(f.spent, 0) as spent,
    f.last_order,
    f.state
  from (
    select lower(email) as email, max(name) as name, max(source) as source
    from newsletter_subscribers where status = 'active' group by lower(email)
  ) s
  left join (
    select lower(email) as email,
      count(*) filter (where status <> 'cancelled') as orders,
      coalesce(sum(total_amount) filter (where status <> 'cancelled'), 0) as spent,
      max(created_at) filter (where status <> 'cancelled') as last_order,
      (array_agg(shipping_address->>'state' order by created_at desc)
         filter (where coalesce(shipping_address->>'state', '') <> ''))[1] as state
    from orders group by lower(email)
  ) f on f.email = s.email
`;

function segmentWhere(a: Audience): SQL {
  switch (a.segment) {
    case "customers":
      return sql`c.orders >= 1`;
    case "repeat":
      return sql`c.orders >= 2`;
    case "prospects":
      return sql`c.orders = 0`;
    case "lapsed":
      return sql`c.orders >= 1 and c.last_order < (now() at time zone 'UTC') - interval '90 days'`;
    case "recent":
      return sql`c.last_order >= (now() at time zone 'UTC') - interval '30 days'`;
    case "vip":
      return sql`c.spent >= ${a.minSpend ?? DEFAULT_VIP_SPEND}`;
    case "lagos":
      return sql`c.state ilike '%lagos%'`;
    case "outside_lagos":
      return sql`c.state is not null and c.state not ilike '%lagos%'`;
    case "collection":
      if (!a.collectionId) return sql`false`;
      return sql`exists (
        select 1 from orders o
        join order_items oi on oi.order_id = o.id
        join product_collections pc on pc.product_id = oi.product_id
        where lower(o.email) = c.email and o.status <> 'cancelled' and pc.collection_id = ${a.collectionId}::uuid
      )`;
    default:
      return sql`true`;
  }
}

/** Not emailed by another campaign in the last `hours` hours. */
function capWhere(hours: number, campaignId?: string): SQL {
  if (!hours) return sql`true`;
  return sql`not exists (
    select 1 from campaign_email_logs l
    where lower(l.subscriber_email) = c.email
      and l.status not in ('QUEUED', 'FAILED')
      and l.sent_at > (now() at time zone 'UTC') - make_interval(hours => ${hours})
      ${campaignId ? sql`and l.campaign_id <> ${campaignId}::uuid` : sql``}
  )`;
}

export async function countAudience(
  a: Audience,
  capHours: number,
  campaignId?: string,
) {
  const [row] = (await db.execute(sql`
    select count(*) as matched,
      count(*) filter (where ${capWhere(capHours, campaignId)}) as reachable
    from (${CONTACTS}) c where ${segmentWhere(a)}
  `)) as unknown as Array<{ matched: unknown; reachable: unknown }>;
  const [all] = (await db.execute(
    sql`select count(*) as n from (${CONTACTS}) c`,
  )) as unknown as Array<{ n: unknown }>;
  return {
    matched: Number(row?.matched ?? 0),
    reachable: Number(row?.reachable ?? 0),
    subscribers: Number(all?.n ?? 0),
  };
}

export async function resolveAudience(
  a: Audience,
  capHours: number,
  campaignId?: string,
) {
  return (await db.execute(sql`
    select c.email, c.name from (${CONTACTS}) c
    where ${segmentWhere(a)} and ${capWhere(capHours, campaignId)}
    order by c.email
  `)) as unknown as Array<{ email: string; name: string | null }>;
}
