import { compare } from "bcryptjs";
import { and, eq, ilike, isNull } from "drizzle-orm";
import { db } from "lib/db";
import { customOrderRequests, users } from "lib/db/schema";
import { handleApiError } from "lib/errors";
import { createUserSession, setUserSessionCookie } from "lib/user-session";
import { NextRequest, NextResponse } from "next/server";

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
