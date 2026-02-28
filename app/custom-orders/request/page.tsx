import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import CustomOrderRequestSection from "components/custom-orders/custom-order-request-section";
import { canonicalUrl, siteName } from "lib/seo";

export const metadata: Metadata = {
  title: "Start a Custom Order",
  description:
    "Submit your custom footwear request, upload references, and receive a quote before payment.",
  alternates: {
    canonical: canonicalUrl("/custom-orders/request"),
  },
  openGraph: {
    title: `Start a Custom Order | ${siteName}`,
    description:
      "Submit your custom footwear request and receive a quote before payment.",
    url: canonicalUrl("/custom-orders/request"),
    type: "website",
    images: ["/opengraph-image"],
  },
  twitter: {
    card: "summary_large_image",
    title: `Start a Custom Order | ${siteName}`,
    description:
      "Submit your custom footwear request and receive a quote before payment.",
    images: ["/opengraph-image"],
  },
};

export default function CustomOrderRequestPage() {
  const customOrderFeatureEnabled =
    process.env.CUSTOM_ORDER_REQUESTS_ENABLED === "true";

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-950 md:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500 dark:text-neutral-400">
          D&apos;FOOTPRINT
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100 md:text-4xl">
          Create a custom pair
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-neutral-600 dark:text-neutral-400">
          This page is intentionally focused. Share your design brief and
          references, then we review and send a quote before payment.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/custom-orders"
            className="rounded-full border border-neutral-300 px-4 py-2 text-xs font-medium text-neutral-900 transition hover:border-neutral-500 dark:border-neutral-700 dark:text-neutral-100 dark:hover:border-neutral-500"
          >
            Back to custom gallery
          </Link>
          <Link
            href="/orders"
            className="rounded-full border border-neutral-300 px-4 py-2 text-xs font-medium text-neutral-900 transition hover:border-neutral-500 dark:border-neutral-700 dark:text-neutral-100 dark:hover:border-neutral-500"
          >
            Track request or order
          </Link>
        </div>
      </div>

      {customOrderFeatureEnabled ? (
        <Suspense
          fallback={
            <div className="rounded-2xl border border-neutral-200 bg-white p-6 text-sm text-neutral-600 shadow-sm dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-400">
              Loading request form...
            </div>
          }
        >
          <CustomOrderRequestSection />
        </Suspense>
      ) : (
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 text-sm text-neutral-600 shadow-sm dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-400">
          Custom requests are currently unavailable. Please contact support and we
          will help you directly.
        </div>
      )}
    </div>
  );
}
