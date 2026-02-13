import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "lib/admin-auth";
import { db } from "lib/db";
import { menuItems, menus } from "lib/db/schema";
import { and, asc, eq, ne } from "drizzle-orm";
import { UpdateMenuBody } from "types/api";

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

    const [menu] = await db
      .select()
      .from(menus)
      .where(eq(menus.id, id))
      .limit(1);

    if (!menu) {
      return NextResponse.json({ error: "Menu not found" }, { status: 404 });
    }

    const items = await db
      .select()
      .from(menuItems)
      .where(eq(menuItems.menuId, menu.id))
      .orderBy(asc(menuItems.position));

    return NextResponse.json({
      menu: {
        id: menu.id,
        handle: menu.handle,
        title: menu.title,
        createdAt: menu.createdAt.toISOString(),
        updatedAt: menu.updatedAt.toISOString(),
        items: items.map((item) => ({
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
    const body = (await request.json()) as UpdateMenuBody;
    const { handle, title } = body;

    if (!handle || !title) {
      return NextResponse.json(
        { error: "Handle and title are required" },
        { status: 400 },
      );
    }

    const [existingMenu] = await db
      .select({ id: menus.id })
      .from(menus)
      .where(and(eq(menus.handle, handle), ne(menus.id, id)))
      .limit(1);

    if (existingMenu) {
      return NextResponse.json(
        { error: "Another menu with this handle already exists" },
        { status: 400 },
      );
    }

    const [menu] = await db
      .update(menus)
      .set({
        handle,
        title,
      })
      .where(eq(menus.id, id))
      .returning();

    return NextResponse.json({
      success: true,
      menu: {
        id: menu?.id,
        handle: menu?.handle,
        title: menu?.title,
        updatedAt: menu?.updatedAt.toISOString(),
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

    await db.delete(menus).where(eq(menus.id, id));

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
