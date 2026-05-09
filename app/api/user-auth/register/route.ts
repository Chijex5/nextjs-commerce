import { hash } from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "lib/db";
import { users } from "lib/db/schema";
import { sendWelcomeEmail } from "lib/email/auth-emails";
import { handleApiError } from "lib/errors";
import { deriveNameFromEmail } from "lib/user-utils";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 },
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 },
      );
    }

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
