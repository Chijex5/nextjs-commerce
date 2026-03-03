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
  const [eligibility, setEligibility] = useState<VerifyPurchaseResponse | null>(
    null,
  );

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
        if (!ignore) {
          setEligibility(data);
        }
      } catch (error) {
        if (!ignore) {
          setEligibility(null);
          setVerifyError(
            error instanceof Error
              ? error.message
              : "Unable to verify purchase status",
          );
        }
      } finally {
        if (!ignore) {
          setVerifyLoading(false);
        }
      }
    };

    void verifyPurchase();
    return () => {
      ignore = true;
    };
  }, [productId, status]);

  const selectedOrderId = useMemo(
    () => eligibility?.orders?.[0]?.id,
    [eligibility],
  );

  const canReview = status === "authenticated" && Boolean(eligibility?.canReview);
  const showForm = status === "authenticated" && !verifyError;
  const callbackUrl = `/auth/login?callbackUrl=${encodeURIComponent(
    `/product/${productHandle}`,
  )}`;

  return (
    <section className="mt-10 rounded-2xl border border-neutral-200 bg-white p-4 sm:p-6 lg:p-8 dark:border-neutral-800 dark:bg-black">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
          Customer Reviews
        </h2>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
          Real experiences from customers in our community.
        </p>
      </div>

      {status === "loading" && (
        <div className="mb-6 rounded border border-neutral-200 bg-neutral-50 p-3 text-sm text-neutral-600 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300">
          Checking your review eligibility...
        </div>
      )}

      {status === "unauthenticated" && (
        <div className="mb-6 rounded-xl border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-700 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300">
          <p className="mb-3">
            Sign in to access review tools and your personalized order history.
          </p>
          <Link
            href={callbackUrl}
            className="inline-flex items-center rounded bg-black px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200"
          >
            Log in to review
          </Link>
        </div>
      )}

      {status === "authenticated" && (
        <div className="mb-6">
          {verifyLoading ? (
            <div className="rounded border border-neutral-200 bg-neutral-50 p-3 text-sm text-neutral-600 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300">
              Verifying your completed orders...
            </div>
          ) : null}

          {!verifyLoading && verifyError ? (
            <div className="rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-700/60 dark:bg-amber-900/20 dark:text-amber-300">
              {verifyError}. You can still read reviews.
            </div>
          ) : null}

          {!verifyLoading && !verifyError && eligibility?.hasReviewed ? (
            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3 text-sm text-neutral-700 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300">
              You already submitted a review for this product.
            </div>
          ) : null}

          {!verifyLoading &&
          !verifyError &&
          !eligibility?.hasReviewed &&
          !eligibility?.hasPurchased ? (
            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3 text-sm text-neutral-700 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300">
              We prioritize feedback from customers with order history on this
              item, so your review option appears automatically once it becomes
              available on your account.
            </div>
          ) : null}
        </div>
      )}

      <ReviewList
        productId={productId}
        showForm={showForm}
        canReview={canReview}
        orderId={selectedOrderId}
      />
    </section>
  );
}
