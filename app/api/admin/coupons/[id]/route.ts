import { NextRequest, NextResponse } from "next/server";
import { db } from "lib/db";
import { couponUsages, coupons, orders, users } from "lib/db/schema";
import { verifyAuth } from "app/api/utils/auth";
import { formatCouponCode, isValidCouponCode } from "lib/coupon-utils";
import { and, desc, eq, ilike, isNotNull, ne, sql } from "drizzle-orm";

function toISOStringOrNull(value: unknown) {
  if (!value) return null;

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value.toISOString();
  }

  const parsed = new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

export async function GET(
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

    const [coupon] = await db
      .select()
      .from(coupons)
      .where(eq(coupons.id, id))
      .limit(1);

    if (!coupon) {
      return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
    }

    const couponCodeFilter = sql`lower(${orders.couponCode}) = lower(${coupon.code})`;

    const [usageStatsRows, recentUsageRows, topUsersRows, orderStatsRows, recentOrderRows] =
      await Promise.all([
        db
          .select({
            usageEvents: sql<number>`count(*)`,
            uniqueUsers: sql<number>`count(distinct ${couponUsages.userId})`,
            guestUses: sql<number>`count(*) filter (where ${couponUsages.userId} is null)`,
            lastUsedAt: sql<Date | null>`max(${couponUsages.usedAt})`,
          })
          .from(couponUsages)
          .where(eq(couponUsages.couponId, id)),
        db
          .select({
            id: couponUsages.id,
            userId: couponUsages.userId,
            sessionId: couponUsages.sessionId,
            usedAt: couponUsages.usedAt,
            userEmail: users.email,
            userName: users.name,
          })
          .from(couponUsages)
          .leftJoin(users, eq(couponUsages.userId, users.id))
          .where(eq(couponUsages.couponId, id))
          .orderBy(desc(couponUsages.usedAt))
          .limit(20),
        db
          .select({
            userId: couponUsages.userId,
            userEmail: users.email,
            userName: users.name,
            usageCount: sql<number>`count(*)`,
            lastUsedAt: sql<Date | null>`max(${couponUsages.usedAt})`,
          })
          .from(couponUsages)
          .leftJoin(users, eq(couponUsages.userId, users.id))
          .where(and(eq(couponUsages.couponId, id), isNotNull(couponUsages.userId)))
          .groupBy(couponUsages.userId, users.email, users.name)
          .orderBy(desc(sql<number>`count(*)`))
          .limit(5),
        db
          .select({
            orderCount: sql<number>`count(*)`,
            totalRevenue: sql<string>`coalesce(sum(${orders.totalAmount}), 0)`,
            totalDiscountGiven: sql<string>`coalesce(sum(${orders.discountAmount}), 0)`,
            avgOrderValue: sql<string>`coalesce(avg(${orders.totalAmount}), 0)`,
            lastOrderAt: sql<Date | null>`max(${orders.createdAt})`,
          })
          .from(orders)
          .where(couponCodeFilter),
        db
          .select({
            id: orders.id,
            orderNumber: orders.orderNumber,
            customerName: orders.customerName,
            email: orders.email,
            status: orders.status,
            totalAmount: orders.totalAmount,
            discountAmount: orders.discountAmount,
            createdAt: orders.createdAt,
          })
          .from(orders)
          .where(couponCodeFilter)
          .orderBy(desc(orders.createdAt))
          .limit(10),
      ]);

    const usageStats = usageStatsRows[0];
    const orderStats = orderStatsRows[0];

    const maxUses = coupon.maxUses;
    const remainingUses =
      typeof maxUses === "number" ? Math.max(maxUses - coupon.usedCount, 0) : null;
    const usageRatePercent =
      typeof maxUses === "number" && maxUses > 0
        ? Math.min((coupon.usedCount / maxUses) * 100, 100)
        : null;

    return NextResponse.json({
      coupon,
      stats: {
        remainingUses,
        usageRatePercent,
        usageEvents: Number(usageStats?.usageEvents ?? 0),
        uniqueUsers: Number(usageStats?.uniqueUsers ?? 0),
        guestUses: Number(usageStats?.guestUses ?? 0),
        lastUsedAt: toISOStringOrNull(usageStats?.lastUsedAt),
        orderCount: Number(orderStats?.orderCount ?? 0),
        totalRevenue: Number(orderStats?.totalRevenue ?? 0),
        totalDiscountGiven: Number(orderStats?.totalDiscountGiven ?? 0),
        avgOrderValue: Number(orderStats?.avgOrderValue ?? 0),
        lastOrderAt: toISOStringOrNull(orderStats?.lastOrderAt),
      },
      recentUsage: recentUsageRows.map((usage) => ({
        id: usage.id,
        userId: usage.userId,
        sessionId: usage.sessionId,
        usedAt: toISOStringOrNull(usage.usedAt) || new Date(0).toISOString(),
        userEmail: usage.userEmail,
        userName: usage.userName,
      })),
      topUsers: topUsersRows.map((user) => ({
        userId: user.userId,
        userEmail: user.userEmail,
        userName: user.userName,
        usageCount: Number(user.usageCount ?? 0),
        lastUsedAt: toISOStringOrNull(user.lastUsedAt),
      })),
      recentOrders: recentOrderRows.map((order) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        email: order.email,
        status: order.status,
        totalAmount: Number(order.totalAmount),
        discountAmount: Number(order.discountAmount),
        createdAt: toISOStringOrNull(order.createdAt) || new Date(0).toISOString(),
      })),
    });
  } catch (error) {
    console.error("Get coupon detail error:", error);
    return NextResponse.json(
      { error: "Failed to fetch coupon details" },
      { status: 500 },
    );
  }
}

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
      .select()
      .from(coupons)
      .where(eq(coupons.id, id))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
    }

    const updateData: Partial<typeof coupons.$inferInsert> = {};

    if (body.code !== undefined) {
      const formattedCode = formatCouponCode(String(body.code || ""));

      if (!isValidCouponCode(formattedCode)) {
        return NextResponse.json(
          {
            error:
              "Invalid coupon code format. Use only letters, numbers, and hyphens (3-50 characters)",
          },
          { status: 400 },
        );
      }

      const [codeConflict] = await db
        .select({ id: coupons.id })
        .from(coupons)
        .where(and(ilike(coupons.code, formattedCode), ne(coupons.id, id)))
        .limit(1);

      if (codeConflict) {
        return NextResponse.json(
          { error: "Coupon code already exists" },
          { status: 400 },
        );
      }

      updateData.code = formattedCode;
    }

    if (body.description !== undefined) {
      if (body.description === null || body.description === "") {
        updateData.description = null;
      } else if (typeof body.description === "string") {
        updateData.description = body.description.trim();
      } else {
        return NextResponse.json(
          { error: "Description must be a string" },
          { status: 400 },
        );
      }
    }

    const nextDiscountType = body.discountType ?? existing.discountType;
    if (!["percentage", "fixed", "free_shipping"].includes(nextDiscountType)) {
      return NextResponse.json(
        { error: "Valid discount type is required" },
        { status: 400 },
      );
    }

    if (body.discountType !== undefined) {
      updateData.discountType = nextDiscountType;
    }

    if (body.discountValue !== undefined || body.discountType !== undefined) {
      const resolvedDiscountValue =
        body.discountValue !== undefined
          ? Number(body.discountValue)
          : Number(existing.discountValue);

      if (
        nextDiscountType !== "free_shipping" &&
        (!Number.isFinite(resolvedDiscountValue) || resolvedDiscountValue <= 0)
      ) {
        return NextResponse.json(
          { error: "Discount value must be greater than 0" },
          { status: 400 },
        );
      }

      updateData.discountValue =
        nextDiscountType === "free_shipping" ? "0" : String(resolvedDiscountValue);
    }

    if (body.minOrderValue !== undefined)
      if (body.minOrderValue === null || body.minOrderValue === "") {
        updateData.minOrderValue = null;
      } else {
        const minOrderValue = Number(body.minOrderValue);
        if (!Number.isFinite(minOrderValue) || minOrderValue < 0) {
          return NextResponse.json(
            { error: "Minimum order value must be 0 or greater" },
            { status: 400 },
          );
        }
        updateData.minOrderValue = String(minOrderValue);
      }

    if (body.maxUses !== undefined) {
      if (body.maxUses === null || body.maxUses === "") {
        updateData.maxUses = null;
      } else {
        const maxUses = Number(body.maxUses);
        if (!Number.isInteger(maxUses) || maxUses <= 0) {
          return NextResponse.json(
            { error: "Total usage limit must be a positive whole number" },
            { status: 400 },
          );
        }
        if (maxUses < existing.usedCount) {
          return NextResponse.json(
            {
              error: `Total usage limit cannot be lower than used count (${existing.usedCount})`,
            },
            { status: 400 },
          );
        }
        updateData.maxUses = maxUses;
      }
    }

    if (body.maxUsesPerUser !== undefined)
      if (body.maxUsesPerUser === null || body.maxUsesPerUser === "") {
        updateData.maxUsesPerUser = null;
      } else {
        const maxUsesPerUser = Number(body.maxUsesPerUser);
        if (!Number.isInteger(maxUsesPerUser) || maxUsesPerUser <= 0) {
          return NextResponse.json(
            { error: "Per customer limit must be a positive whole number" },
            { status: 400 },
          );
        }
        updateData.maxUsesPerUser = maxUsesPerUser;
      }

    if (body.requiresLogin !== undefined) {
      updateData.requiresLogin = Boolean(body.requiresLogin);
    }

    if (body.isActive !== undefined) updateData.isActive = body.isActive;

    const nextStartDate =
      body.startDate !== undefined
        ? body.startDate
          ? new Date(body.startDate)
          : null
        : existing.startDate;

    const nextExpiryDate =
      body.expiryDate !== undefined
        ? body.expiryDate
          ? new Date(body.expiryDate)
          : null
        : existing.expiryDate;

    if (
      nextStartDate &&
      nextExpiryDate &&
      nextExpiryDate.getTime() <= nextStartDate.getTime()
    ) {
      return NextResponse.json(
        { error: "Expiry date must be later than start date" },
        { status: 400 },
      );
    }

    if (body.startDate !== undefined) {
      if (body.startDate && Number.isNaN(nextStartDate?.getTime())) {
        return NextResponse.json(
          { error: "Invalid start date" },
          { status: 400 },
        );
      }
      updateData.startDate = nextStartDate;
    }

    if (body.expiryDate !== undefined) {
      if (body.expiryDate && Number.isNaN(nextExpiryDate?.getTime())) {
        return NextResponse.json(
          { error: "Invalid expiry date" },
          { status: 400 },
        );
      }
      updateData.expiryDate = nextExpiryDate;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No valid fields provided for update" },
        { status: 400 },
      );
    }

    const [coupon] = await db
      .update(coupons)
      .set({ ...updateData, updatedAt: new Date() })
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
