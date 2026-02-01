import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "lib/admin-auth";
import { db } from "lib/db";
import { orders, users } from "lib/db/schema";
import { and, desc, eq, ilike, inArray, or, sql } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const session = await requireAdminSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const perPage = parseInt(searchParams.get("perPage") || "20");
    const search = searchParams.get("search");
    const status = searchParams.get("status");

    const filters = [];

    if (status === "active") {
      filters.push(eq(users.isActive, true));
    } else if (status === "inactive") {
      filters.push(eq(users.isActive, false));
    }

    if (search) {
      const searchValue = `%${search}%`;
      filters.push(
        or(
          ilike(users.email, searchValue),
          ilike(users.name, searchValue),
          ilike(users.phone, searchValue),
        ),
      );
    }

    const whereClause = filters.length ? and(...filters) : undefined;

    const [userRows, totalResult] = await Promise.all([
      db
        .select({
          id: users.id,
          email: users.email,
          name: users.name,
          phone: users.phone,
          isActive: users.isActive,
          createdAt: users.createdAt,
          lastLoginAt: users.lastLoginAt,
        })
        .from(users)
        .where(whereClause)
        .orderBy(desc(users.createdAt))
        .limit(perPage)
        .offset((page - 1) * perPage),
      db
        .select({ count: sql<number>`count(*)` })
        .from(users)
        .where(whereClause),
    ]);

    const userIds = userRows.map((user) => user.id);
    const orderCounts = userIds.length
      ? await db
          .select({
            userId: orders.userId,
            count: sql<number>`count(*)`,
          })
          .from(orders)
          .where(inArray(orders.userId, userIds))
          .groupBy(orders.userId)
      : [];

    const countsByUser = new Map(
      orderCounts.map((row) => [row.userId, Number(row.count)]),
    );

    const total = Number(totalResult[0]?.count ?? 0);
    const totalPages = Math.ceil(total / perPage);

    return NextResponse.json({
      users: userRows.map((user) => ({
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        isActive: user.isActive,
        orderCount: countsByUser.get(user.id) || 0,
        createdAt: user.createdAt.toISOString(),
        lastLoginAt: user.lastLoginAt?.toISOString() || null,
      })),
      pagination: {
        page,
        perPage,
        total,
        totalPages,
      },
    });
  } catch (error) {
    console.error("Failed to fetch users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 },
    );
  }
}
