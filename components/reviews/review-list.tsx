"use client";

import { useEffect, useState } from "react";
import { StarRating } from "./star-rating";
import { ReviewItem } from "./review-item";
import { ReviewForm } from "./review-form";

interface ReviewListProps {
  productId: string;
  showForm?: boolean;
  canReview?: boolean;
  orderId?: string;
}

type SortOption = "newest" | "highest" | "lowest" | "helpful";

type ReviewApiItem = {
  id: string;
  rating: number;
  title?: string | null;
  comment?: string | null;
  images?: string[];
  isVerified: boolean;
  helpfulCount: number;
  createdAt: string;
  user?: {
    name?: string | null;
  } | null;
};

type ReviewListResponse = {
  reviews: ReviewApiItem[];
  averageRating: number;
  totalReviews: number;
};

export function ReviewList({
  productId,
  showForm = false,
  canReview = false,
  orderId,
}: ReviewListProps) {
  const [reviews, setReviews] = useState<ReviewApiItem[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<SortOption>("newest");
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchReviews = async () => {
    try {
      setFetchError(null);
      const response = await fetch(
        `/api/reviews?productId=${productId}&sort=${sort}`,
        { cache: "no-store" },
      );

      if (!response.ok) {
        throw new Error("Failed to load reviews");
      }

      const data = (await response.json()) as ReviewListResponse;
      setReviews(data.reviews || []);
      setAverageRating(data.averageRating || 0);
      setTotalReviews(data.totalReviews || 0);
    } catch (error) {
      setFetchError(
        error instanceof Error ? error.message : "Failed to load reviews",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchReviews();
  }, [productId, sort]);

  const handleVote = async (reviewId: string, isHelpful: boolean) => {
    try {
      const response = await fetch(`/api/reviews/${reviewId}/vote`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isHelpful }),
      });

      if (response.ok) {
        await fetchReviews();
      }
    } catch (error) {
      // Keep silent in UI but log for debugging.
      console.error("Failed to vote:", error);
    }
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-6 text-center dark:border-neutral-800 dark:bg-neutral-900">
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Loading reviews...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-neutral-200 bg-white p-4 sm:p-6 dark:border-neutral-800 dark:bg-neutral-950">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="flex flex-wrap items-center gap-4">
            <div className="rounded-xl bg-neutral-100 px-4 py-3 text-center dark:bg-neutral-800">
              <p className="text-3xl font-semibold text-neutral-900 dark:text-neutral-100">
                {averageRating.toFixed(1)}
              </p>
              <p className="text-xs uppercase tracking-[0.08em] text-neutral-500 dark:text-neutral-400">
                Rating
              </p>
            </div>

            <div>
              <StarRating rating={averageRating} size="lg" />
              <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
                {totalReviews} {totalReviews === 1 ? "review" : "reviews"}
              </p>
            </div>
          </div>

          {showForm && canReview ? (
            <button
              onClick={() => setShowReviewForm((open) => !open)}
              className="inline-flex items-center justify-center rounded-lg bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-neutral-700 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
            >
              {showReviewForm ? "Close review form" : "Write a review"}
            </button>
          ) : null}
        </div>
      </div>

      {showReviewForm ? (
        <div className="rounded-2xl border border-neutral-200 bg-white p-4 sm:p-6 dark:border-neutral-800 dark:bg-neutral-950">
          <h3 className="mb-4 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            Share your experience
          </h3>
          <ReviewForm
            productId={productId}
            orderId={orderId}
            onSuccess={() => {
              setShowReviewForm(false);
              void fetchReviews();
            }}
          />
        </div>
      ) : null}

      {fetchError ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-700/50 dark:bg-amber-900/20 dark:text-amber-300">
          {fetchError}
        </div>
      ) : null}

      <div className="rounded-2xl border border-neutral-200 bg-white p-4 sm:p-6 dark:border-neutral-800 dark:bg-neutral-950">
        <div className="mb-4 flex flex-col gap-3 border-b border-neutral-200 pb-4 sm:flex-row sm:items-center sm:justify-between dark:border-neutral-800">
          <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
            Customer feedback
          </h3>
          <label className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
            Sort:
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortOption)}
              className="rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-sm text-neutral-800 focus:border-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-200 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:focus:border-neutral-500 dark:focus:ring-neutral-700/50"
            >
              <option value="newest">Newest</option>
              <option value="highest">Highest rated</option>
              <option value="lowest">Lowest rated</option>
              <option value="helpful">Most helpful</option>
            </select>
          </label>
        </div>

        {reviews.length === 0 ? (
          <div className="rounded-xl border border-dashed border-neutral-300 p-8 text-center dark:border-neutral-700">
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              No reviews yet.
            </p>
          </div>
        ) : (
          <div>
            {reviews.map((review) => (
              <ReviewItem
                key={review.id}
                review={review}
                onVote={handleVote}
                canVote={true}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
