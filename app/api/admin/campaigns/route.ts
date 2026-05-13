import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { adminUsers, campaignProducts, emailCampaigns } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

// GET /api/admin/campaigns - List all campaigns
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify admin user
    const admin = await db.query.adminUsers.findFirst({
      where: eq(adminUsers.email, session.user.email as string),
    });

    if (!admin || !admin.isActive) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 },
      );
    }

    const url = new URL(req.url);
    const status = url.searchParams.get("status"); // DRAFT, SCHEDULED, SENT
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const limit = parseInt(url.searchParams.get("limit") || "20", 10);
    const offset = (page - 1) * limit;

    let query = db.query.emailCampaigns.findMany({
      orderBy: desc(emailCampaigns.createdAt),
      limit: limit + 1,
      offset: offset,
    });

    if (status) {
      query = db.query.emailCampaigns.findMany({
        where: eq(emailCampaigns.status, status),
        orderBy: desc(emailCampaigns.createdAt),
        limit: limit + 1,
        offset: offset,
      });
    }

    const campaigns = await query;
    const hasMore = campaigns.length > limit;

    return NextResponse.json({
      campaigns: campaigns.slice(0, limit),
      hasMore,
      page,
      limit,
    });
  } catch (error) {
    console.error("Error fetching campaigns:", error);
    return NextResponse.json(
      { error: "Failed to fetch campaigns" },
      { status: 500 },
    );
  }
}

// POST /api/admin/campaigns - Create new campaign
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify admin user
    const admin = await db.query.adminUsers.findFirst({
      where: eq(adminUsers.email, session.user.email as string),
    });

    if (!admin || !admin.isActive) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 },
      );
    }

    const body = await req.json();
    const {
      name,
      type, // JUST_ARRIVED, SALE, COLLECTION
      subject,
      preheader,
      headerTitle,
      headerSubtitle,
      footerText,
      ctaButtonText,
      ctaButtonUrl,
      heroImageUrl,
      productIds,
    } = body;

    if (!name || !type || !subject) {
      return NextResponse.json(
        { error: "Missing required fields: name, type, subject" },
        { status: 400 },
      );
    }

    const [campaign] = await db
      .insert(emailCampaigns)
      .values({
        name,
        type,
        subject,
        preheader,
        headerTitle,
        headerSubtitle,
        footerText,
        ctaButtonText,
        ctaButtonUrl,
        heroImageUrl,
        status: "DRAFT",
        createdBy: admin.id,
      })
      .returning({ id: emailCampaigns.id });

    if (!campaign) {
      throw new Error("Campaign was not created");
    }

    if (Array.isArray(productIds) && productIds.length > 0) {
      await db.insert(campaignProducts).values(
        productIds.map((productId: string, index: number) => ({
          campaignId: campaign.id,
          productId,
          position: index,
        })),
      );
    }

    return NextResponse.json(
      { message: "Campaign created", campaignId: campaign.id },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating campaign:", error);
    return NextResponse.json(
      { error: "Failed to create campaign" },
      { status: 500 },
    );
  }
}
