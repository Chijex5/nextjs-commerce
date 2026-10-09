/**
 * Automated emails ("flows"): sent by a trigger instead of by hand. Industry
 * data puts ~40% of email revenue on flows from ~5% of sends, so these are the
 * highest-leverage emails a small shop can run.
 *
 * welcome & abandoned_cart already existed; they're registered here so they
 * can be switched off and measured. review_request & win_back are new and run
 * from the daily marketing cron.
 */
import { eq, sql } from "drizzle-orm";
import { db } from "lib/db";
import { flowEmailLogs, marketingFlows } from "lib/db/schema";
import { getUnsubscribeUrl } from "lib/email/marketing-campaigns";
import { sendEmailBatch } from "lib/email/resend";
import { baseTemplate } from "lib/email/templates/base";
import { escapeHtml } from "lib/email/templates/email-utils";

export type FlowKey =
  | "welcome"
  | "abandoned_cart"
  | "review_request"
  | "win_back";

export type FlowSettings = {
  /** review_request: days after delivery. win_back: days since last order. */
  days?: number;
  /** win_back: optional coupon shown in the email. */
  couponCode?: string;
};

export const FLOWS: Array<{
  key: FlowKey;
  name: string;
  trigger: string;
  goal: string;
  defaultEnabled: boolean;
  defaults: FlowSettings;
}> = [
  {
    key: "welcome",
    name: "Welcome",
    trigger: "Someone subscribes to the newsletter",
    goal: "Turn a new subscriber into a first order.",
    defaultEnabled: true,
    defaults: {},
  },
  {
    key: "abandoned_cart",
    name: "Abandoned cart",
    trigger: "A signed-in shopper leaves items in their bag",
    goal: "Bring them back to finish checking out.",
    defaultEnabled: true,
    defaults: {},
  },
  {
    key: "review_request",
    name: "Review request",
    trigger: "An order is delivered",
    goal: "Collect reviews that help the next customer decide.",
    defaultEnabled: false,
    defaults: { days: 5 },
  },
  {
    key: "win_back",
    name: "Win-back",
    trigger: "A customer hasn't ordered in a while",
    goal: "Remind past customers you're still here, before they forget.",
    defaultEnabled: false,
    defaults: { days: 90 },
  },
];

export async function getFlowConfig(key: FlowKey) {
  const def = FLOWS.find((f) => f.key === key)!;
  const [row] = await db
    .select()
    .from(marketingFlows)
    .where(eq(marketingFlows.key, key))
    .limit(1);
  return {
    enabled: row ? row.enabled : def.defaultEnabled,
    settings: { ...def.defaults, ...((row?.settings as FlowSettings) ?? {}) },
  };
}

export async function setFlowConfig(
  key: FlowKey,
  patch: { enabled?: boolean; settings?: FlowSettings },
) {
  const current = await getFlowConfig(key);
  const next = {
    enabled: patch.enabled ?? current.enabled,
    settings: { ...current.settings, ...(patch.settings ?? {}) },
  };
  await db
    .insert(marketingFlows)
    .values({
      key,
      enabled: next.enabled,
      settings: next.settings,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: marketingFlows.key,
      set: {
        enabled: next.enabled,
        settings: next.settings,
        updatedAt: new Date(),
      },
    });
  return next;
}

/** Record a flow email for a send that happened elsewhere (welcome, abandoned cart). */
export async function logFlowSend(
  key: FlowKey,
  email: string,
  reference: string,
  resendMessageId?: string | null,
) {
  await db
    .insert(flowEmailLogs)
    .values({
      flowKey: key,
      email: email.toLowerCase(),
      reference,
      resendMessageId: resendMessageId ?? null,
    })
    .onConflictDoNothing();
}

const SITE = () =>
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.NEXTAUTH_URL ||
  "https://www.dfootprint.me";

const button = (href: string, label: string) =>
  `<div style="margin:28px 0;"><a href="${href}" style="display:inline-block;background:#000;color:#fff;text-decoration:none;padding:14px 32px;font-size:13px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;">${label}</a></div>`;

