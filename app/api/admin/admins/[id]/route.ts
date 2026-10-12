import { NextRequest, NextResponse } from "next/server";
import { isAdminRole, requireAdminSession } from "lib/admin-auth";
import { db } from "lib/db";
import { adminUsers } from "lib/db/schema";
import { eq } from "drizzle-orm";
import { hasPermission } from "@/lib/permissions";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireAdminSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = session.user.role;
    if (!userRole) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const permission = hasPermission(userRole, "admin_dashboard", "update");
    if (!permission.permitted) {
      return NextResponse.json({ error: permission.reason ? permission.reason : "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { name, role, isActive } = body;

    if (role !== undefined && !isAdminRole(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }
    if (isActive !== undefined && typeof isActive !== "boolean") {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    // Stops the last super admin from locking everyone out.
    if (
      id === session.user.id &&
      ((role !== undefined && role !== session.user.role) ||
        isActive === false)
    ) {
      return NextResponse.json(
        { error: "You can't change your own role or deactivate yourself" },
        { status: 400 },
      );
    }

    const updateData: Partial<typeof adminUsers.$inferInsert> = {};
    if (typeof name === "string") updateData.name = name.trim() || null;
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

    if (!admin) {
      return NextResponse.json({ error: "Admin not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Admin updated successfully",
      admin: {
        id: admin?.id,
        email: admin?.email,
        name: admin?.name,
        role: admin?.role,
        isActive: admin?.isActive,
        updatedAt: admin?.updatedAt.toISOString(),
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

    const role = session.user.role;
    if (!role) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const permission = hasPermission(role, "admin_dashboard", "delete");
    if (!permission.permitted) {
      return NextResponse.json({ error: permission.reason ? permission.reason : "Forbidden" }, { status: 403 });
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
