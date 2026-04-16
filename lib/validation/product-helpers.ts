import { db } from "@/lib/db";
import { collections, products } from "@/lib/db/schema";
import { eq, inArray } from "drizzle-orm";

/**
 * Check if a handle is already in use (with retry logic)
 */
export async function isHandleInUse(handle: string): Promise<boolean> {
  const existing = await db
    .select({ id: products.id })
    .from(products)
    .where(eq(products.handle, handle))
    .limit(1);

  return existing.length > 0;
}

/**
 * Generate a unique handle with retry
 * Appends a suffix if the base handle is taken
 */
export async function generateUniqueHandle(baseHandle: string): Promise<string> {
  let handle = baseHandle;
  let attempt = 0;
  const maxAttempts = 100;

  while (attempt < maxAttempts) {
    const inUse = await isHandleInUse(handle);
    if (!inUse) {
      return handle;
    }

    // Try with timestamp and attempt number
    const timestamp = Date.now();
    const suffix = attempt > 0 ? `-${attempt}` : "";
    handle = `${baseHandle}-${timestamp}${suffix}`.substring(0, 255);
    attempt++;
  }

  throw new Error("Could not generate unique handle after multiple attempts");
}

/**
 * Validate collection IDs exist in database
 */
export async function validateCollectionIds(collectionIds: string[]): Promise<{
  valid: boolean;
  error?: string;
  foundCount?: number;
}> {
  if (!collectionIds || collectionIds.length === 0) {
    return { valid: true, foundCount: 0 };
  }

  const found = await db
    .select({ id: collections.id })
    .from(collections)
    .where(inArray(collections.id, collectionIds));

  if (found.length !== collectionIds.length) {
    return {
      valid: false,
      foundCount: found.length,
      error: `Invalid collection IDs: found ${found.length} of ${collectionIds.length}`,
    };
  }

  return { valid: true, foundCount: found.length };
}
