/**
 * Store health: turns raw counts into checks with a status and a fix link.
 * Pure (no database) so the thresholds are unit-tested; the queries live in
 * ./health.ts.
 */

export type HealthStatus = "ok" | "warn" | "fail" | "unknown";

export type HealthGroup = "catalog" | "checkout" | "operations" | "systems";

/** Page order: money first, then customers waiting, then the catalog. */
export const HEALTH_GROUPS: Array<{ key: HealthGroup; label: string }> = [
  { key: "checkout", label: "Checkout & payments" },
  { key: "operations", label: "Operations" },
  { key: "catalog", label: "Catalog" },
  { key: "systems", label: "Systems" },
];

export type HealthCheck = {
  id: string;
  group: HealthGroup;
  label: string;
  status: HealthStatus;
  /** One line: what's wrong, or that it's fine. */
  detail: string;
  /** Headline number, when the check counts things. */
  count?: number;
  href?: string;
  /** How much the check moves the score (1 = cosmetic, 3 = losing sales). */
  weight: number;
};

export type CronRun = { lastRunAt: Date; ok: boolean; message?: string };

export type HealthInput = {
  now: Date;
  catalog: {
    activeProducts: number;
    noPhotos: number;
    onePhoto: number;
    noDescription: number;
    noSeo: number;
    noCollection: number;
    zeroPrice: number;
    unbuyable: number;
    soldOut: number;
    lowStock: number;
    missingAlt: number;
  };
  payments: {
    paid: number;
    failed: number;
    conflictsInWindow: number;
    previousPaid: number;
    previousSettled: number;
    openConflicts: number;
    paidWithoutOrder: number;
  };
  operations: {
    late: number;
    unconfirmedOver24h: number;
    requestsWaitingOver48h: number;
    reviewsPending: number;
    lowRatings30d: number;
  };
  marketing: {
    recoveryOverdue: number;
    staleCoupons: number;
  };
  systems: {
    dbLatencyMs: number;
    failedEmails7d: number;
    /** Null when usage reporting is off or Cloudinary didn't answer. */
    cloudinaryUsedPercent: number | null;
    /** Null when Google Merchant isn't configured. */
    merchantFailed: number | null;
    crons: Record<string, CronRun | null>;
    missingEnv: string[];
  };
};

/** Low stock: tracked variants with this many or fewer left (but not zero). */
export const LOW_STOCK = 2;

/** Daily crons are overdue after this long without a run. */
export const CRON_STALE_HOURS = 26;

/** Needs this many settled payments in 7 days before judging the rate. */
const MIN_SETTLED = 5;

export const CRONS: Array<{ key: string; label: string; href?: string }> = [
  { key: "marketing", label: "Campaigns & email flows" },
  { key: "abandoned-cart", label: "Abandoned-cart emails" },
];

const plural = (n: number, one: string, many = `${one}s`) =>
  `${n.toLocaleString("en-NG")} ${n === 1 ? one : many}`;

/** "ok" at zero, else the given status. */
const anyIs = (n: number, status: HealthStatus): HealthStatus =>
  n > 0 ? status : "ok";

