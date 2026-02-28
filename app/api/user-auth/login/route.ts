import { NextRequest, NextResponse } from "next/server";
import { compare } from "bcryptjs";
import { db } from "lib/db";
import { customOrderRequests, orders, users } from "lib/db/schema";
import { createUserSession, setUserSessionCookie } from "lib/user-session";
import { and, eq, ilike, isNull } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 },
      );
    }

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

    // Claim guest orders/requests that share this verified email.
    await Promise.all([
      db
        .update(orders)
        .set({ userId: user.id })
        .where(and(ilike(orders.email, user.email), isNull(orders.userId))),
      db
        .update(customOrderRequests)
        .set({ userId: user.id, updatedAt: new Date() })
        .where(
          and(
            ilike(customOrderRequests.email, user.email),
            isNull(customOrderRequests.userId),
          ),
        ),
    ]);

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
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "An error occurred during login" },
      { status: 500 },
    );
  }
}
