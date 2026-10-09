/**
 * Reliable campaign sending.
 *
 * 1. queueCampaign snapshots the audience into campaign_email_logs as QUEUED
 *    (unique per campaign + email, so re-queuing can't duplicate anyone).
 * 2. processCampaign claims QUEUED rows in batches of 100 with
 *    FOR UPDATE SKIP LOCKED, sends each batch through Resend's batch API and
 *    records the result. It stops before its time budget runs out; whatever is
 *    left is picked up by the next call (manual "resume" or the daily cron).
 * 3. When nothing is queued, the campaign is marked SENT.
 */
import { and, eq, sql } from "drizzle-orm";
import { db } from "lib/db";
import { campaignEmailLogs, emailCampaigns } from "lib/db/schema";
import {
  getCampaignWithProducts,
  getUnsubscribeUrl,
} from "lib/email/marketing-campaigns";
import { sendEmailBatch } from "lib/email/resend";
import { prepareCampaignRenderer } from "./render";
import { normaliseAudience, resolveAudience } from "./segments";

const BATCH = 100;
/** Rows stuck mid-send this long (a crashed run) are retried. */
const STALE_MINUTES = 10;

export async function queueCampaign(campaignId: string) {
  const [campaign] = await db
    .select()
    .from(emailCampaigns)
    .where(eq(emailCampaigns.id, campaignId))
    .limit(1);
  if (!campaign) throw new Error("Campaign not found");
  if (campaign.status === "SENT")
    throw new Error("This campaign has already been sent");

  const recipients = await resolveAudience(
    normaliseAudience(campaign.audience),
    campaign.frequencyCapHours,
    campaignId,
  );
  for (let i = 0; i < recipients.length; i += 500) {
    const chunk = recipients.slice(i, i + 500);
    await db
      .insert(campaignEmailLogs)
      .values(
        chunk.map((r) => ({
          campaignId,
          subscriberEmail: r.email,
          status: "QUEUED",
        })),
      )
      .onConflictDoNothing();
  }

  await db
    .update(emailCampaigns)
    .set({
      status: "SENDING",
      sentAt: campaign.sentAt ?? new Date(),
      updatedAt: new Date(),
    })
    .where(eq(emailCampaigns.id, campaignId));

  return { queued: recipients.length };
}

async function claimBatch(campaignId: string) {
  return (await db.execute(sql`
    update campaign_email_logs set status = 'SENDING', updated_at = now() at time zone 'UTC'
    where id in (
      select id from campaign_email_logs
      where campaign_id = ${campaignId}::uuid
        and (status = 'QUEUED'
          or (status = 'SENDING' and updated_at < (now() at time zone 'UTC') - make_interval(mins => ${STALE_MINUTES})))
      order by subscriber_email
      limit ${BATCH}
      for update skip locked
    )
    returning id, subscriber_email
  `)) as unknown as Array<{ id: string; subscriber_email: string }>;
}

