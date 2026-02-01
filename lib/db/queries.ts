import type {
  Product,
  Collection,
  Cart,
  Page,
  Menu,
  Image,
  ProductVariant,
  ProductOption,
} from "../shopify/types";
import { db } from "./client";
import {
  carts,
  cartLines,
  collections,
  menus,
  menuItems,
  pages,
  productCollections,
  productImages,
  productOptions,
  productVariants,
  products,
  reviews,
} from "./schema";
import {
  and,
  asc,
  desc,
  eq,
  inArray,
  sql,
  ilike,
} from "drizzle-orm";
import { PRODUCT_IMAGE_HEIGHT, PRODUCT_IMAGE_WIDTH } from "../image-constants";

// Helper function to reshape database product to match Shopify Product type
export async function reshapeDbProduct(
  dbProduct: typeof products.$inferSelect | undefined,
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

    variants = dbVariants.map((variant) => ({
      id: variant.id,
      title: variant.title,
      availableForSale: variant.availableForSale,
      selectedOptions: variant.selectedOptions as { name: string; value: string }[],
      price: {
        amount: String(variant.price),
        currencyCode: variant.currencyCode,
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

  const prices = variants.map((variant) => Number(variant.price.amount));
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

async function reshapeDbCart(
  dbCart: typeof carts.$inferSelect | undefined,
): Promise<Cart | undefined> {
  if (!dbCart) return undefined;

  const dbLines = await db
    .select({
      line: cartLines,
      variant: productVariants,
      product: products,
      image: productImages,
    })
    .from(cartLines)
    .innerJoin(
      productVariants,
      eq(cartLines.productVariantId, productVariants.id),
    )
    .innerJoin(products, eq(productVariants.productId, products.id))
    .leftJoin(
      productImages,
      and(
        eq(productImages.productId, products.id),
        eq(productImages.isFeatured, true),
      ),
    )
    .where(eq(cartLines.cartId, dbCart.id));

  const lines = dbLines.map(({ line, variant, product, image }) => ({
    id: line.id,
    quantity: line.quantity,
    cost: {
      totalAmount: {
        amount: String(line.totalAmount),
        currencyCode: line.currencyCode,
      },
    },
    merchandise: {
      id: variant.id,
      title: variant.title,
      selectedOptions: variant.selectedOptions as {
        name: string;
        value: string;
      }[],
      product: {
        id: product.id,
        handle: product.handle,
        title: product.title,
        featuredImage: {
          url: image?.url || "",
          altText: image?.altText || "",
          width: image?.width || PRODUCT_IMAGE_WIDTH,
          height: image?.height || PRODUCT_IMAGE_HEIGHT,
        },
      },
    },
  }));

  return {
    id: dbCart.id,
    checkoutUrl: dbCart.checkoutUrl || "",
    cost: {
      subtotalAmount: {
        amount: String(dbCart.subtotalAmount),
        currencyCode: dbCart.currencyCode,
      },
      totalAmount: {
        amount: String(dbCart.totalAmount),
        currencyCode: dbCart.currencyCode,
      },
      totalTaxAmount: {
        amount: String(dbCart.totalTaxAmount),
        currencyCode: dbCart.currencyCode,
      },
    },
    lines,
    totalQuantity: dbCart.totalQuantity,
  };
}

export async function getProduct(handle: string): Promise<Product | undefined> {
  const [dbProduct] = await db
    .select()
    .from(products)
    .where(eq(products.handle, handle))
    .limit(1);

  return reshapeDbProduct(dbProduct);
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
  const filters = [];

  if (query) {
    filters.push(ilike(products.title, `%${query}%`));
  }

  let orderBy = desc(products.createdAt);
  if (sortKey === "CREATED_AT" || sortKey === "CREATED") {
    orderBy = reverse ? desc(products.createdAt) : asc(products.createdAt);
  } else if (sortKey === "PRICE") {
    orderBy = reverse ? desc(products.title) : asc(products.title);
  }

  const dbProducts = await db
    .select()
    .from(products)
    .where(filters.length ? and(...filters) : undefined)
    .orderBy(orderBy)
    .limit(100);

  const productsWithDetails = await Promise.all(
    dbProducts.map((product) => reshapeDbProduct(product)),
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

  if (!productCols.length) {
    const dbProducts = await db
      .select()
      .from(products)
      .where(sql`${products.id} <> ${productId}`)
      .limit(4);
    const productsWithDetails = await Promise.all(
      dbProducts.map((product) => reshapeDbProduct(product)),
    );
    return productsWithDetails.filter((p): p is Product => p !== undefined);
  }

  const collectionIds = productCols.map((pc) => pc.collectionId);
  const related = await db
    .select({ product: products })
    .from(productCollections)
    .innerJoin(products, eq(productCollections.productId, products.id))
    .where(
      and(
        inArray(productCollections.collectionId, collectionIds),
        sql`${productCollections.productId} <> ${productId}`,
      ),
    )
    .limit(4);

  const productsWithDetails = await Promise.all(
    related.map((rp) => reshapeDbProduct(rp.product)),
  );

  return productsWithDetails.filter((p): p is Product => p !== undefined);
}

export async function getProductReviewAggregate(productId: string): Promise<{
  averageRating: number | null;
  reviewCount: number;
}> {
  const [stats] = await db
    .select({
      averageRating: sql<number>`avg(${reviews.rating})`,
      reviewCount: sql<number>`count(${reviews.rating})`,
    })
    .from(reviews)
    .where(and(eq(reviews.productId, productId), eq(reviews.status, "approved")));

  return {
    averageRating: stats?.averageRating ?? null,
    reviewCount: Number(stats?.reviewCount ?? 0),
  };
}

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
      description: dbCollection.seoDescription || dbCollection.description || "",
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
    ...dbCollections.map((collection) => ({
      handle: collection.handle,
      title: collection.title,
      description: collection.description || "",
      seo: {
        title: collection.seoTitle || collection.title,
        description: collection.seoDescription || collection.description || "",
      },
      updatedAt: collection.updatedAt.toISOString(),
      path: `/search/${collection.handle}`,
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

  const productCollectionRows = await db
    .select({ product: products })
    .from(productCollections)
    .innerJoin(products, eq(productCollections.productId, products.id))
    .where(eq(productCollections.collectionId, dbCollection.id));

  if (!productCollectionRows.length) {
    return [];
  }

  const productsWithDetails = await Promise.all(
    productCollectionRows.map((pc) => reshapeDbProduct(pc.product)),
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
        sql`${collections.handle} <> ${"all"}`,
      ),
    )
    .orderBy(asc(collections.createdAt));

  const collectionsWithProducts = await Promise.all(
    dbCollections.map(async (dbCollection) => {
      const productCollectionRows = await db
        .select({ product: products })
        .from(productCollections)
        .innerJoin(products, eq(productCollections.productId, products.id))
        .where(eq(productCollections.collectionId, dbCollection.id))
        .orderBy(asc(productCollections.position))
        .limit(8);

      const productsWithDetails = await Promise.all(
        productCollectionRows.map((pc) => reshapeDbProduct(pc.product)),
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

export async function createCart(): Promise<Cart> {
  const [dbCart] = await db
    .insert(carts)
    .values({
      totalQuantity: 0,
      subtotalAmount: "0.00",
      totalAmount: "0.00",
      totalTaxAmount: "0.00",
      currencyCode: "NGN",
    })
    .returning();

  return (await reshapeDbCart(dbCart))!;
}

export async function getCart(cartId: string): Promise<Cart | undefined> {
  const [dbCart] = await db
    .select()
    .from(carts)
    .where(eq(carts.id, cartId))
    .limit(1);

  return reshapeDbCart(dbCart);
}

export async function addToCart(
  cartId: string,
  lines: { merchandiseId: string; quantity: number }[],
): Promise<Cart> {
  for (const line of lines) {
    const [variant] = await db
      .select()
      .from(productVariants)
      .where(eq(productVariants.id, line.merchandiseId))
      .limit(1);

    if (!variant) continue;

    const totalAmount = Number(variant.price) * line.quantity;

    const [existingLine] = await db
      .select()
      .from(cartLines)
      .where(
        and(
          eq(cartLines.cartId, cartId),
          eq(cartLines.productVariantId, line.merchandiseId),
        ),
      )
      .limit(1);

    if (existingLine) {
      await db
        .update(cartLines)
        .set({
          quantity: existingLine.quantity + line.quantity,
          totalAmount: String(Number(existingLine.totalAmount) + totalAmount),
          updatedAt: new Date(),
        })
        .where(eq(cartLines.id, existingLine.id));
    } else {
      await db.insert(cartLines).values({
        cartId,
        productVariantId: line.merchandiseId,
        quantity: line.quantity,
        totalAmount: String(totalAmount),
        currencyCode: variant.currencyCode,
      });
    }
  }

  await recalculateCartTotals(cartId);

  return (await getCart(cartId))!;
}

export async function removeFromCart(
  cartId: string,
  lineIds: string[],
): Promise<Cart> {
  await db.delete(cartLines).where(inArray(cartLines.id, lineIds));

  await recalculateCartTotals(cartId);

  return (await getCart(cartId))!;
}

export async function updateCart(
  cartId: string,
  lines: { id: string; merchandiseId: string; quantity: number }[],
): Promise<Cart> {
  for (const line of lines) {
    if (line.quantity === 0) {
      await db.delete(cartLines).where(eq(cartLines.id, line.id));
      continue;
    }

    const [variant] = await db
      .select()
      .from(productVariants)
      .where(eq(productVariants.id, line.merchandiseId))
      .limit(1);

    if (!variant) continue;

    const totalAmount = Number(variant.price) * line.quantity;

    await db
      .update(cartLines)
      .set({
        quantity: line.quantity,
        totalAmount: String(totalAmount),
        updatedAt: new Date(),
      })
      .where(eq(cartLines.id, line.id));
  }

  await recalculateCartTotals(cartId);

  return (await getCart(cartId))!;
}

async function recalculateCartTotals(cartId: string): Promise<void> {
  const lines = await db
    .select()
    .from(cartLines)
    .where(eq(cartLines.cartId, cartId));

  const totalQuantity = lines.reduce((sum, line) => sum + line.quantity, 0);
  const subtotalAmount = lines.reduce(
    (sum, line) => sum + Number(line.totalAmount),
    0,
  );

  await db
    .update(carts)
    .set({
      totalQuantity,
      subtotalAmount: String(subtotalAmount),
      totalAmount: String(subtotalAmount),
      totalTaxAmount: "0.00",
      updatedAt: new Date(),
    })
    .where(eq(carts.id, cartId));
}

export async function getPage(handle: string): Promise<Page> {
  const [dbPage] = await db
    .select()
    .from(pages)
    .where(eq(pages.handle, handle))
    .limit(1);

  if (!dbPage) {
    throw new Error(`Page not found: ${handle}`);
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

  return dbPages.map((page) => ({
    id: page.id,
    title: page.title,
    handle: page.handle,
    body: page.body || "",
    bodySummary: page.bodySummary || "",
    seo: {
      title: page.seoTitle || page.title,
      description: page.seoDescription || "",
    },
    createdAt: page.createdAt.toISOString(),
    updatedAt: page.updatedAt.toISOString(),
  }));
}

export async function getMenu(handle: string): Promise<Menu[]> {
  const [dbMenu] = await db
    .select()
    .from(menus)
    .where(eq(menus.handle, handle))
    .limit(1);

  if (!dbMenu) return [];

  const items = await db
    .select()
    .from(menuItems)
    .where(eq(menuItems.menuId, dbMenu.id))
    .orderBy(asc(menuItems.position));

  return items.map((item) => ({
    title: item.title,
    path: item.url,
  }));
}
