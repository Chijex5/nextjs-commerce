import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "lib/admin-auth";
import { db } from "lib/db";
import { collections, productCollections } from "lib/db/schema";
import { and, eq, ne, sql } from "drizzle-orm";
import type { UpdateCollectionBody } from "types/api";

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

    const [collection] = await db
      .select({
        id: collections.id,
        handle: collections.handle,
        title: collections.title,
        description: collections.description,
        seoTitle: collections.seoTitle,
        seoDescription: collections.seoDescription,
        createdAt: collections.createdAt,
        updatedAt: collections.updatedAt,
      })
      .from(collections)
      .where(eq(collections.id, id))
      .limit(1);

    if (!collection) {
      return NextResponse.json(
        { error: "Collection not found" },
        { status: 404 },
      );
    }

    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(productCollections)
      .where(eq(productCollections.collectionId, id));

    const productCount = Number(countResult?.count ?? 0);

    return NextResponse.json({
      collection: {
        id: collection.id,
        handle: collection.handle,
        title: collection.title,
        description: collection.description,
        seoTitle: collection.seoTitle,
        seoDescription: collection.seoDescription,
        productCount,
        createdAt: collection.createdAt.toISOString(),
        updatedAt: collection.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Failed to fetch collection:", error);
    return NextResponse.json(
      { error: "Failed to fetch collection" },
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
    const body = (await request.json()) as UpdateCollectionBody;
    const { handle, title, description, seoTitle, seoDescription } = body;

    if (!handle || !title) {
      return NextResponse.json(
        { error: "Handle and title are required" },
        { status: 400 },
      );
    }

    const [existingCollection] = await db
      .select({ id: collections.id })
      .from(collections)
      .where(and(eq(collections.handle, handle), ne(collections.id, id)))
      .limit(1);

    if (existingCollection) {
      return NextResponse.json(
        { error: "Another collection with this handle already exists" },
        { status: 400 },
      );
    }

    const [collection] = await db
      .update(collections)
      .set({
        handle,
        title,
        description: description || null,
        seoTitle: seoTitle || null,
        seoDescription: seoDescription || null,
      })
      .where(eq(collections.id, id))
      .returning({
        id: collections.id,
        handle: collections.handle,
        title: collections.title,
        description: collections.description,
        seoTitle: collections.seoTitle,
        seoDescription: collections.seoDescription,
        updatedAt: collections.updatedAt,
      });

    return NextResponse.json({
      success: true,
      message: "Collection updated successfully",
      collection: {
        id: collection.id,
        handle: collection.handle,
        title: collection.title,
        description: collection.description,
        seoTitle: collection.seoTitle,
        seoDescription: collection.seoDescription,
        updatedAt: collection.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Failed to update collection:", error);
    return NextResponse.json(
      { error: "Failed to update collection" },
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

    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(productCollections)
      .where(eq(productCollections.collectionId, id));

    const productCount = Number(countResult?.count ?? 0);

    if (productCount > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete collection with ${productCount} product(s). Remove products first.`,
        },
        { status: 400 },
      );
    }

    await db.delete(collections).where(eq(collections.id, id));

    return NextResponse.json({
      success: true,
      message: "Collection deleted successfully",
    });
  } catch (error) {
    console.error("Failed to delete collection:", error);
    return NextResponse.json(
      { error: "Failed to delete collection" },
      { status: 500 },
    );
  }
}
