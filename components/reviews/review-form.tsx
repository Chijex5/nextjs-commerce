"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { StarSelector } from "./star-selector";
import { slideUp } from "lib/motion";

interface ReviewFormProps {
  productId: string;
  orderId?: string;
  onSuccess?: () => void;
}

export function ReviewForm({ productId, orderId, onSuccess }: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (rating === 0) {
      setError("Please select a rating");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId,
          orderId,
          rating,
          title: title.trim() || null,
          comment: comment.trim() || null,
          images: [], // TODO: Add image upload functionality
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit review");
      }

      setSuccess(true);
      setRating(0);
      setTitle("");
      setComment("");

      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit review");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <motion.div
        initial="hidden"
        animate="visible"
        variants={slideUp}
        className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-center dark:border-emerald-700/40 dark:bg-emerald-900/20"
      >
        <h3 className="mb-1 text-lg font-semibold text-emerald-900 dark:text-emerald-200">
          Thank you
        </h3>
        <p className="text-sm text-emerald-800/90 dark:text-emerald-200/90">
          Your review has been submitted and will be visible once approved by
          our team.
        </p>
      </motion.div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 rounded-2xl border border-neutral-200 bg-neutral-50/60 p-4 sm:p-6 dark:border-neutral-800 dark:bg-neutral-900/60"
    >
      <div>
        <label className="mb-2 block text-sm font-medium text-neutral-900 dark:text-neutral-100">
          Your Rating <span className="text-red-500">*</span>
        </label>
        <StarSelector value={rating} onChange={setRating} />
      </div>

      <div>
        <label
          htmlFor="review-title"
          className="mb-2 block text-sm font-medium text-neutral-900 dark:text-neutral-100"
        >
          Review Title (Optional)
        </label>
        <input
          type="text"
          id="review-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Sum up your experience"
          maxLength={100}
          className="w-full rounded-lg border border-neutral-300 bg-white px-4 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-500 focus:border-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-200 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100 dark:placeholder:text-neutral-400 dark:focus:border-neutral-500 dark:focus:ring-neutral-700/50"
        />
      </div>

      <div>
        <label
          htmlFor="review-comment"
          className="mb-2 block text-sm font-medium text-neutral-900 dark:text-neutral-100"
        >
          Your Review (Optional)
        </label>
        <textarea
          id="review-comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Share your thoughts about this product..."
          rows={5}
          maxLength={1000}
          className="w-full rounded-lg border border-neutral-300 bg-white px-4 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-500 focus:border-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-200 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100 dark:placeholder:text-neutral-400 dark:focus:border-neutral-500 dark:focus:ring-neutral-700/50"
        />
        <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
          {comment.length}/1000 characters
        </p>
      </div>

      <AnimatePresence>
        {error && (
          <motion.div
            key="review-error"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={slideUp}
            className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-700/50 dark:bg-red-900/20 dark:text-red-300"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-neutral-500 dark:text-neutral-400">
          Your review is moderated before appearing publicly.
        </p>
        <button
          type="submit"
          disabled={loading || rating === 0}
          className="inline-flex items-center justify-center rounded-lg bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-neutral-700 disabled:cursor-not-allowed disabled:bg-neutral-300 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200 dark:disabled:bg-neutral-700 dark:disabled:text-neutral-400"
        >
          {loading ? "Submitting..." : "Submit review"}
        </button>
      </div>
    </form>
  );
}
