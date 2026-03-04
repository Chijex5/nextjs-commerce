import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import { requireAdminSession } from "lib/admin-auth";
import { TAGS } from "lib/constants";
import { db } from "lib/db";
import {
  collections,
  googleMerchantProductSyncs,
  productCollections,
  productImages,
  productVariants,
  products,
} from "lib/db/schema";
import {
  createGoogleMerchantClient,
  getGoogleMerchantId,
} from "lib/google-merchant";
import { canonicalUrl } from "lib/seo";
import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

type SyncRequestBody = {
  includeAlreadySynced?: boolean;
  syncCarousel?: boolean;
};

const DEFAULT_CAROUSEL_COLLECTION_HANDLE = "hidden-homepage-carousel";
const GOOGLE_MERCHANT_MAX_ADDITIONAL_IMAGES = 10;

const parseRequestBody = async (
  request: Request,
): Promise<SyncRequestBody> => {
  try {
    const body = (await request.json()) as unknown;
    if (typeof body === "object" && body !== null && !Array.isArray(body)) {
      return body as SyncRequestBody;
    }
    return {};
  } catch {
    return {};
  }
};

const buildOfferId = (handle: string, productId: string) => {
  const sanitizedHandle = handle
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);

  if (sanitizedHandle.length > 0) {
    return sanitizedHandle;
  }

  return `product-${productId.slice(0, 12)}`;
};

const formatPrice = (value: string | number) => {
  const parsed = Number.parseFloat(String(value));
  if (!Number.isFinite(parsed)) {
    return "0.00";
  }
  return parsed.toFixed(2);
};

async function syncCarouselCollection(productIds: string[]) {
  if (productIds.length === 0) {
    return {
      collectionHandle: DEFAULT_CAROUSEL_COLLECTION_HANDLE,
      insertedCount: 0,
      createdCollection: false,
    };
  }

  const collectionHandle =
    process.env.GOOGLE_MERCHANT_CAROUSEL_COLLECTION_HANDLE ||
    DEFAULT_CAROUSEL_COLLECTION_HANDLE;

  let [carouselCollection] = await db
    .select()
    .from(collections)
    .where(eq(collections.handle, collectionHandle))
    .limit(1);

  let createdCollection = false;

  if (!carouselCollection) {
    [carouselCollection] = await db
      .insert(collections)
      .values({
        handle: collectionHandle,
        title: "Homepage Carousel",
        description:
          "Auto-managed collection for products synced to Google Merchant.",
      })
      .returning();

    createdCollection = true;
  }

  if (!carouselCollection) {
    throw new Error("Failed to resolve carousel collection");
  }

  const existingLinks = await db
    .select({ productId: productCollections.productId })
    .from(productCollections)
    .where(
      and(
        eq(productCollections.collectionId, carouselCollection.id),
        inArray(productCollections.productId, productIds),
      ),
    );

  const existingProductIds = new Set(existingLinks.map((row) => row.productId));
  const missingProductIds = productIds.filter((id) => !existingProductIds.has(id));

  if (missingProductIds.length === 0) {
    return {
      collectionHandle,
      insertedCount: 0,
      createdCollection,
    };
  }

  const [positionResult] = await db
    .select({
      maxPosition: sql<number>`coalesce(max(${productCollections.position}), -1)`,
    })
    .from(productCollections)
    .where(eq(productCollections.collectionId, carouselCollection.id));

  const startPosition = Number(positionResult?.maxPosition ?? -1) + 1;

  await db.insert(productCollections).values(
    missingProductIds.map((productId, index) => ({
      productId,
      collectionId: carouselCollection.id,
      position: startPosition + index,
    })),
  );

  return {
    collectionHandle,
    insertedCount: missingProductIds.length,
    createdCollection,
  };
}

