import { db } from "./index";
import {
  products,
  productVariants,
  productImages,
  productOptions,
  collections,
  productCollections,
  carts,
  cartLines,
  pages,
  menus,
  menuItems,
} from "./schema";
import { eq, and, desc, asc, sql, inArray } from "drizzle-orm";
import type {
  Product,
  Collection,
  Cart,
  Page,
  Menu,
  Image,
  ProductVariant,
  ProductOption,
  Money,
  SEO,
} from "../shopify/types";

// Helper function to reshape database product to match Shopify Product type
export async function reshapeDbProduct(
  dbProduct: any,
  includeRelations: boolean = true
): Promise<Product | undefined> {
  if (!dbProduct) return undefined;

  let variants: ProductVariant[] = [];
  let images: Image[] = [];
  let options: ProductOption[] = [];
  let featuredImage: Image | undefined;

  if (includeRelations) {
    // Get variants
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
        amount: v.price,
        currencyCode: v.currencyCode,
      },
    }));

    // Get images
    const dbImages = await db
      .select()
      .from(productImages)
      .where(eq(productImages.productId, dbProduct.id))
      .orderBy(asc(productImages.position));

    images = dbImages.map((img) => ({
      url: img.url,
      altText: img.altText || "",
      width: img.width || 800,
      height: img.height || 800,
    }));

    featuredImage =
      images.find((_, idx) => dbImages[idx]?.isFeatured) || images[0];

    // Get options
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

  // Calculate price range
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
      width: 800,
      height: 800,
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

// Helper function to reshape database cart to match Shopify Cart type
async function reshapeDbCart(dbCart: any): Promise<Cart | undefined> {
  if (!dbCart) return undefined;

  // Get cart lines with product and variant information
  const dbLines = await db
    .select({
      line: cartLines,
      variant: productVariants,
      product: products,
    })
    .from(cartLines)
    .innerJoin(
      productVariants,
      eq(cartLines.productVariantId, productVariants.id)
    )
    .innerJoin(products, eq(productVariants.productId, products.id))
    .where(eq(cartLines.cartId, dbCart.id));

  // Get featured image for each product
  const lines = await Promise.all(
    dbLines.map(async ({ line, variant, product }) => {
      const dbImages = await db
        .select()
        .from(productImages)
        .where(
          and(
            eq(productImages.productId, product.id),
            eq(productImages.isFeatured, true)
          )
        )
        .limit(1);

      const featuredImage = dbImages[0] || {
        url: "",
        altText: "",
        width: 800,
        height: 800,
      };

      return {
        id: line.id,
        quantity: line.quantity,
        cost: {
          totalAmount: {
            amount: line.totalAmount,
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
              url: featuredImage.url,
              altText: featuredImage.altText || "",
              width: featuredImage.width || 800,
              height: featuredImage.height || 800,
            },
          },
        },
      };
    })
  );

  return {
    id: dbCart.id,
    checkoutUrl: dbCart.checkoutUrl || "",
    cost: {
      subtotalAmount: {
        amount: dbCart.subtotalAmount,
        currencyCode: dbCart.currencyCode,
      },
      totalAmount: {
        amount: dbCart.totalAmount,
        currencyCode: dbCart.currencyCode,
      },
      totalTaxAmount: {
        amount: dbCart.totalTaxAmount,
        currencyCode: dbCart.currencyCode,
      },
    },
    lines,
    totalQuantity: dbCart.totalQuantity,
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
  query,
  reverse,
  sortKey,
}: {
  query?: string;
  reverse?: boolean;
  sortKey?: string;
}): Promise<Product[]> {
  let queryBuilder = db.select().from(products);

  // Apply sorting
  if (sortKey === "CREATED_AT" || sortKey === "CREATED") {
    queryBuilder = reverse
      ? queryBuilder.orderBy(desc(products.createdAt))
      : queryBuilder.orderBy(asc(products.createdAt));
  } else if (sortKey === "PRICE") {
    // For price sorting, we'll need to join with variants
    // This is simplified - you might want a more sophisticated approach
    queryBuilder = reverse
      ? queryBuilder.orderBy(desc(products.title))
      : queryBuilder.orderBy(asc(products.title));
  } else {
    queryBuilder = queryBuilder.orderBy(desc(products.createdAt));
  }

  const dbProducts = await queryBuilder.limit(100);

  const productsWithDetails = await Promise.all(
    dbProducts.map((p) => reshapeDbProduct(p))
  );

  return productsWithDetails.filter((p): p is Product => p !== undefined);
}

