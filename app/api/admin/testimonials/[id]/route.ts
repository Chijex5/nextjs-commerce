import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "lib/admin-auth";

// PATCH /api/admin/testimonials/[id] - Update a testimonial
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

    const testimonial = await prisma.testimonial.update({
      where: { id },
      data: body,
    });

    return NextResponse.json({ testimonial });
  } catch (error) {
    console.error("Error updating testimonial:", error);
    return NextResponse.json(
      { error: "Failed to update testimonial" },
      { status: 500 },
    );
  }
}

// DELETE /api/admin/testimonials/[id] - Delete a testimonial
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

    await prisma.testimonial.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting testimonial:", error);
    return NextResponse.json(
      { error: "Failed to delete testimonial" },
      { status: 500 },
    );
  }
}
