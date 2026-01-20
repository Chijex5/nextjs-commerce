import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// POST /api/reviews/[id]/vote - Vote on a review (helpful/not helpful)
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const { isHelpful } = await request.json();
    const { id } = await context.params;

    if (typeof isHelpful !== "boolean") {
      return NextResponse.json(
        { error: "isHelpful must be a boolean" },
        { status: 400 },
      );
    }

    // Check if review exists
    const review = await prisma.review.findUnique({
      where: { id },
    });

    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    // Check if user already voted on this review
    const existingVote = await prisma.reviewVote.findUnique({
      where: {
        review_vote_unique: {
          reviewId: id,
          userId: session.user.id,
        },
      },
    });

    if (existingVote) {
      // Update existing vote
      await prisma.reviewVote.update({
        where: {
          id: existingVote.id,
        },
        data: {
          isHelpful,
        },
      });
    } else {
      // Create new vote
      await prisma.reviewVote.create({
        data: {
          reviewId: id,
          userId: session.user.id,
          isHelpful,
        },
      });
    }

    // Update helpful count on the review
    const helpfulVotes = await prisma.reviewVote.count({
      where: {
        reviewId: id,
        isHelpful: true,
      },
    });

    await prisma.review.update({
      where: { id },
      data: { helpfulCount: helpfulVotes },
    });

    return NextResponse.json({
      success: true,
      helpfulCount: helpfulVotes,
    });
  } catch (error) {
    console.error("Error voting on review:", error);
    return NextResponse.json(
      { error: "Failed to vote on review" },
      { status: 500 },
    );
  }
}
