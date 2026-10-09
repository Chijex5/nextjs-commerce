/**
 * Email campaign results. Sales are credited to a campaign when a recipient
 * clicked the email and placed a paid order within 5 days of that click
 * (Klaviyo's default window). Clicks, not opens: Apple Mail Privacy Protection
 * pre-loads images, so opens are inflated and unreliable.
 */
import { sql, type SQL } from "drizzle-orm";
import { db } from "lib/db";

export const ATTRIBUTION_DAYS = 5;

const num = (v: unknown) => {
  const n = typeof v === "number" ? v : Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
};
const utcDate = (v: unknown) =>
  v ? new Date(String(v).replace(" ", "T") + "Z") : null;

export type CampaignStats = {
  recipients: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
  failed: number;
  queued: number;
  orders: number;
  sales: number;
};

const STATS_SELECT = sql`
  count(l.id) as recipients,
  count(l.id) filter (where l.status not in ('FAILED', 'BOUNCED', 'QUEUED', 'SENDING')) as delivered,
  count(l.id) filter (where l.opened_at is not null) as opened,
  count(l.id) filter (where l.click_count > 0) as clicked,
  count(l.id) filter (where l.status = 'BOUNCED') as bounced,
  count(l.id) filter (where l.status = 'FAILED') as failed,
  count(l.id) filter (where l.status in ('QUEUED', 'SENDING')) as queued
`;

const ATTRIBUTED = (campaign: SQL) => sql`
  select count(*) as orders, coalesce(sum(o.total_amount), 0) as sales
  from orders o
  where o.status <> 'cancelled'
    and exists (
      select 1 from campaign_email_logs l
      where l.campaign_id = ${campaign}.id and l.clicked_at is not null
        and lower(l.subscriber_email) = lower(o.email)
        and o.created_at >= l.clicked_at
        and o.created_at < l.clicked_at + interval '${sql.raw(String(ATTRIBUTION_DAYS))} days'
    )
`;

function toStats(r: Record<string, unknown>): CampaignStats {
  return {
    recipients: num(r.recipients),
    delivered: num(r.delivered),
    opened: num(r.opened),
    clicked: num(r.clicked),
    bounced: num(r.bounced),
    failed: num(r.failed),
    queued: num(r.queued),
    orders: num(r.orders),
    sales: num(r.sales),
  };
}

export const rate = (part: number, whole: number) =>
  whole > 0 ? (part / whole) * 100 : null;

export type CampaignRow = {
  id: string;
  name: string;
  type: string;
  subject: string;
  status: "DRAFT" | "SCHEDULED" | "SENDING" | "SENT";
  audience: unknown;
  couponCode: string | null;
  scheduledAt: Date | null;
  sentAt: Date | null;
  createdAt: Date;
  stats: CampaignStats;
};

/** All campaigns with delivery, engagement and attributed sales. */
export async function getCampaigns(): Promise<CampaignRow[]> {
  const rows = (await db.execute(sql`
    select c.id, c.name, c.type, c.subject, upper(c.status) as status, c.coupon_code, c.audience,
      c.scheduled_at::text as scheduled_at, c.sent_at::text as sent_at, c.created_at::text as created_at,
      s.recipients, s.delivered, s.opened, s.clicked, s.bounced, s.failed, s.queued,
      a.orders, a.sales
    from email_campaigns c
    cross join lateral (select ${STATS_SELECT} from campaign_email_logs l where l.campaign_id = c.id) s
    cross join lateral (${ATTRIBUTED(sql`c`)}) a
    order by coalesce(c.sent_at, c.scheduled_at, c.created_at) desc
  `)) as unknown as Record<string, unknown>[];

  return rows.map((r) => ({
    id: String(r.id),
    name: String(r.name),
    type: String(r.type),
    subject: String(r.subject),
    status: (["DRAFT", "SCHEDULED", "SENDING", "SENT"].includes(
      String(r.status),
    )
      ? r.status
      : "DRAFT") as CampaignRow["status"],
    audience: r.audience,
    couponCode: (r.coupon_code as string | null) ?? null,
    scheduledAt: utcDate(r.scheduled_at),
    sentAt: utcDate(r.sent_at),
    createdAt: utcDate(r.created_at)!,
    stats: toStats(r),
  }));
}

