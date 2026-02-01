import { NextRequest, NextResponse } from "next/server";
import {
  createUserSession,
  getUserSession,
  setUserSessionCookie,
} from "lib/user-session";
import { db } from "lib/db";
import { users } from "lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const session = await getUserSession();

    if (!session?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        phone: users.phone,
        shippingAddress: users.shippingAddress,
        billingAddress: users.billingAddress,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, session.id))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Failed to fetch profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getUserSession();

    if (!session?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, phone } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const [updatedUser] = await db
      .update(users)
      .set({
        name: name.trim(),
        phone: phone?.trim() || null,
      })
      .where(eq(users.id, session.id))
      .returning({
        id: users.id,
        email: users.email,
        name: users.name,
        phone: users.phone,
      });

    const token = await createUserSession({
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      phone: updatedUser.phone,
    });
    await setUserSessionCookie(token);

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Failed to update profile:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 },
    );
  }
}
