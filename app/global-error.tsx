"use client";

import { ErrorState } from "components/layout/error-state";
// The root layout (and its CSS) is replaced when this renders.
import "./globals.css";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="bg-canvas font-sans text-fg antialiased">
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