function catalogChecks(c: HealthInput["catalog"]): HealthCheck[] {
  const products = "/admin/products";
  return [
    {
      id: "unbuyable",
      group: "catalog",
      label: "Live but can't be bought",
      status: anyIs(c.unbuyable, "fail"),
      count: c.unbuyable,
      detail: c.unbuyable
        ? `${plural(c.unbuyable, "product")} on the shop with every size unavailable.`
        : "Every live product has at least one size to buy.",
      href: `${products}?view=unbuyable`,
      weight: 3,
    },
    {
      id: "zero-price",
      group: "catalog",
      label: "Priced at ₦0",
      status: anyIs(c.zeroPrice, "fail"),
      count: c.zeroPrice,
      detail: c.zeroPrice
        ? `${plural(c.zeroPrice, "live product")} with a size that costs nothing.`
        : "No live sizes are free by mistake.",
      href: `${products}?view=zero-price`,
      weight: 3,
    },
    {
      id: "no-photos",
      group: "catalog",
      label: "No photos",
      status: anyIs(c.noPhotos, "fail"),
      count: c.noPhotos,
      detail: c.noPhotos
        ? `${plural(c.noPhotos, "live product")} with no photo at all.`
        : "Every live product has a photo.",
      href: `${products}?view=no-photos`,
      weight: 3,
    },
    {
      id: "sold-out",
      group: "catalog",
      label: "Sold out",
      status: anyIs(c.soldOut, "warn"),
      count: c.soldOut,
      detail: c.soldOut
        ? `${plural(c.soldOut, "product")} with a stocked size at zero. Restock or switch it to made to order.`
        : "No stocked sizes have run out.",
      href: `${products}?view=sold-out`,
      weight: 2,
    },
    {
      id: "low-stock",
      group: "catalog",
      label: "Low stock",
      status: anyIs(c.lowStock, "warn"),
      count: c.lowStock,
      detail: c.lowStock
        ? `${plural(c.lowStock, "product")} with a stocked size down to ${LOW_STOCK} or fewer.`
        : `No stocked sizes are down to ${LOW_STOCK} or fewer.`,
      href: `${products}?view=low-stock`,
      weight: 1,
    },
    {
      id: "one-photo",
      group: "catalog",
      label: "Only one photo",
      status: anyIs(c.onePhoto, "warn"),
      count: c.onePhoto,
      detail: c.onePhoto
        ? `${plural(c.onePhoto, "live product")} with a single photo. Side and sole shots sell.`
        : "Every live product has more than one photo.",
      href: `${products}?view=one-photo`,
      weight: 1,
    },
    {
      id: "no-description",
      group: "catalog",
      label: "No description",
      status: anyIs(c.noDescription, "warn"),
      count: c.noDescription,
      detail: c.noDescription
        ? `${plural(c.noDescription, "live product")} without a description.`
        : "Every live product is described.",
      href: `${products}?view=no-description`,
      weight: 2,
    },
    {
      id: "no-collection",
      group: "catalog",
      label: "Not in a collection",
      status: anyIs(c.noCollection, "warn"),
      count: c.noCollection,
      detail: c.noCollection
        ? `${plural(c.noCollection, "live product")} only findable by search.`
        : "Every live product sits in a collection.",
      href: `${products}?view=no-collection`,
      weight: 2,
    },
    {
      id: "no-seo",
      group: "catalog",
      label: "Search listing not written",
      status: anyIs(c.noSeo, "warn"),
      count: c.noSeo,
      detail: c.noSeo
        ? `${plural(c.noSeo, "live product")} missing an SEO title or description.`
        : "Every live product has its Google listing written.",
      href: `${products}?view=no-seo`,
      weight: 1,
    },
    {
      id: "missing-alt",
      group: "catalog",
      label: "Photos without alt text",
      status: anyIs(c.missingAlt, "warn"),
      count: c.missingAlt,
      detail: c.missingAlt
        ? `${plural(c.missingAlt, "live product")} with photos that have no alt text for screen readers and Google Images.`
        : "Every photo on a live product has alt text.",
      href: `${products}?view=missing-alt`,
      weight: 1,
    },
  ];
}

/** Paid ÷ settled, as a percentage; null with too few payments to judge. */
export function successRate(paid: number, settled: number) {
  return settled >= MIN_SETTLED ? (paid / settled) * 100 : null;
}

