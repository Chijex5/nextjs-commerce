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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          orderId,
          rating,
          title: title.trim() || null,
          comment: comment.trim() || null,
          images: [],
        }),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Failed to submit review");
      setSuccess(true);
      setRating(0);
      setTitle("");
      setComment("");
      if (onSuccess) onSuccess();
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
        style={{
          border: "1px solid rgba(var(--brand-terra-rgb),0.3)",
          background: "rgba(var(--brand-terra-rgb),0.07)",
          padding: "28px 24px",
          textAlign: "center",
        }}
      >
        <h3
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: "22px",
            fontWeight: 300,
            color: "var(--cream, var(--brand-cream))",
            marginBottom: "8px",
          }}
        >
          Thank you
        </h3>
        <p
          style={{
            fontSize: "13px",
            color: "var(--sand, var(--brand-sand))",
            lineHeight: 1.6,
          }}
        >
          Your review has been submitted and will be visible once approved by
          our team.
        </p>
      </motion.div>
    );
  }

  return (
    <>
      <style>{`
        .rf-root {
          display: flex;
          flex-direction: column;
          gap: 20px;
          font-family: 'DM Sans', sans-serif;
        }
        .rf-label {
          display: block;
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--muted, var(--brand-muted));
          margin-bottom: 10px;
        }
        .rf-required { color: var(--terra, var(--brand-terra)); margin-left: 2px; }
        .rf-input,
        .rf-textarea {
          width: 100%;
          background: rgba(var(--brand-bg-rgb),0.6);
          border: 1px solid rgba(var(--brand-fg-rgb),0.09);
          color: var(--cream, var(--brand-cream));
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          padding: 12px 16px;
          outline: none;
          transition: border-color 0.2s;
          resize: none;
        }
        .rf-input::placeholder,
        .rf-textarea::placeholder { color: var(--muted, var(--brand-muted)); }
        .rf-input:focus,
        .rf-textarea:focus { border-color: rgba(var(--brand-terra-rgb),0.45); }
        .rf-char-count {
          font-size: 11px;
          color: var(--muted, var(--brand-muted));
          margin-top: 6px;
          text-align: right;
          letter-spacing: 0.06em;
        }
        .rf-error {
          border: 1px solid rgba(var(--brand-gold-rgb),0.3);
          background: rgba(var(--brand-gold-rgb),0.06);
          padding: 12px 16px;
          font-size: 13px;
          color: var(--brand-gold-light);
          line-height: 1.5;
        }
        .rf-footer {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding-top: 4px;
          border-top: 1px solid rgba(var(--brand-fg-rgb),0.09);
        }
        .rf-disclaimer {
          font-size: 11px;
          color: var(--muted, var(--brand-muted));
          letter-spacing: 0.04em;
          line-height: 1.5;
        }
        .rf-submit {
          background: var(--terra, var(--brand-terra));
          border: none;
          color: var(--cream, var(--brand-cream));
          font-family: 'DM Sans', sans-serif;
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          padding: 13px 28px;
          cursor: pointer;
          transition: background 0.2s;
          flex-shrink: 0;
        }
        .rf-submit:hover:not(:disabled) { background: var(--brand-terra-dark); }
        .rf-submit:disabled {
          opacity: 0.45;
          cursor: not-allowed;
        }
      `}</style>

      <form onSubmit={handleSubmit} className="rf-root">
        {/* Star rating */}
        <div>
          <label className="rf-label">
            Your rating <span className="rf-required">*</span>
          </label>
          <StarSelector value={rating} onChange={setRating} />
        </div>

        {/* Title */}
        <div>
          <label htmlFor="review-title" className="rf-label">
            Review title{" "}
            <span
              style={{
                color: "var(--muted, var(--brand-muted))",
                fontWeight: 400,
              }}
            >
              (optional)
            </span>
          </label>
          <input
            type="text"
            id="review-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Sum up your experience"
            maxLength={100}
            className="rf-input"
          />
        </div>

        {/* Comment */}
        <div>
          <label htmlFor="review-comment" className="rf-label">
            Your review{" "}
            <span
              style={{
                color: "var(--muted, var(--brand-muted))",
                fontWeight: 400,
              }}
            >
              (optional)
            </span>
          </label>
          <textarea
            id="review-comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your thoughts about this product..."
            rows={5}
            maxLength={1000}
            className="rf-textarea"
          />
          <p className="rf-char-count">{comment.length} / 1000</p>
        </div>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              key="review-error"
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={slideUp}
              className="rf-error"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer */}
        <div className="rf-footer">
          <p className="rf-disclaimer">
            Reviews are moderated before appearing publicly.
          </p>
          <button
            type="submit"
            disabled={loading || rating === 0}
            className="rf-submit"
          >
            {loading ? "Submitting..." : "Submit review"}
          </button>
        </div>
      </form>
    </>
  );
}
