"use client";

import { ErrorState } from "components/layout/error-state";

export default function Error({
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
      title="Oops, something went wrong"
      message="We couldn’t complete that request right now."
      reassurance="Don’t worry — your progress is still intact, and a quick retry usually fixes this."
      secondaryHref="/"
      secondaryLabel="Go home"
    />
  );
}
