import { NextRequest, NextResponse } from "next/server";
import prisma from "lib/prisma";
import { verifyAuth } from "app/api/utils/auth";
import {
  generateCouponCode,
  formatCouponCode,
  isValidCouponCode,
} from "lib/coupon-utils";

// GET /api/admin/coupons - List all coupons
export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const authResult = await verifyAuth(request);
    if (!authResult.isValid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status"); // 'active' | 'inactive' | 'all'

    const where: any = {};
    if (status === "active") {
      where.isActive = true;
    } else if (status === "inactive") {
      where.isActive = false;
    }

    const coupons = await prisma.coupon.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ coupons });
  } catch (error) {
    console.error("Get coupons error:", error);
    return NextResponse.json(
      { error: "Failed to fetch coupons" },
      { status: 500 },
    );
  }
}

// POST /api/admin/coupons - Create new coupon
export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    const authResult = await verifyAuth(request);
    if (!authResult.isValid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    let {
      code,
      description,
      discountType,
      discountValue,
      minOrderValue,
      maxUses,
      maxUsesPerUser,
      requiresLogin,
      startDate,
      expiryDate,
      isActive,
      autoGenerate,
    } = body;

    // Auto-generate code if requested or if code is empty
    if (autoGenerate || !code || code.trim() === "") {
      let attempts = 0;
      let unique = false;

      while (!unique && attempts < 10) {
        code = generateCouponCode();
        const existing = await prisma.coupon.findFirst({
          where: { code: { equals: code, mode: "insensitive" } },
        });
        unique = !existing;
        attempts++;
      }

      if (!unique) {
        return NextResponse.json(
          { error: "Failed to generate unique coupon code" },
          { status: 500 },
        );
      }
    } else {
      // Format and validate provided code
      code = formatCouponCode(code);

      if (!isValidCouponCode(code)) {
        return NextResponse.json(
          {
            error:
              "Invalid coupon code format. Use only letters, numbers, and hyphens (3-50 characters)",
          },
          { status: 400 },
        );
      }
    }

    // Validation
    if (
      !discountType ||
      !["percentage", "fixed", "free_shipping"].includes(discountType)
    ) {
      return NextResponse.json(
        { error: "Valid discount type is required" },
        { status: 400 },
      );
    }

    if (discountType !== "free_shipping") {
      if (!discountValue || discountValue <= 0) {
        return NextResponse.json(
          { error: "Discount value must be greater than 0" },
          { status: 400 },
        );
      }
    }

    // Check if code already exists
    const existing = await prisma.coupon.findFirst({
      where: {
        code: {
          equals: code,
          mode: "insensitive",
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Coupon code already exists" },
        { status: 400 },
      );
    }

    // Create coupon
    const coupon = await prisma.coupon.create({
      data: {
        code,
        description,
        discountType,
        discountValue: discountType === "free_shipping" ? 0 : discountValue,
        minOrderValue: minOrderValue || null,
        maxUses: maxUses || null,
        maxUsesPerUser: maxUsesPerUser || null,
        requiresLogin: requiresLogin || false,
        startDate: startDate ? new Date(startDate) : null,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        isActive: isActive !== undefined ? isActive : true,
      },
    });

    return NextResponse.json({ coupon }, { status: 201 });
  } catch (error) {
    console.error("Create coupon error:", error);
    return NextResponse.json(
      { error: "Failed to create coupon" },
      { status: 500 },
    );
  }
}
