import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import { PRODUCT_IMAGE_HEIGHT, PRODUCT_IMAGE_WIDTH } from "../image-constants";
import type {
  Collection,
  Image,
  Menu,
  Page,
  Product,
  ProductOption,
  ProductVariant,
} from "../shopify/types";
import { db } from "./drizzle";
import {
  collections,
  menuItems,
  menus,
  pages,
  productCollections,
  productImages,
  productOptions,
  products,
  productVariants,
  reviews,
} from "./schema";

// Helper function to reshape database product to match Shopify Product type
export async function reshapeDbProduct(
  dbProduct: any,
  includeRelations: boolean = true,
): Promise<Product | undefined> {
  if (!dbProduct) return undefined;

  let variants: ProductVariant[] = [];
  let images: Image[] = [];
  let options: ProductOption[] = [];
  let featuredImage: Image | undefined;

  if (includeRelations) {
    const dbVariants = await db
      .select()
      .from(productVariants)
      .where(eq(productVariants.productId, dbProduct.id));

    variants = dbVariants.map((v) => ({
      id: v.id,
      title: v.title,
      availableForSale: v.availableForSale,
      selectedOptions: v.selectedOptions as { name: string; value: string }[],
      price: {
        amount: v.price.toString(),
        currencyCode: v.currencyCode,
      },
    }));

    const dbImages = await db
      .select()
      .from(productImages)
      .where(eq(productImages.productId, dbProduct.id))
      .orderBy(asc(productImages.position));

    images = dbImages.map((img) => ({
      url: img.url,
      altText: img.altText || "",
      width: img.width || PRODUCT_IMAGE_WIDTH,
      height: img.height || PRODUCT_IMAGE_HEIGHT,
    }));

    featuredImage =
      images.find((_, idx) => dbImages[idx]?.isFeatured) || images[0];

    const dbOptions = await db
      .select()
      .from(productOptions)
      .where(eq(productOptions.productId, dbProduct.id));

    options = dbOptions.map((opt) => ({
      id: opt.id,
      name: opt.name,
      values: opt.values,
    }));
  }

  const prices = variants.map((v) => parseFloat(v.price.amount));
  const minPrice = prices.length ? Math.min(...prices) : 0;
  const maxPrice = prices.length ? Math.max(...prices) : 0;

  return {
    id: dbProduct.id,
    handle: dbProduct.handle,
    availableForSale: dbProduct.availableForSale,
    title: dbProduct.title,
    description: dbProduct.description || "",
    descriptionHtml: dbProduct.descriptionHtml || "",
    options,
    priceRange: {
      maxVariantPrice: {
        amount: maxPrice.toString(),
        currencyCode: "NGN",
      },
      minVariantPrice: {
        amount: minPrice.toString(),
        currencyCode: "NGN",
      },
    },
    variants,
    featuredImage: featuredImage || {
      url: "",
      altText: "",
      width: PRODUCT_IMAGE_WIDTH,
      height: PRODUCT_IMAGE_HEIGHT,
    },
    images,
    seo: {
      title: dbProduct.seoTitle || dbProduct.title,
      description: dbProduct.seoDescription || dbProduct.description || "",
    },
    tags: dbProduct.tags || [],
    updatedAt: dbProduct.updatedAt.toISOString(),
  };
}

// Product queries
export async function getProduct(handle: string): Promise<Product | undefined> {
  const [dbProduct] = await db
    .select()
    .from(products)
    .where(eq(products.handle, handle))
    .limit(1);

  return reshapeDbProduct(dbProduct);
}

