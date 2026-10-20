/**
 * Catalog problems on live products, as SQL conditions over `products`. Store
 * health counts with these and the products list filters with them (as
 * ?view=<key>), so a number on the health page always matches the list its
 * fix link opens.
 */
import { and, eq, exists, not, sql, type SQL } from "drizzle-orm";
import type { AnyPgColumn } from "drizzle-orm/pg-core";
import { db } from "lib/db";
import {
  productCollections,
  productImages,
  productVariants,
  products,
} from "lib/db/schema";
import { LOW_STOCK } from "./health-checks";

const variantWhere = (condition: SQL) =>
  exists(
    db
      .select({ x: sql`1` })
      .from(productVariants)
      .where(and(eq(productVariants.productId, products.id), condition)),
  );

const imageCount = sql<number>`(select count(*) from ${productImages} where ${productImages.productId} = ${products.id})`;

const blank = (column: SQL | AnyPgColumn) =>
  sql`nullif(trim(${column}), '') is null`;

const live = eq(products.availableForSale, true);

/** A couple listing: no variants of its own, it sells two other products'. */
const isCouple = sql`${products.pairing} is not null`;

/** The linked product exists, is on sale and has a size that can be bought. */
const buyableLink = (column: AnyPgColumn) => sql`exists (
  select 1 from ${products} p join ${productVariants} v on v.product_id = p.id
  where p.id = ${column} and p.available_for_sale and v.available_for_sale
)`;

const ISSUE_CONDITIONS = {
  // A couple listing can't be bought when either of its products can't.
  unbuyable: sql`(case when ${isCouple} then not (${buyableLink(products.pairFirstProductId)} and ${buyableLink(products.pairSecondProductId)}) else ${not(variantWhere(eq(productVariants.availableForSale, true)))} end)`,
  "zero-price": variantWhere(
    and(
      eq(productVariants.availableForSale, true),
      sql`${productVariants.price} = 0`,
    )!,
  ),
  "no-photos": sql`${imageCount} = 0`,
  "one-photo": sql`${imageCount} = 1`,
  "sold-out": variantWhere(
    and(
      eq(productVariants.trackInventory, true),
      sql`coalesce(${productVariants.stockQuantity}, 0) = 0`,
    )!,
  ),
  "low-stock": variantWhere(
    and(
      eq(productVariants.trackInventory, true),
      sql`${productVariants.stockQuantity} between 1 and ${LOW_STOCK}`,
    )!,
  ),
  // The editor writes HTML; strip tags so "<p></p>" counts as empty.
  "no-description": blank(
    sql`regexp_replace(coalesce(${products.descriptionHtml}, ${products.description}, ''), '<[^>]*>', '', 'g')`,
  ),
  "no-collection": not(
    exists(
      db
        .select({ x: sql`1` })
        .from(productCollections)
        .where(eq(productCollections.productId, products.id)),
    ),
  ),
  "no-seo": sql`(${blank(products.seoTitle)} or ${blank(products.seoDescription)})`,
  "missing-alt": exists(
    db
      .select({ x: sql`1` })
      .from(productImages)
      .where(
        and(
          eq(productImages.productId, products.id),
          blank(productImages.altText),
        ),
      ),
  ),
} satisfies Record<string, SQL>;

export type ProductIssue = keyof typeof ISSUE_CONDITIONS;

export const PRODUCT_ISSUES: Array<{ key: ProductIssue; label: string }> = [
  { key: "unbuyable", label: "Can't be bought" },
  { key: "zero-price", label: "Priced at ₦0" },
  { key: "no-photos", label: "No photos" },
  { key: "sold-out", label: "Sold-out sizes" },
  { key: "low-stock", label: "Low stock" },
  { key: "one-photo", label: "One photo" },
  { key: "no-description", label: "No description" },
  { key: "no-collection", label: "No collection" },
  { key: "no-seo", label: "No search listing" },
  { key: "missing-alt", label: "Missing alt text" },
];

/** Live products with the issue. */
export function productIssueWhere(issue: ProductIssue): SQL {
  return and(live, ISSUE_CONDITIONS[issue])!;
}

/** One query: how many live products have each issue, plus the live total. */
export async function countProductIssues() {
  const [row] = await db
    .select({
      active: sql<number>`count(*)`,
      ...Object.fromEntries(
        PRODUCT_ISSUES.map(({ key }) => [
          key,
          sql<number>`count(*) filter (where ${ISSUE_CONDITIONS[key]})`,
        ]),
      ),
    })
    .from(products)
    .where(live);
  const n = (v: unknown) => Number(v ?? 0) || 0;
  const r = (row ?? {}) as Record<string, unknown>;
  return {
    active: n(r.active),
    ...(Object.fromEntries(
      PRODUCT_ISSUES.map(({ key }) => [key, n(r[key])]),
    ) as Record<ProductIssue, number>),
  };
}
