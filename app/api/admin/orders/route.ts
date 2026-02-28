import { and, desc, eq, ilike, inArray, or, sql } from "drizzle-orm";
import { requireAdminSession } from "lib/admin-auth";
import { db } from "lib/db";
import { customOrderRequests, orderItems, orders } from "lib/db/schema";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const session = await requireAdminSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const perPage = parseInt(searchParams.get("perPage") || "20");
    const status = searchParams.get("status");
    const deliveryStatus = searchParams.get("deliveryStatus");
    const orderType = searchParams.get("orderType");
    const search = searchParams.get("search");

    const filters = [];

    if (status && status !== "all") {
      filters.push(eq(orders.status, status));
    }

    if (deliveryStatus && deliveryStatus !== "all") {
      filters.push(eq(orders.deliveryStatus, deliveryStatus));
    }

    if (orderType && orderType !== "all") {
      filters.push(eq(orders.orderType, orderType));
    }

    if (search) {
      const searchValue = `%${search}%`;
      filters.push(
        or(
          ilike(orders.orderNumber, searchValue),
          ilike(orders.customerName, searchValue),
          ilike(orders.email, searchValue),
        ),
      );
    }

    const whereClause = filters.length ? and(...filters) : undefined;

    const [orderRows, totalResult] = await Promise.all([
      db
        .select()
        .from(orders)
        .where(whereClause)
        .orderBy(desc(orders.createdAt))
        .limit(perPage)
        .offset((page - 1) * perPage),
      db
        .select({ count: sql<number>`count(*)` })
        .from(orders)
        .where(whereClause),
    ]);

    const orderIds = orderRows.map((order) => order.id);
    const items = orderIds.length
      ? await db
          .select()
          .from(orderItems)
          .where(inArray(orderItems.orderId, orderIds))
      : [];

    const itemsByOrder = items.reduce<Record<string, typeof items>>(
      (acc, item) => {
        (acc[item.orderId] ??= [] as typeof items).push(item);
        return acc;
      },
      {},
    );

    const total = Number(totalResult[0]?.count ?? 0);
    const totalPages = Math.ceil(total / perPage);
    const requestIds = orderRows
      .map((order) => order.customOrderRequestId)
      .filter((value): value is string => Boolean(value));
    const requestRows = requestIds.length
      ? await db
          .select({
            id: customOrderRequests.id,
            requestNumber: customOrderRequests.requestNumber,
          })
          .from(customOrderRequests)
          .where(inArray(customOrderRequests.id, requestIds))
      : [];
    const requestMap = new Map(
      requestRows.map((requestRow) => [requestRow.id, requestRow.requestNumber]),
    );

    return NextResponse.json({
      orders: orderRows.map((order) => {
        const orderItemsList = itemsByOrder[order.id] || [];
        return {
          id: order.id,
          orderNumber: order.orderNumber,
          orderType: order.orderType,
          customOrderRequestId: order.customOrderRequestId,
          customRequestNumber: order.customOrderRequestId
            ? requestMap.get(order.customOrderRequestId) || null
            : null,
          customerName: order.customerName,
          email: order.email,
          phone: order.phone,
          status: order.status,
          deliveryStatus: order.deliveryStatus,
          estimatedArrival: order.estimatedArrival?.toISOString() || null,
          totalAmount: String(order.totalAmount),
          currencyCode: order.currencyCode,
          shippingAddress: order.shippingAddress,
          acknowledgedAt: order.acknowledgedAt?.toISOString() || null,
          acknowledgedBy: order.acknowledgedBy,
          createdAt: order.createdAt.toISOString(),
          updatedAt: order.updatedAt.toISOString(),
          itemCount: orderItemsList.length,
          items: orderItemsList.map((item) => ({
            id: item.id,
            productTitle: item.productTitle,
            variantTitle: item.variantTitle,
            quantity: item.quantity,
            price: String(item.price),
            totalAmount: String(item.totalAmount),
          })),
        };
      }),
      pagination: {
        page,
        perPage,
        total,
        totalPages,
      },
    });
  } catch (error) {
    console.error("Failed to fetch orders:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 },
    );
  }
}
