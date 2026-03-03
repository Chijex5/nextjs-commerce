"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { StarRating } from "components/reviews/star-rating";

type ReviewStatus = "pending" | "approved" | "rejected";

type AdminReview = {
  id: string;
  productId: string | null;
  userId: string | null;
  orderId: string | null;
  rating: number;
  title: string | null;
  comment: string | null;
  images: string[] | null;
  isVerified: boolean;
  helpfulCount: number;
  status: ReviewStatus;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
  } | null;
  product: {
    id: string;
    title: string;
    handle: string;
    images: Array<{
      url: string;
      altText: string | null;
    }>;
  } | null;
};

type ReviewsResponse = {
  reviews: AdminReview[];
  pagination: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
  };
  stats: {
    pending: number;
    approved: number;
    rejected: number;
    total: number;
  };
};

const EMPTY_RESPONSE: ReviewsResponse = {
  reviews: [],
  pagination: { page: 1, perPage: 20, total: 0, totalPages: 0 },
  stats: { pending: 0, approved: 0, rejected: 0, total: 0 },
};

const STATUS_OPTIONS: Array<{ value: "all" | ReviewStatus; label: string }> = [
  { value: "all", label: "All statuses" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

const RATING_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "all", label: "All ratings" },
  { value: "5", label: "5 stars" },
  { value: "4", label: "4 stars" },
  { value: "3", label: "3 stars" },
  { value: "2", label: "2 stars" },
  { value: "1", label: "1 star" },
];

const STATUS_BADGE: Record<ReviewStatus, string> = {
  pending:
    "border border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-700/40 dark:bg-amber-900/20 dark:text-amber-300",
  approved:
    "border border-green-200 bg-green-50 text-green-700 dark:border-green-700/40 dark:bg-green-900/20 dark:text-green-300",
  rejected:
    "border border-red-200 bg-red-50 text-red-700 dark:border-red-700/40 dark:bg-red-900/20 dark:text-red-300",
};

