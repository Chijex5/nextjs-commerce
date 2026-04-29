import { randomUUID } from "crypto";
import { asc, desc, eq } from "drizzle-orm";
import { HIDDEN_PRODUCT_TAG, TAGS } from "lib/constants";
import {
    unstable_cacheLife as cacheLife,
    unstable_cacheTag as cacheTag,
    revalidateTag,
} from "next/cache";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { db } from "../db/client";
import * as dbQueries from "../db/queries";
import { customOrders, sizeGuides } from "../db/schema";
import type { Cart, Collection, Menu, Page, Product } from "../shopify/types";

const CART_SESSION_COOKIE = "cartSessionId";
const CART_COOKIE_OPTIONS = {
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

function getOrCreateCartSessionId(cookieStore: Awaited<ReturnType<typeof cookies>>) {
  let sessionId = cookieStore.get(CART_SESSION_COOKIE)?.value;

  if (!sessionId) {
    sessionId = randomUUID();
    cookieStore.set(CART_SESSION_COOKIE, sessionId, {
      ...CART_COOKIE_OPTIONS,
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 30,
    });
  }

  return sessionId;
}

async function resolveCartForSession(
  cookieStore: Awaited<ReturnType<typeof cookies>>,
): Promise<Cart> {
  const sessionId = getOrCreateCartSessionId(cookieStore);
  const cookieCartId = cookieStore.get("cartId")?.value;

  if (cookieCartId) {
    const cookieCart = await dbQueries.getCart(cookieCartId);
    if (cookieCart) {
      return cookieCart;
    }
  }

  let sessionCart = await dbQueries.getCartBySessionId(sessionId);
  if (!sessionCart) {
    sessionCart = await dbQueries.createCart(sessionId);
  }

  cookieStore.set("cartId", sessionCart.id!, {
    ...CART_COOKIE_OPTIONS,
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 30,
  });

  return sessionCart;
}

// Re-export types from shopify for compatibility
export type {
    Cart, CartItem,
    CartProduct, Collection, Image, Menu, Money, Page,
    Product,
    ProductOption,
    ProductVariant, SEO
} from "../shopify/types";

// Cart operations
export async function createCart(): Promise<Cart> {
  const cookieStore = await cookies();
  return resolveCartForSession(cookieStore);
}

export async function addToCart(
  lines: { merchandiseId: string; quantity: number }[],
): Promise<Cart> {
  const cookieStore = await cookies();
  const cart = await resolveCartForSession(cookieStore);
  const cartId = cart.id;
  if (!cartId) {
    throw new Error("Resolved cart is missing id");
  }
  return dbQueries.addToCart(cartId, lines);
}

export async function removeFromCart(lineIds: string[]): Promise<Cart> {
  const cookieStore = await cookies();
  const cart = await resolveCartForSession(cookieStore);
  const cartId = cart.id;
  if (!cartId) {
    throw new Error("Resolved cart is missing id");
  }
  return dbQueries.removeFromCart(cartId, lineIds);
}

export async function updateCart(
  lines: { id: string; merchandiseId: string; quantity: number }[],
): Promise<Cart> {
  const cookieStore = await cookies();
  const cart = await resolveCartForSession(cookieStore);
  const cartId = cart.id;
  if (!cartId) {
    throw new Error("Resolved cart is missing id");
  }
  return dbQueries.updateCart(cartId, lines);
}

export async function getCart(): Promise<Cart | undefined> {
  const cookieStore = await cookies();
  const cartId = cookieStore.get("cartId")?.value;

  if (cartId) {
    const cart = await dbQueries.getCart(cartId);
    if (cart) {
      return cart;
    }
  }

  const sessionId = cookieStore.get(CART_SESSION_COOKIE)?.value;
  if (!sessionId) {
    return undefined;
  }

  const sessionCart = await dbQueries.getCartBySessionId(sessionId);
  if (sessionCart) {
    cookieStore.set("cartId", sessionCart.id!, {
      ...CART_COOKIE_OPTIONS,
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 30,
    });
  }

  return sessionCart;
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
  limit,
  offset,
}: {
  collection: string;
  reverse?: boolean;
  sortKey?: string;
  limit?: number;
  offset?: number;
}): Promise<Product[]> {
  "use cache";
  cacheTag(TAGS.collections, TAGS.products);
  cacheLife("days");

  const products = await dbQueries.getCollectionProducts({
    collection,
    reverse,
    sortKey,
    limit,
    offset,
  });

  return products.filter(
    (product) =>
      product.availableForSale &&
      !product.tags.includes(HIDDEN_PRODUCT_TAG),
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

  const collectionsWithProducts = await dbQueries.getCollectionsWithProducts();

  return collectionsWithProducts
    .map((entry) => ({
      ...entry,
      products: entry.products.filter(
        (product) =>
          product.availableForSale &&
          !product.tags.includes(HIDDEN_PRODUCT_TAG),
      ),
    }))
    .filter((entry) => entry.products.length > 0);
}

// Product operations
export async function getProduct(handle: string): Promise<Product | undefined> {
  "use cache";
  cacheTag(TAGS.products);
  cacheLife("days");

  const product = await dbQueries.getProduct(handle);

  // Filter out hidden products
  if (
    product &&
    (!product.availableForSale || product.tags.includes(HIDDEN_PRODUCT_TAG))
  ) {
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
    (product) =>
      product.availableForSale &&
      !product.tags.includes(HIDDEN_PRODUCT_TAG),
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
}: {
  query?: string;
  reverse?: boolean;
  sortKey?: string;
  limit?: number;
  offset?: number;
}): Promise<Product[]> {
  "use cache";
  cacheTag(TAGS.products, TAGS.collections);

  if (query?.trim()) {
    cacheLife("hours");
  } else {
    cacheLife("days");
  }

  const products = await dbQueries.getProducts({
    query,
    reverse,
    sortKey,
    limit,
    offset,
    onlyAvailableForSale: true,
  });

  // Filter out hidden products
  return products.filter(
    (product) =>
      product.availableForSale &&
      !product.tags.includes(HIDDEN_PRODUCT_TAG),
  );
}

// Menu operations
export async function getMenu(handle: string): Promise<Menu[]> {
  "use cache";
  cacheTag(TAGS.collections);
  cacheLife("days");

  return dbQueries.getMenu(handle);
}

// Page operations
export async function getPage(handle: string): Promise<Page | undefined> {
  "use cache";
  cacheTag(TAGS.pages);
  cacheLife("days");

  return dbQueries.getPage(handle);
}

/**
 * Call this after any page create/update/delete mutation.
 * Example: admin page routes should invoke this once mutation succeeds.
 */
export function revalidatePages(): void {
  revalidateTag(TAGS.pages, "seconds");
}

export async function getPages(): Promise<Page[]> {
  "use cache";
  cacheTag(TAGS.pages);
  cacheLife("days");

  return dbQueries.getPages();
}

export type PublishedCustomOrder = typeof customOrders.$inferSelect;

export async function getPublishedCustomOrders(
  limit: number = 3,
): Promise<PublishedCustomOrder[]> {
  "use cache";
  cacheTag(TAGS.customOrders);
  cacheLife("hours");

  return db
    .select()
    .from(customOrders)
    .where(eq(customOrders.isPublished, true))
    .orderBy(asc(customOrders.position), desc(customOrders.updatedAt))
    .limit(limit);
}

export type PublishedSizeGuide = typeof sizeGuides.$inferSelect;

export async function getPublishedSizeGuides(
  limit: number = 6,
): Promise<PublishedSizeGuide[]> {
  "use cache";
  cacheTag(TAGS.sizeGuides);
  cacheLife("hours");

  return db
    .select()
    .from(sizeGuides)
    .where(eq(sizeGuides.isActive, true))
    .orderBy(asc(sizeGuides.productType), asc(sizeGuides.title))
    .limit(limit);
}

export function revalidateCustomOrders(): void {
  revalidateTag(TAGS.customOrders, "seconds");
}

export function revalidateSizeGuides(): void {
  revalidateTag(TAGS.sizeGuides, "seconds");
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
  const pageWebhooks = ["pages/create", "pages/delete", "pages/update"];
  const topic = req.headers.get("x-webhook-topic") || "unknown";
  const secret = req.nextUrl.searchParams.get("secret");
  const isCollectionUpdate = collectionWebhooks.includes(topic);
  const isProductUpdate = productWebhooks.includes(topic);
  const isPageUpdate = pageWebhooks.includes(topic);

  if (!secret || secret !== process.env.REVALIDATION_SECRET) {
    console.error("Invalid revalidation secret.");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isCollectionUpdate && !isProductUpdate && !isPageUpdate) {
    return NextResponse.json({ status: 200 });
  }

  if (isCollectionUpdate) {
    revalidateTag(TAGS.collections, "seconds");
  }

  if (isProductUpdate) {
    revalidateTag(TAGS.products, "seconds");
  }

  if (isPageUpdate) {
    revalidateTag(TAGS.pages, "seconds");
  }

  return NextResponse.json({ status: 200, revalidated: true, now: Date.now() });
}
