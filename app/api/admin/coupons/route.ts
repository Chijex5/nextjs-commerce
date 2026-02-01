import { NextRequest, NextResponse } from "next/server";
import { db } from "lib/db";
import { coupons } from "lib/db/schema";
import { verifyAuth } from "app/api/utils/auth";
import {
  generateCouponCode,
  formatCouponCode,
  isValidCouponCode,
} from "lib/coupon-utils";
import { desc, eq, ilike } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.isValid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    let whereClause;
    if (status === "active") {
      whereClause = eq(coupons.isActive, true);
    } else if (status === "inactive") {
      whereClause = eq(coupons.isActive, false);
    }

    const couponRows = await db
      .select()
      .from(coupons)
      .where(whereClause)
      .orderBy(desc(coupons.createdAt));

    return NextResponse.json({ coupons: couponRows });
  } catch (error) {
    console.error("Get coupons error:", error);
    return NextResponse.json(
      { error: "Failed to fetch coupons" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
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

    if (autoGenerate || !code || code.trim() === "") {
      let attempts = 0;
      let unique = false;

      while (!unique && attempts < 10) {
        code = generateCouponCode();
        const [existing] = await db
          .select({ id: coupons.id })
          .from(coupons)
          .where(ilike(coupons.code, code))
          .limit(1);
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

    const [existing] = await db
      .select({ id: coupons.id })
      .from(coupons)
      .where(ilike(coupons.code, code))
      .limit(1);

    if (existing) {
      return NextResponse.json(
        { error: "Coupon code already exists" },
        { status: 400 },
      );
    }

    const [coupon] = await db
      .insert(coupons)
      .values({
        code,
        description,
        discountType,
        discountValue:
          discountType === "free_shipping" ? "0" : String(discountValue),
        minOrderValue: minOrderValue ? String(minOrderValue) : null,
        maxUses: maxUses || null,
        maxUsesPerUser: maxUsesPerUser || null,
        requiresLogin: requiresLogin || false,
        startDate: startDate ? new Date(startDate) : null,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        isActive: isActive !== undefined ? isActive : true,
      })
      .returning();

    return NextResponse.json({ coupon }, { status: 201 });
  } catch (error) {
    console.error("Create coupon error:", error);
    return NextResponse.json(
      { error: "Failed to create coupon" },
      { status: 500 },
    );
  }
}
