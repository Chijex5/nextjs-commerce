import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "lib/admin-auth";
import { db } from "lib/db";
import { menuItems, menus } from "lib/db/schema";
import { asc, eq, ilike, inArray, or } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const session = await requireAdminSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");

    const whereClause = search
      ? or(
          ilike(menus.title, `%${search}%`),
          ilike(menus.handle, `%${search}%`),
        )
      : undefined;

    const menuRows = await db
      .select()
      .from(menus)
      .where(whereClause)
      .orderBy(asc(menus.title));

    const menuIds = menuRows.map((menu) => menu.id);
    const items = menuIds.length
      ? await db
          .select()
          .from(menuItems)
          .where(inArray(menuItems.menuId, menuIds))
          .orderBy(asc(menuItems.position))
      : [];

    const itemsByMenu = items.reduce<Record<string, typeof items>>(
      (acc, item) => {
        const menuItemsForMenu =
          acc[item.menuId] ?? (acc[item.menuId] = [] as typeof items);
        menuItemsForMenu.push(item);
        return acc;
      },
      {},
    );

    return NextResponse.json({
      menus: menuRows.map((menu) => ({
        id: menu.id,
        handle: menu.handle,
        title: menu.title,
        createdAt: menu.createdAt.toISOString(),
        updatedAt: menu.updatedAt.toISOString(),
        items: (itemsByMenu[menu.id] || []).map((item) => ({
          id: item.id,
          menuId: item.menuId,
          title: item.title,
          url: item.url,
          position: item.position,
          createdAt: item.createdAt.toISOString(),
        })),
      })),
    });
  } catch (error) {
    console.error("Failed to fetch menus:", error);
    return NextResponse.json(
      { error: "Failed to fetch menus" },
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
      .where(eq(menus.handle, handle))
      .limit(1);

    if (existingMenu) {
      return NextResponse.json(
        { error: "Menu with this handle already exists" },
        { status: 400 },
      );
    }

    const [menu] = await db
      .insert(menus)
      .values({
        handle,
        title,
      })
      .returning();

    return NextResponse.json({
      success: true,
      menu: {
        id: menu?.id,
        handle: menu?.handle,
        title: menu?.title,
        createdAt: menu?.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Failed to create menu:", error);
    return NextResponse.json(
      { error: "Failed to create menu" },
      { status: 500 },
    );
  }
}