function reviewEmail(
  name: string,
  items: Array<{ title: string; handle: string }>,
) {
  const first = escapeHtml(name.split(" ")[0] || "there");
  const list = items
    .map(
      (i) =>
        `<tr><td style="padding:12px 0;border-bottom:1px solid #e5e5e5;font-size:15px;color:#000;">${escapeHtml(i.title)}</td><td style="padding:12px 0;border-bottom:1px solid #e5e5e5;text-align:right;"><a href="${SITE()}/product/${encodeURIComponent(i.handle)}#reviews" style="color:#000;font-size:13px;font-weight:600;">Rate it &rarr;</a></td></tr>`,
    )
    .join("");
  return `
    <h2 style="margin:0 0 16px;font-size:24px;color:#000;">How are they fitting?</h2>
    <p style="margin:0 0 12px;font-size:14px;line-height:1.6;color:#525252;">Hi ${first}, your D'FOOTPRINT order arrived a few days ago. Every pair is made by hand, so your honest review helps us, and helps the next person choosing a size.</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;">${list}</table>
    ${button(`${SITE()}/product/${encodeURIComponent(items[0]!.handle)}#reviews`, "Write a review")}
    <p style="margin:0;font-size:12px;color:#737373;">Something not right with the fit? Just reply to this email and we'll sort it out.</p>`;
}

function winBackEmail(name: string, couponCode?: string) {
  const first = escapeHtml(name.split(" ")[0] || "there");
  const offer = couponCode
    ? `<div style="margin:20px 0;padding:18px;border:1px dashed #000;text-align:center;"><p style="margin:0 0 6px;font-size:12px;letter-spacing:.1em;text-transform:uppercase;color:#525252;">Your code</p><p style="margin:0;font-size:22px;font-weight:700;letter-spacing:.2em;color:#000;">${escapeHtml(couponCode)}</p></div>`
    : "";
  return `
    <h2 style="margin:0 0 16px;font-size:24px;color:#000;">It's been a while, ${first}</h2>
    <p style="margin:0 0 12px;font-size:14px;line-height:1.6;color:#525252;">We've been busy in the workshop: new slides, mules and colourways, all still made by hand in Nigeria. Come and see what's new.</p>
    ${offer}
    ${button(`${SITE()}/products`, "See what's new")}`;
}

type Candidate = {
  email: string;
  name: string;
  reference: string;
  html: string;
  subject: string;
};

/** Claim each trigger in flow_email_logs first so overlapping runs can't double-send. */
async function sendFlow(key: FlowKey, candidates: Candidate[]) {
  let sent = 0;
  for (let i = 0; i < candidates.length; i += 100) {
    const claimed: Candidate[] = [];
    for (const c of candidates.slice(i, i + 100)) {
      const rows = await db
        .insert(flowEmailLogs)
        .values({
          flowKey: key,
          email: c.email,
          reference: c.reference,
          status: "SENDING",
        })
        .onConflictDoNothing()
        .returning({ id: flowEmailLogs.id });
      if (rows.length) claimed.push(c);
    }
    if (!claimed.length) continue;
    const result = await sendEmailBatch(
      claimed.map((c) => {
        const unsubscribeUrl = getUnsubscribeUrl(c.email);
        return {
          to: c.email,
          subject: c.subject,
          html: baseTemplate(c.html, unsubscribeUrl),
          headers: {
            "List-Unsubscribe": `<${unsubscribeUrl}>`,
            "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
          },
        };
      }),
    );
    await db.execute(sql`
      update flow_email_logs as l set status = ${result.success ? "SENT" : "FAILED"},
        resend_message_id = v.mid, sent_at = now() at time zone 'UTC'
      from (values ${sql.join(
        claimed.map(
          (c, idx) =>
            sql`(${c.email}, ${c.reference}, ${result.success ? (result.ids[idx] ?? null) : null})`,
        ),
        sql`, `,
      )}) as v(email, reference, mid)
      where l.flow_key = ${key} and l.email = v.email and l.reference = v.reference
    `);
    if (result.success) sent += claimed.length;
  }
  return sent;
}

