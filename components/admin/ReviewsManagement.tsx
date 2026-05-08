"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { StarRating } from "components/reviews/star-rating";

// ─── Types ────────────────────────────────────────────────────────────────────

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
  user: { id: string; name: string | null; email: string } | null;
  product: {
    id: string;
    title: string;
    handle: string;
    images: Array<{ url: string; altText: string | null }>;
  } | null;
};

type ReviewsResponse = {
  reviews: AdminReview[];
  pagination: { page: number; perPage: number; total: number; totalPages: number };
  stats: { pending: number; approved: number; rejected: number; total: number };
};

// ─── Constants ────────────────────────────────────────────────────────────────

const EMPTY: ReviewsResponse = {
  reviews: [],
  pagination: { page: 1, perPage: 20, total: 0, totalPages: 0 },
  stats: { pending: 0, approved: 0, rejected: 0, total: 0 },
};

const STATUS_TABS: Array<{ value: "all" | ReviewStatus; label: string }> = [
  { value: "all",      label: "All"      },
  { value: "pending",  label: "Pending"  },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

function pct(n: number, total: number) {
  return total === 0 ? 0 : Math.round((n / total) * 100);
}

// ─── SVG Donut chart ──────────────────────────────────────────────────────────

type DonutSlice = { value: number; color: string; label: string };

function DonutChart({ slices, size = 120 }: { slices: DonutSlice[]; size?: number }) {
  const r = 42;
  const cx = size / 2;
  const circ = 2 * Math.PI * r;
  const total = slices.reduce((s, sl) => s + sl.value, 0);

  const segments = useMemo(() => {
    let offset = 0;
    return slices.map((sl) => {
      const len = total === 0 ? 0 : (sl.value / total) * circ;
      const seg = { ...sl, dashArray: `${len} ${circ - len}`, offset: circ * 0.25 - offset };
      offset += len;
      return seg;
    });
  }, [slices, total, circ]);

  if (total === 0) {
    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={cx} cy={cx} r={r} fill="none" stroke="currentColor"
          strokeWidth="14" className="text-neutral-100 dark:text-neutral-800" />
      </svg>
    );
  }

  return (
<svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Review status distribution">
      {segments.map((seg, i) => (
        <circle
          key={i}
          cx={cx} cy={cx} r={r}
          fill="none"
          stroke={seg.color}
          strokeWidth="14"
          strokeDasharray={seg.dashArray}
          strokeDashoffset={seg.offset}
          strokeLinecap="butt"
          style={{ transition: "stroke-dasharray 0.5s ease" }}
        />
      ))}
      {/* Centre label */}
      <text x={cx} y={cx - 6} textAnchor="middle" className="fill-neutral-900 dark:fill-neutral-100"
        fontSize="20" fontWeight="700" fontFamily="inherit">
        {total}
      </text>
      <text x={cx} y={cx + 11} textAnchor="middle"
        fontSize="9" fontWeight="600" letterSpacing="0.06em"
        className="fill-neutral-400 dark:fill-neutral-500" fontFamily="inherit"
        style={{ textTransform: "uppercase" }}>
        REVIEWS
      </text>
    </svg>
  );
}

// ─── Rating bar chart ─────────────────────────────────────────────────────────

