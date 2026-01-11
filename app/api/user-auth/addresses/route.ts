import { NextRequest, NextResponse } from "next/server";
import { getUserSession } from "lib/user-session";
import prisma from "lib/prisma";

// GET - Fetch user addresses
export async function GET() {
  try {
    const session = await getUserSession();

    if (!session?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.id },
      select: {
        shippingAddress: true,
        billingAddress: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
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
      { status: 500 }
    );
  }
}

// PUT - Update user address
export async function PUT(request: NextRequest) {
  try {
    const session = await getUserSession();

    if (!session?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { type, address } = body;

    if (!type || !address) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (type !== "shipping" && type !== "billing") {
      return NextResponse.json(
        { error: "Invalid address type" },
        { status: 400 }
      );
    }

    // Validate address fields
    const requiredFields = ["firstName", "lastName", "address", "city", "state", "country"];
    for (const field of requiredFields) {
      if (!address[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Update user address
    const updateData = type === "shipping"
      ? { shippingAddress: address }
      : { billingAddress: address };

    await prisma.user.update({
      where: { id: session.id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      message: "Address updated successfully",
    });
  } catch (error) {
    console.error("Failed to update address:", error);
    return NextResponse.json(
      { error: "Failed to update address" },
      { status: 500 }
    );
  }
}
