import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "lib/admin-auth";
import { db } from "lib/db";
import { pages } from "lib/db/schema";
import { desc, eq, ilike, or } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const session = await requireAdminSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");

    const whereClause = search
      ? or(
          ilike(pages.title, `%${search}%`),
          ilike(pages.handle, `%${search}%`),
        )
      : undefined;

    const pageRows = await db
      .select()
      .from(pages)
      .where(whereClause)
      .orderBy(desc(pages.updatedAt));

    return NextResponse.json({
      pages: pageRows.map((page) => ({
        id: page.id,
        handle: page.handle,
        title: page.title,
        body: page.body,
        bodySummary: page.bodySummary,
        seoTitle: page.seoTitle,
        seoDescription: page.seoDescription,
        createdAt: page.createdAt.toISOString(),
        updatedAt: page.updatedAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("Failed to fetch pages:", error);
    return NextResponse.json(
      { error: "Failed to fetch pages" },
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
    const {
      handle,
      title,
      body: pageBody,
      bodySummary,
      seoTitle,
      seoDescription,
    } = body;

    if (!handle || !title) {
      return NextResponse.json(
        { error: "Handle and title are required" },
        { status: 400 },
      );
    }

    const [existingPage] = await db
      .select({ id: pages.id })
      .from(pages)
      .where(eq(pages.handle, handle))
      .limit(1);

    if (existingPage) {
      return NextResponse.json(
        { error: "Page with this handle already exists" },
        { status: 400 },
      );
    }

    const [page] = await db
      .insert(pages)
      .values({
        handle,
        title,
        body: pageBody || null,
        bodySummary: bodySummary || null,
        seoTitle: seoTitle || null,
        seoDescription: seoDescription || null,
      })
      .returning();

    if (!page) {
      return NextResponse.json(
        { error: "Failed to create page" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      page: {
        id: page.id,
        handle: page.handle,
        title: page.title,
        body: page.body,
        bodySummary: page.bodySummary,
        seoTitle: page.seoTitle,
        seoDescription: page.seoDescription,
        createdAt: page.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Failed to create page:", error);
    return NextResponse.json(
      { error: "Failed to create page" },
      { status: 500 },
    );
  }
}
