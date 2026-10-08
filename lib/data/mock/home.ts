import type { HomeData } from "../home";
import { MOCK_COLLECTIONS, MOCK_PRODUCTS } from "./catalogue";

const byNewest = [...MOCK_PRODUCTS].reverse();

export const mockHomeData: HomeData = {
  newArrivals: byNewest.slice(0, 10),
  bestSellers: [2, 0, 4, 7, 1].map((i) => MOCK_PRODUCTS[i]!),
  collections: MOCK_COLLECTIONS.map((c) => ({
    ...c,
    productCount: MOCK_PRODUCTS.filter((p) => p.collections.includes(c.handle))
      .length,
  })),
};
