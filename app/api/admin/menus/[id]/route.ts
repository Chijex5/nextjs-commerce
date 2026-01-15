import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "lib/admin-auth";
import prisma from "lib/prisma";

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

    const menu = await prisma.menu.findUnique({
      where: { id },
      include: { items: { orderBy: { position: "asc" } } },
    });

    if (!menu) {
      return NextResponse.json({ error: "Menu not found" }, { status: 404 });
    }

    return NextResponse.json({
      menu: {
        id: menu.id,
        handle: menu.handle,
        title: menu.title,
        createdAt: menu.createdAt.toISOString(),
        updatedAt: menu.updatedAt.toISOString(),
        items: menu.items.map((item) => ({
          id: item.id,
          menuId: item.menuId,
          title: item.title,
          url: item.url,
          position: item.position,
          createdAt: item.createdAt.toISOString(),
        })),
      },
    });
  } catch (error) {
    console.error("Failed to fetch menu:", error);
    return NextResponse.json(
      { error: "Failed to fetch menu" },
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
    const body = await request.json();
    const { handle, title } = body;

    if (!handle || !title) {
      return NextResponse.json(
        { error: "Handle and title are required" },
        { status: 400 },
      );
    }

    const existingMenu = await prisma.menu.findFirst({
      where: {
        handle,
        NOT: { id },
      },
    });

    if (existingMenu) {
      return NextResponse.json(
        { error: "Another menu with this handle already exists" },
        { status: 400 },
      );
    }

    const menu = await prisma.menu.update({
      where: { id },
      data: {
        handle,
        title,
      },
    });

    return NextResponse.json({
      success: true,
      menu: {
        id: menu.id,
        handle: menu.handle,
        title: menu.title,
        updatedAt: menu.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Failed to update menu:", error);
    return NextResponse.json(
      { error: "Failed to update menu" },
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

    await prisma.menu.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Menu deleted successfully",
    });
  } catch (error) {
    console.error("Failed to delete menu:", error);
    return NextResponse.json(
      { error: "Failed to delete menu" },
      { status: 500 },
    );
  }
}
