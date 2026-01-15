import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "lib/admin-auth";
import prisma from "lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await requireAdminSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");

    const where: any = {};

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" as const } },
        { handle: { contains: search, mode: "insensitive" as const } },
      ];
    }

    const pages = await prisma.page.findMany({
      where,
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({
      pages: pages.map((page) => ({
        id: page.id,
        handle: page.handle,
        title: page.title,
        body: page.body,
        bodySummary: page.bodySummary,
        seoTitle: page.seoTitle,
        seoDescription: page.seoDescription,
        createdAt: page.createdAt.toISOString(),
        updatedAt: page.updatedAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("Failed to fetch pages:", error);
    return NextResponse.json(
      { error: "Failed to fetch pages" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAdminSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      handle,
      title,
      body: pageBody,
      bodySummary,
      seoTitle,
      seoDescription,
    } = body;

    if (!handle || !title) {
      return NextResponse.json(
        { error: "Handle and title are required" },
        { status: 400 },
      );
    }

    const existingPage = await prisma.page.findUnique({
      where: { handle },
    });

    if (existingPage) {
      return NextResponse.json(
        { error: "Page with this handle already exists" },
        { status: 400 },
      );
    }

    const page = await prisma.page.create({
      data: {
        handle,
        title,
        body: pageBody || null,
        bodySummary: bodySummary || null,
        seoTitle: seoTitle || null,
        seoDescription: seoDescription || null,
      },
    });

    return NextResponse.json({
      success: true,
      page: {
        id: page.id,
        handle: page.handle,
        title: page.title,
        body: page.body,
        bodySummary: page.bodySummary,
        seoTitle: page.seoTitle,
        seoDescription: page.seoDescription,
        createdAt: page.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Failed to create page:", error);
    return NextResponse.json(
      { error: "Failed to create page" },
      { status: 500 },
    );
  }
}