export async function processCampaign(campaignId: string, budgetMs = 45_000) {
  const started = Date.now();
  const campaign = await getCampaignWithProducts(campaignId);
  const render = await prepareCampaignRenderer(campaign);
  const names = new Map(
    (
      (await db.execute(sql`
        select lower(email) as email, max(name) as name from newsletter_subscribers group by lower(email)
      `)) as unknown as Array<{ email: string; name: string | null }>
    ).map((r) => [r.email, r.name]),
  );

  let sent = 0;
  let failed = 0;
  while (Date.now() - started < budgetMs) {
    const batch = await claimBatch(campaignId);
    if (!batch.length) break;

    const emails = batch.map((row) => {
      const subscriber = {
        email: row.subscriber_email,
        name: names.get(row.subscriber_email.toLowerCase()) ?? null,
      };
      const unsubscribeUrl = getUnsubscribeUrl(row.subscriber_email);
      return {
        to: row.subscriber_email,
        subject: render.subject(subscriber.name),
        html: render.html(subscriber.name, unsubscribeUrl),
        preheader: render.preheader(subscriber.name),
        headers: {
          "List-Unsubscribe": `<${unsubscribeUrl}>`,
          "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
        },
      };
    });

    const result = await sendEmailBatch(emails);
    if (!result.success && batch.length > 1) {
      // Batches are all-or-nothing: one bad address fails the other 99.
      // Retry one by one so only the genuinely bad addresses fail.
      const ids: Array<string | null> = [];
      const errors: Array<string | null> = [];
      for (const email of emails) {
        const single = await sendEmailBatch([email]);
        ids.push(single.success ? (single.ids[0] ?? null) : null);
        errors.push(single.success ? null : single.error);
        await new Promise((r) => setTimeout(r, 110));
      }
      await db.execute(sql`
        update campaign_email_logs as l
        set status = case when v.mid is null then 'FAILED' else 'SENT' end,
          resend_message_id = v.mid, bounce_reason = v.err,
          sent_at = now() at time zone 'UTC', updated_at = now() at time zone 'UTC'
        from (values ${sql.join(
          batch.map(
            (row, i) =>
              sql`(${row.id}::uuid, ${ids[i]}::text, ${errors[i]?.slice(0, 250) ?? null}::text)`,
          ),
          sql`, `,
        )}) as v(id, mid, err)
        where l.id = v.id
      `);
      const ok = ids.filter(Boolean).length;
      sent += ok;
      failed += batch.length - ok;
      continue;
    }
    if (result.success) {
      // One statement per batch: map each row to its Resend id.
      await db.execute(sql`
        update campaign_email_logs as l set status = 'SENT', resend_message_id = v.mid,
          sent_at = now() at time zone 'UTC', updated_at = now() at time zone 'UTC'
        from (values ${sql.join(
          batch.map(
            (row, i) => sql`(${row.id}::uuid, ${result.ids[i] ?? null})`,
          ),
          sql`, `,
        )}) as v(id, mid)
        where l.id = v.id
      `);
      sent += batch.length;
    } else {
      await db.execute(sql`
        update campaign_email_logs set status = 'FAILED', bounce_reason = ${result.error.slice(0, 250)},
          updated_at = now() at time zone 'UTC'
        where id in (${sql.join(
          batch.map((r) => sql`${r.id}::uuid`),
          sql`, `,
        )})
      `);
      failed += batch.length;
    }
    // Stay under Resend's 10 requests/second.
    await new Promise((r) => setTimeout(r, 120));
  }

  const [left] = (await db.execute(sql`
    select count(*) as n from campaign_email_logs
    where campaign_id = ${campaignId}::uuid and status in ('QUEUED', 'SENDING')
  `)) as unknown as Array<{ n: unknown }>;
  const remaining = Number(left?.n ?? 0);
  if (remaining === 0) {
    await db
      .update(emailCampaigns)
      .set({ status: "SENT", completedAt: new Date(), updatedAt: new Date() })
      .where(
        and(
          eq(emailCampaigns.id, campaignId),
          eq(emailCampaigns.status, "SENDING"),
        ),
      );
  }
  return { sent, failed, remaining };
}

/** Start campaigns whose scheduled time has arrived and continue unfinished sends. */
export async function runDueCampaigns(budgetMs = 50_000) {
  const started = Date.now();
  const due = (await db.execute(sql`
    select id from email_campaigns
    where (status = 'SCHEDULED' and scheduled_at <= now() at time zone 'UTC') or status = 'SENDING'
    order by scheduled_at nulls first
  `)) as unknown as Array<{ id: string }>;

  const results: Array<{
    id: string;
    sent: number;
    failed: number;
    remaining: number;
    error?: string;
  }> = [];
  for (const { id } of due) {
    const left = budgetMs - (Date.now() - started);
    if (left < 5_000) break;
    try {
      const [c] = await db
        .select({ status: emailCampaigns.status })
        .from(emailCampaigns)
        .where(eq(emailCampaigns.id, id))
        .limit(1);
      if (c?.status === "SCHEDULED") await queueCampaign(id);
      results.push({ id, ...(await processCampaign(id, left - 3_000)) });
    } catch (err) {
      results.push({
        id,
        sent: 0,
        failed: 0,
        remaining: -1,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }
  return results;
}
