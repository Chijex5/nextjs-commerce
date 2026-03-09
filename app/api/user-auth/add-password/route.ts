import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { hash } from "bcryptjs";
import { db } from "lib/db";
import { emailOtps, users } from "lib/db/schema";
import { getUserSession } from "lib/user-session";
import { and, eq, gt, isNull } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const session = await getUserSession();

    if (!session?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { otp, newPassword, confirmPassword } = body;

    if (!otp || !newPassword || !confirmPassword) {
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

    const [user] = await db
      .select({ id: users.id, email: users.email, hasPassword: users.hasPassword })
      .from(users)
      .where(eq(users.id, session.id))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.hasPassword) {
      return NextResponse.json(
        { error: "Use the change-password endpoint instead" },
        { status: 400 },
      );
    }

    // Verify the OTP
    const otpHash = crypto.createHash("sha256").update(otp.trim()).digest("hex");

    const [otpRecord] = await db
      .select()
      .from(emailOtps)
      .where(
        and(
          eq(emailOtps.email, user.email),
          eq(emailOtps.otpHash, otpHash),
          eq(emailOtps.purpose, "add_password"),
          isNull(emailOtps.usedAt),
          gt(emailOtps.expiresAt, new Date()),
        ),
      )
      .limit(1);

    if (!otpRecord) {
      return NextResponse.json(
        { error: "Invalid or expired verification code" },
        { status: 400 },
      );
    }

    // Mark OTP as used
    await db
      .update(emailOtps)
      .set({ usedAt: new Date() })
      .where(eq(emailOtps.id, otpRecord.id));

    // Set the new password
    const passwordHash = await hash(newPassword, 10);

    await db
      .update(users)
      .set({ passwordHash, hasPassword: true })
      .where(eq(users.id, session.id));

    return NextResponse.json({
      success: true,
      message: "Password added successfully.",
    });
  } catch (error) {
    console.error("Add password error:", error);
    return NextResponse.json(
      { error: "Failed to add password" },
      { status: 500 },
    );
  }
}
