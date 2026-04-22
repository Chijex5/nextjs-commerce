"use client";

import { ErrorState } from "components/layout/error-state";

export default function AdminError({
  error,
  resetAction,
}: {
  error: Error & { digest?: string };
  resetAction: () => void;
}) {
  return (
    <ErrorState
      error={error}
      resetAction={resetAction}
      title="Admin action couldn’t be completed"
      message="Something interrupted the admin workflow."
      reassurance="No data was removed. Please retry the action or return to your dashboard."
      secondaryHref="/admin/dashboard"
      secondaryLabel="Go to dashboard"
    />
  );
}
