import { getCollectionsWithProducts, getProducts } from "lib/database";
import type { Collection, Product } from "lib/shopify/types";
import { mockHomeData } from "./mock/home";
import { isMockData } from "./source";

/**
 * View models for the home page. The page renders these lean shapes rather
 * than the full Product type, so the upcoming backend only has to fill them.
 */
export type HomeProduct = {
  id: string;
  handle: string;
  title: string;
  price: { amount: string; currencyCode: string };
  image?: { url: string; alt: string };
  available: boolean;
};

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

function toHomeProduct(product: Product): HomeProduct {
  const image = product.featuredImage?.url
    ? {
        url: product.featuredImage.url,
        alt: product.featuredImage.altText || product.title,
      }
    : undefined;

  return {
    id: product.id,
    handle: product.handle,
    title: product.title,
    price: product.priceRange.minVariantPrice,
    image,
    available: product.availableForSale,
  };
}

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
    newArrivals: latest.slice(0, 10).map(toHomeProduct),
    bestSellers: bestSelling.slice(0, 5).map(toHomeProduct),
    collections: collections
      .filter((entry) => entry.products.length > 0)
      .slice(0, 4)
      .map(toHomeCollection),
  };
}
