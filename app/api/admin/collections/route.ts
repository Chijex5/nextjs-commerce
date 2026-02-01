import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "lib/admin-auth";
import { db } from "lib/db";
import { collections, productCollections } from "lib/db/schema";
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

    const whereClause = search
      ? or(
          ilike(collections.title, `%${search}%`),
          ilike(collections.handle, `%${search}%`),
          ilike(collections.description, `%${search}%`),
        )
      : undefined;

    const [collectionRows, totalResult] = await Promise.all([
      db
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
        .where(whereClause)
        .orderBy(desc(collections.createdAt))
        .limit(perPage)
        .offset((page - 1) * perPage),
      db
        .select({ count: sql<number>`count(*)` })
        .from(collections)
        .where(whereClause),
    ]);

    const collectionIds = collectionRows.map((collection) => collection.id);
    const collectionCounts = collectionIds.length
      ? await db
          .select({
            collectionId: productCollections.collectionId,
            count: sql<number>`count(*)`,
          })
          .from(productCollections)
          .where(inArray(productCollections.collectionId, collectionIds))
          .groupBy(productCollections.collectionId)
      : [];

    const countsByCollection = new Map(
      collectionCounts.map((row) => [row.collectionId, Number(row.count)]),
    );

    const total = Number(totalResult[0]?.count ?? 0);
    const totalPages = Math.ceil(total / perPage);

    return NextResponse.json({
      collections: collectionRows.map((collection) => ({
        id: collection.id,
        handle: collection.handle,
        title: collection.title,
        description: collection.description,
        seoTitle: collection.seoTitle,
        seoDescription: collection.seoDescription,
        productCount: countsByCollection.get(collection.id) || 0,
        createdAt: collection.createdAt.toISOString(),
        updatedAt: collection.updatedAt.toISOString(),
      })),
      pagination: {
        page,
        perPage,
        total,
        totalPages,
      },
    });
  } catch (error) {
    console.error("Failed to fetch collections:", error);
    return NextResponse.json(
      { error: "Failed to fetch collections" },
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
      .where(eq(collections.handle, handle))
      .limit(1);

    if (existingCollection) {
      return NextResponse.json(
        { error: "Collection with this handle already exists" },
        { status: 400 },
      );
    }

    const [collection] = await db
      .insert(collections)
      .values({
        handle,
        title,
        description: description || null,
        seoTitle: seoTitle || null,
        seoDescription: seoDescription || null,
      })
      .returning({
        id: collections.id,
        handle: collections.handle,
        title: collections.title,
        description: collections.description,
        seoTitle: collections.seoTitle,
        seoDescription: collections.seoDescription,
        createdAt: collections.createdAt,
      });

    return NextResponse.json({
      success: true,
      message: "Collection created successfully",
      collection: {
        id: collection?.id,
        handle: collection?.handle,
        title: collection?.title,
        description: collection?.description,
        seoTitle: collection?.seoTitle,
        seoDescription: collection?.seoDescription,
        createdAt: collection?.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Failed to create collection:", error);
    return NextResponse.json(
      { error: "Failed to create collection" },
      { status: 500 },
    );
  }
}
