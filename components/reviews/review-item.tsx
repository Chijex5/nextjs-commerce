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
    user?: { name?: string | null } | null;
  };
  onVote?: (reviewId: string, isHelpful: boolean) => Promise<void>;
  canVote?: boolean;
}

export function ReviewItem({ review, onVote, canVote = false }: ReviewItemProps) {
  const [voting, setVoting] = useState(false);

  const handleVote = async (isHelpful: boolean) => {
    if (!onVote || voting) return;
    setVoting(true);
    try { await onVote(review.id, isHelpful); }
    finally { setVoting(false); }
  };

  return (
    <>
      <style>{`
        .ri-root {
          padding: 28px 0;
          border-bottom: 1px solid rgba(242,232,213,0.07);
          font-family: 'DM Sans', sans-serif;
        }
        .ri-root:first-child { padding-top: 20px; }
        .ri-root:last-child { border-bottom: none; padding-bottom: 0; }

        .ri-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 14px;
        }
        .ri-meta {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .ri-star-row {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .ri-verified {
          font-size: 9px;
          font-weight: 500;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: var(--terra, #BF5A28);
          border: 1px solid rgba(191,90,40,0.35);
          background: rgba(191,90,40,0.08);
          padding: 3px 9px;
        }
        .ri-byline {
          font-size: 12px;
          color: var(--muted, #6A5A48);
          letter-spacing: 0.04em;
        }
        .ri-byline-name {
          color: var(--sand, #C9B99A);
          font-weight: 500;
        }

        .ri-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 19px;
          font-weight: 400;
          color: var(--cream, #F2E8D5);
          margin-bottom: 8px;
          line-height: 1.2;
        }
        .ri-comment {
          font-size: 13px;
          line-height: 1.75;
          color: var(--sand, #C9B99A);
        }

        .ri-images {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 16px;
        }
        .ri-img {
          width: 72px;
          height: 72px;
          object-fit: cover;
          border: 1px solid rgba(242,232,213,0.09);
        }

        .ri-helpful {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 12px;
          margin-top: 18px;
          padding-top: 14px;
          border-top: 1px solid rgba(242,232,213,0.06);
        }
        .ri-helpful-label {
          font-size: 11px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--muted, #6A5A48);
        }
        .ri-vote-btn {
          background: transparent;
          border: 1px solid rgba(242,232,213,0.09);
          color: var(--muted, #6A5A48);
          font-family: 'DM Sans', sans-serif;
          font-size: 11px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          padding: 7px 16px;
          cursor: pointer;
          transition: border-color 0.2s, color 0.2s, background 0.2s;
        }
        .ri-vote-btn:hover:not(:disabled) {
          border-color: rgba(242,232,213,0.28);
          color: var(--cream, #F2E8D5);
          background: rgba(242,232,213,0.04);
        }
        .ri-vote-btn:disabled { opacity: 0.4; cursor: not-allowed; }
      `}</style>

      <div className="ri-root">
        <div className="ri-top">
          <div className="ri-meta">
            <div className="ri-star-row">
              <StarRating rating={review.rating} size="sm" />
              {review.isVerified && (
                <span className="ri-verified">Verified Purchase</span>
              )}
            </div>
            <p className="ri-byline">
              <span className="ri-byline-name">
                {review.user?.name || "Anonymous"}
              </span>
              {" · "}
              {format(new Date(review.createdAt), "MMM d, yyyy")}
            </p>
          </div>
        </div>

        {review.title && <h4 className="ri-title">{review.title}</h4>}
        {review.comment && <p className="ri-comment">{review.comment}</p>}

        {review.images && review.images.length > 0 && (
          <div className="ri-images">
            {review.images.map((image, i) => (
              <img
                key={i}
                src={image}
                alt={`Review image ${i + 1}`}
                className="ri-img"
              />
            ))}
          </div>
        )}

        {canVote && (
          <div className="ri-helpful">
            <span className="ri-helpful-label">Was this helpful?</span>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                onClick={() => handleVote(true)}
                disabled={voting}
                className="ri-vote-btn"
              >
                Yes {review.helpfulCount > 0 && `(${review.helpfulCount})`}
              </button>
              <button
                onClick={() => handleVote(false)}
                disabled={voting}
                className="ri-vote-btn"
              >
                No
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}