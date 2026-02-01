import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "lib/admin-auth";
import { db } from "lib/db";
import { pages } from "lib/db/schema";
import { and, eq, ne } from "drizzle-orm";
import { UpdatePageBody } from "types/api";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireAdminSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const [page] = await db
      .select()
      .from(pages)
      .where(eq(pages.id, id))
      .limit(1);

    if (!page) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    return NextResponse.json({
      page: {
        id: page.id,
        handle: page.handle,
        title: page.title,
        body: page.body,
        bodySummary: page.bodySummary,
        seoTitle: page.seoTitle,
        seoDescription: page.seoDescription,
        createdAt: page.createdAt.toISOString(),
        updatedAt: page.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Failed to fetch page:", error);
    return NextResponse.json(
      { error: "Failed to fetch page" },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireAdminSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = (await request.json()) as UpdatePageBody;
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
      .where(and(eq(pages.handle, handle), ne(pages.id, id)))
      .limit(1);

    if (existingPage) {
      return NextResponse.json(
        { error: "Another page with this handle already exists" },
        { status: 400 },
      );
    }

    const [page] = await db
      .update(pages)
      .set({
        handle,
        title,
        body: pageBody || null,
        bodySummary: bodySummary || null,
        seoTitle: seoTitle || null,
        seoDescription: seoDescription || null,
      })
      .where(eq(pages.id, id))
      .returning();

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
        updatedAt: page.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Failed to update page:", error);
    return NextResponse.json(
      { error: "Failed to update page" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireAdminSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    await db.delete(pages).where(eq(pages.id, id));

    return NextResponse.json({
      success: true,
      message: "Page deleted successfully",
    });
  } catch (error) {
    console.error("Failed to delete page:", error);
    return NextResponse.json(
      { error: "Failed to delete page" },
      { status: 500 },
    );
  }
}
