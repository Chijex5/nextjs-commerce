import { hash } from "bcryptjs";
import { and, eq, gt, isNull } from "drizzle-orm";
import { hashAdminResetToken } from "lib/admin-password-reset";
import { db } from "lib/db";
import { adminPasswordResets, adminUsers } from "lib/db/schema";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const token = typeof body?.token === "string" ? body.token.trim() : "";
    const newPassword =
      typeof body?.newPassword === "string" ? body.newPassword : "";
    const confirmPassword =
      typeof body?.confirmPassword === "string" ? body.confirmPassword : "";

    if (!token || !newPassword || !confirmPassword) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 },
      );
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { error: "Passwords do not match" },
        { status: 400 },
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 },
      );
    }

    const tokenHash = hashAdminResetToken(token);

    const [resetRecord] = await db
      .select({
        id: adminPasswordResets.id,
        adminId: adminPasswordResets.adminId,
      })
      .from(adminPasswordResets)
      .where(
        and(
          eq(adminPasswordResets.tokenHash, tokenHash),
          isNull(adminPasswordResets.usedAt),
          gt(adminPasswordResets.expiresAt, new Date()),
        ),
      )
      .limit(1);

    if (!resetRecord) {
      return NextResponse.json(
        { error: "Reset link is invalid or has expired" },
        { status: 400 },
      );
    }

    const passwordHash = await hash(newPassword, 10);

    await db.transaction(async (tx) => {
      await tx
        .update(adminUsers)
        .set({ passwordHash, updatedAt: new Date() })
        .where(eq(adminUsers.id, resetRecord.adminId));

      await tx
        .update(adminPasswordResets)
        .set({ usedAt: new Date() })
        .where(eq(adminPasswordResets.id, resetRecord.id));
    });

    return NextResponse.json({
      success: true,
      message: "Password reset successfully",
    });
  } catch (error) {
    console.error("Admin reset-password error:", error);
    return NextResponse.json(
      { error: "Failed to reset password" },
      { status: 500 },
    );
  }
}