function RatingBars({ reviews }: { reviews: AdminReview[] }) {
  const counts = useMemo(() => {
    const c = [0, 0, 0, 0, 0]; // index 0 = 1 star … 4 = 5 stars
    reviews.forEach((r) => { if (r.rating >= 1 && r.rating <= 5) c[r.rating - 1]!++; });
    return c;
  }, [reviews]);

  const max = Math.max(...counts, 1);

  return (
    <div className="space-y-1.5">
      {[5, 4, 3, 2, 1].map((star) => {
        const count = counts[star - 1]!;
        const w = pct(count, max);
        return (
          <div key={star} className="flex items-center gap-2">
            <span className="w-3 flex-shrink-0 text-right text-[11px] font-semibold text-neutral-500 dark:text-neutral-400">
              {star}
            </span>
            <svg width="12" height="11" viewBox="0 0 12 11" className="flex-shrink-0 text-amber-400" fill="currentColor">
              <path d="M6 .5l1.545 3.13L11 4.15l-2.5 2.435.59 3.44L6 8.435 2.91 10.025 3.5 6.585 1 4.15l3.455-.52L6 .5z"/>
            </svg>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
              <div
                className="h-full rounded-full bg-amber-400 transition-all duration-500"
                style={{ width: `${w}%` }}
              />
            </div>
            <span className="w-5 flex-shrink-0 text-right text-[11px] font-medium text-neutral-400 dark:text-neutral-500">
              {count}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Status pill ──────────────────────────────────────────────────────────────

function StatusPill({ status }: { status: ReviewStatus }) {
  const map: Record<ReviewStatus, string> = {
    pending:  "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400",
    approved: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400",
    rejected: "bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${map[status]}`}>
      {status}
    </span>
  );
}

// ─── Star display ─────────────────────────────────────────────────────────────

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} width="12" height="11" viewBox="0 0 12 11" fill="none"
          className={i <= rating ? "text-amber-400" : "text-neutral-200 dark:text-neutral-700"}
        >
          <path d="M6 .5l1.545 3.13L11 4.15l-2.5 2.435.59 3.44L6 8.435 2.91 10.025 3.5 6.585 1 4.15l3.455-.52L6 .5z"
            fill="currentColor" />
        </svg>
      ))}
    </div>
  );
}

// ─── Action buttons ───────────────────────────────────────────────────────────

