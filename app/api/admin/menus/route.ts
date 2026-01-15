import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "lib/admin-auth";
import prisma from "lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await requireAdminSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");

    const where: any = {};

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" as const } },
        { handle: { contains: search, mode: "insensitive" as const } },
      ];
    }

    const menus = await prisma.menu.findMany({
      where,
      include: {
        items: { orderBy: { position: "asc" } },
      },
      orderBy: { title: "asc" },
    });

    return NextResponse.json({
      menus: menus.map((menu) => ({
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

    const existingMenu = await prisma.menu.findUnique({
      where: { handle },
    });

    if (existingMenu) {
      return NextResponse.json(
        { error: "Menu with this handle already exists" },
        { status: 400 },
      );
    }

    const menu = await prisma.menu.create({
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
        createdAt: menu.createdAt.toISOString(),
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
