import { NextRequest, NextResponse } from "next/server";
import { getUserSession } from "lib/user-session";
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
        shippingAddress: users.shippingAddress,
        billingAddress: users.billingAddress,
      })
      .from(users)
      .where(eq(users.id, session.id))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      addresses: {
        shippingAddress: user.shippingAddress,
        billingAddress: user.billingAddress,
      },
    });
  } catch (error) {
    console.error("Failed to fetch addresses:", error);
    return NextResponse.json(
      { error: "Failed to fetch addresses" },
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
    const { type, address } = body;

    if (!type || !address) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    if (type !== "shipping" && type !== "billing") {
      return NextResponse.json(
        { error: "Invalid address type" },
        { status: 400 },
      );
    }

    const requiredFields = [
      "firstName",
      "lastName",
      "address",
      "city",
      "state",
      "country",
    ];
    for (const field of requiredFields) {
      if (!address[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 },
        );
      }
    }

    const updateData =
      type === "shipping"
        ? { shippingAddress: address }
        : { billingAddress: address };

    await db.update(users).set(updateData).where(eq(users.id, session.id));

    return NextResponse.json({
      success: true,
      message: "Address updated successfully",
    });
  } catch (error) {
    console.error("Failed to update address:", error);
    return NextResponse.json(
      { error: "Failed to update address" },
      { status: 500 },
    );
  }
}
