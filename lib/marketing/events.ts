/**
 * Resend webhook events → campaign/flow engagement, plus list hygiene:
 * hard bounces and spam complaints unsubscribe the address, which protects
 * the sending domain's reputation (and everyone else's inbox placement).
 */
import crypto from "crypto";
import { sql } from "drizzle-orm";
import { db } from "lib/db";

/**
 * Verify a Svix-signed webhook (Resend uses Svix). Secret format: whsec_<base64>.
 * Rejects timestamps more than 5 minutes off to stop replays.
 */
export function verifySvixSignature(
  payload: string,
  headers: Headers,
  secret: string,
) {
  const id = headers.get("svix-id");
  const timestamp = headers.get("svix-timestamp");
  const signatures = headers.get("svix-signature");
  if (!id || !timestamp || !signatures) return false;
  if (Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) return false;

  const key = Buffer.from(secret.replace(/^whsec_/, ""), "base64");
  const expected = crypto
    .createHmac("sha256", key)
    .update(`${id}.${timestamp}.${payload}`)
    .digest("base64");
  return signatures.split(" ").some((part) => {
    const [, sig] = part.split(",");
    if (!sig) return false;
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  });
}

type ResendEvent = {
  type: string;
  data: {
    email_id?: string;
    to?: string[];
    bounce?: { type?: string; message?: string };
    bounce_type?: string;
  };
};

async function unsubscribe(email: string, reason: string) {
  await db.execute(sql`
    update newsletter_subscribers set status = ${reason}, unsubscribed_at = now() at time zone 'UTC'
    where lower(email) = lower(${email}) and status = 'active'
  `);
}

export async function handleResendEvent(event: ResendEvent) {
  const id = event.data.email_id;
  const recipient = event.data.to?.[0];
  if (!id) return;

  switch (event.type) {
    case "email.opened":
      await db.execute(sql`update campaign_email_logs set opened_at = coalesce(opened_at, now() at time zone 'UTC'),
        status = case when status in ('SENT', 'DELIVERED') then 'OPENED' else status end, updated_at = now() at time zone 'UTC'
        where resend_message_id = ${id}`);
      await db.execute(
        sql`update flow_email_logs set opened_at = coalesce(opened_at, now() at time zone 'UTC') where resend_message_id = ${id}`,
      );
      break;
    case "email.clicked":
      await db.execute(sql`update campaign_email_logs set clicked_at = coalesce(clicked_at, now() at time zone 'UTC'),
        opened_at = coalesce(opened_at, now() at time zone 'UTC'), click_count = click_count + 1, status = 'CLICKED',
        updated_at = now() at time zone 'UTC' where resend_message_id = ${id}`);
      await db.execute(sql`update flow_email_logs set clicked_at = coalesce(clicked_at, now() at time zone 'UTC'),
        opened_at = coalesce(opened_at, now() at time zone 'UTC'), click_count = click_count + 1 where resend_message_id = ${id}`);
      break;
    case "email.bounced": {
      const kind =
        event.data.bounce?.type ?? event.data.bounce_type ?? "Unknown";
      await db.execute(sql`update campaign_email_logs set status = 'BOUNCED', bounce_reason = ${String(kind).slice(0, 250)},
        updated_at = now() at time zone 'UTC' where resend_message_id = ${id}`);
      await db.execute(
        sql`update flow_email_logs set status = 'BOUNCED' where resend_message_id = ${id}`,
      );
      // Only permanent (hard) bounces mean the address is dead.
      if (recipient && /permanent|hard/i.test(String(kind)))
        await unsubscribe(recipient, "bounced");
      break;
    }
    case "email.complained":
      await db.execute(sql`update campaign_email_logs set status = 'COMPLAINED', updated_at = now() at time zone 'UTC'
        where resend_message_id = ${id}`);
      if (recipient) await unsubscribe(recipient, "complained");
      break;
  }
}