async function runReviewRequests(days: number) {
  // Delivered N+ days ago (but within 30 days of that), no review yet, not unsubscribed.
  const rows = (await db.execute(sql`
    select o.id, lower(o.email) as email, o.customer_name as name,
      json_agg(json_build_object('title', p.title, 'handle', p.handle)) as items
    from orders o
    join order_items oi on oi.order_id = o.id
    join products p on p.id = oi.product_id
    where o.delivery_status = 'completed' and o.status <> 'cancelled'
      and o.updated_at <= (now() at time zone 'UTC') - make_interval(days => ${days})
      and o.updated_at > (now() at time zone 'UTC') - make_interval(days => ${days + 30})
      and not exists (select 1 from reviews r join users u on u.id = r.user_id
                      where lower(u.email) = lower(o.email) and r.product_id = oi.product_id)
      and not exists (select 1 from newsletter_subscribers s
                      where lower(s.email) = lower(o.email) and s.status <> 'active')
      and not exists (select 1 from flow_email_logs f
                      where f.flow_key = 'review_request' and f.reference = o.id::text)
    group by o.id
    limit 200
  `)) as unknown as Array<{
    id: string;
    email: string;
    name: string;
    items: Array<{ title: string; handle: string }>;
  }>;

  return sendFlow(
    "review_request",
    rows.map((r) => {
      const items = [...new Map(r.items.map((i) => [i.handle, i])).values()];
      return {
        email: r.email,
        name: r.name,
        reference: r.id,
        subject:
          items.length === 1
            ? `How are your ${items[0]!.title}?`
            : "How are your new D'FOOTPRINTs?",
        html: reviewEmail(r.name, items),
      };
    }),
  );
}

async function runWinBack(days: number, couponCode?: string) {
  // Subscribed customers whose last order is N+ days old; at most once per 180 days each.
  const rows = (await db.execute(sql`
    with last_orders as (
      select lower(o.email) as email, max(o.customer_name) as name, max(o.created_at) as last_at
      from orders o
      join newsletter_subscribers s on lower(s.email) = lower(o.email) and s.status = 'active'
      where o.status <> 'cancelled'
      group by lower(o.email)
    )
    select l.email, l.name, l.last_at::date::text as last_order
    from last_orders l
    where l.last_at <= (now() at time zone 'UTC') - make_interval(days => ${days})
      and not exists (select 1 from flow_email_logs f
        where f.flow_key = 'win_back' and f.email = l.email
          and f.sent_at > (now() at time zone 'UTC') - interval '180 days')
    limit 300
  `)) as unknown as Array<{ email: string; name: string; last_order: string }>;

  return sendFlow(
    "win_back",
    rows.map((r) => ({
      email: r.email,
      name: r.name,
      reference: `last-order:${r.last_order}`,
      subject: couponCode
        ? "We miss you. Here's something to come back for"
        : "New in at D'FOOTPRINT",
      html: winBackEmail(r.name, couponCode),
    })),
  );
}

/** Run every enabled cron-driven flow. Called by the daily marketing cron. */
export async function runFlows() {
  const out: Record<string, number | string> = {};
  const review = await getFlowConfig("review_request");
  if (review.enabled)
    out.review_request = await runReviewRequests(
      review.settings.days ?? 5,
    ).catch((e) => String(e));
  const winBack = await getFlowConfig("win_back");
  if (winBack.enabled)
    out.win_back = await runWinBack(
      winBack.settings.days ?? 90,
      winBack.settings.couponCode,
    ).catch((e) => String(e));
  return out;
}

/** Sends, clicks and attributed sales per flow (paid orders within 7 days of the email). */
export async function getFlowStats() {
  const rows = (await db.execute(sql`
    with sends as (
      select flow_key,
        count(*) filter (where status = 'SENT') as sent,
        count(*) filter (where status = 'SENT' and sent_at > (now() at time zone 'UTC') - interval '30 days') as sent_30d,
        count(*) filter (where click_count > 0) as clicked
      from flow_email_logs group by flow_key
    ),
    -- Distinct so an order is credited once even if several emails preceded it.
    attributed as (
      select distinct f.flow_key, o.id, o.total_amount
      from flow_email_logs f
      join orders o on lower(o.email) = f.email and o.status <> 'cancelled'
        and o.created_at >= f.sent_at and o.created_at < f.sent_at + interval '7 days'
      where f.status = 'SENT'
    )
    select s.flow_key, s.sent, s.sent_30d, s.clicked,
      (select count(*) from attributed a where a.flow_key = s.flow_key) as orders,
      (select coalesce(sum(a.total_amount), 0) from attributed a where a.flow_key = s.flow_key) as sales
    from sends s
  `)) as unknown as Array<Record<string, unknown>>;
  return new Map(
    rows.map((r) => [
      String(r.flow_key),
      {
        sent: Number(r.sent),
        sent30d: Number(r.sent_30d),
        clicked: Number(r.clicked),
        orders: Number(r.orders),
        sales: Number(r.sales),
      },
    ]),
  );
}
