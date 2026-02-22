import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "lib/admin-auth";

// PATCH /api/admin/size-guides/[id] - Update a size guide
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireAdminSession();

    if (!session) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 },
      );
    }

    const { id } = await context.params;
    const body = await request.json();

    const sizeGuide = await prisma.sizeGuide.update({
      where: { id },
      data: body,
    });

    return NextResponse.json({ sizeGuide });
  } catch (error) {
    console.error("Error updating size guide:", error);
    return NextResponse.json(
      { error: "Failed to update size guide" },
      { status: 500 },
    );
  }
}

// DELETE /api/admin/size-guides/[id] - Delete a size guide
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireAdminSession();

    if (!session) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 },
      );
    }

    const { id } = await context.params;

    await prisma.sizeGuide.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting size guide:", error);
    return NextResponse.json(
      { error: "Failed to delete size guide" },
      { status: 500 },
    );
  }
}
