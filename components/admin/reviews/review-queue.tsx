"use client";

import clsx from "clsx";
import { EmptyState, StatusPill } from "components/admin/ui";
import { buttonClass } from "components/ui/button";
import { shortDate, timeAgo } from "lib/admin/format";
import {
  BadgeCheck,
  Check,
  EyeOff,
  Loader2,
  Star,
  Trash2,
  Undo2,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

export type ReviewRow = {
  id: string;
  rating: number;
  title: string | null;
  comment: string | null;
  images: string[];
  verified: boolean;
  helpful: number;
  status: string;
  createdAt: string;
  product: {
    id: string;
    title: string;
    handle: string;
    image: string | null;
  } | null;
  author: string;
  email: string | null;
};

const STATUS = {
  pending: { label: "Waiting", tone: "warning" },
  approved: { label: "Published", tone: "positive" },
  rejected: { label: "Hidden", tone: "neutral" },
} as const;

function Stars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={clsx(
            "size-3.5",
            i <= rating ? "fill-fg text-fg" : "text-fg/25",
          )}
          strokeWidth={1.5}
        />
      ))}
    </span>
  );
}

export function ReviewQueue({
  reviews,
  view,
}: {
  reviews: ReviewRow[];
  view: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  // Optimistically drop moderated reviews from the "to moderate" queue.
  const [done, setDone] = useState<Set<string>>(new Set());
  const [, startTransition] = useTransition();

  async function setStatus(
    r: ReviewRow,
    status: "approved" | "rejected" | "pending",
  ) {
    setBusy(r.id);
    const res = await fetch(`/api/admin/reviews/${r.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setBusy(null);
    if (!res.ok) return toast.error("Couldn't update the review.");
    if (view === "pending" && status !== "pending")
      setDone((d) => new Set(d).add(r.id));
    toast.success(
      status === "approved"
        ? "Published"
        : status === "rejected"
          ? "Hidden from the shop"
          : "Moved back to the queue",
    );
    startTransition(() => router.refresh());
  }

  async function remove(r: ReviewRow) {
    if (
      !window.confirm(
        "Delete this review for good? Hiding it is usually enough.",
      )
    )
      return;
    setBusy(r.id);
    const res = await fetch(`/api/admin/reviews/${r.id}`, { method: "DELETE" });
    setBusy(null);
    if (!res.ok) return toast.error("Couldn't delete the review.");
    setDone((d) => new Set(d).add(r.id));
    toast.success("Review deleted");
    startTransition(() => router.refresh());
  }

  const visible = reviews.filter((r) => !done.has(r.id));
  if (visible.length === 0) {
    return (
      <div className="border border-line px-5">
        <EmptyState
          title={view === "pending" ? "All caught up" : "No reviews here"}
        >
          {view === "pending"
            ? "New reviews will wait here until you publish or hide them."
            : "Try another view or rating filter."}
        </EmptyState>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-line border border-line">
      {visible.map((r) => {
        const s = STATUS[r.status as keyof typeof STATUS] ?? {
          label: r.status,
          tone: "neutral" as const,
        };
        const isBusy = busy === r.id;
        return (
          <li
            key={r.id}
            className="grid gap-5 p-5 md:grid-cols-[200px_minmax(0,1fr)_auto]"
          >
            {/* Product */}
            <div className="flex items-start gap-3 md:block">
              {r.product ? (
                <>
                  <div className="relative size-14 shrink-0 overflow-hidden bg-plate md:mb-2 md:size-16">
                    {r.product.image ? (
                      <Image
                        src={r.product.image}
                        alt=""
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    ) : null}
                  </div>
                  <Link
                    href={`/admin/products/${r.product.id}/edit`}
                    className="text-xs text-fg-2 hover:text-fg hover:underline"
                  >
                    {r.product.title}
                  </Link>
                </>
              ) : (
                <span className="text-xs text-fg-3">Product deleted</span>
              )}
            </div>

            {/* Review */}
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <Stars rating={r.rating} />
                <StatusPill tone={s.tone}>{s.label}</StatusPill>
                {r.verified ? (
                  <span className="inline-flex items-center gap-1 text-xs text-emerald-700 dark:text-emerald-400">
                    <BadgeCheck className="size-3.5" /> Verified buyer
                  </span>
                ) : null}
              </div>
              {r.title ? (
                <p className="mt-2 font-medium text-fg">{r.title}</p>
              ) : null}
              {r.comment ? (
                <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-fg-2">
                  {r.comment}
                </p>
              ) : null}
              {r.images.length ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {r.images.map((src, i) => (
                    <a
                      key={src + i}
                      href={src}
                      target="_blank"
                      rel="noreferrer"
                      className="relative size-16 overflow-hidden bg-plate"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element -- review photos can come from any upload host */}
                      <img
                        src={src}
                        alt={`Photo ${i + 1} from ${r.author}`}
                        className="size-full object-cover"
                      />
                    </a>
                  ))}
                </div>
              ) : null}
              <p className="mt-3 text-xs text-fg-3">
                {r.email ? (
                  <Link
                    href={`/admin/users/${encodeURIComponent(r.email.toLowerCase())}`}
                    className="hover:text-fg hover:underline"
                  >
                    {r.author}
                  </Link>
                ) : (
                  r.author
                )}{" "}
                ·{" "}
                <span title={shortDate(new Date(r.createdAt))}>
                  {timeAgo(new Date(r.createdAt))}
                </span>
                {r.helpful ? ` · ${r.helpful} found it helpful` : ""}
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-start gap-2 md:w-44 md:flex-col md:items-stretch">
              {r.status !== "approved" ? (
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={() => setStatus(r, "approved")}
                  className={buttonClass("solid", "md")}
                >
                  {isBusy ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Check className="size-4" />
                  )}{" "}
                  Publish
                </button>
              ) : null}
              {r.status !== "rejected" ? (
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={() => setStatus(r, "rejected")}
                  className={buttonClass("outline", "md")}
                >
                  <EyeOff className="size-4" /> Hide
                </button>
              ) : null}
              {r.status !== "pending" ? (
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={() => setStatus(r, "pending")}
                  className="label flex h-10 items-center justify-center gap-1.5 text-fg-3 hover:text-fg"
                >
                  <Undo2 className="size-3.5" /> Back to queue
                </button>
              ) : null}
              <button
                type="button"
                disabled={isBusy}
                onClick={() => remove(r)}
                className="label flex h-10 items-center justify-center gap-1.5 text-fg-3 hover:text-red-600"
              >
                <Trash2 className="size-3.5" /> Delete
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
