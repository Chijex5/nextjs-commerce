import { compare } from "bcryptjs";
import { and, eq, ilike, isNull } from "drizzle-orm";
import { db } from "lib/db";
import { customOrderRequests, users } from "lib/db/schema";
import { handleApiError } from "lib/errors";
import { getClientIp, rateLimit, tooManyRequests } from "lib/rate-limit";
import { createUserSession, setUserSessionCookie } from "lib/user-session";
import { normalizeEmail } from "lib/user-utils";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { email: rawEmail, password } = await request.json();

    if (!rawEmail || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 },
      );
    }

    const email = normalizeEmail(rawEmail);
    const ip = getClientIp(request);
    // Throttle by IP (broad) and by account (targeted) to slow credential
    // stuffing without locking a whole office network out of one account.
    const ipLimit = rateLimit(`login:ip:${ip}`, 20, 15 * 60_000);
    if (!ipLimit.ok) return tooManyRequests(ipLimit.retryAfter);
    const emailLimit = rateLimit(`login:email:${email}`, 5, 15 * 60_000);
    if (!emailLimit.ok) return tooManyRequests(emailLimit.retryAfter);

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user || !user.isActive) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 },
      );
    }

    const isPasswordValid = await compare(password, user.passwordHash);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 },
      );
    }

    await db
      .update(users)
      .set({ lastLoginAt: new Date() })
      .where(eq(users.id, user.id));

    await db
      .update(customOrderRequests)
      .set({ userId: user.id, updatedAt: new Date() })
      .where(
        and(
          ilike(customOrderRequests.email, user.email),
          isNull(customOrderRequests.userId),
        ),
      );

    const token = await createUserSession({
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
    });

    await setUserSessionCookie(token);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
      },
    });
  } catch (error) {
    return handleApiError(error, "Login");
  }
}
