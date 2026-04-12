"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useUserSession } from "hooks/useUserSession";
import { ReviewList } from "components/reviews/review-list";

type VerifyPurchaseResponse = {
  canReview: boolean;
  hasPurchased: boolean;
  hasReviewed: boolean;
  orders: Array<{
    id: string;
    orderNumber: string;
    createdAt: string;
  }>;
};

export function ProductReviewsSection({
  productId,
  productHandle,
}: {
  productId: string;
  productHandle: string;
}) {
  const { status } = useUserSession();
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [eligibility, setEligibility] = useState<VerifyPurchaseResponse | null>(null);

  useEffect(() => {
    if (status !== "authenticated") {
      setEligibility(null);
      setVerifyError(null);
      setVerifyLoading(false);
      return;
    }

    let ignore = false;
    const verifyPurchase = async () => {
      setVerifyLoading(true);
      setVerifyError(null);
      try {
        const response = await fetch(
          `/api/reviews/verify-purchase?productId=${encodeURIComponent(productId)}`,
          { cache: "no-store" },
        );
        if (!response.ok) {
          const data = (await response.json().catch(() => null)) as
            | { error?: string }
            | null;
          throw new Error(data?.error || "Unable to verify purchase status");
        }
        const data = (await response.json()) as VerifyPurchaseResponse;
        if (!ignore) setEligibility(data);
      } catch (error) {
        if (!ignore) {
          setEligibility(null);
          setVerifyError(
            error instanceof Error ? error.message : "Unable to verify purchase status",
          );
        }
      } finally {
        if (!ignore) setVerifyLoading(false);
      }
    };

    void verifyPurchase();
    return () => { ignore = true; };
  }, [productId, status]);

  const selectedOrderId = useMemo(() => eligibility?.orders?.[0]?.id, [eligibility]);
  const canReview = status === "authenticated" && Boolean(eligibility?.canReview);
  const showForm = status === "authenticated" && !verifyError;
  const callbackUrl = `/auth/login?callbackUrl=${encodeURIComponent(`/product/${productHandle}`)}`;

  return (
    <>
      <style>{`
        .pr-root {
          padding: 40px;
          font-family: 'DM Sans', sans-serif;
        }

        .pr-header {
          padding-bottom: 24px;
          border-bottom: 1px solid rgba(242,232,213,0.09);
          margin-bottom: 28px;
        }
        .pr-eyebrow {
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 0.26em;
          text-transform: uppercase;
          color: var(--terra, #BF5A28);
          margin-bottom: 10px;
        }
        .pr-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(24px, 3vw, 34px);
          font-weight: 300;
          color: var(--cream, #F2E8D5);
          line-height: 1.05;
          margin-bottom: 6px;
        }
        .pr-subtitle {
          font-size: 12px;
          color: var(--muted, #6A5A48);
          letter-spacing: 0.03em;
        }

        /* ── STATUS BANNERS ── */
        .pr-banner {
          border: 1px solid rgba(242,232,213,0.09);
          background: rgba(242,232,213,0.02);
          padding: 14px 18px;
          font-size: 13px;
          color: var(--sand, #C9B99A);
          margin-bottom: 20px;
          line-height: 1.5;
        }
        .pr-banner-warn {
          border-color: rgba(192,137,42,0.3);
          background: rgba(192,137,42,0.06);
          color: #d4a84b;
        }

        /* ── LOGIN PROMPT ── */
        .pr-login-box {
          border: 1px solid rgba(242,232,213,0.09);
          background: rgba(242,232,213,0.02);
          padding: 20px;
          margin-bottom: 20px;
        }
        .pr-login-text {
          font-size: 13px;
          color: var(--sand, #C9B99A);
          margin-bottom: 14px;
          line-height: 1.6;
        }
        .pr-login-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: var(--terra, #BF5A28);
          color: var(--cream, #F2E8D5);
          font-family: 'DM Sans', sans-serif;
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          padding: 11px 22px;
          text-decoration: none;
          transition: background 0.2s;
        }
        .pr-login-btn:hover { background: #a34d22; }
        .pr-login-btn::after { content: '→'; }

        @media (max-width: 640px) {
          .pr-root { padding: 20px; }
        }
      `}</style>

      <div className="pr-root">
        <div className="pr-header">
          <p className="pr-eyebrow">Community</p>
          <h2 className="pr-title">Customer Reviews</h2>
          <p className="pr-subtitle">Real experiences from customers in our community.</p>
        </div>

        {/* Loading session */}
        {status === "loading" && (
          <div className="pr-banner">
            Checking your review eligibility...
          </div>
        )}

        {/* Unauthenticated */}
        {status === "unauthenticated" && (
          <div className="pr-login-box">
            <p className="pr-login-text">
              Sign in to access review tools and your personalized order history.
            </p>
            <Link href={callbackUrl} className="pr-login-btn">
              Log in to review
            </Link>
          </div>
        )}

        {/* Authenticated states */}
        {status === "authenticated" && (
          <div>
            {verifyLoading && (
              <div className="pr-banner">Verifying your completed orders...</div>
            )}
            {!verifyLoading && verifyError && (
              <div className="pr-banner pr-banner-warn">
                {verifyError}. You can still read reviews below.
              </div>
            )}
            {!verifyLoading && !verifyError && eligibility?.hasReviewed && (
              <div className="pr-banner">
                You already submitted a review for this product.
              </div>
            )}
            {!verifyLoading &&
              !verifyError &&
              !eligibility?.hasReviewed &&
              !eligibility?.hasPurchased && (
                <div className="pr-banner">
                  We prioritize feedback from customers with order history on this
                  item — your review option appears automatically once available.
                </div>
              )}
          </div>
        )}

        {/* Review list + form */}
        <ReviewList
          productId={productId}
          showForm={showForm}
          canReview={canReview}
          orderId={selectedOrderId}
        />
      </div>
    </>
  );
}