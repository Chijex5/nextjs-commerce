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
  notInArray,
  sql,
  ilike,
  or,
  type SQL,
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
      selectedOptions: variant.selectedOptions as {
        name: string;
        value: string;
      }[],
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
  const filters: SQL[] = [];
  const sanitizedQuery = query?.trim();
  let relevanceScore = sql<number>`0`;

  if (sanitizedQuery) {
    const normalizedQuery = sanitizedQuery.toLowerCase();
    const pattern = `%${sanitizedQuery}%`;

    const coreSearchText = sql<string>`
      trim(
        concat_ws(
          ' ',
          coalesce(${products.title}, ''),
          coalesce(${products.handle}, ''),
          coalesce(array_to_string(${products.tags}, ' '), ''),
          coalesce(${products.description}, ''),
          coalesce(${products.seoTitle}, ''),
          coalesce(${products.seoDescription}, '')
        )
      )
    `;

    const collectionSearchText = sql<string>`
      coalesce(
        (
          select string_agg(
            distinct concat_ws(
              ' ',
              ${collections.title},
              ${collections.handle},
              coalesce(${collections.description}, '')
            ),
            ' '
          )
          from ${productCollections}
          inner join ${collections}
            on ${productCollections.collectionId} = ${collections.id}
          where ${productCollections.productId} = ${products.id}
        ),
        ''
      )
    `;

    const optionSearchText = sql<string>`
      coalesce(
        (
          select string_agg(
            distinct concat_ws(
              ' ',
              ${productOptions.name},
              coalesce(array_to_string(${productOptions.values}, ' '), '')
            ),
            ' '
          )
          from ${productOptions}
          where ${productOptions.productId} = ${products.id}
        ),
        ''
      )
    `;

    const variantSearchText = sql<string>`
      coalesce(
        (
          select string_agg(
            distinct concat_ws(
              ' ',
              ${productVariants.title},
              ${productVariants.selectedOptions}::text
            ),
            ' '
          )
          from ${productVariants}
          where ${productVariants.productId} = ${products.id}
        ),
        ''
      )
    `;

    const customerIntentText = sql<string>`
      trim(
        concat_ws(
          ' ',
          ${coreSearchText},
          ${collectionSearchText},
          ${optionSearchText},
          ${variantSearchText}
        )
      )
    `;

    const searchVector = sql`
      (
        setweight(to_tsvector('simple', coalesce(${products.title}, '')), 'A') ||
        setweight(
          to_tsvector('simple', coalesce(array_to_string(${products.tags}, ' '), '')),
          'A'
        ) ||
        setweight(to_tsvector('simple', coalesce(${products.handle}, '')), 'B') ||
        setweight(to_tsvector('simple', ${collectionSearchText}), 'B') ||
        setweight(to_tsvector('simple', ${optionSearchText}), 'B') ||
        setweight(to_tsvector('simple', ${variantSearchText}), 'B') ||
        setweight(
          to_tsvector(
            'english',
            coalesce(${products.seoTitle}, '') || ' ' || coalesce(${products.seoDescription}, '')
          ),
          'C'
        ) ||
        setweight(to_tsvector('english', coalesce(${products.description}, '')), 'C')
      )
    `;
    const simpleTsQuery = sql`plainto_tsquery('simple', ${sanitizedQuery})`;
    const englishTsQuery = sql`plainto_tsquery('english', ${sanitizedQuery})`;

    const relatedFieldMatch = sql<boolean>`
      (
        exists (
          select 1
          from ${productVariants}
          where ${productVariants.productId} = ${products.id}
            and (
              ${productVariants.title} ILIKE ${pattern}
              or ${productVariants.selectedOptions}::text ILIKE ${pattern}
              or lower(${productVariants.title}) % ${normalizedQuery}
            )
        )
        or exists (
          select 1
          from ${productOptions}
          where ${productOptions.productId} = ${products.id}
            and (
              ${productOptions.name} ILIKE ${pattern}
              or array_to_string(${productOptions.values}, ' ') ILIKE ${pattern}
              or lower(
                trim(
                  concat_ws(
                    ' ',
                    coalesce(${productOptions.name}, ''),
                    coalesce(array_to_string(${productOptions.values}, ' '), '')
                  )
                )
              ) % ${normalizedQuery}
            )
        )
        or exists (
          select 1
          from ${productCollections}
          inner join ${collections}
            on ${productCollections.collectionId} = ${collections.id}
          where ${productCollections.productId} = ${products.id}
            and (
              ${collections.title} ILIKE ${pattern}
              or ${collections.handle} ILIKE ${pattern}
              or lower(
                trim(
                  concat_ws(
                    ' ',
                    coalesce(${collections.title}, ''),
                    coalesce(${collections.handle}, ''),
                    coalesce(${collections.description}, '')
                  )
                )
              ) % ${normalizedQuery}
            )
        )
      )
    `;

    const fuzzyScore = sql<number>`
      greatest(
        similarity(lower(${products.title}), ${normalizedQuery}),
        word_similarity(${normalizedQuery}, lower(${customerIntentText}))
      )
    `;

    const exactTitleBoost = sql<number>`
      case
        when lower(${products.title}) = ${normalizedQuery} then 4.0
        when lower(${products.title}) like ${`${normalizedQuery}%`} then 2.4
        when lower(${products.title}) like ${`%${normalizedQuery}%`} then 1.1
        else 0
      end
    `;

    relevanceScore = sql<number>`
      (
        (
          2.6 * greatest(
            ts_rank_cd(${searchVector}, ${simpleTsQuery}, 32),
            ts_rank_cd(${searchVector}, ${englishTsQuery}, 32)
          )
        )
        + (1.35 * ${fuzzyScore})
        + ${exactTitleBoost}
        + (case when ${products.availableForSale} then 0.12 else 0 end)
      )
    `;

    const fuzzyThreshold = normalizedQuery.length >= 10 ? 0.24 : 0.31;

    filters.push(
      sql<boolean>`
        (
          ${searchVector} @@ ${simpleTsQuery}
          or ${searchVector} @@ ${englishTsQuery}
          or lower(${coreSearchText}) % ${normalizedQuery}
          or ${coreSearchText} ILIKE ${pattern}
          or ${relatedFieldMatch}
          or ${fuzzyScore} > ${fuzzyThreshold}
        )
      `,
    );
  }

  let primaryOrder: SQL = desc(products.createdAt);
  if (sortKey === "CREATED_AT" || sortKey === "CREATED") {
    primaryOrder = reverse ? desc(products.createdAt) : asc(products.createdAt);
  } else if (sortKey === "PRICE") {
    const minVariantPrice = sql<number>`(
      SELECT COALESCE(MIN(${productVariants.price}), 0)
      FROM ${productVariants}
      WHERE ${productVariants.productId} = ${products.id}
    )`;
    primaryOrder = reverse ? desc(minVariantPrice) : asc(minVariantPrice);
  }

  const hasQuery = Boolean(sanitizedQuery);
  const hasExplicitNonRelevanceSort =
    sortKey === "PRICE" || sortKey === "CREATED_AT" || sortKey === "CREATED";

  const orderByClauses: SQL[] = [];
  if (hasQuery && !hasExplicitNonRelevanceSort) {
    orderByClauses.push(desc(relevanceScore));
  }

  orderByClauses.push(primaryOrder);

  if (hasQuery && hasExplicitNonRelevanceSort) {
    orderByClauses.push(desc(relevanceScore));
  }

  orderByClauses.push(asc(products.id));

  let dbProducts: Array<{ product: typeof products.$inferSelect }>;

  try {
    dbProducts = await db
      .select({
        product: products,
      })
      .from(products)
      .where(filters.length ? and(...filters) : undefined)
      .orderBy(...orderByClauses)
      .limit(100);
  } catch (error) {
    if (!sanitizedQuery) {
      throw error;
    }

    const fallbackPattern = `%${sanitizedQuery}%`;
    dbProducts = await db
      .select({
        product: products,
      })
      .from(products)
      .where(
        or(
          ilike(products.title, fallbackPattern),
          ilike(products.handle, fallbackPattern),
          ilike(products.description, fallbackPattern),
          sql`${products.tags}::text ILIKE ${fallbackPattern}`,
          sql<boolean>`
            exists (
              select 1
              from ${productVariants}
              where ${productVariants.productId} = ${products.id}
                and (
                  ${productVariants.title} ILIKE ${fallbackPattern}
                  or ${productVariants.selectedOptions}::text ILIKE ${fallbackPattern}
                )
            )
          `,
          sql<boolean>`
            exists (
              select 1
              from ${productOptions}
              where ${productOptions.productId} = ${products.id}
                and (
                  ${productOptions.name} ILIKE ${fallbackPattern}
                  or array_to_string(${productOptions.values}, ' ') ILIKE ${fallbackPattern}
                )
            )
          `,
          sql<boolean>`
            exists (
              select 1
              from ${productCollections}
              inner join ${collections}
                on ${productCollections.collectionId} = ${collections.id}
              where ${productCollections.productId} = ${products.id}
                and (
                  ${collections.title} ILIKE ${fallbackPattern}
                  or ${collections.handle} ILIKE ${fallbackPattern}
                  or ${collections.description} ILIKE ${fallbackPattern}
                )
            )
          `,
        ),
      )
      .orderBy(primaryOrder, asc(products.id))
      .limit(100);
  }

  const productsWithDetails = await Promise.all(
    dbProducts.map(({ product }) => reshapeDbProduct(product)),
  );

  return productsWithDetails.filter((p): p is Product => p !== undefined);
}

