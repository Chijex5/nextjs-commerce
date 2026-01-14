import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "lib/auth";
import prisma from "lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

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
      const lastItem = await prisma.menuItem.findFirst({
        where: { menuId },
        orderBy: { position: "desc" },
        select: { position: true },
      });
      nextPosition = lastItem ? lastItem.position + 1 : 0;
    }

    const menuItem = await prisma.menuItem.create({
      data: {
        menuId,
        title,
        url,
        position: nextPosition,
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
