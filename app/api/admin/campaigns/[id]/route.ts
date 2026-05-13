import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  adminUsers,
  campaignProducts,
  emailCampaigns,
  products,
} from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

// GET /api/admin/campaigns/[id] - Get campaign with products
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = await db.query.adminUsers.findFirst({
      where: eq(adminUsers.email, session.user.email as string),
    });

    if (!admin || !admin.isActive) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 },
      );
    }

    const campaign = await db.query.emailCampaigns.findFirst({
      where: eq(emailCampaigns.id, id),
    });

    if (!campaign) {
      return NextResponse.json(
        { error: "Campaign not found" },
        { status: 404 },
      );
    }

    // Get campaign products
    const campaignProds = await db
      .select({
        id: campaignProducts.id,
        productId: campaignProducts.productId,
        position: campaignProducts.position,
      })
      .from(campaignProducts)
      .where(eq(campaignProducts.campaignId, id))
      .orderBy(campaignProducts.position);

    // Fetch product details
    const productsList = [];
    for (const cp of campaignProds) {
      const prod = await db.query.products.findFirst({
        where: eq(products.id, cp.productId),
      });
      if (prod) {
        productsList.push({
          ...prod,
          position: cp.position,
        });
      }
    }

    return NextResponse.json({
      campaign: {
        ...campaign,
        products: productsList,
      },
    });
  } catch (error) {
    console.error("Error fetching campaign:", error);
    return NextResponse.json(
      { error: "Failed to fetch campaign" },
      { status: 500 },
    );
  }
}

// PATCH /api/admin/campaigns/[id] - Update campaign
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = await db.query.adminUsers.findFirst({
      where: eq(adminUsers.email, session.user.email as string),
    });

    if (!admin || !admin.isActive) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 },
      );
    }

    const campaign = await db.query.emailCampaigns.findFirst({
      where: eq(emailCampaigns.id, id),
    });

    if (!campaign) {
      return NextResponse.json(
        { error: "Campaign not found" },
        { status: 404 },
      );
    }

    // Only allow updating DRAFT campaigns (or SCHEDULED before sending)
    if (campaign.status === "SENT") {
      return NextResponse.json(
        { error: "Cannot edit sent campaigns" },
        { status: 400 },
      );
    }

    const body = await req.json();
    const {
      name,
      type,
      subject,
      preheader,
      headerTitle,
      headerSubtitle,
      footerText,
      ctaButtonText,
      ctaButtonUrl,
      scheduledAt,
      heroImageUrl,
      discountPercentage,
      couponCode,
      saleDeadline,
      discountNote,
      productIds, // Array of product IDs to include
    } = body;

    // Update campaign fields
    const updates: any = {};
    if (name !== undefined) updates.name = name;
    if (type !== undefined) updates.type = type;
    if (subject !== undefined) updates.subject = subject;
    if (preheader !== undefined) updates.preheader = preheader;
    if (headerTitle !== undefined) updates.headerTitle = headerTitle;
    if (headerSubtitle !== undefined) updates.headerSubtitle = headerSubtitle;
    if (footerText !== undefined) updates.footerText = footerText;
    if (ctaButtonText !== undefined) updates.ctaButtonText = ctaButtonText;
    if (ctaButtonUrl !== undefined) updates.ctaButtonUrl = ctaButtonUrl;
    if (heroImageUrl !== undefined) updates.heroImageUrl = heroImageUrl;
    if (discountPercentage !== undefined) {
      updates.discountPercentage =
        discountPercentage === null || discountPercentage === ""
          ? null
          : Number(discountPercentage);
    }
    if (couponCode !== undefined) {
      updates.couponCode = couponCode ? String(couponCode).toUpperCase() : null;
    }
    if (saleDeadline !== undefined) {
      updates.saleDeadline = saleDeadline ? new Date(saleDeadline) : null;
    }
    if (discountNote !== undefined) updates.discountNote = discountNote;
    if (scheduledAt !== undefined) {
      updates.scheduledAt = scheduledAt ? new Date(scheduledAt) : null;
      if (scheduledAt) {
        updates.status = "SCHEDULED";
      }
    }
    updates.updatedAt = new Date();

    await db
      .update(emailCampaigns)
      .set(updates)
      .where(eq(emailCampaigns.id, id));

    // Update products if provided
    if (productIds && Array.isArray(productIds)) {
      // Delete existing campaign products
      await db
        .delete(campaignProducts)
        .where(eq(campaignProducts.campaignId, id));

      // Insert new ones
      for (let i = 0; i < productIds.length; i++) {
        await db.insert(campaignProducts).values({
          campaignId: id,
          productId: productIds[i],
          position: i,
        });
      }
    }

    return NextResponse.json({
      message: "Campaign updated successfully",
      campaignId: id,
    });
  } catch (error) {
    console.error("Error updating campaign:", error);
    return NextResponse.json(
      { error: "Failed to update campaign" },
      { status: 500 },
    );
  }
}

// DELETE /api/admin/campaigns/[id] - Delete campaign (DRAFT only)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = await db.query.adminUsers.findFirst({
      where: eq(adminUsers.email, session.user.email as string),
    });

    if (!admin || !admin.isActive) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 },
      );
    }

    const campaign = await db.query.emailCampaigns.findFirst({
      where: eq(emailCampaigns.id, id),
    });

    if (!campaign) {
      return NextResponse.json(
        { error: "Campaign not found" },
        { status: 404 },
      );
    }

    // Only allow deleting DRAFT campaigns
    if (campaign.status !== "DRAFT") {
      return NextResponse.json(
        { error: "Can only delete draft campaigns" },
        { status: 400 },
      );
    }

    await db.delete(emailCampaigns).where(eq(emailCampaigns.id, id));

    return NextResponse.json({
      message: "Campaign deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting campaign:", error);
    return NextResponse.json(
      { error: "Failed to delete campaign" },
      { status: 500 },
    );
  }
}
