import { SHOP_TIME_ZONE } from "lib/db/time";

/** Days to make a made-to-order pair when the product doesn't say. */
export const DEFAULT_PRODUCTION_DAYS = 7;

const normalize = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

/** Working days in transit after dispatch, as a [min, max] range. */
export function transitDays(state?: string | null): [number, number] {
  const s = normalize(state || "");
  if (!s) return [1, 5];
  if (s === "lagos") return [1, 2];
  return [2, 5];
}

/** Adds working days (Mon–Sat; the workshop and couriers rest on Sunday). */
function addWorkingDays(from: Date, days: number) {
  const d = new Date(from);
  let left = days;
  while (left > 0) {
    d.setUTCDate(d.getUTCDate() + 1);
    if (d.getUTCDay() !== 0) left -= 1;
  }
  return d;
}

/** Today's calendar date in Lagos, at UTC midnight. */
function lagosToday(now: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: SHOP_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
  return new Date(`${parts}T00:00:00Z`);
}

export type DeliveryEstimate = {
  /** ISO dates (yyyy-mm-dd) for the earliest and latest likely arrival. */
  from: string;
  to: string;
  productionDays: number;
};

/**
 * When a bag should reach the customer: the slowest item's production time
 * (stocked pairs count as zero) plus courier transit for the state.
 */
export function estimateDelivery(input: {
  productionDays: (number | null | undefined)[];
  state?: string | null;
  now?: Date;
}): DeliveryEstimate {
  const production = Math.max(
    0,
    ...input.productionDays.map((d) =>
      d == null ? DEFAULT_PRODUCTION_DAYS : Math.max(0, d),
    ),
  );
  const [min, max] = transitDays(input.state);
  const start = lagosToday(input.now ?? new Date());
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  return {
    from: iso(addWorkingDays(start, production + min)),
    to: iso(addWorkingDays(start, production + max)),
    productionDays: production,
  };
}

/** "Fri 24 Oct" or "Fri 24 – Tue 28 Oct". */
export function formatDeliveryRange({ from, to }: DeliveryEstimate) {
  const fmt = (iso: string, opts: Intl.DateTimeFormatOptions) =>
    new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-GB", {
      timeZone: "UTC",
      ...opts,
    });
  const full = { weekday: "short", day: "numeric", month: "short" } as const;
  if (from === to) return fmt(from, full);
  const sameMonth = from.slice(0, 7) === to.slice(0, 7);
  return `${fmt(from, sameMonth ? { weekday: "short", day: "numeric" } : full)} – ${fmt(to, full)}`;
}
