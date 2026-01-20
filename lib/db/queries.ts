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
import prisma from "lib/prisma";
import { Prisma } from "@/app/generated/prisma/client";
import { PRODUCT_IMAGE_HEIGHT, PRODUCT_IMAGE_WIDTH } from "../image-constants";

const db = prisma;
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
    // Get variants
    const dbVariants = await db.productVariant.findMany({
      where: { productId: dbProduct.id },
    });

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

    // Get images
    const dbImages = await db.productImage.findMany({
      where: { productId: dbProduct.id },
      orderBy: { position: "asc" },
    });

    images = dbImages.map((img) => ({
      url: img.url,
      altText: img.altText || "",
      width: img.width || PRODUCT_IMAGE_WIDTH,
      height: img.height || PRODUCT_IMAGE_HEIGHT,
    }));

    featuredImage =
      images.find((_, idx) => dbImages[idx]?.isFeatured) || images[0];

    // Get options
    const dbOptions = await db.productOption.findMany({
      where: { productId: dbProduct.id },
    });

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

// Helper function to reshape database cart to match Shopify Cart type
async function reshapeDbCart(dbCart: any): Promise<Cart | undefined> {
  if (!dbCart) return undefined;

  // Get cart lines with product and variant information
  const dbLines = await db.cartLine.findMany({
    where: { cartId: dbCart.id },
    include: {
      variant: {
        include: {
          product: {
            include: {
              images: {
                where: { isFeatured: true },
                take: 1,
              },
            },
          },
        },
      },
    },
  });

  const lines = dbLines.map(({ variant, ...line }) => {
    const product = variant.product;
    const featuredImage = product.images[0] || {
      url: "",
      altText: "",
      width: PRODUCT_IMAGE_WIDTH,
      height: PRODUCT_IMAGE_HEIGHT,
    };

    return {
      id: line.id,
      quantity: line.quantity,
      cost: {
        totalAmount: {
          amount: line.totalAmount.toString(),
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
            width: featuredImage.width || PRODUCT_IMAGE_WIDTH,
            height: featuredImage.height || PRODUCT_IMAGE_HEIGHT,
          },
        },
      },
    };
  });

  return {
    id: dbCart.id,
    checkoutUrl: dbCart.checkoutUrl || "",
    cost: {
      subtotalAmount: {
        amount: dbCart.subtotalAmount.toString(),
        currencyCode: dbCart.currencyCode,
      },
      totalAmount: {
        amount: dbCart.totalAmount.toString(),
        currencyCode: dbCart.currencyCode,
      },
      totalTaxAmount: {
        amount: dbCart.totalTaxAmount.toString(),
        currencyCode: dbCart.currencyCode,
      },
    },
    lines,
    totalQuantity: dbCart.totalQuantity,
  };
}

// Product queries
export async function getProduct(handle: string): Promise<Product | undefined> {
  const dbProduct = await db.product.findUnique({
    where: { handle },
  });

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
  const orderBy: Prisma.ProductOrderByWithRelationInput = {};

  if (sortKey === "CREATED_AT" || sortKey === "CREATED") {
    orderBy.createdAt = reverse ? "desc" : "asc";
  } else if (sortKey === "PRICE") {
    orderBy.title = reverse ? "desc" : "asc"; // Simplified sorting
  } else {
    orderBy.createdAt = "desc";
  }

  const dbProducts = await db.product.findMany({
    orderBy,
    take: 100,
  });

  const productsWithDetails = await Promise.all(
    dbProducts.map((p) => reshapeDbProduct(p)),
  );

  return productsWithDetails.filter((p): p is Product => p !== undefined);
}

export async function getProductRecommendations(
  productId: string,
): Promise<Product[]> {
  // Get products from same collections
  const productCols = await db.productCollection.findMany({
    where: { productId },
  });

  if (productCols.length === 0) {
    // Return random products if no collections
    const dbProducts = await db.product.findMany({
      where: { id: { not: productId } },
      take: 4,
    });
    const productsWithDetails = await Promise.all(
      dbProducts.map((p) => reshapeDbProduct(p)),
    );
    return productsWithDetails.filter((p): p is Product => p !== undefined);
  }

  const collectionIds = productCols.map((pc) => pc.collectionId);
  const relatedProducts = await db.productCollection.findMany({
    where: {
      collectionId: { in: collectionIds },
      productId: { not: productId },
    },
    take: 4,
    include: {
      product: true,
    },
  });

  const productsWithDetails = await Promise.all(
    relatedProducts.map((rp) => reshapeDbProduct(rp.product)),
  );

  return productsWithDetails.filter((p): p is Product => p !== undefined);
}

export async function getProductReviewAggregate(productId: string): Promise<{
  averageRating: number | null;
  reviewCount: number;
}> {
  const stats = await db.review.aggregate({
    where: { productId, status: "approved" },
    _avg: { rating: true },
    _count: { rating: true },
  });

  return {
    averageRating: stats._avg.rating ?? null,
    reviewCount: stats._count.rating ?? 0,
  };
}