function ActionBtn({
  onClick, disabled, variant, children,
}: {
  onClick: () => void;
  disabled: boolean;
  variant: "approve" | "reject" | "pending" | "delete";
  children: React.ReactNode;
}) {
  const cls = {
    approve: "bg-emerald-600 text-white hover:bg-emerald-500",
    reject:  "bg-red-600 text-white hover:bg-red-500",
    pending: "border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-transparent dark:text-neutral-300 dark:hover:bg-neutral-800",
    delete:  "text-red-500 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30",
  }[variant];

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex items-center rounded-lg px-3 py-1.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${cls}`}
    >
      {children}
    </button>
  );
}

// ─── Review card ──────────────────────────────────────────────────────────────

function ReviewCard({
  review,
  isMutating,
  onUpdateStatus,
  onDelete,
}: {
  review: AdminReview;
  isMutating: boolean;
  onUpdateStatus: (id: string, status: ReviewStatus) => void;
  onDelete: (id: string) => void;
}) {
  const thumb = review.product?.images?.[0]?.url;

  return (
    <article className="overflow-hidden rounded-2xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
      {/* Header row */}
      <div className="flex items-start gap-4 border-b border-neutral-100 px-5 py-4 dark:border-neutral-800">
        {/* Product thumb */}
        <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg border border-neutral-100 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-950">
          {thumb ? (
            <img src={thumb} alt={review.product?.title} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-neutral-300">
                <rect x="1" y="1" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.25" />
                <path d="M1 9l3-3 3 3 2-2 4 4" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          )}
        </div>

        {/* Product + reviewer info */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              {review.product?.title ?? "Unknown product"}
            </p>
            {review.product?.handle && (
              <Link
                href={`/product/${review.product.handle}`}
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-neutral-400 underline-offset-2 hover:underline dark:text-neutral-500"
              >
                ↗ View
              </Link>
            )}
          </div>
          <p className="mt-0.5 text-[11px] text-neutral-400 dark:text-neutral-500">
            {review.user?.name || "Anonymous"}
            {review.user?.email ? ` · ${review.user.email}` : ""}
            {" · "}{fmtDate(review.createdAt)}
          </p>
        </div>

        {/* Status badge + rating */}
        <div className="flex flex-shrink-0 flex-col items-end gap-1.5">
          <StatusPill status={review.status} />
          <Stars rating={review.rating} />
        </div>
      </div>

      {/* Body */}
      <div className="px-5 py-4">
        {/* Badges row */}
        <div className="mb-3 flex flex-wrap items-center gap-2">
          {review.isVerified && (
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400">
              <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                <path d="M1.5 4l2 2 3-3" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Verified
            </span>
          )}
          {review.helpfulCount > 0 && (
            <span className="text-[11px] text-neutral-400 dark:text-neutral-500">
              {review.helpfulCount} found helpful
            </span>
          )}
        </div>

        {/* Review content */}
        {review.title && (
          <p className="mb-1.5 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
            {review.title}
          </p>
        )}
        {review.comment && (
          <p className="text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
            {review.comment}
          </p>
        )}

        {/* Images */}
        {review.images?.length ? (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {review.images.map((img, i) => (
              <img
                key={i}
                src={img}
                alt={`Review image ${i + 1}`}
                className="h-14 w-14 rounded-lg border border-neutral-200 object-cover dark:border-neutral-700"
              />
            ))}
          </div>
        ) : null}
      </div>

      {/* Action bar */}
      <div className="flex items-center justify-between border-t border-neutral-100 px-5 py-3 dark:border-neutral-800">
        <div className="flex items-center gap-1.5">
          <ActionBtn
            variant="approve"
            disabled={isMutating || review.status === "approved"}
            onClick={() => onUpdateStatus(review.id, "approved")}
          >
            Approve
          </ActionBtn>
          <ActionBtn
            variant="reject"
            disabled={isMutating || review.status === "rejected"}
            onClick={() => onUpdateStatus(review.id, "rejected")}
          >
            Reject
          </ActionBtn>
          {review.status !== "pending" && (
            <ActionBtn
              variant="pending"
              disabled={isMutating}
              onClick={() => onUpdateStatus(review.id, "pending")}
            >
              Reset
            </ActionBtn>
          )}
        </div>
        <ActionBtn
          variant="delete"
          disabled={isMutating}
          onClick={() => onDelete(review.id)}
        >
          Delete
        </ActionBtn>
      </div>
    </article>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function CardSkeleton() {
  return (
    <div className="animate-pulse overflow-hidden rounded-2xl border border-neutral-100 dark:border-neutral-800">
      <div className="flex items-center gap-4 border-b border-neutral-100 px-5 py-4 dark:border-neutral-800">
        <div className="h-10 w-10 rounded-lg bg-neutral-100 dark:bg-neutral-800" />
        <div className="flex-1 space-y-1.5">
          <div className="h-3.5 w-40 rounded bg-neutral-100 dark:bg-neutral-800" />
          <div className="h-2.5 w-56 rounded bg-neutral-100 dark:bg-neutral-800" />
        </div>
      </div>
      <div className="space-y-2 px-5 py-4">
        <div className="h-3 w-full rounded bg-neutral-100 dark:bg-neutral-800" />
        <div className="h-3 w-3/4 rounded bg-neutral-100 dark:bg-neutral-800" />
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ReviewsManagement() {
  const [statusFilter, setStatusFilter] = useState<"all" | ReviewStatus>("pending");
  const [ratingFilter, setRatingFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<ReviewsResponse>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const p = new URLSearchParams({ page: String(page), perPage: "20" });
      if (statusFilter !== "all") p.set("status", statusFilter);
      if (ratingFilter !== "all") p.set("rating", ratingFilter);
      const res = await fetch(`/api/admin/reviews?${p}`, { cache: "no-store" });
      const payload = await res.json().catch(() => null);
      if (!res.ok) throw new Error(payload?.error || "Failed to load reviews");
      setData(payload || EMPTY);
    } catch (e) {
      setData(EMPTY);
      setError(e instanceof Error ? e.message : "Failed to load reviews");
    } finally {
      setLoading(false);
    }
  }, [page, ratingFilter, statusFilter]);

  useEffect(() => { void fetchReviews(); }, [fetchReviews]);

  const updateStatus = async (id: string, status: ReviewStatus) => {
    setActionId(id);
    try {
      const res = await fetch(`/api/admin/reviews/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const payload = await res.json().catch(() => null);
      if (!res.ok) throw new Error(payload?.error || "Failed to update");
      toast.success(`Marked ${status}`);
      await fetchReviews();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update");
    } finally { setActionId(null); }
  };

  const deleteReview = async (id: string) => {
    if (!confirm("Delete this review permanently?")) return;
    setActionId(id);
    try {
      const res = await fetch(`/api/admin/reviews/${id}`, { method: "DELETE" });
      const payload = await res.json().catch(() => null);
      if (!res.ok) throw new Error(payload?.error || "Failed to delete");
      toast.success("Review deleted");
      await fetchReviews();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to delete");
    } finally { setActionId(null); }
  };

  const { stats, reviews, pagination } = data;
  const donutSlices: DonutSlice[] = [
    { value: stats.pending,  color: "#f59e0b", label: "Pending"  },
    { value: stats.approved, color: "#10b981", label: "Approved" },
    { value: stats.rejected, color: "#ef4444", label: "Rejected" },
  ];

  return (
    <div className="space-y-5">

      {/* ══════════════════════════════════════════════════
          ANALYTICS HEADER PANEL
          ══════════════════════════════════════════════════ */}
      <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">

        {/* Title bar */}
        <div className="flex items-center justify-between border-b border-neutral-100 px-6 py-4 dark:border-neutral-800">
          <div>
            <h1 className="text-[15px] font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
              Reviews
            </h1>
            <p className="mt-0.5 text-xs text-neutral-400 dark:text-neutral-500">
              Moderate and manage customer reviews
            </p>
          </div>
          <button
            type="button"
            onClick={() => void fetchReviews()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-600 transition-colors hover:bg-neutral-50 dark:border-neutral-700 dark:bg-transparent dark:text-neutral-300 dark:hover:bg-neutral-800"
          >
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
              <path d="M9.5 5.5A4 4 0 1 1 5.5 1.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
              <path d="M5.5 1.5L7.5 3.5l-2 2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Refresh
          </button>
        </div>

        {/* Charts row */}
        <div className="grid divide-y divide-neutral-100 sm:grid-cols-2 sm:divide-x sm:divide-y-0 dark:divide-neutral-800">

          {/* Left — Donut + legend */}
          <div className="flex items-center gap-6 px-6 py-5">
            <DonutChart slices={donutSlices} size={110} />
            <div className="space-y-3">
              {[
                { label: "Pending",  value: stats.pending,  color: "bg-amber-400",  pct: pct(stats.pending,  stats.total) },
                { label: "Approved", value: stats.approved, color: "bg-emerald-500", pct: pct(stats.approved, stats.total) },
                { label: "Rejected", value: stats.rejected, color: "bg-red-500",    pct: pct(stats.rejected, stats.total) },
              ].map((s) => (
                <div key={s.label} className="flex items-center gap-2.5">
                  <span className={`h-2.5 w-2.5 flex-shrink-0 rounded-sm ${s.color}`} />
                  <span className="w-14 text-xs text-neutral-500 dark:text-neutral-400">{s.label}</span>
                  <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{s.value}</span>
                  <span className="text-[11px] text-neutral-400 dark:text-neutral-500">{s.pct}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right — Rating distribution */}
          <div className="px-6 py-5">
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-neutral-400 dark:text-neutral-500">
              Rating distribution
              <span className="ml-1.5 font-normal normal-case">
                (this page · {reviews.length} reviews)
              </span>
            </p>
            <RatingBars reviews={reviews} />
            {reviews.length > 0 && (
              <p className="mt-3 text-[11px] text-neutral-400 dark:text-neutral-500">
                Avg:{" "}
                <span className="font-semibold text-neutral-700 dark:text-neutral-300">
                  {(reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)}
                </span>
                {" "}across {reviews.length} visible reviews
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════
          FILTER BAR
          ══════════════════════════════════════════════════ */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Status tabs */}
        <div className="flex items-center gap-1 rounded-xl border border-neutral-200 bg-white p-1 dark:border-neutral-800 dark:bg-neutral-900">
          {STATUS_TABS.map((tab) => {
            const active = statusFilter === tab.value;
            const badge =
              tab.value === "pending"  ? stats.pending  :
              tab.value === "approved" ? stats.approved :
              tab.value === "rejected" ? stats.rejected : null;
            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => { setStatusFilter(tab.value); setPage(1); }}
                className={`relative flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-medium transition-all ${
                  active
                    ? "bg-neutral-900 text-white shadow-sm dark:bg-neutral-100 dark:text-neutral-900"
                    : "text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200"
                }`}
              >
                {tab.label}
                {badge !== null && badge > 0 && (
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold leading-none ${
                      active
                        ? "bg-white/20 text-white dark:bg-black/20 dark:text-neutral-900"
                        : tab.value === "pending"  ? "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400"
                        : tab.value === "approved" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                        : "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400"
                    }`}
                  >
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Rating filter */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 rounded-xl border border-neutral-200 bg-white p-1 dark:border-neutral-800 dark:bg-neutral-900">
            {["all", "5", "4", "3", "2", "1"].map((r) => {
              const active = ratingFilter === r;
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => { setRatingFilter(r); setPage(1); }}
                  className={`flex items-center gap-1 rounded-lg px-2.5 py-2 text-xs font-medium transition-all ${
                    active
                      ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900"
                      : "text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200"
                  }`}
                >
                  {r === "all" ? (
                    "All"
                  ) : (
                    <>
                      {r}
                      <svg width="10" height="9" viewBox="0 0 12 11" fill="currentColor"
                        className={active ? "text-white dark:text-neutral-900" : "text-amber-400"}>
                        <path d="M6 .5l1.545 3.13L11 4.15l-2.5 2.435.59 3.44L6 8.435 2.91 10.025 3.5 6.585 1 4.15l3.455-.52L6 .5z"/>
                      </svg>
                    </>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════
          CONTENT
          ══════════════════════════════════════════════════ */}
      {loading ? (
        <div className="space-y-3">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : error ? (
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/20 dark:text-red-300">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="mt-px flex-shrink-0">
            <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.25" />
            <path d="M8 5v3.5M8 11v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          {error}
        </div>
      ) : reviews.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-200 py-16 dark:border-neutral-800">
          <p className="text-sm text-neutral-400 dark:text-neutral-500">
            No reviews match the current filters
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              isMutating={actionId === review.id}
              onUpdateStatus={updateStatus}
              onDelete={deleteReview}
            />
          ))}
        </div>
      )}

      {/* ══════════════════════════════════════════════════
          PAGINATION
          ══════════════════════════════════════════════════ */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between rounded-2xl border border-neutral-200 bg-white px-5 py-3.5 dark:border-neutral-800 dark:bg-neutral-900">
          <p className="text-xs text-neutral-400 dark:text-neutral-500">
            Page <span className="font-medium text-neutral-700 dark:text-neutral-300">{page}</span>
            {" "}of{" "}
            <span className="font-medium text-neutral-700 dark:text-neutral-300">{pagination.totalPages}</span>
            <span className="ml-2 text-neutral-300 dark:text-neutral-600">·</span>
            <span className="ml-2">{pagination.total} total</span>
          </p>
          <div className="flex items-center gap-1">
            {[
              { label: "← Prev", action: () => setPage((p) => Math.max(1, p - 1)), disabled: page <= 1 },
              { label: "Next →", action: () => setPage((p) => Math.min(pagination.totalPages, p + 1)), disabled: page >= pagination.totalPages },
            ].map((btn) => (
              <button
                key={btn.label}
                type="button"
                disabled={btn.disabled}
                onClick={btn.action}
                className="rounded-lg border border-neutral-200 bg-white px-3.5 py-2 text-xs font-medium text-neutral-600 transition-colors hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-neutral-700 dark:bg-transparent dark:text-neutral-300 dark:hover:bg-neutral-800"
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}