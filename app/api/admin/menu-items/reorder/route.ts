import { eq } from "drizzle-orm";
import { requireAdminSession } from "lib/admin-auth";
import { db } from "lib/db";
import { menuItems } from "lib/db/schema";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(request: NextRequest) {
  try {
    const session = await requireAdminSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { menuId, itemIds } = body;

    if (!menuId || !Array.isArray(itemIds) || itemIds.length === 0) {
      return NextResponse.json(
        { error: "Menu ID and item IDs array are required" },
        { status: 400 },
      );
    }

    // Update positions for all items
    const updates = itemIds.map((id: string, index: number) =>
      db
        .update(menuItems)
        .set({ position: index })
        .where(eq(menuItems.id, id)),
    );

    await Promise.all(updates);

    return NextResponse.json({
      success: true,
      message: "Menu items reordered successfully",
    });
  } catch (error) {
    console.error("Failed to reorder menu items:", error);
    return NextResponse.json(
      { error: "Failed to reorder menu items" },
      { status: 500 },
    );
  }
}
