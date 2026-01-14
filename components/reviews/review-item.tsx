'use client';

import { StarRating } from './star-rating';
import { format } from 'date-fns';
import { useState } from 'react';

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

export function ReviewItem({ review, onVote, canVote = false }: ReviewItemProps) {
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
    <div className="border-b border-neutral-200 py-6 first:pt-0 last:border-b-0">
      <div className="mb-3 flex items-start justify-between">
        <div className="flex-1">
          <div className="mb-2 flex items-center gap-2">
            <StarRating rating={review.rating} size="sm" />
            {review.isVerified && (
              <span className="rounded bg-neutral-100 px-2 py-0.5 text-xs text-neutral-600">
                Verified Purchase
              </span>
            )}
          </div>
          <p className="text-sm text-neutral-600">
            {review.user?.name || 'Anonymous'} •{' '}
            {format(new Date(review.createdAt), 'MMM d, yyyy')}
          </p>
        </div>
      </div>

      {review.title && (
        <h4 className="mb-2 font-medium text-black">{review.title}</h4>
      )}

      {review.comment && (
        <p className="text-sm leading-relaxed text-neutral-700">{review.comment}</p>
      )}

      {review.images && review.images.length > 0 && (
        <div className="mt-4 flex gap-2">
          {review.images.map((image, i) => (
            <img
              key={i}
              src={image}
              alt={`Review image ${i + 1}`}
              className="h-20 w-20 rounded border border-neutral-200 object-cover"
            />
          ))}
        </div>
      )}

      {canVote && (
        <div className="mt-4 flex items-center gap-4">
          <span className="text-sm text-neutral-600">Was this helpful?</span>
          <div className="flex gap-2">
            <button
              onClick={() => handleVote(true)}
              disabled={voting}
              className="rounded border border-neutral-200 px-3 py-1 text-sm transition-colors hover:border-black disabled:opacity-50"
            >
              Yes {review.helpfulCount > 0 && `(${review.helpfulCount})`}
            </button>
            <button
              onClick={() => handleVote(false)}
              disabled={voting}
              className="rounded border border-neutral-200 px-3 py-1 text-sm transition-colors hover:border-black disabled:opacity-50"
            >
              No
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
