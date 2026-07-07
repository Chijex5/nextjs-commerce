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
  user?: { name?: string | null } | null;
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
      if (!response.ok) throw new Error("Failed to load reviews");
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isHelpful }),
      });
      if (response.ok) await fetchReviews();
    } catch (error) {
      console.error("Failed to vote:", error);
    }
  };

  if (loading) {
    return (
      <>
        <style>{`
          @keyframes rl-pulse {
            0%, 100% { opacity: 0.3; }
            50% { opacity: 0.6; }
          }
        `}</style>
        <div
          style={{
            padding: "40px",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              style={{
                height: "80px",
                background: "rgba(var(--brand-fg-rgb),0.04)",
                border: "1px solid rgba(var(--brand-fg-rgb),0.09)",
                animation: "rl-pulse 1.8s ease-in-out infinite",
                animationDelay: `${i * 0.15}s`,
              }}
            />
          ))}
        </div>
      </>
    );
  }

  return (
    <>
      <style>{`
        .rl-root {
          font-family: 'DM Sans', sans-serif;
          color: var(--cream, var(--brand-cream));
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        /* ── SUMMARY BAR ── */
        .rl-summary {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          padding: 28px 40px;
          border-bottom: 1px solid rgba(var(--brand-fg-rgb),0.09);
          background: rgba(var(--brand-fg-rgb),0.02);
        }
        .rl-score-block {
          display: flex;
          align-items: center;
          gap: 20px;
        }
        .rl-score-num {
          font-family: 'Cormorant Garamond', serif;
          font-size: 52px;
          font-weight: 300;
          line-height: 1;
          color: var(--gold, var(--brand-gold));
        }
        .rl-score-meta {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .rl-review-count {
          font-size: 11px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--muted, var(--brand-muted));
          margin-top: 4px;
        }
        .rl-write-btn {
          background: var(--terra, var(--brand-terra));
          border: none;
          color: var(--cream, var(--brand-cream));
          font-family: 'DM Sans', sans-serif;
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          padding: 12px 24px;
          cursor: pointer;
          transition: background 0.2s;
          flex-shrink: 0;
        }
        .rl-write-btn:hover { background: var(--brand-terra-dark); }

        /* ── FORM WRAPPER ── */
        .rl-form-wrap {
          padding: 32px 40px;
          border-bottom: 1px solid rgba(var(--brand-fg-rgb),0.09);
          background: rgba(var(--brand-fg-rgb),0.02);
        }
        .rl-form-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 22px;
          font-weight: 300;
          color: var(--cream, var(--brand-cream));
          margin-bottom: 20px;
        }

        /* ── ERROR BANNER ── */
        .rl-error {
          margin: 0 40px;
          padding: 14px 18px;
          border: 1px solid rgba(var(--brand-gold-rgb),0.3);
          background: rgba(var(--brand-gold-rgb),0.06);
          font-size: 13px;
          color: var(--brand-gold-light);
        }

        /* ── REVIEWS PANEL ── */
        .rl-panel {
          padding: 28px 40px 36px;
          background: rgba(var(--brand-fg-rgb),0.015);
        }
        .rl-panel-header {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding-bottom: 20px;
          border-bottom: 1px solid rgba(var(--brand-fg-rgb),0.09);
          margin-bottom: 4px;
        }
        .rl-panel-title {
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: var(--muted, var(--brand-muted));
        }
        .rl-sort-wrap {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 11px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--muted, var(--brand-muted));
        }
        .rl-sort-select {
          background: rgba(var(--brand-bg-rgb),0.6);
          border: 1px solid rgba(var(--brand-fg-rgb),0.09);
          color: var(--cream, var(--brand-cream));
          font-family: 'DM Sans', sans-serif;
          font-size: 11px;
          letter-spacing: 0.1em;
          padding: 7px 12px;
          outline: none;
          cursor: pointer;
          transition: border-color 0.2s;
          -webkit-appearance: none;
          appearance: none;
        }
        .rl-sort-select:focus { border-color: rgba(var(--brand-terra-rgb),0.5); }
        .rl-sort-select option { background: var(--brand-charcoal); }

        /* ── EMPTY ── */
        .rl-empty {
          padding: 48px 0;
          text-align: center;
          border: 1px dashed rgba(var(--brand-fg-rgb),0.1);
          margin-top: 20px;
        }
        .rl-empty-text {
          font-family: 'Cormorant Garamond', serif;
          font-size: 20px;
          font-weight: 300;
          font-style: italic;
          color: var(--muted, var(--brand-muted));
        }
        .rl-empty-sub {
          font-size: 11px;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: rgba(var(--brand-muted-rgb),0.5);
          margin-top: 8px;
        }

        @media (max-width: 640px) {
          .rl-summary { padding: 20px; }
          .rl-form-wrap { padding: 20px; }
          .rl-panel { padding: 20px; }
          .rl-error { margin: 0 20px; }
          .rl-score-num { font-size: 40px; }
        }
      `}</style>

      <div className="rl-root">
        {/* Summary bar */}
        <div className="rl-summary">
          <div className="rl-score-block">
            <span className="rl-score-num">{averageRating.toFixed(1)}</span>
            <div className="rl-score-meta">
              <StarRating rating={averageRating} size="lg" />
              <p className="rl-review-count">
                {totalReviews} {totalReviews === 1 ? "review" : "reviews"}
              </p>
            </div>
          </div>
          {showForm && canReview && (
            <button
              onClick={() => setShowReviewForm((open) => !open)}
              className="rl-write-btn"
            >
              {showReviewForm ? "Close form" : "Write a review"}
            </button>
          )}
        </div>

        {/* Review form */}
        {showReviewForm && (
          <div className="rl-form-wrap">
            <h3 className="rl-form-title">Share your experience</h3>
            <ReviewForm
              productId={productId}
              orderId={orderId}
              onSuccess={() => {
                setShowReviewForm(false);
                void fetchReviews();
              }}
            />
          </div>
        )}

        {/* Fetch error */}
        {fetchError && <div className="rl-error">{fetchError}</div>}

        {/* Reviews list */}
        <div className="rl-panel">
          <div className="rl-panel-header">
            <span className="rl-panel-title">Customer feedback</span>
            <div className="rl-sort-wrap">
              <span>Sort</span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortOption)}
                className="rl-sort-select"
              >
                <option value="newest">Newest</option>
                <option value="highest">Highest rated</option>
                <option value="lowest">Lowest rated</option>
                <option value="helpful">Most helpful</option>
              </select>
            </div>
          </div>

          {reviews.length === 0 ? (
            <div className="rl-empty">
              <p className="rl-empty-text">No reviews yet.</p>
              <p className="rl-empty-sub">
                Be the first to share your experience
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
    </>
  );
}
