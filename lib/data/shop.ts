import { defaultSort, sorting } from "lib/constants";
import {
  getCollection,
  getCollectionProducts,
  getCollections,
  getProducts,
} from "lib/database";
import { MOCK_COLLECTIONS, MOCK_PRODUCTS } from "./mock/catalogue";
import { isMockData } from "./source";
import { toCardProduct, type CardProduct, type ShopCollection } from "./types";

export const SHOP_PAGE_SIZE = 24;

export type ShopQuery = {
  q?: string;
  sort?: string | null;
  collection?: string;
  offset?: number;
  limit?: number;
};

export type ShopPage = { products: CardProduct[]; hasMore: boolean };

export function resolveSort(slug?: string | null) {
  return sorting.find((s) => s.slug === slug) || defaultSort;
}

/** One page of products for the shop, search and collection views. */
export async function getShopPage({
  q,
  sort,
  collection,
  offset = 0,
  limit = SHOP_PAGE_SIZE,
}: ShopQuery): Promise<ShopPage> {
  const { sortKey, reverse } = resolveSort(sort);
  const query = q?.trim() || undefined;

  if (isMockData) {
    let list = MOCK_PRODUCTS.filter(
      (p) =>
        (!collection || p.collections.includes(collection)) &&
        (!query || p.title.toLowerCase().includes(query.toLowerCase())),
    );
    if (sortKey === "PRICE") {
      list = [...list].sort(
        (a, b) => Number(a.price.amount) - Number(b.price.amount),
      );
    } else if (sortKey === "CREATED_AT") {
      list = [...list].sort((a, b) => a.createdAt - b.createdAt);
    }
    if (reverse) list.reverse();
    const products = list.slice(offset, offset + limit);
    return { products, hasMore: offset + limit < list.length };
  }

  const products = collection
    ? await getCollectionProducts({
        collection,
        sortKey,
        reverse,
        offset,
        limit,
      })
    : await getProducts({ query, sortKey, reverse, offset, limit });

  return {
    products: products.map(toCardProduct),
    hasMore: products.length === limit,
  };
}

export async function getShopCollections(): Promise<ShopCollection[]> {
  if (isMockData) return MOCK_COLLECTIONS;
  const collections = await getCollections();
  return collections
    .filter((c) => c.handle && !c.handle.startsWith("hidden-"))
    .map((c) => ({
      handle: c.handle,
      title: c.title,
      path: c.path,
      description: c.description,
    }));
}

export async function getShopCollection(
  handle: string,
): Promise<ShopCollection | undefined> {
  if (isMockData) return MOCK_COLLECTIONS.find((c) => c.handle === handle);
  const c = await getCollection(handle);
  return c
    ? {
        handle: c.handle,
        title: c.title,
        path: c.path,
        description: c.description,
        seo: c.seo,
      }
    : undefined;
}
