import { and, eq, gt, ilike, isNull } from "drizzle-orm";
import {
    ADMIN_RESET_REQUEST_COOLDOWN_SECONDS,
    ADMIN_RESET_TOKEN_TTL_MINUTES,
    createAdminResetToken,
} from "lib/admin-password-reset";
import { db } from "lib/db";
import { adminPasswordResets, adminUsers } from "lib/db/schema";
import { sendAdminPasswordResetEmail } from "lib/email/auth-emails";
import { NextRequest, NextResponse } from "next/server";

const GENERIC_SUCCESS_MESSAGE =
  "If that admin email exists, a reset link has been sent.";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const emailRaw = typeof body?.email === "string" ? body.email.trim() : "";

    if (!emailRaw) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const normalizedEmail = emailRaw.toLowerCase();

    const [admin] = await db
      .select({
        id: adminUsers.id,
        email: adminUsers.email,
        isActive: adminUsers.isActive,
      })
      .from(adminUsers)
      .where(ilike(adminUsers.email, normalizedEmail))
      .limit(1);

    if (!admin || !admin.isActive) {
      return NextResponse.json({ success: true, message: GENERIC_SUCCESS_MESSAGE });
    }

    const cooldownAt = new Date(
      Date.now() - ADMIN_RESET_REQUEST_COOLDOWN_SECONDS * 1000,
    );

    const [recentReset] = await db
      .select({ id: adminPasswordResets.id })
      .from(adminPasswordResets)
      .where(
        and(
          eq(adminPasswordResets.email, admin.email),
          isNull(adminPasswordResets.usedAt),
          gt(adminPasswordResets.expiresAt, new Date()),
          gt(adminPasswordResets.createdAt, cooldownAt),
        ),
      )
      .limit(1);

    if (recentReset) {
      return NextResponse.json({ success: true, message: GENERIC_SUCCESS_MESSAGE });
    }

    const { token, tokenHash, expiresAt } = createAdminResetToken();

    await db.insert(adminPasswordResets).values({
      adminId: admin.id,
      email: admin.email,
      tokenHash,
      expiresAt,
    });

    const origin = new URL(request.url).origin;
    const resetUrl = `${origin}/admin/reset-password?token=${encodeURIComponent(token)}`;

    const emailResult = await sendAdminPasswordResetEmail({
      email: admin.email,
      resetUrl,
      expiresInMinutes: ADMIN_RESET_TOKEN_TTL_MINUTES,
    });

    if (!emailResult.success) {
      console.warn("Admin password reset email failed", {
        adminId: admin.id,
        error: emailResult.error || "unknown_error",
      });
    }

    return NextResponse.json({ success: true, message: GENERIC_SUCCESS_MESSAGE });
  } catch (error) {
    console.error("Admin request-password-reset error:", error);
    return NextResponse.json(
      { error: "Failed to process reset request" },
      { status: 500 },
    );
  }
}
