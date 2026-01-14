import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "lib/auth";
import prisma from "lib/prisma";

const toDetailsArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
};

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");

    const where: any = {};

    if (search) {
      where.title = { contains: search, mode: "insensitive" as const };
    }

    const customOrders = await prisma.customOrder.findMany({
      where,
      orderBy: [{ position: "asc" }, { updatedAt: "desc" }],
    });

    return NextResponse.json({
      customOrders: customOrders.map((order) => ({
        id: order.id,
        title: order.title,
        customerStory: order.customerStory,
        beforeImage: order.beforeImage,
        afterImage: order.afterImage,
        details: toDetailsArray(order.details),
        completionTime: order.completionTime,
        position: order.position,
        isPublished: order.isPublished,
        createdAt: order.createdAt.toISOString(),
        updatedAt: order.updatedAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("Failed to fetch custom orders:", error);
    return NextResponse.json(
      { error: "Failed to fetch custom orders" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      title,
      customerStory,
      beforeImage,
      afterImage,
      details,
      completionTime,
      position,
      isPublished,
    } = body;

    if (!title || title.trim() === "") {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const order = await prisma.customOrder.create({
      data: {
        title: title.trim(),
        customerStory: customerStory || null,
        beforeImage: beforeImage || null,
        afterImage: afterImage || null,
        details: toDetailsArray(details),
        completionTime: completionTime || null,
        position: typeof position === "number" ? position : 0,
        isPublished: isPublished === undefined ? true : Boolean(isPublished),
      },
    });

    return NextResponse.json({
      success: true,
      customOrder: {
        id: order.id,
        title: order.title,
        customerStory: order.customerStory,
        beforeImage: order.beforeImage,
        afterImage: order.afterImage,
        details: toDetailsArray(order.details),
        completionTime: order.completionTime,
        position: order.position,
        isPublished: order.isPublished,
        createdAt: order.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Failed to create custom order:", error);
    return NextResponse.json(
      { error: "Failed to create custom order" },
      { status: 500 },
    );
  }
}