export async function getProducts({
  query: _query,
  reverse,
  sortKey,
}: {
  query?: string;
  reverse?: boolean;
  sortKey?: string;
}): Promise<Product[]> {
  let queryBuilder = db.select().from(products).$dynamic();

  if (sortKey === "CREATED_AT" || sortKey === "CREATED") {
    queryBuilder = reverse
      ? queryBuilder.orderBy(desc(products.createdAt))
      : queryBuilder.orderBy(asc(products.createdAt));
  } else if (sortKey === "PRICE") {
    queryBuilder = reverse
      ? queryBuilder.orderBy(desc(products.title))
      : queryBuilder.orderBy(asc(products.title));
  } else {
    queryBuilder = queryBuilder.orderBy(desc(products.createdAt));
  }

153
 
        ? await (
  const dbProducts = await queryBuilder.limit(100);

  const productsWithDetails = await Promise.all(
    dbProducts.map((p) => reshapeDbProduct(p)),
  );

  return productsWithDetails.filter((p): p is Product => p !== undefined);
}

export async function getProductRecommendations(
  productId: string,
): Promise<Product[]> {
  const productCols = await db
    .select({ collectionId: productCollections.collectionId })
    .from(productCollections)
    .where(eq(productCollections.productId, productId));

  if (productCols.length === 0) {
    const dbProducts = await db
      .select()
      .from(products)
      .where(sql`${products.id} != ${productId}`)
      .limit(4);
    const productsWithDetails = await Promise.all(
      dbProducts.map((p) => reshapeDbProduct(p)),
    );
    return productsWithDetails.filter((p): p is Product => p !== undefined);
  }

  const collectionIds = productCols.map((pc) => pc.collectionId);
  const relatedProductIds = await db
    .select({ productId: productCollections.productId })
    .from(productCollections)
    .where(
      and(
        inArray(productCollections.collectionId, collectionIds),
        sql`${productCollections.productId} != ${productId}`,
      ),
    )
    .limit(4);

  const productIds = relatedProductIds.map((rp) => rp.productId);

  if (productIds.length === 0) {
    return [];
  }

  const dbProducts = await db
    .select()
    .from(products)
    .where(inArray(products.id, productIds));

  const productsWithDetails = await Promise.all(
    dbProducts.map((p) => reshapeDbProduct(p)),
  );

  return productsWithDetails.filter((p): p is Product => p !== undefined);
}

export async function getProductReviewAggregate(productId: string): Promise<{
  averageRating: number | null;
  reviewCount: number;
}> {
  const [stats] = await db
    .select({
      averageRating: sql<number | null>`avg(${reviews.rating})`,
      reviewCount: sql<number>`count(${reviews.rating})`,
    })
    .from(reviews)
    .where(
      and(eq(reviews.productId, productId), eq(reviews.status, "approved")),
    );

  return {
    averageRating:
      stats?.averageRating === null || stats?.averageRating === undefined
        ? null
        : Number(stats.averageRating),
    reviewCount: Number(stats?.reviewCount ?? 0),
  };
}

// Collection queries
export async function getCollection(
  handle: string,
): Promise<Collection | undefined> {
  const [dbCollection] = await db
    .select()
    .from(collections)
    .where(eq(collections.handle, handle))
    .limit(1);

  if (!dbCollection) return undefined;

  return {
    handle: dbCollection.handle,
    title: dbCollection.title,
    description: dbCollection.description || "",
    seo: {
      title: dbCollection.seoTitle || dbCollection.title,
      description:
        dbCollection.seoDescription || dbCollection.description || "",
    },
    updatedAt: dbCollection.updatedAt.toISOString(),
    path: `/search/${dbCollection.handle}`,
  };
}

export async function getCollections(): Promise<Collection[]> {
  const dbCollections = await db.select().from(collections);

  return [
    {
      handle: "",
      title: "All",
      description: "All products",
      seo: {
        title: "All",
        description: "All products",
      },
      path: "/search",
      updatedAt: new Date().toISOString(),
    },
    ...dbCollections.map((c) => ({
      handle: c.handle,
      title: c.title,
      description: c.description || "",
      seo: {
        title: c.seoTitle || c.title,
        description: c.seoDescription || c.description || "",
      },
      updatedAt: c.updatedAt.toISOString(),
      path: `/search/${c.handle}`,
    })),
  ];
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
  if (!collection) {
    return getProducts({ reverse, sortKey });
  }

  const [dbCollection] = await db
    .select()
    .from(collections)
    .where(eq(collections.handle, collection))
    .limit(1);

  if (!dbCollection) {
    return [];
  }

  const productIds = await db
    .select({ productId: productCollections.productId })
    .from(productCollections)
    .where(eq(productCollections.collectionId, dbCollection.id));

  if (productIds.length === 0) {
    return [];
  }

  const dbProducts = await db
    .select()
    .from(products)
    .where(
      inArray(
        products.id,
        productIds.map((p) => p.productId),
      ),
    );

  const productsWithDetails = await Promise.all(
    dbProducts.map((p) => reshapeDbProduct(p)),
  );

  return productsWithDetails.filter((p): p is Product => p !== undefined);
}

export async function getCollectionsWithProducts(): Promise<
  Array<{ collection: Collection; products: Product[] }>
> {
  const dbCollections = await db
    .select()
    .from(collections)
    .where(
      and(
        sql`${collections.handle} not like ${"hidden-%"}`,
        sql`${collections.handle} != ${"all"}`,
      ),
    )
    .orderBy(asc(collections.createdAt));

  const collectionsWithProducts = await Promise.all(
    dbCollections.map(async (dbCollection) => {
      const productRows = await db
        .select({ product: products })
        .from(productCollections)
        .innerJoin(products, eq(productCollections.productId, products.id))
        .where(eq(productCollections.collectionId, dbCollection.id))
        .orderBy(asc(productCollections.position))
        .limit(8);

      const productsWithDetails = await Promise.all(
        productRows.map((row) => reshapeDbProduct(row.product)),
      );

      return {
        collection: {
          handle: dbCollection.handle,
          title: dbCollection.title,
          description: dbCollection.description || "",
          seo: {
            title: dbCollection.seoTitle || dbCollection.title,
            description:
              dbCollection.seoDescription || dbCollection.description || "",
          },
          updatedAt: dbCollection.updatedAt.toISOString(),
          path: `/search/${dbCollection.handle}`,
        },
        products: productsWithDetails.filter(
          (p): p is Product => p !== undefined,
        ),
      };
    }),
  );

  return collectionsWithProducts.filter((c) => c.products.length > 0);
}

// Page queries
export async function getPage(handle: string): Promise<Page | undefined> {
  const [dbPage] = await db
    .select()
    .from(pages)
    .where(eq(pages.handle, handle))
    .limit(1);

  if (!dbPage) {
    return undefined;
  }

  return {
    id: dbPage.id,
    title: dbPage.title,
    handle: dbPage.handle,
    body: dbPage.body || "",
    bodySummary: dbPage.bodySummary || "",
    seo: {
      title: dbPage.seoTitle || dbPage.title,
      description: dbPage.seoDescription || "",
    },
    createdAt: dbPage.createdAt.toISOString(),
    updatedAt: dbPage.updatedAt.toISOString(),
  };
}

export async function getPages(): Promise<Page[]> {
  const dbPages = await db.select().from(pages);

  return dbPages.map((p) => ({
    id: p.id,
    title: p.title,
    handle: p.handle,
    body: p.body || "",
    bodySummary: p.bodySummary || "",
    seo: {
      title: p.seoTitle || p.title,
      description: p.seoDescription || "",
    },
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  }));
}

// Menu queries
export async function getMenu(handle: string): Promise<Menu[]> {
  const [dbMenu] = await db
    .select()
    .from(menus)
    .where(eq(menus.handle, handle))
    .limit(1);

  if (!dbMenu) return [];

  const dbMenuItems = await db
    .select()
    .from(menuItems)
    .where(eq(menuItems.menuId, dbMenu.id))
    .orderBy(asc(menuItems.position));

  return dbMenuItems.map((item) => ({
    title: item.title,
    path: item.url,
  }));
}
