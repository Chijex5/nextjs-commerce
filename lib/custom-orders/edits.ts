import { asc, eq } from "drizzle-orm";
import { db } from "lib/db";
import { customEditOptions } from "lib/db/schema";
import type { EditOption } from "./shared";

export type EditOptionRow = EditOption & { isActive: boolean; position: number };

export async function listEditOptions({
  activeOnly = true,
}: { activeOnly?: boolean } = {}): Promise<EditOptionRow[]> {
  const rows = await db
    .select()
    .from(customEditOptions)
    .where(activeOnly ? eq(customEditOptions.isActive, true) : undefined)
    .orderBy(asc(customEditOptions.position), asc(customEditOptions.createdAt));
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    description: r.description,
    price: Number(r.price),
    image: r.image,
    detailPrompt: r.detailPrompt,
    needsReview: r.needsReview,
    isActive: r.isActive,
    position: r.position,
  }));
}