export async function POST(request: Request) {
  try {
    const session = await requireAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const merchantId = getGoogleMerchantId();
    if (!merchantId) {
      return NextResponse.json(
        {
          error:
            "GOOGLE_MERCHANT_ID is missing. Configure Google Merchant environment variables first.",
        },
        { status: 400 },
      );
    }

    const body = await parseRequestBody(request);
    const includeAlreadySynced = body.includeAlreadySynced === true;
    const syncCarousel = body.syncCarousel !== false;

    const productRows = await db
      .select({
        id: products.id,
        title: products.title,
        handle: products.handle,
        description: products.description,
        seoDescription: products.seoDescription,
        availableForSale: products.availableForSale,
      })
      .from(products)
      .orderBy(desc(products.createdAt));

    if (productRows.length === 0) {
      return NextResponse.json({
        success: true,
        totalProducts: 0,
        attempted: 0,
        synced: 0,
        skipped: 0,
        failed: 0,
        failures: [] as Array<{ productId: string; handle: string; reason: string }>,
        carousel: {
          enabled: syncCarousel,
          collectionHandle:
            process.env.GOOGLE_MERCHANT_CAROUSEL_COLLECTION_HANDLE ||
            DEFAULT_CAROUSEL_COLLECTION_HANDLE,
          insertedCount: 0,
          createdCollection: false,
        },
      });
    }

    const productIds = productRows.map((product) => product.id);

    const [variantRows, imageRows, syncRows] = await Promise.all([
      db
        .select({
          productId: productVariants.productId,
          price: productVariants.price,
          currencyCode: productVariants.currencyCode,
        })
        .from(productVariants)
        .where(inArray(productVariants.productId, productIds))
        .orderBy(asc(productVariants.price)),
      db
        .select({
          productId: productImages.productId,
          url: productImages.url,
          position: productImages.position,
        })
        .from(productImages)
        .where(inArray(productImages.productId, productIds))
        .orderBy(asc(productImages.position)),
      db
        .select()
        .from(googleMerchantProductSyncs)
        .where(
          and(
            inArray(googleMerchantProductSyncs.productId, productIds),
            eq(googleMerchantProductSyncs.merchantId, merchantId),
          ),
        ),
    ]);

    const variantByProductId = new Map<
      string,
      { price: string; currencyCode: string }
    >();

    for (const variant of variantRows) {
      if (!variantByProductId.has(variant.productId)) {
        variantByProductId.set(variant.productId, {
          price: String(variant.price),
          currencyCode: variant.currencyCode || "NGN",
        });
      }
    }

    const imageLinksByProductId = new Map<string, string[]>();
    for (const image of imageRows) {
      const existing = imageLinksByProductId.get(image.productId) ?? [];
      existing.push(image.url);
      imageLinksByProductId.set(image.productId, existing);
    }

    const syncByProductId = new Map(syncRows.map((row) => [row.productId, row]));
    const existingSyncedProductIds = syncRows
      .filter((row) => row.syncStatus === "synced")
      .map((row) => row.productId);

    const syncQueue = productRows.filter((product) => {
      const syncState = syncByProductId.get(product.id);
      if (!syncState) return true;
      if (syncState.syncStatus !== "synced") return true;
      return includeAlreadySynced;
    });

    const skipped = productRows.length - syncQueue.length;
    const failures: Array<{ productId: string; handle: string; reason: string }> = [];
    const syncedProductIds: string[] = [];

    if (syncQueue.length > 0) {
      const merchantClient = await createGoogleMerchantClient();

      for (const product of syncQueue) {
        const variant = variantByProductId.get(product.id);

        if (!variant) {
          const reason = "Product has no variant/price and cannot be synced";
          failures.push({ productId: product.id, handle: product.handle, reason });

          await db
            .insert(googleMerchantProductSyncs)
            .values({
              productId: product.id,
              merchantId,
              offerId: buildOfferId(product.handle, product.id),
              syncStatus: "failed",
              lastError: reason,
              payload: { reason },
              updatedAt: new Date(),
            })
            .onConflictDoUpdate({
              target: [
                googleMerchantProductSyncs.productId,
                googleMerchantProductSyncs.merchantId,
              ],
              set: {
                syncStatus: "failed",
                lastError: reason,
                payload: { reason },
                updatedAt: new Date(),
              },
            });

          continue;
        }

        const offerId = buildOfferId(product.handle, product.id);
        const imageLinks = imageLinksByProductId.get(product.id) ?? [];
        const [imageLink, ...remainingImageLinks] = imageLinks;
        const additionalImageLinks = remainingImageLinks.slice(
          0,
          GOOGLE_MERCHANT_MAX_ADDITIONAL_IMAGES,
        );

        try {
          const response = await merchantClient.upsertProduct({
            offerId,
            title: product.title.slice(0, 150),
            description: (product.seoDescription || product.description || product.title)
              .slice(0, 5000),
            link: canonicalUrl(`/product/${product.handle}`),
            imageLink,
            additionalImageLinks:
              additionalImageLinks.length > 0 ? additionalImageLinks : undefined,
            availability: product.availableForSale ? "in stock" : "out of stock",
            priceValue: formatPrice(variant.price),
            currencyCode: (variant.currencyCode || "NGN").toUpperCase(),
          });

          syncedProductIds.push(product.id);

          await db
            .insert(googleMerchantProductSyncs)
            .values({
              productId: product.id,
              merchantId,
              offerId,
              googleProductId: response.id,
              syncStatus: "synced",
              lastError: null,
              payload: response.raw,
              lastSyncedAt: new Date(),
              updatedAt: new Date(),
            })
            .onConflictDoUpdate({
              target: [
                googleMerchantProductSyncs.productId,
                googleMerchantProductSyncs.merchantId,
              ],
              set: {
                offerId,
                googleProductId: response.id,
                syncStatus: "synced",
                lastError: null,
                payload: response.raw,
                lastSyncedAt: new Date(),
                updatedAt: new Date(),
              },
            });
        } catch (error) {
          const reason = error instanceof Error ? error.message : "Unknown sync error";
          failures.push({ productId: product.id, handle: product.handle, reason });

          await db
            .insert(googleMerchantProductSyncs)
            .values({
              productId: product.id,
              merchantId,
              offerId,
              syncStatus: "failed",
              lastError: reason,
              payload: { reason },
              updatedAt: new Date(),
            })
            .onConflictDoUpdate({
              target: [
                googleMerchantProductSyncs.productId,
                googleMerchantProductSyncs.merchantId,
              ],
              set: {
                offerId,
                syncStatus: "failed",
                lastError: reason,
                payload: { reason },
                updatedAt: new Date(),
              },
            });
        }
      }
    }

    const carouselProductIds = Array.from(
      new Set([...existingSyncedProductIds, ...syncedProductIds]),
    );

    const carouselResult = syncCarousel
      ? await syncCarouselCollection(carouselProductIds)
      : {
          collectionHandle:
            process.env.GOOGLE_MERCHANT_CAROUSEL_COLLECTION_HANDLE ||
            DEFAULT_CAROUSEL_COLLECTION_HANDLE,
          insertedCount: 0,
          createdCollection: false,
        };

    if (syncedProductIds.length > 0 || carouselResult.insertedCount > 0) {
      revalidateTag(TAGS.products, "seconds");
      revalidateTag(TAGS.collections, "seconds");
    }

    return NextResponse.json({
      success: true,
      totalProducts: productRows.length,
      attempted: syncQueue.length,
      synced: syncedProductIds.length,
      skipped,
      failed: failures.length,
      failures,
      carousel: {
        enabled: syncCarousel,
        collectionHandle: carouselResult.collectionHandle,
        insertedCount: carouselResult.insertedCount,
        createdCollection: carouselResult.createdCollection,
      },
    });
  } catch (error) {
    
    console.error("Google Merchant sync failed:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to sync products to Google Merchant",
      },
      { status: 500 },
    );
  }
}
