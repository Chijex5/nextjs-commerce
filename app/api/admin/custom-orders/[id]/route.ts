import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "lib/auth";
import prisma from "lib/prisma";

const toDetailsArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
};

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const params = await context.params;
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const order = await prisma.customOrder.findUnique({
      where: { id: params.id },
    });

    if (!order) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({
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
        updatedAt: order.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Failed to fetch custom order:", error);
    return NextResponse.json(
      { error: "Failed to fetch custom order" },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
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

    const order = await prisma.customOrder.update({
      where: { id: params.id },
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
        updatedAt: order.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Failed to update custom order:", error);
    return NextResponse.json(
      { error: "Failed to update custom order" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await prisma.customOrder.delete({ where: { id: params.id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete custom order:", error);
    return NextResponse.json(
      { error: "Failed to delete custom order" },
      { status: 500 },
    );
  }
}
