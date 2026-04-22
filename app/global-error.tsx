"use client";

import { ErrorState } from "components/layout/error-state";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <ErrorState
          error={error}
          resetAction={reset}
          title="Oops, something went wrong"
          message="A critical issue interrupted this page."
          reassurance="Don’t worry — your information is safe. Please retry, or contact support if this keeps happening."
          secondaryHref="/"
          secondaryLabel="Go home"
        />
      </body>
    </html>
  );
}
