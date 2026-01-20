"use client";

import { useState, useEffect } from "react";
import { StarRating } from "./star-rating";
import { ReviewItem } from "./review-item";
import { ReviewForm } from "./review-form";

interface ReviewListProps {
  productId: string;
  showForm?: boolean;
  canReview?: boolean;
  orderId?: string;
}

export function ReviewList({
  productId,
  showForm = false,
  canReview = false,
  orderId,
}: ReviewListProps) {
  const [reviews, setReviews] = useState<any[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<"newest" | "highest" | "lowest" | "helpful">(
    "newest",
  );
  const [showReviewForm, setShowReviewForm] = useState(false);

  const fetchReviews = async () => {
    try {
      const response = await fetch(
        `/api/reviews?productId=${productId}&sort=${sort}`,
      );
      if (response.ok) {
        const data = await response.json();
        setReviews(data.reviews);
        setAverageRating(data.averageRating);
        setTotalReviews(data.totalReviews);
      }
    } catch (error) {
      console.error("Failed to fetch reviews:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
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
        fetchReviews(); // Refresh to show updated vote count
      }
    } catch (error) {
      console.error("Failed to vote:", error);
    }
  };

  if (loading) {
    return (
      <div className="py-8 text-center">
        <p className="text-neutral-600">Loading reviews...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="border-b border-neutral-200 pb-6">
        <div className="mb-4 flex items-center gap-4">
          <div className="text-4xl font-semibold text-black">
            {averageRating.toFixed(1)}
          </div>
          <div>
            <StarRating rating={averageRating} size="lg" />
            <p className="text-sm text-neutral-600">
              Based on {totalReviews} reviews
            </p>
          </div>
        </div>

        {showForm && canReview && (
          <button
            onClick={() => setShowReviewForm(!showReviewForm)}
            className="rounded bg-black px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-800"
          >
            {showReviewForm ? "Cancel" : "Write a Review"}
          </button>
        )}
      </div>

      {/* Review Form */}
      {showReviewForm && (
        <div className="border-b border-neutral-200 pb-6">
          <h3 className="mb-4 text-lg font-semibold text-black">
            Write Your Review
          </h3>
          <ReviewForm
            productId={productId}
            orderId={orderId}
            onSuccess={() => {
              setShowReviewForm(false);
              fetchReviews();
            }}
          />
        </div>
      )}

      {/* Sort Options */}
      {totalReviews > 0 && (
        <div className="flex items-center justify-between border-b border-neutral-200 pb-4">
          <h3 className="font-semibold text-black">Customer Reviews</h3>
          <div className="flex items-center gap-2">
            <span className="text-sm text-neutral-600">Sort by:</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as any)}
              className="rounded border border-neutral-200 px-3 py-1 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
            >
              <option value="newest">Newest</option>
              <option value="highest">Highest Rated</option>
              <option value="lowest">Lowest Rated</option>
              <option value="helpful">Most Helpful</option>
            </select>
          </div>
        </div>
      )}

      {/* Reviews List */}
      {reviews.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-neutral-600">
            No reviews yet. Be the first to review this product!
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
  );
}
