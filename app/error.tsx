"use client";

export default function Error({ reset }: { reset: () => void }) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-16">
      <div className="relative mx-auto w-full max-w-2xl">
        {/* Decorative background elements */}
        <div className="pointer-events-none absolute inset-0 -z-10 opacity-40">
          <div className="absolute left-1/4 top-0 h-64 w-64 rounded-full bg-gradient-to-br from-red-400/30 to-orange-400/30 blur-3xl" />
          <div className="absolute bottom-0 right-1/4 h-64 w-64 rounded-full bg-gradient-to-br from-purple-400/30 to-pink-400/30 blur-3xl" />
        </div>

        {/* Error Card */}
        <div className="relative overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-2xl dark:border-neutral-800 dark:bg-neutral-900">
          {/* Top accent bar */}
          <div className="h-2 w-full bg-gradient-to-r from-red-500 via-orange-500 to-red-500" />

          <div className="px-8 py-12 text-center sm:px-12">
            {/* Icon */}
            <div className="mb-6 flex justify-center">
              <div className="rounded-full bg-red-100 p-4 dark:bg-red-900/20">
                <svg
                  className="h-12 w-12 text-red-600 dark:text-red-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
            </div>

            {/* Title */}
            <h1 className="mb-4 bg-gradient-to-r from-neutral-900 via-neutral-800 to-neutral-900 bg-clip-text text-3xl font-bold tracking-tight text-transparent dark:from-neutral-100 dark:via-neutral-200 dark:to-neutral-100 sm:text-4xl">
              Oops! Something Went Wrong
            </h1>

            {/* Description */}
            <p className="mb-8 text-lg leading-relaxed text-neutral-600 dark:text-neutral-400">
              We encountered an unexpected issue with our storefront. Don't
              worry, this is likely temporary. Please try your action again or
              return to the homepage.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
              <button
                onClick={() => reset()}
                className="group inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-neutral-900 to-neutral-800 px-8 py-4 text-sm font-semibold text-white shadow-xl transition-all duration-500 ease-out hover:-translate-y-1 hover:shadow-2xl dark:from-neutral-100 dark:to-neutral-200 dark:text-black"
              >
                <svg
                  className="h-5 w-5 transition-transform duration-300 group-hover:rotate-180"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Try Again
              </button>

              <a
                href="/"
                className="group inline-flex items-center justify-center gap-2 rounded-full border-2 border-neutral-300 bg-transparent px-8 py-4 text-sm font-semibold text-neutral-900 transition-all duration-300 hover:border-neutral-400 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-100 dark:hover:border-neutral-600 dark:hover:bg-neutral-800"
              >
                <svg
                  className="h-5 w-5 transition-transform duration-300 group-hover:-translate-x-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                  />
                </svg>
                Back to Home
              </a>
            </div>

            {/* Help Text */}
            <p className="mt-8 text-sm text-neutral-500 dark:text-neutral-500">
              If the problem persists, please contact our support team.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
