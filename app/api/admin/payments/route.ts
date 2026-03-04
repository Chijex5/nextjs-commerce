import { and, desc, eq, gte, ilike, lte, or, sql } from "drizzle-orm";
import { requireAdminSession } from "lib/admin-auth";
import { db } from "lib/db";
import { orders, paymentTransactions } from "lib/db/schema";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const session = await requireAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get("page") || 1));
    const perPage = Math.min(
      100,
      Math.max(10, Number(searchParams.get("perPage") || 20)),
    );
    const status = searchParams.get("status");
    const source = searchParams.get("source");
    const search = searchParams.get("search")?.trim();
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");

    const filters = [];

    if (status && status !== "all") {
      filters.push(eq(paymentTransactions.status, status));
    }

    if (source && source !== "all") {
      filters.push(eq(paymentTransactions.source, source));
    }

    if (search) {
      const like = `%${search}%`;
      filters.push(
        or(
          ilike(paymentTransactions.reference, like),
          ilike(paymentTransactions.conflictCode, like),
          ilike(orders.orderNumber, like),
          ilike(orders.email, like),
        ),
      );
    }

    if (dateFrom) {
      const parsed = new Date(dateFrom);
      if (!Number.isNaN(parsed.getTime())) {
        filters.push(gte(paymentTransactions.createdAt, parsed));
      }
    }

    if (dateTo) {
      const parsed = new Date(dateTo);
      if (!Number.isNaN(parsed.getTime())) {
        filters.push(lte(paymentTransactions.createdAt, parsed));
      }
    }

    const whereClause = filters.length ? and(...filters) : undefined;

    const [rows, totalResult, conflictResult] = await Promise.all([
      db
        .select({
          id: paymentTransactions.id,
          provider: paymentTransactions.provider,
          reference: paymentTransactions.reference,
          source: paymentTransactions.source,
          status: paymentTransactions.status,
          amount: paymentTransactions.amount,
          currencyCode: paymentTransactions.currencyCode,
          paystackStatus: paymentTransactions.paystackStatus,
          orderId: paymentTransactions.orderId,
          conflictCode: paymentTransactions.conflictCode,
          conflictMessage: paymentTransactions.conflictMessage,
          lastVerifiedAt: paymentTransactions.lastVerifiedAt,
          resolvedAt: paymentTransactions.resolvedAt,
          createdAt: paymentTransactions.createdAt,
          updatedAt: paymentTransactions.updatedAt,
          orderNumber: orders.orderNumber,
          orderEmail: orders.email,
          orderCustomerName: orders.customerName,
        })
        .from(paymentTransactions)
        .leftJoin(orders, eq(paymentTransactions.orderId, orders.id))
        .where(whereClause)
        .orderBy(desc(paymentTransactions.createdAt))
        .limit(perPage)
        .offset((page - 1) * perPage),
      db
        .select({ count: sql<number>`count(*)` })
        .from(paymentTransactions)
        .leftJoin(orders, eq(paymentTransactions.orderId, orders.id))
        .where(whereClause),
      db
        .select({ count: sql<number>`count(*)` })
        .from(paymentTransactions)
        .where(eq(paymentTransactions.status, "conflict")),
    ]);

    const total = Number(totalResult[0]?.count ?? 0);
    const conflictCount = Number(conflictResult[0]?.count ?? 0);

    return NextResponse.json({
      payments: rows.map((row) => ({
        ...row,
        amountNaira: Number(row.amount) / 100,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
        lastVerifiedAt: row.lastVerifiedAt?.toISOString() || null,
        resolvedAt: row.resolvedAt?.toISOString() || null,
      })),
      pagination: {
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage),
      },
      summary: {
        conflictCount,
      },
    });
  } catch (error) {
    console.error("Failed to fetch payment transactions:", error);
    return NextResponse.json(
      { error: "Failed to fetch payment transactions" },
      { status: 500 },
    );
  }
}
