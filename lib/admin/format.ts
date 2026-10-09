import { SHOP_TIME_ZONE } from "./range";

const ngn = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  maximumFractionDigits: 0,
});

export function money(amount: number) {
  return ngn.format(Math.round(amount || 0));
}

/** ₦1.2M / ₦840K / ₦9,500 — for axes and dense tiles. */
export function moneyCompact(amount: number) {
  const abs = Math.abs(amount);
  if (abs >= 1_000_000)
    return `₦${(amount / 1_000_000).toFixed(abs >= 10_000_000 ? 0 : 1)}M`;
  if (abs >= 10_000) return `₦${Math.round(amount / 1_000)}K`;
  return money(amount);
}

export function count(n: number) {
  return Math.round(n || 0).toLocaleString("en-NG");
}

export function percent(n: number | null, digits = 0) {
  if (n === null || !Number.isFinite(n)) return "—";
  return `${n.toFixed(digits)}%`;
}

export function timeAgo(date: Date, now = new Date()) {
  const seconds = Math.max(
    0,
    Math.floor((now.getTime() - date.getTime()) / 1000),
  );
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86_400) return `${Math.floor(seconds / 3600)}h ago`;
  const days = Math.floor(seconds / 86_400);
  if (days < 30) return `${days}d ago`;
  return shortDate(date);
}

/** Days between now and a date, rounded; positive = in the past. */
export function daysSince(date: Date, now = new Date()) {
  return Math.floor((now.getTime() - date.getTime()) / 86_400_000);
}

export function shortDate(date: Date) {
  return date.toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    timeZone: SHOP_TIME_ZONE,
  });
}

export function longDate(date: Date) {
  return date.toLocaleDateString("en-NG", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: SHOP_TIME_ZONE,
  });
}

export function shopHour(date: Date) {
  return Number(
    date.toLocaleString("en-GB", {
      hour: "2-digit",
      hour12: false,
      timeZone: SHOP_TIME_ZONE,
    }),
  );
}

export function pairs(n: number) {
  return `${count(n)} ${Math.round(n) === 1 ? "pair" : "pairs"}`;
}
