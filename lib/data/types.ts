import type { Product } from "lib/shopify/types";

/** Lean product shape every product tile renders (home, shop, search). */
export type CardProduct = {
  id: string;
  handle: string;
  title: string;
  price: { amount: string; currencyCode: string };
  image?: { url: string; alt: string };
  available: boolean;
};

export type ShopCollection = {
  handle: string;
  title: string;
  path: string;
  description?: string;
  seo?: { title?: string; description?: string };
};

export function toCardProduct(product: Product): CardProduct {
  return {
    id: product.id,
    handle: product.handle,
    title: product.title,
    price: product.priceRange.minVariantPrice,
    image: product.featuredImage?.url
      ? {
          url: product.featuredImage.url,
          alt: product.featuredImage.altText || product.title,
        }
      : undefined,
    available: product.availableForSale,
  };
}
