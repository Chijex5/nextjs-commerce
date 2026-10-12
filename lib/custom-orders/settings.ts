import { eq } from "drizzle-orm";
import { db } from "lib/db";
import { storeSettings } from "lib/db/schema";
import { normaliseSettings, type CustomOrderSettings } from "./shared";

export { normaliseSettings };

const KEY = "custom_orders";

export async function getCustomOrderSettings(): Promise<CustomOrderSettings> {
  const [row] = await db
    .select({ value: storeSettings.value })
    .from(storeSettings)
    .where(eq(storeSettings.key, KEY))
    .limit(1);
  return normaliseSettings(row?.value);
}

export async function saveCustomOrderSettings(input: unknown) {
  const value = normaliseSettings(input);
  await db
    .insert(storeSettings)
    .values({ key: KEY, value })
    .onConflictDoUpdate({
      target: storeSettings.key,
      set: { value, updatedAt: new Date() },
    });
  return value;
}
