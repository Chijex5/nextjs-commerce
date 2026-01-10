import { HIDDEN_PRODUCT_TAG, TAGS } from "lib/constants";
import {
  unstable_cacheLife as cacheLife,
  unstable_cacheTag as cacheTag,
  revalidateTag,
} from "next/cache";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import {
  createDbCart,
  getDbCart,
  addToDbCart,
  removeFromDbCart,
  updateDbCart,
  getDbProduct,
  getDbProducts,
  getDbProductRecommendations,
  getDbCollection,
  getDbCollections,
  getDbCollectionProducts,
  getDbMenu,
  getDbPage,
  getDbPages,
} from "../db";
import { Cart, Collection, Menu, Page, Product } from "./types";

export async function createCart(): Promise<Cart> {
  return await createDbCart();
}

export async function addToCart(
  lines: { merchandiseId: string; quantity: number }[]
): Promise<Cart> {
  const cartId = (await cookies()).get("cartId")?.value!;
  return await addToDbCart(cartId, lines);
}

export async function removeFromCart(lineIds: string[]): Promise<Cart> {
  const cartId = (await cookies()).get("cartId")?.value!;
  return await removeFromDbCart(cartId, lineIds);
}

export async function updateCart(
  lines: { id: string; merchandiseId: string; quantity: number }[]
): Promise<Cart> {
  const cartId = (await cookies()).get("cartId")?.value!;
  return await updateDbCart(cartId, lines);
}

export async function getCart(): Promise<Cart | undefined> {
  "use cache: private";
  cacheTag(TAGS.cart);
  cacheLife("seconds");

  const cartId = (await cookies()).get("cartId")?.value;

  if (!cartId) {
    return undefined;
  }

  const cart = await getDbCart(cartId);
  
  return cart || undefined;
}

export async function getCollection(
  handle: string
): Promise<Collection | undefined> {
  "use cache";
  cacheTag(TAGS.collections);
  cacheLife("days");

  return await getDbCollection(handle) || undefined;
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

  return await getDbCollectionProducts({
    handle: collection,
    reverse,
    sortKey,
  });
}

export async function getCollections(): Promise<Collection[]> {
  "use cache";
  cacheTag(TAGS.collections);
  cacheLife("days");

  const collections = await getDbCollections();
  
  const allCollection: Collection = {
    handle: "",
    title: "All",
    description: "All products",
    seo: {
      title: "All",
      description: "All products",
    },
    path: "/search",
    updatedAt: new Date().toISOString(),
  };
  
  // Filter out collections that start with "hidden"
  const visibleCollections = collections.filter(
    (collection) => !collection.handle.startsWith("hidden")
  );

  return [allCollection, ...visibleCollections];
}

export async function getMenu(handle: string): Promise<Menu[]> {
  "use cache";
  cacheTag(TAGS.collections);
  cacheLife("days");

  return await getDbMenu(handle);
}

export async function getPage(handle: string): Promise<Page> {
  const page = await getDbPage(handle);
  
  if (!page) {
    throw new Error(`Page with handle "${handle}" not found`);
  }
  
  return page;
}

export async function getPages(): Promise<Page[]> {
  return await getDbPages();
}

export async function getProduct(handle: string): Promise<Product | undefined> {
  "use cache";
  cacheTag(TAGS.products);
  cacheLife("days");

  const product = await getDbProduct(handle);
  
  // Filter out hidden products
  if (product && product.tags.includes(HIDDEN_PRODUCT_TAG)) {
    return undefined;
  }
  
  return product || undefined;
}

export async function getProductRecommendations(
  productId: string
): Promise<Product[]> {
  "use cache";
  cacheTag(TAGS.products);
  cacheLife("days");

  return await getDbProductRecommendations(productId);
}

export async function getProducts({
  query,
  reverse,
  sortKey,
}: {
  query?: string;
  reverse?: boolean;
  sortKey?: string;
}): Promise<Product[]> {
  "use cache";
  cacheTag(TAGS.products);
  cacheLife("days");

  const products = await getDbProducts({
    query,
    reverse,
    sortKey,
  });
  
  // Filter out hidden products
  return products.filter((product) => !product.tags.includes(HIDDEN_PRODUCT_TAG));
}

// This is called from `app/api/revalidate.ts` so providers can control revalidation logic.
export async function revalidate(req: NextRequest): Promise<NextResponse> {
  // We always need to respond with a 200 status code,
  // otherwise it will continue to retry the request.
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
    // We don't need to revalidate anything for any other topics.
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