export default function ReviewsManagement() {
  const [statusFilter, setStatusFilter] = useState<"all" | ReviewStatus>(
    "pending",
  );
  const [ratingFilter, setRatingFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<ReviewsResponse>(EMPTY_RESPONSE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionReviewId, setActionReviewId] = useState<string | null>(null);

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: String(page),
        perPage: "20",
      });

      if (statusFilter !== "all") {
        params.set("status", statusFilter);
      }

      if (ratingFilter !== "all") {
        params.set("rating", ratingFilter);
      }

      const response = await fetch(`/api/admin/reviews?${params.toString()}`, {
        cache: "no-store",
      });
      const payload = (await response.json().catch(() => null)) as
        | ReviewsResponse
        | { error?: string }
        | null;

      if (!response.ok) {
        throw new Error(
          payload && "error" in payload && payload.error
            ? payload.error
            : "Failed to load reviews",
        );
      }

      setData((payload as ReviewsResponse) || EMPTY_RESPONSE);
    } catch (fetchError) {
      setData(EMPTY_RESPONSE);
      setError(
        fetchError instanceof Error
          ? fetchError.message
          : "Failed to load reviews",
      );
    } finally {
      setLoading(false);
    }
  }, [page, ratingFilter, statusFilter]);

  useEffect(() => {
    void fetchReviews();
  }, [fetchReviews]);

  const updateStatus = async (reviewId: string, status: ReviewStatus) => {
    setActionReviewId(reviewId);
    try {
      const response = await fetch(`/api/admin/reviews/${reviewId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const payload = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;

      if (!response.ok) {
        throw new Error(payload?.error || "Failed to update review status");
      }

      toast.success(`Review marked ${status}`);
      await fetchReviews();
    } catch (updateError) {
      toast.error(
        updateError instanceof Error
          ? updateError.message
          : "Failed to update review status",
      );
    } finally {
      setActionReviewId(null);
    }
  };

  const deleteReview = async (reviewId: string) => {
    if (!confirm("Delete this review permanently?")) {
      return;
    }

    setActionReviewId(reviewId);
    try {
      const response = await fetch(`/api/admin/reviews/${reviewId}`, {
        method: "DELETE",
      });
      const payload = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;

      if (!response.ok) {
        throw new Error(payload?.error || "Failed to delete review");
      }

      toast.success("Review deleted");
      await fetchReviews();
    } catch (deleteError) {
      toast.error(
        deleteError instanceof Error
          ? deleteError.message
          : "Failed to delete review",
      );
    } finally {
      setActionReviewId(null);
    }
  };

  const totalPages = data.pagination.totalPages;
  const canGoPrev = page > 1;
  const canGoNext = page < totalPages;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Pending" value={data.stats.pending} tone="amber" />
        <StatCard label="Approved" value={data.stats.approved} tone="green" />
        <StatCard label="Rejected" value={data.stats.rejected} tone="red" />
        <StatCard label="Total" value={data.stats.total} tone="neutral" />
      </div>

      <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row">
            <select
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value as "all" | ReviewStatus);
                setPage(1);
              }}
              className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-800"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <select
              value={ratingFilter}
              onChange={(event) => {
                setRatingFilter(event.target.value);
                setPage(1);
              }}
              className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-800"
            >
              {RATING_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={() => void fetchReviews()}
            className="rounded-md border border-neutral-300 px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
          >
            Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          <div className="h-40 animate-pulse rounded-lg bg-neutral-200 dark:bg-neutral-800" />
          <div className="h-40 animate-pulse rounded-lg bg-neutral-200 dark:bg-neutral-800" />
        </div>
      ) : error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-700/40 dark:bg-red-900/20 dark:text-red-300">
          {error}
        </div>
      ) : data.reviews.length === 0 ? (
        <div className="rounded-lg border border-neutral-200 bg-white p-8 text-center text-sm text-neutral-600 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400">
          No reviews found for the current filters.
        </div>
      ) : (
        <div className="space-y-4">
          {data.reviews.map((review) => {
            const isMutating = actionReviewId === review.id;

            return (
              <article
                key={review.id}
                className="rounded-lg border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900"
              >
                <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                      {review.product ? review.product.title : "Unknown product"}
                    </p>
                    {review.product?.handle ? (
                      <Link
                        href={`/product/${review.product.handle}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-neutral-500 underline-offset-2 hover:underline dark:text-neutral-400"
                      >
                        View product
                      </Link>
                    ) : null}
                    <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                      {review.user?.name || "Anonymous"}{" "}
                      {review.user?.email ? `(${review.user.email})` : ""} •{" "}
                      {new Date(review.createdAt).toLocaleString()}
                    </p>
                  </div>

                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${STATUS_BADGE[review.status]}`}
                  >
                    {review.status}
                  </span>
                </div>

                <div className="mb-3 flex items-center gap-3">
                  <StarRating rating={review.rating} size="sm" />
                  <span className="text-sm text-neutral-600 dark:text-neutral-300">
                    {review.rating}/5
                  </span>
                  {review.isVerified ? (
                    <span className="rounded border border-neutral-300 px-2 py-0.5 text-xs text-neutral-600 dark:border-neutral-700 dark:text-neutral-300">
                      Verified purchase
                    </span>
                  ) : null}
                  <span className="text-xs text-neutral-500 dark:text-neutral-400">
                    Helpful votes: {review.helpfulCount}
                  </span>
                </div>

                {review.title ? (
                  <h3 className="mb-2 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                    {review.title}
                  </h3>
                ) : null}

                {review.comment ? (
                  <p className="mb-3 text-sm text-neutral-700 dark:text-neutral-300">
                    {review.comment}
                  </p>
                ) : null}

                {review.images?.length ? (
                  <div className="mb-4 flex flex-wrap gap-2">
                    {review.images.map((image, index) => (
                      <img
                        key={`${review.id}-image-${index}`}
                        src={image}
                        alt={`Review image ${index + 1}`}
                        className="h-16 w-16 rounded border border-neutral-200 object-cover dark:border-neutral-700"
                      />
                    ))}
                  </div>
                ) : null}

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={isMutating || review.status === "approved"}
                    onClick={() => void updateStatus(review.id, "approved")}
                    className="rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-500 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    disabled={isMutating || review.status === "rejected"}
                    onClick={() => void updateStatus(review.id, "rejected")}
                    className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Reject
                  </button>
                  <button
                    type="button"
                    disabled={isMutating || review.status === "pending"}
                    onClick={() => void updateStatus(review.id, "pending")}
                    className="rounded-md bg-neutral-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-neutral-600 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Mark pending
                  </button>
                  <button
                    type="button"
                    disabled={isMutating}
                    onClick={() => void deleteReview(review.id)}
                    className="rounded-md border border-red-300 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-red-700/40 dark:text-red-300 dark:hover:bg-red-900/20"
                  >
                    Delete
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {totalPages > 1 ? (
        <div className="flex items-center justify-between rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Page {page} of {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={!canGoPrev}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm text-neutral-700 hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={!canGoNext}
              onClick={() =>
                setPage((current) => Math.min(totalPages, current + 1))
              }
              className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm text-neutral-700 hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
            >
              Next
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "amber" | "green" | "red" | "neutral";
}) {
  const toneClass =
    tone === "amber"
      ? "text-amber-600 dark:text-amber-300"
      : tone === "green"
        ? "text-green-600 dark:text-green-300"
        : tone === "red"
          ? "text-red-600 dark:text-red-300"
          : "text-neutral-900 dark:text-neutral-100";

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
      <p className="text-sm text-neutral-600 dark:text-neutral-400">{label}</p>
      <p className={`mt-1 text-2xl font-semibold ${toneClass}`}>{value}</p>
    </div>
  );
}