export async function getCampaignReport(id: string) {
  const [[campaign], hourly, recipients, coupon] = await Promise.all([
    db.execute(sql`
      select c.id, c.name, c.type, c.subject, c.preheader, upper(c.status) as status, c.coupon_code,
        c.sent_at::text as sent_at, c.created_at::text as created_at,
        s.recipients, s.delivered, s.opened, s.clicked, s.bounced, s.failed, s.queued, a.orders, a.sales
      from email_campaigns c
      cross join lateral (select ${STATS_SELECT} from campaign_email_logs l where l.campaign_id = c.id) s
      cross join lateral (${ATTRIBUTED(sql`c`)}) a
      where c.id = ${id}::uuid
    `) as unknown as Promise<Record<string, unknown>[]>,
    // Engagement by hour after the send (first 72 hours).
    db.execute(sql`
      with c as (select sent_at from email_campaigns where id = ${id}::uuid)
      select h.hour,
        (select count(*) from campaign_email_logs l, c where l.campaign_id = ${id}::uuid and l.opened_at is not null
           and floor(extract(epoch from (l.opened_at - c.sent_at)) / 3600) = h.hour) as opens,
        (select count(*) from campaign_email_logs l, c where l.campaign_id = ${id}::uuid and l.clicked_at is not null
           and floor(extract(epoch from (l.clicked_at - c.sent_at)) / 3600) = h.hour) as clicks
      from generate_series(0, 71) as h(hour)
      order by h.hour
    `) as unknown as Promise<
      Array<{ hour: number; opens: unknown; clicks: unknown }>
    >,
    db.execute(sql`
      select l.subscriber_email as email, l.status, l.opened_at::text as opened_at, l.clicked_at::text as clicked_at,
        l.click_count, l.bounce_reason,
        (select coalesce(sum(o.total_amount), 0) from orders o
          where l.clicked_at is not null and lower(o.email) = lower(l.subscriber_email)
            and o.status <> 'cancelled' and o.created_at >= l.clicked_at
            and o.created_at < l.clicked_at + interval '${sql.raw(String(ATTRIBUTION_DAYS))} days') as spent
      from campaign_email_logs l
      where l.campaign_id = ${id}::uuid
      order by spent desc, l.click_count desc, l.opened_at desc nulls last
      limit 25
    `) as unknown as Promise<Record<string, unknown>[]>,
    db.execute(sql`
      select count(*) as orders, coalesce(sum(o.total_amount), 0) as sales
      from orders o, email_campaigns c
      where c.id = ${id}::uuid and c.coupon_code is not null and upper(o.coupon_code) = upper(c.coupon_code)
        and o.status <> 'cancelled'
    `) as unknown as Promise<Record<string, unknown>[]>,
  ]);
  if (!campaign) return null;

  return {
    id: String(campaign.id),
    name: String(campaign.name),
    type: String(campaign.type),
    subject: String(campaign.subject),
    preheader: (campaign.preheader as string | null) ?? null,
    status: String(campaign.status),
    couponCode: (campaign.coupon_code as string | null) ?? null,
    sentAt: utcDate(campaign.sent_at),
    createdAt: utcDate(campaign.created_at)!,
    stats: toStats(campaign),
    couponOrders: num(coupon[0]?.orders),
    couponSales: num(coupon[0]?.sales),
    hourly: hourly.map((h) => ({
      hour: Number(h.hour),
      opens: num(h.opens),
      clicks: num(h.clicks),
    })),
    recipients: recipients.map((r) => ({
      email: String(r.email),
      status: String(r.status),
      openedAt: utcDate(r.opened_at),
      clickedAt: utcDate(r.clicked_at),
      clicks: num(r.click_count),
      bounceReason: (r.bounce_reason as string | null) ?? null,
      spent: num(r.spent),
    })),
  };
}
