"use client";

import Link from "next/link";

type OrderActionsProps = {
  orderNumber: string;
};

export default function OrderActions({ orderNumber }: OrderActionsProps) {
  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-950 md:p-6">
      <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
        Need anything else?
      </h2>
      <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
        You can track your update, talk to us, or keep a copy of this receipt.
      </p>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <Link
          href={`/orders${orderNumber ? `?orderNumber=${encodeURIComponent(orderNumber)}` : ""}`}
          className="inline-flex items-center justify-center rounded-full bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-700 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
        >
          Track order
        </Link>
        <Link
          href={`/contact?order=${encodeURIComponent(orderNumber)}`}
          className="inline-flex items-center justify-center rounded-full border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-900 transition hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-100 dark:hover:bg-neutral-900"
        >
          Contact support
        </Link>
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center justify-center rounded-full border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-900 transition hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-100 dark:hover:bg-neutral-900"
        >
          Download receipt
        </button>
      </div>
    </section>
  );
}
