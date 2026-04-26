import { and, desc, eq, gte, sql } from "drizzle-orm";
import { requireAdminSession } from "lib/admin-auth";
import { db } from "lib/db";
import { adminUsers, orders } from "lib/db/schema";
import { NextRequest, NextResponse } from "next/server";

function toIsoDate(value: Date | string | null | undefined) {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

export async function GET() {
  try {
    const session = await requireAdminSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [admin] = await db
      .select({
        id: adminUsers.id,
        email: adminUsers.email,
        name: adminUsers.name,
        role: adminUsers.role,
        isActive: adminUsers.isActive,
        createdAt: adminUsers.createdAt,
        lastLoginAt: adminUsers.lastLoginAt,
      })
      .from(adminUsers)
      .where(eq(adminUsers.id, session.user.id))
      .limit(1);

    if (!admin) {
      return NextResponse.json({ error: "Admin not found" }, { status: 404 });
    }

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [summaryRows, statusBreakdownRows, recent30dRows, recentOrdersRows] =
      await Promise.all([
        db
          .select({
            totalAcknowledged: sql<number>`count(*)`,
            totalValue: sql<string>`coalesce(sum(${orders.totalAmount}), '0')`,
            firstAcknowledgedAt: sql<Date | null>`min(${orders.acknowledgedAt})`,
            lastAcknowledgedAt: sql<Date | null>`max(${orders.acknowledgedAt})`,
          })
          .from(orders)
          .where(eq(orders.acknowledgedBy, admin.email)),
        db
          .select({
            status: orders.status,
            count: sql<number>`count(*)`,
          })
          .from(orders)
          .where(eq(orders.acknowledgedBy, admin.email))
          .groupBy(orders.status)
          .orderBy(desc(sql<number>`count(*)`)),
        db
          .select({
            recentCount: sql<number>`count(*)`,
          })
          .from(orders)
          .where(
            and(
              eq(orders.acknowledgedBy, admin.email),
              gte(orders.acknowledgedAt, thirtyDaysAgo),
            ),
          ),
        db
          .select({
            id: orders.id,
            orderNumber: orders.orderNumber,
            status: orders.status,
            deliveryStatus: orders.deliveryStatus,
            customerName: orders.customerName,
            email: orders.email,
            totalAmount: orders.totalAmount,
            acknowledgedAt: orders.acknowledgedAt,
            createdAt: orders.createdAt,
          })
          .from(orders)
          .where(eq(orders.acknowledgedBy, admin.email))
          .orderBy(desc(orders.acknowledgedAt), desc(orders.createdAt))
          .limit(8),
      ]);

    const summary = summaryRows[0] || {
      totalAcknowledged: 0,
      totalValue: "0",
      firstAcknowledgedAt: null,
      lastAcknowledgedAt: null,
    };

    return NextResponse.json({
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
        isActive: admin.isActive,
        createdAt: admin.createdAt.toISOString(),
        lastLoginAt: admin.lastLoginAt?.toISOString() || null,
      },
      stats: {
        totalAcknowledged: Number(summary.totalAcknowledged),
        totalValue: Number(summary.totalValue || 0),
        handled30d: Number(recent30dRows[0]?.recentCount ?? 0),
        firstAcknowledgedAt: toIsoDate(summary.firstAcknowledgedAt),
        lastAcknowledgedAt: toIsoDate(summary.lastAcknowledgedAt),
        statusBreakdown: statusBreakdownRows.map((row) => ({
          status: row.status,
          count: Number(row.count),
        })),
        recentOrders: recentOrdersRows.map((order) => ({
          id: order.id,
          orderNumber: order.orderNumber,
          status: order.status,
          deliveryStatus: order.deliveryStatus,
          customerName: order.customerName,
          email: order.email,
          totalAmount: Number(order.totalAmount || 0),
          acknowledgedAt: toIsoDate(order.acknowledgedAt),
          createdAt: toIsoDate(order.createdAt),
        })),
      },
    });
  } catch (error) {
    console.error("Failed to fetch admin account:", error);
    return NextResponse.json(
      { error: "Failed to fetch admin account" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await requireAdminSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const nameValue = typeof body?.name === "string" ? body.name.trim() : "";

    if (!nameValue) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 },
      );
    }

    if (nameValue.length > 255) {
      return NextResponse.json(
        { error: "Name is too long" },
        { status: 400 },
      );
    }

    const [admin] = await db
      .update(adminUsers)
      .set({ name: nameValue, updatedAt: new Date() })
      .where(eq(adminUsers.id, session.user.id))
      .returning({
        id: adminUsers.id,
        email: adminUsers.email,
        name: adminUsers.name,
        role: adminUsers.role,
        isActive: adminUsers.isActive,
        createdAt: adminUsers.createdAt,
        lastLoginAt: adminUsers.lastLoginAt,
      });

    if (!admin) {
      return NextResponse.json({ error: "Admin not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
        isActive: admin.isActive,
        createdAt: admin.createdAt.toISOString(),
        lastLoginAt: admin.lastLoginAt?.toISOString() || null,
      },
    });
  } catch (error) {
    console.error("Failed to update admin account:", error);
    return NextResponse.json(
      { error: "Failed to update admin account" },
      { status: 500 },
    );
  }
}