export async function getProductRecommendations(
  productId: string
): Promise<Product[]> {
  // Get products from same collections
  const productCols = await db
    .select()
    .from(productCollections)
    .where(eq(productCollections.productId, productId));

  if (productCols.length === 0) {
    // Return random products if no collections
    const dbProducts = await db
      .select()
      .from(products)
      .where(sql`${products.id} != ${productId}`)
      .limit(4);
    return Promise.all(
      dbProducts.map((p) => reshapeDbProduct(p)).filter((p) => p !== undefined)
    ) as Promise<Product[]>;
  }

  const collectionIds = productCols.map((pc) => pc.collectionId);
  const relatedProductIds = await db
    .select()
    .from(productCollections)
    .where(
      and(
        inArray(productCollections.collectionId, collectionIds),
        sql`${productCollections.productId} != ${productId}`
      )
    )
    .limit(4);

  const dbProducts = await db
    .select()
    .from(products)
    .where(
      inArray(
        products.id,
        relatedProductIds.map((rp) => rp.productId)
      )
    );

  const productsWithDetails = await Promise.all(
    dbProducts.map((p) => reshapeDbProduct(p))
  );

  return productsWithDetails.filter((p): p is Product => p !== undefined);
}

// Collection queries
export async function getCollection(
  handle: string
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
        productIds.map((p) => p.productId)
      )
    );

  const productsWithDetails = await Promise.all(
    dbProducts.map((p) => reshapeDbProduct(p))
  );

  return productsWithDetails.filter((p): p is Product => p !== undefined);
}

// Cart queries and mutations
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
  lines: { merchandiseId: string; quantity: number }[]
): Promise<Cart> {
  // Add each line to cart
  for (const line of lines) {
    const [variant] = await db
      .select()
      .from(productVariants)
      .where(eq(productVariants.id, line.merchandiseId))
      .limit(1);

    if (!variant) continue;

    const totalAmount = (
      parseFloat(variant.price) * line.quantity
    ).toFixed(2);

    // Check if line already exists
    const [existingLine] = await db
      .select()
      .from(cartLines)
      .where(
        and(
          eq(cartLines.cartId, cartId),
          eq(cartLines.productVariantId, line.merchandiseId)
        )
      )
      .limit(1);

    if (existingLine) {
      // Update quantity
      await db
        .update(cartLines)
        .set({
          quantity: existingLine.quantity + line.quantity,
          totalAmount: (
            parseFloat(existingLine.totalAmount) + parseFloat(totalAmount)
          ).toFixed(2),
          updatedAt: new Date(),
        })
        .where(eq(cartLines.id, existingLine.id));
    } else {
      // Insert new line
      await db.insert(cartLines).values({
        cartId,
        productVariantId: line.merchandiseId,
        quantity: line.quantity,
        totalAmount,
        currencyCode: variant.currencyCode,
      });
    }
  }

  // Recalculate cart totals
  await recalculateCartTotals(cartId);

  return (await getCart(cartId))!;
}

export async function removeFromCart(
  cartId: string,
  lineIds: string[]
): Promise<Cart> {
  await db.delete(cartLines).where(inArray(cartLines.id, lineIds));

  // Recalculate cart totals
  await recalculateCartTotals(cartId);

  return (await getCart(cartId))!;
}

export async function updateCart(
  cartId: string,
  lines: { id: string; merchandiseId: string; quantity: number }[]
): Promise<Cart> {
  for (const line of lines) {
    if (line.quantity === 0) {
      await db.delete(cartLines).where(eq(cartLines.id, line.id));
    } else {
      const [variant] = await db
        .select()
        .from(productVariants)
        .where(eq(productVariants.id, line.merchandiseId))
        .limit(1);

      if (!variant) continue;

      const totalAmount = (
        parseFloat(variant.price) * line.quantity
      ).toFixed(2);

      await db
        .update(cartLines)
        .set({
          quantity: line.quantity,
          totalAmount,
          updatedAt: new Date(),
        })
        .where(eq(cartLines.id, line.id));
    }
  }

  // Recalculate cart totals
  await recalculateCartTotals(cartId);

  return (await getCart(cartId))!;
}

async function recalculateCartTotals(cartId: string): Promise<void> {
  const lines = await db
    .select()
    .from(cartLines)
    .where(eq(cartLines.cartId, cartId));

  const totalQuantity = lines.reduce((sum, line) => sum + line.quantity, 0);
  const subtotalAmount = lines
    .reduce((sum, line) => sum + parseFloat(line.totalAmount), 0)
    .toFixed(2);

  await db
    .update(carts)
    .set({
      totalQuantity,
      subtotalAmount,
      totalAmount: subtotalAmount, // No tax for now
      totalTaxAmount: "0.00",
      updatedAt: new Date(),
    })
    .where(eq(carts.id, cartId));
}

// Page queries
export async function getPage(handle: string): Promise<Page> {
  const [dbPage] = await db
    .select()
    .from(pages)
    .where(eq(pages.handle, handle))
    .limit(1);

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

  const dbItems = await db
    .select()
    .from(menuItems)
    .where(eq(menuItems.menuId, dbMenu.id))
    .orderBy(asc(menuItems.position));

  return dbItems.map((item) => ({
    title: item.title,
    path: item.url,
  }));
}
