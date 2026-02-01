import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { products, reviews, users } from "@/lib/db/schema";
import { requireAdminSession } from "lib/admin-auth";
import { sendReviewApprovedEmail } from "@/lib/email/order-emails";
import { eq } from "drizzle-orm";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireAdminSession();

    if (!session) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 },
      );
    }

    const { status } = await request.json();
    const { id } = await context.params;

    if (!["approved", "rejected", "pending"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status. Must be approved, rejected, or pending" },
        { status: 400 },
      );
    }

    const [reviewRow] = await db
      .select({
        review: reviews,
        user: users,
        product: products,
      })
      .from(reviews)
      .leftJoin(users, eq(reviews.userId, users.id))
      .leftJoin(products, eq(reviews.productId, products.id))
      .where(eq(reviews.id, id))
      .limit(1);

    if (!reviewRow) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    const [updatedReview] = await db
      .update(reviews)
      .set({ status })
      .where(eq(reviews.id, id))
      .returning();

    if (status === "approved" && reviewRow.user?.email && reviewRow.product) {
      try {
        await sendReviewApprovedEmail({
          to: reviewRow.user.email,
          customerName: reviewRow.user.name || "Customer",
          productTitle: reviewRow.product.title,
          productHandle: reviewRow.product.handle,
          reviewTitle: reviewRow.review.title || "",
          reviewComment: reviewRow.review.comment || "",
          rating: reviewRow.review.rating,
        });
      } catch (emailError) {
        console.error("Failed to send review approved email:", emailError);
      }
    }

    return NextResponse.json({
      success: true,
      review: updatedReview,
    });
  } catch (error) {
    console.error("Error updating review:", error);
    return NextResponse.json(
      { error: "Failed to update review" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireAdminSession();

    if (!session) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 },
      );
    }

    const { id } = await context.params;

    await db.delete(reviews).where(eq(reviews.id, id));

    return NextResponse.json({
      success: true,
      message: "Review deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting review:", error);
    return NextResponse.json(
      { error: "Failed to delete review" },
      { status: 500 },
    );
  }
}
