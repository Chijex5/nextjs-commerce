import { NextRequest, NextResponse } from "next/server";
import prisma from "lib/prisma";
import { verifyAuth } from "app/api/utils/auth";

// PATCH /api/admin/coupons/[id] - Update coupon
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    // Verify admin authentication
    const authResult = await verifyAuth(request);
    if (!authResult.isValid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const params = await context.params;
    const { id } = params;
    const body = await request.json();

    // Find existing coupon
    const existing = await prisma.coupon.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
    }

    // Prepare update data
    const updateData: any = {};

    if (body.description !== undefined)
      updateData.description = body.description;
    if (body.discountValue !== undefined)
      updateData.discountValue = body.discountValue;
    if (body.minOrderValue !== undefined)
      updateData.minOrderValue = body.minOrderValue || null;
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

    // Update coupon
    const coupon = await prisma.coupon.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ coupon });
  } catch (error) {
    console.error("Update coupon error:", error);
    return NextResponse.json(
      { error: "Failed to update coupon" },
      { status: 500 },
    );
  }
}

// DELETE /api/admin/coupons/[id] - Delete coupon
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    // Verify admin authentication
    const authResult = await verifyAuth(request);
    if (!authResult.isValid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const params = await context.params;
    const { id } = params;

    // Delete coupon
    await prisma.coupon.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete coupon error:", error);
    return NextResponse.json(
      { error: "Failed to delete coupon" },
      { status: 500 },
    );
  }
}
