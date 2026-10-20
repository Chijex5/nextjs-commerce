/** Couple listings in admin: what can be paired, and checks before saving. */
import {
  and,
  asc,
  eq,
  inArray,
  isNotNull,
  isNull,
  ne,
  or,
  sql,
} from "drizzle-orm";
import type { PairableProduct } from "components/admin/products/couples-pair";
import { db } from "lib/db";
import { products, productVariants } from "lib/db/schema";

/** Every product that isn't itself a couple listing, with its price range. */
export async function getPairableProducts(): Promise<PairableProduct[]> {
  const rows = await db
    .select({
      id: products.id,
      title: products.title,
      active: products.availableForSale,
      min: sql<string | null>`min(${productVariants.price})`,
      max: sql<string | null>`max(${productVariants.price})`,
    })
    .from(products)
    .leftJoin(productVariants, eq(productVariants.productId, products.id))
    .where(isNull(products.pairing))
    .groupBy(products.id)
    .orderBy(asc(products.title));
  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    active: r.active,
    minPrice: r.min == null ? null : Number(r.min),
    maxPrice: r.max == null ? null : Number(r.max),
  }));
}

/**
 * Why a couple listing can't link these two products, or null when it can:
 * two different products, neither a couple listing itself, and no other
 * couple listing already selling the same two (either way round), so a bag
 * line always knows which listing it belongs to.
 */
export async function coupleLinkError(input: {
  firstProductId: string;
  secondProductId: string;
  /** The listing being edited. */
  selfId?: string;
}): Promise<string | null> {
  const { firstProductId: a, secondProductId: b, selfId } = input;
  if (a === b) return "Choose two different products";
  if (selfId && (a === selfId || b === selfId))
    return "A couple set can't include itself";

  const found = await db
    .select({ id: products.id, pairing: products.pairing })
    .from(products)
    .where(inArray(products.id, [a, b]));
  if (found.length !== 2) return "One of the products no longer exists";
  if (found.some((p) => p.pairing))
    return "A couple set can't include another couple set";

  const [taken] = await db
    .select({ title: products.title })
    .from(products)
    .where(
      and(
        isNotNull(products.pairing),
        selfId ? ne(products.id, selfId) : undefined,
        or(
          and(
            eq(products.pairFirstProductId, a),
            eq(products.pairSecondProductId, b),
          ),
          and(
            eq(products.pairFirstProductId, b),
            eq(products.pairSecondProductId, a),
          ),
        ),
      ),
    )
    .limit(1);
  return taken
    ? `"${taken.title}" already sells these two products as a set`
    : null;
}
