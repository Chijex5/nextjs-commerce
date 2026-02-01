import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "lib/admin-auth";
import { db } from "lib/db";
import { adminUsers } from "lib/db/schema";
import { eq } from "drizzle-orm";
import { UpdateAdminBody } from "types/api";

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
    const body = (await request.json()) as UpdateAdminBody;
    const { name, role, isActive } = body;

    const updateData: Partial<typeof adminUsers.$inferInsert> = {};
    if (name !== undefined) updateData.name = name;
    if (role !== undefined) updateData.role = role;
    if (isActive !== undefined) updateData.isActive = isActive;

    const [admin] = await db
      .update(adminUsers)
      .set(updateData)
      .where(eq(adminUsers.id, id))
      .returning({
        id: adminUsers.id,
        email: adminUsers.email,
        name: adminUsers.name,
        role: adminUsers.role,
        isActive: adminUsers.isActive,
        updatedAt: adminUsers.updatedAt,
      });

    return NextResponse.json({
      success: true,
      message: "Admin updated successfully",
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
        isActive: admin.isActive,
        updatedAt: admin.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Failed to update admin:", error);
    return NextResponse.json(
      { error: "Failed to update admin" },
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

    if (session.user.id === id) {
      return NextResponse.json(
        { error: "Cannot delete your own admin account" },
        { status: 400 },
      );
    }

    await db.delete(adminUsers).where(eq(adminUsers.id, id));

    return NextResponse.json({
      success: true,
      message: "Admin deleted successfully",
    });
  } catch (error) {
    console.error("Failed to delete admin:", error);
    return NextResponse.json(
      { error: "Failed to delete admin" },
      { status: 500 },
    );
  }
}
