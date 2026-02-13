import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { reviewVotes, reviews } from "@/lib/db/schema";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { and, eq, sql } from "drizzle-orm";
import { ReviewVoteBody } from "types/api";

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

    const { isHelpful } = (await request.json()) as ReviewVoteBody;
    const { id } = await context.params;

    if (typeof isHelpful !== "boolean") {
      return NextResponse.json(
        { error: "isHelpful must be a boolean" },
        { status: 400 },
      );
    }

    const [review] = await db
      .select({ id: reviews.id })
      .from(reviews)
      .where(eq(reviews.id, id))
      .limit(1);

    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    const [existingVote] = await db
      .select()
      .from(reviewVotes)
      .where(
        and(eq(reviewVotes.reviewId, id), eq(reviewVotes.userId, session.user.id)),
      )
      .limit(1);

    if (existingVote) {
      await db
        .update(reviewVotes)
        .set({ isHelpful })
        .where(eq(reviewVotes.id, existingVote.id));
    } else {
      await db.insert(reviewVotes).values({
        reviewId: id,
        userId: session.user.id,
        isHelpful,
      });
    }

    const [helpfulStats] = await db
      .select({ count: sql<number>`count(*)` })
      .from(reviewVotes)
      .where(
        and(eq(reviewVotes.reviewId, id), eq(reviewVotes.isHelpful, true)),
      );

    const helpfulCount = Number(helpfulStats?.count ?? 0);

    await db
      .update(reviews)
      .set({ helpfulCount })
      .where(eq(reviews.id, id));

    return NextResponse.json({
      success: true,
      helpfulCount,
    });
  } catch (error) {
    console.error("Error voting on review:", error);
    return NextResponse.json(
      { error: "Failed to vote on review" },
      { status: 500 },
    );
  }
}
