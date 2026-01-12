import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "lib/auth";
import prisma from "lib/prisma";

// GET - List all collections with pagination
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const perPage = parseInt(searchParams.get("perPage") || "20");
    const search = searchParams.get("search");

    // Build where clause
    const where: any = {};

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" as const } },
        { handle: { contains: search, mode: "insensitive" as const } },
        { description: { contains: search, mode: "insensitive" as const } },
      ];
    }

    const [collections, total] = await Promise.all([
      prisma.collection.findMany({
        where,
        select: {
          id: true,
          handle: true,
          title: true,
          description: true,
          seoTitle: true,
          seoDescription: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: { productCollections: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      prisma.collection.count({ where }),
    ]);

    const totalPages = Math.ceil(total / perPage);

    return NextResponse.json({
      collections: collections.map((collection) => ({
        id: collection.id,
        handle: collection.handle,
        title: collection.title,
        description: collection.description,
        seoTitle: collection.seoTitle,
        seoDescription: collection.seoDescription,
        productCount: collection._count.productCollections,
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

// POST - Create new collection
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { handle, title, description, seoTitle, seoDescription } = body;

    // Validate inputs
    if (!handle || !title) {
      return NextResponse.json(
        { error: "Handle and title are required" },
        { status: 400 },
      );
    }

    // Check if collection with this handle already exists
    const existingCollection = await prisma.collection.findUnique({
      where: { handle },
    });

    if (existingCollection) {
      return NextResponse.json(
        { error: "Collection with this handle already exists" },
        { status: 400 },
      );
    }

    // Create collection
    const collection = await prisma.collection.create({
      data: {
        handle,
        title,
        description: description || null,
        seoTitle: seoTitle || null,
        seoDescription: seoDescription || null,
      },
      select: {
        id: true,
        handle: true,
        title: true,
        description: true,
        seoTitle: true,
        seoDescription: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Collection created successfully",
      collection: {
        id: collection.id,
        handle: collection.handle,
        title: collection.title,
        description: collection.description,
        seoTitle: collection.seoTitle,
        seoDescription: collection.seoDescription,
        createdAt: collection.createdAt.toISOString(),
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
