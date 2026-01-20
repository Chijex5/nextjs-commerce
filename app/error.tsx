"use client";

export default function Error({ reset }: { reset: () => void }) {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-16">
      <div className="mx-auto w-full max-w-lg">
        {/* Error Card - Clean, professional design */}
        <div className="overflow-hidden border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-black">
          <div className="border-b border-neutral-200 bg-neutral-50 px-8 py-6 dark:border-neutral-800 dark:bg-neutral-900">
            <div className="flex items-start gap-4">
              {/* Icon */}
              <div className="flex-shrink-0">
                <svg
                  className="h-6 w-6 text-neutral-900 dark:text-neutral-100"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>

              {/* Title and Description */}
              <div className="flex-1">
                <h1 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                  Something went wrong
                </h1>
                <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
                  We encountered an error processing your request. This is
                  usually temporary.
                </p>
              </div>
            </div>
          </div>

          <div className="px-8 py-6">
            {/* Detailed Message */}
            <div className="mb-6">
              <h2 className="mb-2 text-sm font-medium text-neutral-900 dark:text-neutral-100">
                What you can do:
              </h2>
              <ul className="space-y-2 text-sm text-neutral-600 dark:text-neutral-400">
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 text-neutral-400">•</span>
                  <span>
                    Try refreshing the page or performing the action again
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 text-neutral-400">•</span>
                  <span>Return to the homepage and continue shopping</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 text-neutral-400">•</span>
                  <span>Contact support if the problem persists</span>
                </li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                onClick={() => reset()}
                className="inline-flex flex-1 items-center justify-center border border-neutral-900 bg-neutral-900 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:ring-offset-2 dark:border-neutral-100 dark:bg-neutral-100 dark:text-black dark:hover:bg-neutral-200 dark:focus:ring-neutral-100"
              >
                Try again
              </button>

              <a
                href="/"
                className="inline-flex flex-1 items-center justify-center border border-neutral-300 bg-white px-6 py-3 text-sm font-medium text-neutral-900 transition-colors hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:ring-offset-2 dark:border-neutral-700 dark:bg-black dark:text-neutral-100 dark:hover:bg-neutral-900 dark:focus:ring-neutral-100"
              >
                Go to homepage
              </a>
            </div>
          </div>
        </div>

        {/* Support Link */}
        <div className="mt-6 text-center">
          <p className="text-sm text-neutral-500 dark:text-neutral-500">
            Need help?{" "}
            <a
              href="/contact"
              className="font-medium text-neutral-900 underline hover:no-underline dark:text-neutral-100"
            >
              Contact support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
