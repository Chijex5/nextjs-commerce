import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "lib/admin-auth";
import prisma from "lib/prisma";

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
    const { menuId, title, url, position } = body;

    if (!title || !url) {
      return NextResponse.json(
        { error: "Title and URL are required" },
        { status: 400 },
      );
    }

    const existingItem = await prisma.menuItem.findUnique({
      where: { id },
    });

    if (!existingItem) {
      return NextResponse.json(
        { error: "Menu item not found" },
        { status: 404 },
      );
    }

    const nextMenuId = menuId || existingItem.menuId;

    let nextPosition: number | undefined;

    if (typeof position === "number") {
      nextPosition = position;
    } else if (menuId && menuId !== existingItem.menuId) {
      const lastItem = await prisma.menuItem.findFirst({
        where: { menuId },
        orderBy: { position: "desc" },
        select: { position: true },
      });
      nextPosition = lastItem ? lastItem.position + 1 : 0;
    }

    const menuItem = await prisma.menuItem.update({
      where: { id },
      data: {
        menuId: nextMenuId,
        title,
        url,
        ...(typeof nextPosition === "number" ? { position: nextPosition } : {}),
      },
    });

    return NextResponse.json({
      success: true,
      menuItem: {
        id: menuItem.id,
        menuId: menuItem.menuId,
        title: menuItem.title,
        url: menuItem.url,
        position: menuItem.position,
      },
    });
  } catch (error) {
    console.error("Failed to update menu item:", error);
    return NextResponse.json(
      { error: "Failed to update menu item" },
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

    await prisma.menuItem.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Menu item deleted successfully",
    });
  } catch (error) {
    console.error("Failed to delete menu item:", error);
    return NextResponse.json(
      { error: "Failed to delete menu item" },
      { status: 500 },
    );
  }
}