// Collection queries
export async function getCollection(
  handle: string,
): Promise<Collection | undefined> {
  const dbCollection = await db.collection.findUnique({
    where: { handle },
  });

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
  const dbCollections = await db.collection.findMany();

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

  const dbCollection = await db.collection.findUnique({
    where: { handle: collection },
  });

  if (!dbCollection) {
    return [];
  }

  const productCollections = await db.productCollection.findMany({
    where: { collectionId: dbCollection.id },
    include: { product: true },
  });

  if (productCollections.length === 0) {
    return [];
  }

  const productsWithDetails = await Promise.all(
    productCollections.map((pc) => reshapeDbProduct(pc.product)),
  );

  return productsWithDetails.filter((p): p is Product => p !== undefined);
}

// Get all collections with their products (excluding hidden collections)
export async function getCollectionsWithProducts(): Promise<
  Array<{ collection: Collection; products: Product[] }>
> {
  const dbCollections = await db.collection.findMany({
    where: {
      AND: [
        { handle: { not: { startsWith: "hidden-" } } },
        { handle: { not: "all" } },
      ],
    },
    orderBy: { createdAt: "asc" },
  });

  const collectionsWithProducts = await Promise.all(
    dbCollections.map(async (dbCollection) => {
      const productCollections = await db.productCollection.findMany({
        where: { collectionId: dbCollection.id },
        include: { product: true },
        orderBy: { position: "asc" },
        take: 8, // Limit to 8 products per collection for homepage
      });

      const productsWithDetails = await Promise.all(
        productCollections.map((pc) => reshapeDbProduct(pc.product)),
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

  // Filter out collections with no products
  return collectionsWithProducts.filter((c) => c.products.length > 0);
}

// Cart queries and mutations
export async function createCart(): Promise<Cart> {
  const dbCart = await db.cart.create({
    data: {
      totalQuantity: 0,
      subtotalAmount: 0,
      totalAmount: 0,
      totalTaxAmount: 0,
      currencyCode: "NGN",
    },
  });

  return (await reshapeDbCart(dbCart))!;
}

export async function getCart(cartId: string): Promise<Cart | undefined> {
  const dbCart = await db.cart.findUnique({
    where: { id: cartId },
  });

  return reshapeDbCart(dbCart);
}

export async function addToCart(
  cartId: string,
  lines: { merchandiseId: string; quantity: number }[],
): Promise<Cart> {
  // Add each line to cart
  for (const line of lines) {
    const variant = await db.productVariant.findUnique({
      where: { id: line.merchandiseId },
    });

    if (!variant) continue;

    const totalAmount = variant.price.toNumber() * line.quantity;

    // Check if line already exists
    const existingLine = await db.cartLine.findFirst({
      where: {
        cartId,
        productVariantId: line.merchandiseId,
      },
    });

    if (existingLine) {
      // Update quantity
      await db.cartLine.update({
        where: { id: existingLine.id },
        data: {
          quantity: existingLine.quantity + line.quantity,
          totalAmount: existingLine.totalAmount.toNumber() + totalAmount,
          updatedAt: new Date(),
        },
      });
    } else {
      // Insert new line
      await db.cartLine.create({
        data: {
          cartId,
          productVariantId: line.merchandiseId,
          quantity: line.quantity,
          totalAmount,
          currencyCode: variant.currencyCode,
        },
      });
    }
  }

  // Recalculate cart totals
  await recalculateCartTotals(cartId);

  return (await getCart(cartId))!;
}

export async function removeFromCart(
  cartId: string,
  lineIds: string[],
): Promise<Cart> {
  await db.cartLine.deleteMany({
    where: { id: { in: lineIds } },
  });

  // Recalculate cart totals
  await recalculateCartTotals(cartId);

  return (await getCart(cartId))!;
}

export async function updateCart(
  cartId: string,
  lines: { id: string; merchandiseId: string; quantity: number }[],
): Promise<Cart> {
  for (const line of lines) {
    if (line.quantity === 0) {
      await db.cartLine.delete({
        where: { id: line.id },
      });
    } else {
      const variant = await db.productVariant.findUnique({
        where: { id: line.merchandiseId },
      });

      if (!variant) continue;

      const totalAmount = variant.price.toNumber() * line.quantity;

      await db.cartLine.update({
        where: { id: line.id },
        data: {
          quantity: line.quantity,
          totalAmount,
          updatedAt: new Date(),
        },
      });
    }
  }

  // Recalculate cart totals
  await recalculateCartTotals(cartId);

  return (await getCart(cartId))!;
}

async function recalculateCartTotals(cartId: string): Promise<void> {
  const lines = await db.cartLine.findMany({
    where: { cartId },
  });

  const totalQuantity = lines.reduce((sum, line) => sum + line.quantity, 0);
  const subtotalAmount = lines.reduce(
    (sum, line) => sum + line.totalAmount.toNumber(),
    0,
  );

  await db.cart.update({
    where: { id: cartId },
    data: {
      totalQuantity,
      subtotalAmount,
      totalAmount: subtotalAmount, // No tax for now
      totalTaxAmount: 0,
      updatedAt: new Date(),
    },
  });
}

// Page queries
export async function getPage(handle: string): Promise<Page> {
  const dbPage = await db.page.findUnique({
    where: { handle },
  });

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
  const dbPages = await db.page.findMany();

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
  const dbMenu = await db.menu.findUnique({
    where: { handle },
    include: {
      items: {
        orderBy: { position: "asc" },
      },
    },
  });

  if (!dbMenu) return [];

  return dbMenu.items.map((item) => ({
    title: item.title,
    path: item.url,
  }));
}