function paymentChecks(
  p: HealthInput["payments"],
  m: HealthInput["marketing"],
): HealthCheck[] {
  const settled = p.paid + p.failed + p.conflictsInWindow;
  const rate = successRate(p.paid, settled);
  const previous = successRate(p.previousPaid, p.previousSettled);
  const rateText = (r: number) => `${Math.round(r)}%`;

  return [
    {
      id: "paid-without-order",
      group: "checkout",
      label: "Paid but no order",
      status: anyIs(p.paidWithoutOrder, "fail"),
      count: p.paidWithoutOrder,
      detail: p.paidWithoutOrder
        ? `${plural(p.paidWithoutOrder, "payment")} taken with no order created. Open each one and recover it.`
        : "Every successful checkout payment became an order.",
      href: "/admin/payments?view=paid",
      weight: 3,
    },
    {
      id: "payment-conflicts",
      group: "checkout",
      label: "Payments to review",
      status: anyIs(p.openConflicts, "fail"),
      count: p.openConflicts,
      detail: p.openConflicts
        ? `${plural(p.openConflicts, "payment")} Paystack flagged as not matching the order.`
        : "No payments need a decision.",
      href: "/admin/payments?view=conflict",
      weight: 3,
    },
    {
      id: "payment-success",
      group: "checkout",
      label: "Payment success, last 7 days",
      status:
        rate === null
          ? "unknown"
          : rate < 70
            ? "fail"
            : rate < 85
              ? "warn"
              : "ok",
      detail:
        rate === null
          ? `Not enough payments yet to judge (${settled} settled).`
          : `${rateText(rate)} of ${plural(settled, "finished payment")} went through` +
            (previous === null
              ? "."
              : `, against ${rateText(previous)} the week before.`),
      href: "/admin/payments?view=failed",
      weight: 3,
    },
    {
      id: "recovery-overdue",
      group: "checkout",
      label: "Cart reminders overdue",
      status: anyIs(m.recoveryOverdue, "warn"),
      count: m.recoveryOverdue,
      detail: m.recoveryOverdue
        ? `${plural(m.recoveryOverdue, "abandoned bag")} past due with no reminder sent. Check the email cron below.`
        : "Abandoned-bag reminders are going out on time.",
      href: "/admin/campaigns/automations",
      weight: 1,
    },
    {
      id: "stale-coupons",
      group: "checkout",
      label: "Dead coupons still switched on",
      status: anyIs(m.staleCoupons, "warn"),
      count: m.staleCoupons,
      detail: m.staleCoupons
        ? `${plural(m.staleCoupons, "coupon")} expired or used up but still active. Customers who try them get an error.`
        : "Every active coupon still works.",
      href: "/admin/coupons",
      weight: 1,
    },
  ];
}

function operationChecks(o: HealthInput["operations"]): HealthCheck[] {
  return [
    {
      id: "late-orders",
      group: "operations",
      label: "Late orders",
      status: anyIs(o.late, "fail"),
      count: o.late,
      detail: o.late
        ? `${plural(o.late, "order")} past the promised arrival date.`
        : "Every open order is on schedule.",
      href: "/admin/orders?view=late",
      weight: 3,
    },
    {
      id: "unconfirmed",
      group: "operations",
      label: "Unconfirmed after a day",
      status: anyIs(o.unconfirmedOver24h, "warn"),
      count: o.unconfirmedOver24h,
      detail: o.unconfirmedOver24h
        ? `${plural(o.unconfirmedOver24h, "paid order")} older than 24 hours not yet confirmed.`
        : "New orders are being confirmed within a day.",
      href: "/admin/orders?view=confirm",
      weight: 2,
    },
    {
      id: "requests-waiting",
      group: "operations",
      label: "Custom requests waiting",
      status: anyIs(o.requestsWaitingOver48h, "warn"),
      count: o.requestsWaitingOver48h,
      detail: o.requestsWaitingOver48h
        ? `${plural(o.requestsWaitingOver48h, "request")} waiting more than 48 hours for a quote.`
        : "Custom requests are being quoted within two days.",
      href: "/admin/custom-order-requests",
      weight: 2,
    },
    {
      id: "low-ratings",
      group: "operations",
      label: "Unhappy reviews, last 30 days",
      status: anyIs(o.lowRatings30d, "warn"),
      count: o.lowRatings30d,
      detail: o.lowRatings30d
        ? `${plural(o.lowRatings30d, "1–2★ review")}. Worth a message to each customer.`
        : "No 1–2★ reviews this month.",
      href: "/admin/reviews?view=all&rating=low",
      weight: 1,
    },
    {
      id: "reviews-pending",
      group: "operations",
      label: "Reviews to moderate",
      status: anyIs(o.reviewsPending, "warn"),
      count: o.reviewsPending,
      detail: o.reviewsPending
        ? `${plural(o.reviewsPending, "review")} waiting to be published or hidden.`
        : "No reviews waiting.",
      href: "/admin/reviews",
      weight: 1,
    },
  ];
}

export function cronStatus(run: CronRun | null, now: Date): HealthStatus {
  if (!run) return "unknown";
  if (!run.ok) return "fail";
  const hours = (now.getTime() - run.lastRunAt.getTime()) / 3_600_000;
  return hours > CRON_STALE_HOURS ? "fail" : "ok";
}

function hoursAgo(date: Date, now: Date) {
  const h = Math.round((now.getTime() - date.getTime()) / 3_600_000);
  return h < 1 ? "under an hour ago" : `${plural(h, "hour")} ago`;
}

