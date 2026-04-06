"use client";

import Link from "next/link";
import { motion } from "framer-motion";

type ErrorStateProps = {
  error: Error & { digest?: string };
  reset: () => void;
  title: string;
  message: string;
  reassurance?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
  supportHref?: string;
};

const containerTransition = {
  duration: 0.3,
  ease: [0.22, 1, 0.36, 1],
};

const buttonTransition = {
  duration: 0.18,
  ease: "easeOut",
};

export function ErrorState({
  error,
  reset,
  title,
  message,
  reassurance,
  secondaryHref = "/",
  secondaryLabel = "Go home",
  supportHref = "/contact",
}: ErrorStateProps) {
  return (
    <main className="min-h-screen bg-white px-6 py-20 text-neutral-950 dark:bg-black dark:text-neutral-50 sm:px-10 sm:py-24">
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={containerTransition}
        className="mx-auto flex min-h-[calc(100vh-10rem)] w-full max-w-3xl flex-col justify-center"
      >
        <div className="mb-8 inline-flex h-11 w-11 items-center justify-center rounded-full border border-neutral-300 text-neutral-700 dark:border-neutral-700 dark:text-neutral-200">
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.75}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 8.25v4.5m0 3h.008M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>

        <h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
          {title}
        </h1>

        <p className="mt-4 max-w-2xl text-pretty text-base leading-relaxed text-neutral-600 dark:text-neutral-300 sm:text-lg">
          {message}
        </p>

        {reassurance && (
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-neutral-500 dark:text-neutral-400 sm:text-base">
            {reassurance}
          </p>
        )}

        <div className="mt-10 flex w-full flex-col gap-3 sm:max-w-md sm:flex-row">
          <motion.button
            type="button"
            onClick={reset}
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.98 }}
            transition={buttonTransition}
            className="inline-flex items-center justify-center rounded-full bg-neutral-950 px-6 py-3 text-sm font-medium text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:bg-neutral-100 dark:text-black dark:focus-visible:ring-neutral-500 dark:focus-visible:ring-offset-black"
          >
            Try again
          </motion.button>

          <motion.div
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.98 }}
            transition={buttonTransition}
            className="flex"
          >
            <Link
              href={secondaryHref}
              className="inline-flex w-full items-center justify-center rounded-full border border-neutral-300 px-6 py-3 text-sm font-medium text-neutral-800 transition-colors hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-900 dark:focus-visible:ring-neutral-500 dark:focus-visible:ring-offset-black"
            >
              {secondaryLabel}
            </Link>
          </motion.div>
        </div>

        <div className="mt-8 text-sm text-neutral-500 dark:text-neutral-400">
          Need help?{" "}
          <Link
            href={supportHref}
            className="font-medium text-neutral-900 underline decoration-neutral-400 underline-offset-4 hover:decoration-neutral-900 dark:text-neutral-100 dark:decoration-neutral-500 dark:hover:decoration-neutral-100"
          >
            Contact support
          </Link>
        </div>

        {error.digest && (
          <p className="mt-6 text-xs tracking-wide text-neutral-400 dark:text-neutral-500">
            Reference ID: {error.digest}
          </p>
        )}
      </motion.section>
    </main>
  );
}
