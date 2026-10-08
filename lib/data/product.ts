import {
  getProduct,
  getProductRecommendations,
  getProductReviewAggregate,
} from "lib/database";
import type { Product } from "lib/shopify/types";
import { LOOKS } from "./editorial";
import { MOCK_PRODUCTS } from "./mock/catalogue";
import { isMockData } from "./source";
import { toCardProduct, type CardProduct } from "./types";

export type ReviewAggregate = {
  averageRating: number | null;
  reviewCount: number;
};

const MOCK_SIZES = ["38", "39", "40", "41", "42", "43", "44", "45"];

/** Builds a full Product from a mock catalogue entry (sizes 38–45). */
function mockProduct(handle: string): Product | undefined {
  const base = MOCK_PRODUCTS.find((p) => p.handle === handle);
  if (!base) return undefined;
  const money = base.price;
  const gallery = [base.image!.url, ...LOOKS.slice(0, 2).map((l) => l.src)].map(
    (url, i) => ({
      url,
      altText: i === 0 ? base.title : `${base.title} — worn`,
      width: 1600,
      height: 2000,
    }),
  );

  return {
    id: base.id,
    handle: base.handle,
    availableForSale: base.available,
    title: base.title,
    description: `${base.title}, cut, stitched and finished by hand in Lagos.`,
    descriptionHtml: `<p>${base.title}, cut, stitched and finished by hand in Lagos. Real leather upper on a cushioned sole, made to be worn every day.</p>`,
    options: [{ id: "size", name: "Size", values: MOCK_SIZES }],
    priceRange: { minVariantPrice: money, maxVariantPrice: money },
    variants: MOCK_SIZES.map((size, i) => ({
      id: `${base.id}-${size}`,
      title: size,
      // A couple of sizes sold out so the UI shows that state.
      availableForSale: base.available && i !== 0 && i !== 6,
      selectedOptions: [{ name: "Size", value: size }],
      price: money,
    })),
    featuredImage: gallery[0]!,
    images: gallery,
    seo: { title: base.title, description: base.title },
    tags: [],
    updatedAt: new Date(0).toISOString(),
  };
}

export async function getProductView(
  handle: string,
): Promise<Product | undefined> {
  if (isMockData) return mockProduct(handle);
  return getProduct(handle);
}

export async function getProductReviews(id: string): Promise<ReviewAggregate> {
  if (isMockData) return { averageRating: null, reviewCount: 0 };
  return getProductReviewAggregate(id);
}

export async function getRelatedProducts(
  product: Product,
): Promise<CardProduct[]> {
  if (isMockData) {
    return MOCK_PRODUCTS.filter((p) => p.id !== product.id).slice(0, 8);
  }
  const related = await getProductRecommendations(product.id);
  return related.map(toCardProduct);
}