export async function getProductRecommendations(
  productId: string,
): Promise<Product[]> {
  const TARGET_RELATED = 4;
  const productCols = await db
    .select({ collectionId: productCollections.collectionId })
    .from(productCollections)
    .where(eq(productCollections.productId, productId));

  const collectionIds = productCols.map((pc) => pc.collectionId);
  let relatedProducts: typeof products.$inferSelect[] = [];

  if (collectionIds.length) {
    const sharedCount =
      sql<number>`count(${productCollections.collectionId})`.as(
        "shared_count",
      );
    const related = await db
      .select({ product: products, sharedCount })
      .from(productCollections)
      .innerJoin(products, eq(productCollections.productId, products.id))
      .where(
        and(
          inArray(productCollections.collectionId, collectionIds),
          sql`${productCollections.productId} <> ${productId}`,
        ),
      )
      .groupBy(products.id)
      .orderBy(desc(sharedCount), desc(products.updatedAt), asc(products.id))
      .limit(TARGET_RELATED);

    relatedProducts = related.map((rp) => rp.product);
  }

  if (relatedProducts.length < TARGET_RELATED) {
    const remaining = TARGET_RELATED - relatedProducts.length;
    const excludeIds = [productId, ...relatedProducts.map((p) => p.id)];
    const fallback = await db
      .select()
      .from(products)
      .where(notInArray(products.id, excludeIds))
      .orderBy(desc(products.updatedAt), asc(products.id))
      .limit(remaining);
    relatedProducts = [...relatedProducts, ...fallback];
  }

  const productsWithDetails = await Promise.all(
    relatedProducts.map((product) => reshapeDbProduct(product)),
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
    .where(
      and(eq(reviews.productId, productId), eq(reviews.status, "approved")),
    );

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
