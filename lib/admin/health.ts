/**
 * Store health: gathers the counts behind every check in ./health-checks.ts.
 * Not time-ranged except where a check says so; all of it is "right now".
 */
import { v2 as cloudinary } from "cloudinary";
import { sql } from "drizzle-orm";
import { getCronRuns } from "lib/cron-heartbeat";
import { db } from "lib/db";
import { getFlowConfig } from "lib/marketing/flows";
import {
  buildHealthChecks,
  CRONS,
  sortChecks,
  summarise,
  type HealthCheck,
  type HealthInput,
} from "./health-checks";
import { OPEN } from "./metrics";
import { countProductIssues } from "./product-issues";

/** Server keys the shop can't take payments, send email or upload without. */
const REQUIRED_ENV = [
  "PAYSTACK_SECRET_KEY",
  "RESEND_API_KEY",
  "CRON_SECRET",
  "NEXTAUTH_SECRET",
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
];

const num = (value: unknown) => {
  const n = typeof value === "number" ? value : Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
};

async function dbLatency() {
  const startedAt = performance.now();
  await db.execute(sql`select 1`);
  return performance.now() - startedAt;
}

/** Credits used this month, or null if reporting is off or slow to answer. */
async function cloudinaryUsedPercent(): Promise<number | null> {
  if (process.env.CLOUDINARY_USAGE_ENABLED !== "true") return null;
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  try {
    const usage = (await Promise.race([
      cloudinary.api.usage(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("timeout")), 3000),
      ),
    ])) as { credits?: { used_percent?: unknown } };
    const used = Number(usage?.credits?.used_percent);
    return Number.isFinite(used) ? used : null;
  } catch {
    return null;
  }
}

async function counts() {
  const [r] = (await db.execute(sql`
    select
      (select count(*) from payment_transactions
         where created_at >= now() - interval '7 days' and status = 'paid') as paid,
      (select count(*) from payment_transactions
         where created_at >= now() - interval '7 days' and status = 'failed') as failed,
      (select count(*) from payment_transactions
         where created_at >= now() - interval '7 days' and status = 'conflict') as conflicts_window,
      (select count(*) from payment_transactions
         where created_at >= now() - interval '14 days' and created_at < now() - interval '7 days'
           and status = 'paid') as previous_paid,
      (select count(*) from payment_transactions
         where created_at >= now() - interval '14 days' and created_at < now() - interval '7 days'
           and status in ('paid', 'failed', 'conflict')) as previous_settled,
      (select count(*) from payment_transactions where status = 'conflict') as open_conflicts,
      (select count(*) from payment_transactions
         where status = 'paid' and order_id is null and source = 'catalog_checkout'
           and created_at < now() - interval '15 minutes') as paid_without_order,

      (select count(*) from orders o where ${OPEN} and o.delivery_status <> 'paused'
         and o.estimated_arrival is not null and o.estimated_arrival < now()) as late,
      (select count(*) from orders o where ${OPEN} and o.acknowledged_at is null
         and o.created_at < now() - interval '24 hours') as unconfirmed,
      (select count(*) from custom_order_requests
         where status in ('submitted', 'under_review')
           and created_at < now() - interval '48 hours') as requests_waiting,
      (select count(*) from reviews where status = 'pending') as reviews_pending,
      (select count(*) from reviews
         where rating <= 2 and created_at >= now() - interval '30 days') as low_ratings,

      (select count(*) from abandoned_carts
         where not email_sent and not recovered
           and expires_at < now() - interval '2 days') as recovery_overdue,
      (select count(*) from coupons
         where is_active and (expiry_date < now()
           or (max_uses is not null and used_count >= max_uses))) as stale_coupons,
      (select count(*) from campaign_email_logs
         where status = 'FAILED' and created_at >= now() - interval '7 days')
        + (select count(*) from flow_email_logs
         where status = 'FAILED' and sent_at >= now() - interval '7 days') as failed_emails,
      (select count(*) from google_merchant_product_syncs
         where sync_status = 'failed') as merchant_failed
  `)) as unknown as Array<Record<string, unknown>>;
  return r ?? {};
}

export type StoreHealth = {
  checks: HealthCheck[];
  score: number;
  failing: number;
  warnings: number;
  checkedAt: Date;
};

export async function getStoreHealth(now = new Date()): Promise<StoreHealth> {
  const [latency, catalog, r, crons, cartFlow, cloudinaryUsed] =
    await Promise.all([
      dbLatency(),
      countProductIssues(),
      counts(),
      getCronRuns(CRONS.map((c) => c.key)),
      getFlowConfig("abandoned_cart"),
      cloudinaryUsedPercent(),
    ]);

  const input: HealthInput = {
    now,
    catalog: {
      activeProducts: catalog.active,
      noPhotos: catalog["no-photos"],
      onePhoto: catalog["one-photo"],
      noDescription: catalog["no-description"],
      noSeo: catalog["no-seo"],
      noCollection: catalog["no-collection"],
      zeroPrice: catalog["zero-price"],
      unbuyable: catalog.unbuyable,
      soldOut: catalog["sold-out"],
      lowStock: catalog["low-stock"],
      missingAlt: catalog["missing-alt"],
    },
    payments: {
      paid: num(r.paid),
      failed: num(r.failed),
      conflictsInWindow: num(r.conflicts_window),
      previousPaid: num(r.previous_paid),
      previousSettled: num(r.previous_settled),
      openConflicts: num(r.open_conflicts),
      paidWithoutOrder: num(r.paid_without_order),
    },
    operations: {
      late: num(r.late),
      unconfirmedOver24h: num(r.unconfirmed),
      requestsWaitingOver48h: num(r.requests_waiting),
      reviewsPending: num(r.reviews_pending),
      lowRatings30d: num(r.low_ratings),
    },
    marketing: {
      // Switched-off reminders aren't overdue.
      recoveryOverdue: cartFlow.enabled ? num(r.recovery_overdue) : 0,
      staleCoupons: num(r.stale_coupons),
    },
    systems: {
      dbLatencyMs: latency,
      failedEmails7d: num(r.failed_emails),
      cloudinaryUsedPercent: cloudinaryUsed,
      merchantFailed: process.env.GOOGLE_MERCHANT_ID
        ? num(r.merchant_failed)
        : null,
      crons,
      missingEnv: REQUIRED_ENV.filter((k) => !process.env[k]?.trim()),
    },
  };

  const checks = sortChecks(buildHealthChecks(input));
  return { checks, ...summarise(checks), checkedAt: now };
}
