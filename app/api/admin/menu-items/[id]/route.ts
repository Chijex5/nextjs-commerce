import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "lib/admin-auth";
import { db } from "lib/db";
import { menuItems } from "lib/db/schema";
import { desc, eq } from "drizzle-orm";

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

    const [existingItem] = await db
      .select()
      .from(menuItems)
      .where(eq(menuItems.id, id))
      .limit(1);

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
      const [lastItem] = await db
        .select({ position: menuItems.position })
        .from(menuItems)
        .where(eq(menuItems.menuId, menuId))
        .orderBy(desc(menuItems.position))
        .limit(1);
      nextPosition = lastItem ? lastItem.position + 1 : 0;
    }

    const [menuItem] = await db
      .update(menuItems)
      .set({
        menuId: nextMenuId,
        title,
        url,
        ...(typeof nextPosition === "number" ? { position: nextPosition } : {}),
      })
      .where(eq(menuItems.id, id))
      .returning();

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

    await db.delete(menuItems).where(eq(menuItems.id, id));

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
