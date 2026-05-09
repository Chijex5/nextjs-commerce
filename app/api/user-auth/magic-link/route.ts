import crypto from "crypto";
import { eq } from "drizzle-orm";
import { db } from "lib/db";
import { magicLinkTokens, users } from "lib/db/schema";
import { sendMagicLinkEmail } from "lib/email/auth-emails";
import { baseUrl, ensureStartsWith } from "lib/utils";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { email, callbackUrl, purpose } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const [existingUser] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    const safeCallback =
      typeof callbackUrl === "string" && callbackUrl.startsWith("/")
        ? callbackUrl
        : "/account?welcome=1";

    await db.insert(magicLinkTokens).values({
      email,
      tokenHash,
      expiresAt,
    });

    const verifyUrl = `${baseUrl}/api/user-auth/magic-link/verify?email=${encodeURIComponent(
      email,
    )}&token=${token}&callbackUrl=${encodeURIComponent(
      ensureStartsWith(safeCallback, "/"),
    )}`;

    const emailPurpose =
      purpose === "signup" && !existingUser ? "signup" : "signin";

    const emailResult = await sendMagicLinkEmail({
      email,
      loginUrl: verifyUrl,
      purpose: emailPurpose,
    });

    if (!emailResult.success) {
      return NextResponse.json(
        { error: "Failed to send magic link" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message:
        emailPurpose === "signup"
          ? "Magic link sent. Check your email to finish setting up your account."
          : "Magic link sent. Check your email.",
    });
  } catch (error) {
    console.error("Magic link request error:", error);
    return NextResponse.json(
      { error: "Failed to send magic link" },
      { status: 500 },
    );
  }
}
