"use client";

import { StarRating } from "./star-rating";
import { format } from "date-fns";
import { useState } from "react";

interface ReviewItemProps {
  review: {
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
  onVote?: (reviewId: string, isHelpful: boolean) => Promise<void>;
  canVote?: boolean;
}

export function ReviewItem({
  review,
  onVote,
  canVote = false,
}: ReviewItemProps) {
  const [voting, setVoting] = useState(false);

  const handleVote = async (isHelpful: boolean) => {
    if (!onVote || voting) return;

    setVoting(true);
    try {
      await onVote(review.id, isHelpful);
    } finally {
      setVoting(false);
    }
  };

  return (
    <div className="border-b border-neutral-200 py-6 first:pt-0 last:border-b-0 dark:border-neutral-800">
      <div className="mb-3 flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="mb-2 flex items-center gap-2">
            <StarRating rating={review.rating} size="sm" />
            {review.isVerified && (
              <span className="rounded-full border border-neutral-300 bg-neutral-100 px-2.5 py-0.5 text-xs font-medium text-neutral-700 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
                Verified Purchase
              </span>
            )}
          </div>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            {review.user?.name || "Anonymous"} •{" "}
            {format(new Date(review.createdAt), "MMM d, yyyy")}
          </p>
        </div>
      </div>

      {review.title && (
        <h4 className="mb-2 font-semibold text-neutral-900 dark:text-neutral-100">
          {review.title}
        </h4>
      )}

      {review.comment && (
        <p className="text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
          {review.comment}
        </p>
      )}

      {review.images && review.images.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {review.images.map((image, i) => (
            <img
              key={i}
              src={image}
              alt={`Review image ${i + 1}`}
              className="h-20 w-20 rounded-lg border border-neutral-200 object-cover dark:border-neutral-700"
            />
          ))}
        </div>
      )}

      {canVote && (
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <span className="text-sm text-neutral-600 dark:text-neutral-400">
            Was this helpful?
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleVote(true)}
              disabled={voting}
              className="rounded-full border border-neutral-300 px-3 py-1.5 text-sm text-neutral-700 transition-colors hover:border-neutral-500 hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:border-neutral-500 dark:hover:bg-neutral-800"
            >
              Yes {review.helpfulCount > 0 && `(${review.helpfulCount})`}
            </button>
            <button
              onClick={() => handleVote(false)}
              disabled={voting}
              className="rounded-full border border-neutral-300 px-3 py-1.5 text-sm text-neutral-700 transition-colors hover:border-neutral-500 hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:border-neutral-500 dark:hover:bg-neutral-800"
            >
              No
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
