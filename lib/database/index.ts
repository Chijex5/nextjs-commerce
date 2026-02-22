import { TAGS, HIDDEN_PRODUCT_TAG } from "lib/constants";
import {
  unstable_cacheLife as cacheLife,
  unstable_cacheTag as cacheTag,
  revalidateTag,
} from "next/cache";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import * as dbQueries from "../db/queries";
import type { Cart, Collection, Menu, Page, Product } from "../shopify/types";

// Re-export types from shopify for compatibility
export type {
  Cart,
  Collection,
  Menu,
  Page,
  Product,
  ProductOption,
  ProductVariant,
  Image,
  Money,
  SEO,
  CartItem,
  CartProduct,
} from "../shopify/types";

// Cart operations
export async function createCart(): Promise<Cart> {
  return dbQueries.createCart();
}

export async function addToCart(
  lines: { merchandiseId: string; quantity: number }[],
): Promise<Cart> {
  const cartId = (await cookies()).get("cartId")?.value!;
  return dbQueries.addToCart(cartId, lines);
}

export async function removeFromCart(lineIds: string[]): Promise<Cart> {
  const cartId = (await cookies()).get("cartId")?.value!;
  return dbQueries.removeFromCart(cartId, lineIds);
}

export async function updateCart(
  lines: { id: string; merchandiseId: string; quantity: number }[],
): Promise<Cart> {
  const cartId = (await cookies()).get("cartId")?.value!;
  return dbQueries.updateCart(cartId, lines);
}

export async function getCart(): Promise<Cart | undefined> {
  "use cache: private";
  cacheTag(TAGS.cart);
  cacheLife("seconds");

  const cartId = (await cookies()).get("cartId")?.value;

  if (!cartId) {
    return undefined;
  }

  return dbQueries.getCart(cartId);
}

// Collection operations
export async function getCollection(
  handle: string,
): Promise<Collection | undefined> {
  "use cache";
  cacheTag(TAGS.collections);
  cacheLife("days");

  return dbQueries.getCollection(handle);
}

export async function getCollectionProducts({
  collection,
  reverse,
  sortKey,
}: {
  collection: string;
  reverse?: boolean;
  sortKey?: string;
}): Promise<Product[]> {
  "use cache";
  cacheTag(TAGS.collections, TAGS.products);
  cacheLife("days");

  const products = await dbQueries.getCollectionProducts({
    collection,
    reverse,
    sortKey,
  });

  return products.filter(
    (product) => !product.tags.includes(HIDDEN_PRODUCT_TAG),
  );
}

export async function getCollections(): Promise<Collection[]> {
  "use cache";
  cacheTag(TAGS.collections);
  cacheLife("days");

  return dbQueries.getCollections();
}

export async function getCollectionsWithProducts(): Promise<
  Array<{ collection: Collection; products: Product[] }>
> {
  "use cache";
  cacheTag(TAGS.collections, TAGS.products);
  cacheLife("days");

  return dbQueries.getCollectionsWithProducts();
}

// Product operations
export async function getProduct(handle: string): Promise<Product | undefined> {
  "use cache";
  cacheTag(TAGS.products);
  cacheLife("days");

  const product = await dbQueries.getProduct(handle);

  // Filter out hidden products
  if (product && product.tags.includes(HIDDEN_PRODUCT_TAG)) {
    return undefined;
  }

  return product;
}

export async function getProductRecommendations(
  productId: string,
): Promise<Product[]> {
  "use cache";
  cacheTag(TAGS.products);
  cacheLife("days");

  const products = await dbQueries.getProductRecommendations(productId);

  return products.filter(
    (product) => !product.tags.includes(HIDDEN_PRODUCT_TAG),
  );
}

export async function getProductReviewAggregate(
  productId: string,
): Promise<{ averageRating: number | null; reviewCount: number }> {
  "use cache";
  cacheTag(TAGS.products);
  cacheLife("hours");

  return dbQueries.getProductReviewAggregate(productId);
}

export async function getProducts({
  query,
  reverse,
  sortKey,
  limit,
  offset,
  availableOnly,
}: {
  query?: string;
  reverse?: boolean;
  sortKey?: string;
  limit?: number;
  offset?: number;
  availableOnly?: boolean;
}): Promise<Product[]> {
  "use cache";
  cacheTag(TAGS.products);
  cacheLife("days");

  const products = await dbQueries.getProducts({
    query,
    reverse,
    sortKey,
    limit,
    offset,
    availableOnly,
  });

  // Filter out hidden products
  return products.filter(
    (product) => !product.tags.includes(HIDDEN_PRODUCT_TAG),
  );
}

export async function getProductsCount({
  query,
  availableOnly,
}: {
  query?: string;
  availableOnly?: boolean;
} = {}): Promise<number> {
  "use cache";
  cacheTag(TAGS.products);
  cacheLife("hours");

  return dbQueries.getProductsCount({ query, availableOnly });
}

// Menu operations
export async function getMenu(handle: string): Promise<Menu[]> {
  "use cache";
  cacheTag(TAGS.collections);
  cacheLife("days");

  return dbQueries.getMenu(handle);
}

// Page operations
export async function getPage(handle: string): Promise<Page> {
  return dbQueries.getPage(handle);
}

export async function getPages(): Promise<Page[]> {
  return dbQueries.getPages();
}

// Revalidation webhook handler (for potential future use with admin dashboard)
export async function revalidate(req: NextRequest): Promise<NextResponse> {
  const collectionWebhooks = [
    "collections/create",
    "collections/delete",
    "collections/update",
  ];
  const productWebhooks = [
    "products/create",
    "products/delete",
    "products/update",
  ];
  const topic = req.headers.get("x-webhook-topic") || "unknown";
  const secret = req.nextUrl.searchParams.get("secret");
  const isCollectionUpdate = collectionWebhooks.includes(topic);
  const isProductUpdate = productWebhooks.includes(topic);

  if (!secret || secret !== process.env.REVALIDATION_SECRET) {
    console.error("Invalid revalidation secret.");
    return NextResponse.json({ status: 401 });
  }

  if (!isCollectionUpdate && !isProductUpdate) {
    return NextResponse.json({ status: 200 });
  }

  if (isCollectionUpdate) {
    revalidateTag(TAGS.collections, "seconds");
  }

  if (isProductUpdate) {
    revalidateTag(TAGS.products, "seconds");
  }

  return NextResponse.json({ status: 200, revalidated: true, now: Date.now() });
}
