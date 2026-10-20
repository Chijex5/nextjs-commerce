import { describe, expect, it } from "vitest";
import {
  buildHealthChecks,
  cronStatus,
  CRON_STALE_HOURS,
  healthScore,
  sortChecks,
  successRate,
  summarise,
  type HealthCheck,
  type HealthInput,
} from "lib/admin/health-checks";

const now = new Date("2026-10-20T09:00:00Z");
const hoursAgo = (h: number) => new Date(now.getTime() - h * 3_600_000);

function healthy(): HealthInput {
  return {
    now,
    catalog: {
      activeProducts: 20,
      noPhotos: 0,
      onePhoto: 0,
      noDescription: 0,
      noSeo: 0,
      noCollection: 0,
      zeroPrice: 0,
      unbuyable: 0,
      soldOut: 0,
      lowStock: 0,
      missingAlt: 0,
    },
    payments: {
      paid: 40,
      failed: 2,
      conflictsInWindow: 0,
      previousPaid: 30,
      previousSettled: 32,
      openConflicts: 0,
      paidWithoutOrder: 0,
    },
    operations: {
      late: 0,
      unconfirmedOver24h: 0,
      requestsWaitingOver48h: 0,
      reviewsPending: 0,
      lowRatings30d: 0,
    },
    marketing: { recoveryOverdue: 0, staleCoupons: 0 },
    systems: {
      dbLatencyMs: 40,
      failedEmails7d: 0,
      cloudinaryUsedPercent: null,
      merchantFailed: null,
      crons: {
        marketing: { lastRunAt: hoursAgo(3), ok: true },
        "abandoned-cart": { lastRunAt: hoursAgo(5), ok: true },
      },
      missingEnv: [],
    },
  };
}

const byId = (checks: HealthCheck[], id: string) =>
  checks.find((c) => c.id === id)!;

describe("store health", () => {
  it("scores a healthy shop 100 with nothing open", () => {
    const checks = buildHealthChecks(healthy());
    expect(checks.every((c) => c.status === "ok")).toBe(true);
    expect(summarise(checks)).toEqual({ score: 100, failing: 0, warnings: 0 });
  });

  it("fails on catalog problems that lose sales and warns on polish", () => {
    const input = healthy();
    input.catalog.noPhotos = 2;
    input.catalog.onePhoto = 4;
    const checks = buildHealthChecks(input);
    expect(byId(checks, "no-photos")).toMatchObject({
      status: "fail",
      count: 2,
      href: "/admin/products?view=no-photos",
    });
    expect(byId(checks, "one-photo").status).toBe("warn");
  });

  it("judges payment success only with enough payments", () => {
    expect(successRate(3, 4)).toBeNull();
    expect(successRate(9, 10)).toBe(90);

    const input = healthy();
    input.payments = { ...input.payments, paid: 1, failed: 1 };
    expect(byId(buildHealthChecks(input), "payment-success").status).toBe(
      "unknown",
    );

    input.payments = { ...input.payments, paid: 8, failed: 2 };
    expect(byId(buildHealthChecks(input), "payment-success").status).toBe(
      "warn",
    );

    input.payments = { ...input.payments, paid: 6, failed: 4 };
    expect(byId(buildHealthChecks(input), "payment-success").status).toBe(
      "fail",
    );
  });

  it("flags crons that failed or stopped running", () => {
    expect(cronStatus(null, now)).toBe("unknown");
    expect(cronStatus({ lastRunAt: hoursAgo(2), ok: false }, now)).toBe("fail");
    expect(
      cronStatus({ lastRunAt: hoursAgo(CRON_STALE_HOURS + 1), ok: true }, now),
    ).toBe("fail");
    expect(
      cronStatus({ lastRunAt: hoursAgo(CRON_STALE_HOURS - 1), ok: true }, now),
    ).toBe("ok");
  });

  it("only adds integration checks that are configured", () => {
    const ids = buildHealthChecks(healthy()).map((c) => c.id);
    expect(ids).not.toContain("merchant");
    expect(ids).not.toContain("cloudinary");

    const input = healthy();
    input.systems.merchantFailed = 3;
    input.systems.cloudinaryUsedPercent = 96;
    const checks = buildHealthChecks(input);
    expect(byId(checks, "merchant").status).toBe("warn");
    expect(byId(checks, "cloudinary").status).toBe("fail");
  });

  it("names missing configuration without values", () => {
    const input = healthy();
    input.systems.missingEnv = ["PAYSTACK_SECRET_KEY"];
    const env = byId(buildHealthChecks(input), "env");
    expect(env.status).toBe("fail");
    expect(env.detail).toContain("PAYSTACK_SECRET_KEY");
  });

  it("weights the score and ignores checks that can't be judged", () => {
    const check = (
      status: HealthCheck["status"],
      weight: number,
    ): HealthCheck => ({
      id: `${status}-${weight}`,
      group: "catalog",
      label: "",
      detail: "",
      status,
      weight,
    });
    expect(healthScore([check("ok", 3), check("fail", 1)])).toBe(75);
    expect(healthScore([check("ok", 1), check("warn", 1)])).toBe(75);
    expect(healthScore([check("ok", 1), check("unknown", 3)])).toBe(100);
    expect(healthScore([])).toBe(100);
  });

  it("sorts worst and heaviest first", () => {
    const input = healthy();
    input.catalog.onePhoto = 1; // warn, weight 1
    input.operations.unconfirmedOver24h = 1; // warn, weight 2
    input.operations.late = 1; // fail, weight 3
    const ids = sortChecks(buildHealthChecks(input))
      .slice(0, 3)
      .map((c) => c.id);
    expect(ids).toEqual(["late-orders", "unconfirmed", "one-photo"]);
  });
});
