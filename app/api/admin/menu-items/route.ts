import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "lib/admin-auth";
import { db } from "lib/db";
import { menuItems } from "lib/db/schema";
import { desc, eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const session = await requireAdminSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { menuId, title, url, position } = body;

    if (!menuId || !title || !url) {
      return NextResponse.json(
        { error: "Menu, title, and URL are required" },
        { status: 400 },
      );
    }

    let nextPosition = 0;
    if (typeof position === "number") {
      nextPosition = position;
    } else {
      const [lastItem] = await db
        .select({ position: menuItems.position })
        .from(menuItems)
        .where(eq(menuItems.menuId, menuId))
        .orderBy(desc(menuItems.position))
        .limit(1);
      nextPosition = lastItem ? lastItem.position + 1 : 0;
    }

    const [menuItem] = await db
      .insert(menuItems)
      .values({
        menuId,
        title,
        url,
        position: nextPosition,
      })
      .returning();

    return NextResponse.json({
      success: true,
      menuItem: {
        id: menuItem.id,
        menuId: menuItem.menuId,
        title: menuItem.title,
        url: menuItem.url,
        position: menuItem.position,
        createdAt: menuItem.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Failed to create menu item:", error);
    return NextResponse.json(
      { error: "Failed to create menu item" },
      { status: 500 },
    );
  }
}
