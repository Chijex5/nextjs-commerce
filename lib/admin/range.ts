/**
 * Reporting periods for the admin. Pure functions only, so they can be used by
 * server queries and client charts alike.
 *
 * All reporting happens in shop time (Africa/Lagos, a fixed UTC+1 with no DST)
 * so "today" means today in Lagos, not on the database server. Timestamps in
 * Postgres are stored as UTC wall-clock values; callers compare them against
 * the UTC instants produced here.
 */

export const SHOP_TIME_ZONE = "Africa/Lagos";
const SHOP_OFFSET_MS = 60 * 60 * 1000; // UTC+1, no daylight saving

export type RangeKey = "today" | "7d" | "30d" | "90d" | "12m";
export type Granularity = "hour" | "day" | "week" | "month";

export type ReportRange = {
  key: RangeKey;
  label: string;
  /** Short label for compact controls. */
  short: string;
  start: Date;
  end: Date;
  /** Same-length window immediately before, cut at the same point in time. */
  previousStart: Date;
  previousEnd: Date;
  granularity: Granularity;
  /** e.g. "vs yesterday", "vs previous 30 days". */
  comparisonLabel: string;
};

export const RANGE_OPTIONS: Array<{
  key: RangeKey;
  label: string;
  short: string;
}> = [
  { key: "today", label: "Today", short: "Today" },
  { key: "7d", label: "Last 7 days", short: "7D" },
  { key: "30d", label: "Last 30 days", short: "30D" },
  { key: "90d", label: "Last 90 days", short: "90D" },
  { key: "12m", label: "Last 12 months", short: "12M" },
];

/** Shop-local calendar parts for a UTC instant. */
function shopParts(date: Date) {
  const shifted = new Date(date.getTime() + SHOP_OFFSET_MS);
  return {
    y: shifted.getUTCFullYear(),
    m: shifted.getUTCMonth(),
    d: shifted.getUTCDate(),
    h: shifted.getUTCHours(),
  };
}

/** UTC instant of shop-local midnight on the given shop-local calendar day. */
function shopMidnight(y: number, m: number, d: number) {
  return new Date(Date.UTC(y, m, d) - SHOP_OFFSET_MS);
}

export function startOfShopDay(date: Date) {
  const { y, m, d } = shopParts(date);
  return shopMidnight(y, m, d);
}

export function resolveRange(
  key: string | undefined,
  now = new Date(),
): ReportRange {
  const option = RANGE_OPTIONS.find((o) => o.key === key) ?? RANGE_OPTIONS[2]!;
  const today = startOfShopDay(now);
  const { y, m, d } = shopParts(now);

  let start: Date;
  let granularity: Granularity;
  let comparisonLabel: string;

  switch (option.key) {
    case "today":
      start = today;
      granularity = "hour";
      comparisonLabel = "vs yesterday";
      break;
    case "7d":
      start = shopMidnight(y, m, d - 6);
      granularity = "day";
      comparisonLabel = "vs previous 7 days";
      break;
    case "90d":
      start = shopMidnight(y, m, d - 89);
      granularity = "week";
      comparisonLabel = "vs previous 90 days";
      break;
    case "12m":
      start = shopMidnight(y, m - 11, 1);
      granularity = "month";
      comparisonLabel = "vs previous 12 months";
      break;
    case "30d":
    default:
      start = shopMidnight(y, m, d - 29);
      granularity = "day";
      comparisonLabel = "vs previous 30 days";
      break;
  }

  const end = now;
  // Compare like with like: "today until 3pm" against "yesterday until 3pm".
  let previousStart: Date;
  if (option.key === "12m") {
    previousStart = shopMidnight(y - 1, m - 11, 1);
  } else {
    previousStart = new Date(
      start.getTime() - (today.getTime() - start.getTime()) - 86_400_000,
    );
  }
  const previousEnd = new Date(
    previousStart.getTime() + (end.getTime() - start.getTime()),
  );

  return {
    key: option.key,
    label: option.label,
    short: option.short,
    start,
    end,
    previousStart,
    previousEnd,
    granularity,
    comparisonLabel,
  };
}

export type Bucket = {
  /** Bucket key matching the SQL `to_char` format for this granularity. */
  key: string;
  /** Axis label. */
  label: string;
  /** Tooltip label. */
  title: string;
};

const pad = (n: number) => String(n).padStart(2, "0");

/** ISO week-start (Monday) for a shop-local calendar date. */
function weekStart(y: number, m: number, d: number) {
  const date = new Date(Date.UTC(y, m, d));
  const dow = (date.getUTCDay() + 6) % 7; // 0 = Monday
  date.setUTCDate(date.getUTCDate() - dow);
  return date;
}

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function dayKey(date: Date) {
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

function dayLabel(date: Date) {
  return `${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]}`;
}

/**
 * Every bucket in a window, so charts show empty days/hours as zero instead
 * of skipping them. Keys line up with {@link bucketSqlFormat}.
 */
export function buildBuckets(
  start: Date,
  end: Date,
  granularity: Granularity,
): Bucket[] {
  const buckets: Bucket[] = [];
  const s = shopParts(start);
  const e = shopParts(new Date(end.getTime() - 1));

  if (granularity === "hour") {
    for (let h = 0; h < 24; h++) {
      buckets.push({
        key: pad(h),
        label: `${pad(h)}:00`,
        title: `${pad(h)}:00 – ${pad(h)}:59`,
      });
    }
    return buckets;
  }

  if (granularity === "month") {
    let y = s.y;
    let m = s.m;
    while (y < e.y || (y === e.y && m <= e.m)) {
      buckets.push({
        key: `${y}-${pad(m + 1)}`,
        label: MONTHS[m]!,
        title: `${MONTHS[m]} ${y}`,
      });
      m += 1;
      if (m > 11) {
        m = 0;
        y += 1;
      }
    }
    return buckets;
  }

  if (granularity === "week") {
    const cursor = weekStart(s.y, s.m, s.d);
    const last = weekStart(e.y, e.m, e.d);
    while (cursor <= last) {
      const weekEnd = new Date(cursor);
      weekEnd.setUTCDate(weekEnd.getUTCDate() + 6);
      buckets.push({
        key: dayKey(cursor),
        label: dayLabel(cursor),
        title: `Week of ${dayLabel(cursor)} – ${dayLabel(weekEnd)}`,
      });
      cursor.setUTCDate(cursor.getUTCDate() + 7);
    }
    return buckets;
  }

  const cursor = new Date(Date.UTC(s.y, s.m, s.d));
  const last = new Date(Date.UTC(e.y, e.m, e.d));
  while (cursor <= last) {
    buckets.push({
      key: dayKey(cursor),
      label: dayLabel(cursor),
      title: dayLabel(cursor),
    });
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return buckets;
}

/** Postgres `to_char` pattern producing {@link Bucket.key} for a granularity. */
export function bucketSqlFormat(granularity: Granularity) {
  switch (granularity) {
    case "hour":
      return "HH24";
    case "month":
      return "YYYY-MM";
    default:
      return "YYYY-MM-DD";
  }
}

/** Percentage change, or null when there's nothing to compare against. */
export function percentChange(
  current: number,
  previous: number,
): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return ((current - previous) / previous) * 100;
}
