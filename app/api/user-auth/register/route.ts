import { hash } from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "lib/db";
import { users } from "lib/db/schema";
import { sendWelcomeEmail } from "lib/email/auth-emails";
import { handleApiError } from "lib/errors";
import { getClientIp, rateLimit, tooManyRequests } from "lib/rate-limit";
import { deriveNameFromEmail, normalizeEmail } from "lib/user-utils";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const limit = rateLimit(`register:${getClientIp(request)}`, 5, 60 * 60_000);
    if (!limit.ok) return tooManyRequests(limit.retryAfter);

    const { name, email: rawEmail, password } = await request.json();

    if (!rawEmail || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 },
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 },
      );
    }

    const email = normalizeEmail(rawEmail);

    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 },
      );
    }

    const passwordHash = await hash(password, 10);

    const userName =
      typeof name === "string" && name.trim()
        ? name.trim()
        : deriveNameFromEmail(email);

    const [user] = await db
      .insert(users)
      .values({
        name: userName,
        email,
        passwordHash,
        hasPassword: true,
      })
      .returning();

    if (!user) {
      return NextResponse.json(
        { error: "Failed to create user" },
        { status: 500 },
      );
    }

    const welcomeResult = await sendWelcomeEmail({
      email: user.email,
      name: user.name,
    });

    if (!welcomeResult.success) {
      console.error("Failed to send welcome email after registration");
    }

    return NextResponse.json(
      {
        message: "User created successfully",
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    return handleApiError(error, "Registration");
  }
}
