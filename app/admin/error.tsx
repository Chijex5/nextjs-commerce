"use client";

import { ErrorState } from "components/layout/error-state";

export default function AdminError({
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
      title="Admin action couldn’t be completed"
      message="Something interrupted the admin workflow."
      reassurance="No data was removed. Please retry the action or return to your dashboard."
      secondaryHref="/admin/dashboard"
      secondaryLabel="Go to dashboard"
    />
  );
}
