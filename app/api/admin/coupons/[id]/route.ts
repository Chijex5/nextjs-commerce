import { NextRequest, NextResponse } from "next/server";
import { db } from "lib/db";
import { coupons } from "lib/db/schema";
import { verifyAuth } from "app/api/utils/auth";
import { eq } from "drizzle-orm";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.isValid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const params = await context.params;
    const { id } = params;
    const body = await request.json();

    const [existing] = await db
      .select({ id: coupons.id })
      .from(coupons)
      .where(eq(coupons.id, id))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
    }

    const updateData: Partial<typeof coupons.$inferInsert> = {};

    if (body.description !== undefined) updateData.description = body.description;
    if (body.discountValue !== undefined)
      updateData.discountValue = String(body.discountValue);
    if (body.minOrderValue !== undefined)
      updateData.minOrderValue = body.minOrderValue
        ? String(body.minOrderValue)
        : null;
    if (body.maxUses !== undefined) updateData.maxUses = body.maxUses || null;
    if (body.maxUsesPerUser !== undefined)
      updateData.maxUsesPerUser = body.maxUsesPerUser || null;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;
    if (body.startDate !== undefined)
      updateData.startDate = body.startDate ? new Date(body.startDate) : null;
    if (body.expiryDate !== undefined)
      updateData.expiryDate = body.expiryDate
        ? new Date(body.expiryDate)
        : null;

    const [coupon] = await db
      .update(coupons)
      .set(updateData)
      .where(eq(coupons.id, id))
      .returning();

    return NextResponse.json({ coupon });
  } catch (error) {
    console.error("Update coupon error:", error);
    return NextResponse.json(
      { error: "Failed to update coupon" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.isValid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const params = await context.params;
    const { id } = params;

    await db.delete(coupons).where(eq(coupons.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete coupon error:", error);
    return NextResponse.json(
      { error: "Failed to delete coupon" },
      { status: 500 },
    );
  }
}
