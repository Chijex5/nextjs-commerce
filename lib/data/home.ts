import { getCollectionsWithProducts, getProducts } from "lib/database";
import type { Collection, Product } from "lib/shopify/types";
import { mockHomeData } from "./mock/home";
import { toCardProduct, type CardProduct } from "./types";
import { isMockData } from "./source";

/** Products on the home page use the shared card shape. */
export type HomeProduct = CardProduct;

export type HomeCollection = {
  handle: string;
  title: string;
  path: string;
  productCount: number;
  image?: { url: string; alt: string };
};

export type HomeData = {
  newArrivals: HomeProduct[];
  bestSellers: HomeProduct[];
  collections: HomeCollection[];
};

function toHomeCollection(entry: {
  collection: Collection;
  products: Product[];
}): HomeCollection {
  const cover = entry.products.find((p) => p.featuredImage?.url);
  return {
    handle: entry.collection.handle,
    title: entry.collection.title,
    path: entry.collection.path,
    productCount: entry.products.length,
    image: cover
      ? {
          url: cover.featuredImage.url,
          alt: cover.featuredImage.altText || entry.collection.title,
        }
      : undefined,
  };
}

export async function getHomeData(): Promise<HomeData> {
  if (isMockData) return mockHomeData;

  const [latest, bestSelling, collections] = await Promise.all([
    getProducts({ sortKey: "CREATED_AT", reverse: true }),
    getProducts({ sortKey: "BEST_SELLING", reverse: false }),
    getCollectionsWithProducts(),
  ]);

  return {
    newArrivals: latest.slice(0, 10).map(toCardProduct),
    bestSellers: bestSelling.slice(0, 5).map(toCardProduct),
    collections: collections
      .filter((entry) => entry.products.length > 0)
      .slice(0, 4)
      .map(toHomeCollection),
  };
}