function systemChecks(s: HealthInput["systems"], now: Date): HealthCheck[] {
  const checks: HealthCheck[] = [
    {
      id: "env",
      group: "systems",
      label: "Configuration",
      status: s.missingEnv.length ? "fail" : "ok",
      count: s.missingEnv.length,
      detail: s.missingEnv.length
        ? `Missing on the server: ${s.missingEnv.join(", ")}.`
        : "Payments, email, images and cron keys are all set.",
      weight: 3,
    },
    {
      id: "database",
      group: "systems",
      label: "Database",
      status:
        s.dbLatencyMs > 1500 ? "fail" : s.dbLatencyMs > 500 ? "warn" : "ok",
      detail: `Answered in ${Math.round(s.dbLatencyMs)} ms.`,
      weight: 2,
    },
  ];

  for (const cron of CRONS) {
    const run = s.crons[cron.key] ?? null;
    const status = cronStatus(run, now);
    checks.push({
      id: `cron-${cron.key}`,
      group: "systems",
      label: cron.label,
      status,
      detail: !run
        ? "No run recorded yet. Shows up after the next daily run."
        : !run.ok
          ? `Last run failed ${hoursAgo(run.lastRunAt, now)}${run.message ? `: ${run.message}` : "."}`
          : status === "fail"
            ? `Hasn't run since ${hoursAgo(run.lastRunAt, now)}. The daily job may be off.`
            : `Ran ${hoursAgo(run.lastRunAt, now)}.`,
      href: cron.href,
      weight: 2,
    });
  }

  checks.push({
    id: "failed-emails",
    group: "systems",
    label: "Failed emails, last 7 days",
    status: anyIs(s.failedEmails7d, "warn"),
    count: s.failedEmails7d,
    detail: s.failedEmails7d
      ? `${plural(s.failedEmails7d, "campaign or flow email")} Resend couldn't send.`
      : "Every campaign and flow email went out.",
    href: "/admin/campaigns",
    weight: 1,
  });

  if (s.merchantFailed !== null) {
    checks.push({
      id: "merchant",
      group: "systems",
      label: "Google Shopping sync",
      status: anyIs(s.merchantFailed, "warn"),
      count: s.merchantFailed,
      detail: s.merchantFailed
        ? `${plural(s.merchantFailed, "product")} Google rejected on the last sync.`
        : "Every product synced to Google Merchant.",
      href: "/admin/products",
      weight: 1,
    });
  }

  if (s.cloudinaryUsedPercent !== null) {
    const used = s.cloudinaryUsedPercent;
    checks.push({
      id: "cloudinary",
      group: "systems",
      label: "Image storage plan",
      status: used >= 95 ? "fail" : used >= 80 ? "warn" : "ok",
      detail: `${Math.round(used)}% of this month's Cloudinary credits used.`,
      weight: 2,
    });
  }

  return checks;
}

export function buildHealthChecks(input: HealthInput): HealthCheck[] {
  return [
    ...catalogChecks(input.catalog),
    ...paymentChecks(input.payments, input.marketing),
    ...operationChecks(input.operations),
    ...systemChecks(input.systems, input.now),
  ];
}

const EARNED: Record<Exclude<HealthStatus, "unknown">, number> = {
  ok: 1,
  warn: 0.5,
  fail: 0,
};

/** 0–100, weighted; checks that can't be judged yet don't count. */
export function healthScore(checks: HealthCheck[]) {
  let possible = 0;
  let earned = 0;
  for (const c of checks) {
    if (c.status === "unknown") continue;
    possible += c.weight;
    earned += c.weight * EARNED[c.status];
  }
  return possible === 0 ? 100 : Math.round((earned / possible) * 100);
}

const RANK: Record<HealthStatus, number> = {
  fail: 0,
  warn: 1,
  unknown: 2,
  ok: 3,
};

/** Worst first, then heaviest. */
export function sortChecks(checks: HealthCheck[]) {
  return [...checks].sort(
    (a, b) => RANK[a.status] - RANK[b.status] || b.weight - a.weight,
  );
}

export function summarise(checks: HealthCheck[]) {
  return {
    score: healthScore(checks),
    failing: checks.filter((c) => c.status === "fail").length,
    warnings: checks.filter((c) => c.status === "warn").length,
  };
}

export function scoreVerdict(score: number) {
  return score >= 90
    ? "In good shape"
    : score >= 70
      ? "A few things to fix"
      : "Needs work";
}
