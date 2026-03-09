import { NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "lib/db";
import { emailOtps, users } from "lib/db/schema";
import { getUserSession } from "lib/user-session";
import { sendOtpEmail } from "lib/email/auth-emails";
import { and, eq, gt, isNull } from "drizzle-orm";

export async function POST() {
  try {
    const session = await getUserSession();

    if (!session?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

    // Rate-limit: one request per 60 seconds
    const cooldownAt = new Date(Date.now() - 60 * 1000);
    const recentOtp = await db
      .select({ id: emailOtps.id })
      .from(emailOtps)
      .where(
        and(
          eq(emailOtps.email, user.email),
          eq(emailOtps.purpose, "add_password"),
          isNull(emailOtps.usedAt),
          gt(emailOtps.expiresAt, new Date()),
          gt(emailOtps.createdAt, cooldownAt),
        ),
      )
      .limit(1);

    if (recentOtp.length > 0) {
      return NextResponse.json(
        { error: "Please wait 60 seconds before requesting a new code." },
        { status: 429 },
      );
    }

    // Generate a cryptographically secure 6-digit OTP (100000–999999)
    const otp = String(crypto.randomInt(100000, 1000000));
    const otpHash = crypto.createHash("sha256").update(otp).digest("hex");
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await db.insert(emailOtps).values({
      email: user.email,
      otpHash,
      purpose: "add_password",
      expiresAt,
    });

    const emailResult = await sendOtpEmail({
      email: user.email,
      otp,
      purpose: "add_password",
    });

    if (!emailResult.success) {
      return NextResponse.json(
        { error: "Failed to send verification code. Please try again." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Verification code sent to your email.",
    });
  } catch (error) {
    console.error("Request add-password OTP error:", error);
    return NextResponse.json(
      { error: "Failed to send verification code" },
      { status: 500 },
    );
  }
}
