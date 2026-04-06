"use client";

import { ErrorState } from "components/layout/error-state";

export default function CheckoutError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorState
      error={error}
      reset={reset}
      title="Checkout hit a temporary issue"
      message="Your checkout didn’t go through this time."
      reassurance="Don’t worry — your cart and details are still saved. Try again when you’re ready."
      secondaryHref="/checkout"
      secondaryLabel="Back to checkout"
    />
  );
}
