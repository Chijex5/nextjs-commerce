import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "lib/admin-auth";
import { db } from "lib/db";
import { adminUsers } from "lib/db/schema";
import bcrypt from "bcryptjs";
import { and, desc, eq, ilike, or, sql } from "drizzle-orm";

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
      filters.push(eq(adminUsers.isActive, true));
    } else if (status === "inactive") {
      filters.push(eq(adminUsers.isActive, false));
    }

    if (search) {
      const searchValue = `%${search}%`;
      filters.push(
        or(
          ilike(adminUsers.email, searchValue),
          ilike(adminUsers.name, searchValue),
        ),
      );
    }

    const whereClause = filters.length ? and(...filters) : undefined;

    const [admins, totalResult] = await Promise.all([
      db
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
        .where(whereClause)
        .orderBy(desc(adminUsers.createdAt))
        .limit(perPage)
        .offset((page - 1) * perPage),
      db
        .select({ count: sql<number>`count(*)` })
        .from(adminUsers)
        .where(whereClause),
    ]);

    const total = Number(totalResult[0]?.count ?? 0);
    const totalPages = Math.ceil(total / perPage);

    return NextResponse.json({
      admins: admins.map((admin) => ({
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
        isActive: admin.isActive,
        createdAt: admin.createdAt.toISOString(),
        lastLoginAt: admin.lastLoginAt?.toISOString() || null,
      })),
      pagination: {
        page,
        perPage,
        total,
        totalPages,
      },
    });
  } catch (error) {
    console.error("Failed to fetch admins:", error);
    return NextResponse.json(
      { error: "Failed to fetch admins" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAdminSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { email, name, password, role } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 },
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 },
      );
    }

    const [existingAdmin] = await db
      .select({ id: adminUsers.id })
      .from(adminUsers)
      .where(eq(adminUsers.email, email))
      .limit(1);

    if (existingAdmin) {
      return NextResponse.json(
        { error: "Admin with this email already exists" },
        { status: 400 },
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const [admin] = await db
      .insert(adminUsers)
      .values({
        email,
        name: name || null,
        passwordHash,
        role: role || "admin",
        isActive: true,
      })
      .returning({
        id: adminUsers.id,
        email: adminUsers.email,
        name: adminUsers.name,
        role: adminUsers.role,
        isActive: adminUsers.isActive,
        createdAt: adminUsers.createdAt,
      });

    return NextResponse.json({
      success: true,
      message: "Admin created successfully",
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
        isActive: admin.isActive,
        createdAt: admin.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Failed to create admin:", error);
    return NextResponse.json(
      { error: "Failed to create admin" },
      { status: 500 },
    );
  }
}
