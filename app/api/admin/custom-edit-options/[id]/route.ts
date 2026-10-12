import { eq } from "drizzle-orm";
import { requireAdminSession } from "lib/admin-auth";
import { db } from "lib/db";
import { customEditOptions } from "lib/db/schema";
import { NextRequest, NextResponse } from "next/server";
import { readEditOption } from "../validate";

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await context.params;
  const parsed = readEditOption(await request.json().catch(() => ({})));
  if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const [row] = await db
    .update(customEditOptions)
    .set({ ...parsed.value, updatedAt: new Date() })
    .where(eq(customEditOptions.id, id))
    .returning({ id: customEditOptions.id });
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ success: true });
}

/** Past requests keep their own copy of the edit, so deleting is safe. */
export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await context.params;
  await db.delete(customEditOptions).where(eq(customEditOptions.id, id));
  return NextResponse.json({ success: true });
}
