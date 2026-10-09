/** Segment definitions shared by server queries and the campaign editor (no DB imports). */

export type Audience = {
  segment: SegmentKey;
  /** For "collection": who bought from this collection. */
  collectionId?: string;
  /** For "vip": minimum lifetime spend in naira. */
  minSpend?: number;
};

export const SEGMENTS = [
  {
    key: "all",
    label: "Everyone subscribed",
    description: "All active newsletter subscribers.",
  },
  {
    key: "customers",
    label: "Customers",
    description: "Subscribers who have bought at least once.",
  },
  {
    key: "repeat",
    label: "Repeat customers",
    description: "Bought two or more times. Your most loyal people.",
  },
  {
    key: "prospects",
    label: "Haven't bought yet",
    description: "Subscribed but never ordered. Good for a first-order offer.",
  },
  {
    key: "lapsed",
    label: "Lapsed customers",
    description: "Bought before, but nothing in the last 90 days.",
  },
  {
    key: "recent",
    label: "Recent customers",
    description: "Ordered in the last 30 days.",
  },
  {
    key: "vip",
    label: "Big spenders",
    description: "Lifetime spend above an amount you choose.",
  },
  {
    key: "lagos",
    label: "In Lagos",
    description: "Last delivery address was in Lagos.",
  },
  {
    key: "outside_lagos",
    label: "Outside Lagos",
    description: "Last delivery address was outside Lagos.",
  },
  {
    key: "collection",
    label: "Bought from a collection",
    description: "Anyone who bought a product in a collection you pick.",
  },
] as const;

export type SegmentKey = (typeof SEGMENTS)[number]["key"];

export const DEFAULT_VIP_SPEND = 150_000;

export function normaliseAudience(raw: unknown): Audience {
  const a = (raw ?? {}) as Partial<Audience>;
  const segment = SEGMENTS.some((s) => s.key === a.segment)
    ? (a.segment as SegmentKey)
    : "all";
  return {
    segment,
    collectionId:
      typeof a.collectionId === "string" ? a.collectionId : undefined,
    minSpend:
      typeof a.minSpend === "number" && a.minSpend > 0 ? a.minSpend : undefined,
  };
}

export function describeAudience(a: Audience, collectionTitle?: string) {
  const seg = SEGMENTS.find((s) => s.key === a.segment)!;
  if (a.segment === "collection")
    return collectionTitle ? `Bought from ${collectionTitle}` : seg.label;
  if (a.segment === "vip")
    return `Spent over ₦${(a.minSpend ?? DEFAULT_VIP_SPEND).toLocaleString("en-NG")}`;
  return seg.label;
}
