import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "lib/admin-auth";
import prisma from "lib/prisma";

// GET - Get single collection
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

    const collection = await prisma.collection.findUnique({
      where: { id },
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
    });

    if (!collection) {
      return NextResponse.json(
        { error: "Collection not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      collection: {
        id: collection.id,
        handle: collection.handle,
        title: collection.title,
        description: collection.description,
        seoTitle: collection.seoTitle,
        seoDescription: collection.seoDescription,
        productCount: collection._count.productCollections,
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

// PUT - Update collection
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
    const body = await request.json();
    const { handle, title, description, seoTitle, seoDescription } = body;

    // Validate inputs
    if (!handle || !title) {
      return NextResponse.json(
        { error: "Handle and title are required" },
        { status: 400 },
      );
    }

    // Check if another collection has the same handle
    const existingCollection = await prisma.collection.findFirst({
      where: {
        handle,
        NOT: { id },
      },
    });

    if (existingCollection) {
      return NextResponse.json(
        { error: "Another collection with this handle already exists" },
        { status: 400 },
      );
    }

    const collection = await prisma.collection.update({
      where: { id },
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
        updatedAt: true,
      },
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

// DELETE - Delete collection
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

    // Check if collection has products
    const collection = await prisma.collection.findUnique({
      where: { id },
      select: {
        _count: {
          select: { productCollections: true },
        },
      },
    });

    if (!collection) {
      return NextResponse.json(
        { error: "Collection not found" },
        { status: 404 },
      );
    }

    if (collection._count.productCollections > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete collection with ${collection._count.productCollections} product(s). Remove products first.`,
        },
        { status: 400 },
      );
    }

    await prisma.collection.delete({
      where: { id },
    });

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
