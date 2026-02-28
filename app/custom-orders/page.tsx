import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { asc, desc, eq } from "drizzle-orm";
import { db } from "lib/db";
import { customOrders } from "lib/db/schema";
import { canonicalUrl, siteName } from "lib/seo";

export const metadata: Metadata = {
  title: "Custom Orders Gallery",
  description:
    "See customer inspirations and final handcrafted results. Start your own custom request when you are ready.",
  alternates: {
    canonical: canonicalUrl("/custom-orders"),
  },
  openGraph: {
    title: "Custom Orders Gallery",
    description:
      "See customer inspirations and final handcrafted results from D'FOOTPRINT.",
    url: canonicalUrl("/custom-orders"),
    type: "website",
    images: ["/opengraph-image"],
  },
  twitter: {
    card: "summary_large_image",
    title: `Custom Orders Gallery | ${siteName}`,
    description:
      "See customer inspirations and final handcrafted results from D'FOOTPRINT.",
    images: ["/opengraph-image"],
  },
};

const toDetailsArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
};

export default async function CustomOrdersPage() {
  const customOrderFeatureEnabled =
    process.env.CUSTOM_ORDER_REQUESTS_ENABLED === "true";

  const customOrdersList = await db
    .select()
    .from(customOrders)
    .where(eq(customOrders.isPublished, true))
    .orderBy(asc(customOrders.position), desc(customOrders.updatedAt));

  return (
    <div className="mx-auto max-w-[1400px] space-y-12 px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      <section className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-950 md:p-10">
        <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500 dark:text-neutral-400">
              Custom Orders
            </p>
            <h1 className="max-w-3xl text-3xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100 md:text-5xl">
              From customer inspiration to finished handcrafted pair.
            </h1>
            <p className="max-w-2xl text-sm leading-7 text-neutral-600 dark:text-neutral-400 md:text-base">
              Browse real before-and-after stories. When you are ready, submit a
              focused custom request and receive a quote before payment.
            </p>
            <div className="flex flex-wrap gap-3 pt-1">
              <Link
                href={
                  customOrderFeatureEnabled
                    ? "/custom-orders/request"
                    : "/contact"
                }
                className="rounded-full bg-neutral-900 px-6 py-3 text-sm font-medium text-white transition hover:bg-neutral-700 dark:bg-white dark:text-black dark:hover:bg-neutral-200"
              >
                Start custom request
              </Link>
              <Link
                href="/orders"
                className="rounded-full border border-neutral-300 px-6 py-3 text-sm font-medium text-neutral-900 transition hover:border-neutral-500 dark:border-neutral-700 dark:text-neutral-100 dark:hover:border-neutral-500"
              >
                Track request or order
              </Link>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-900">
              <p className="text-xs uppercase tracking-[0.14em] text-neutral-500 dark:text-neutral-400">
                Workflow
              </p>
              <p className="mt-2 text-sm font-medium text-neutral-900 dark:text-neutral-100">
                Submit request → Review → Quote → Pay
              </p>
            </div>
            <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-900">
              <p className="text-xs uppercase tracking-[0.14em] text-neutral-500 dark:text-neutral-400">
                Account
              </p>
              <p className="mt-2 text-sm font-medium text-neutral-900 dark:text-neutral-100">
                Optional. Email tracking works without login.
              </p>
            </div>
            <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-900">
              <p className="text-xs uppercase tracking-[0.14em] text-neutral-500 dark:text-neutral-400">
                Delivery
              </p>
              <p className="mt-2 text-sm font-medium text-neutral-900 dark:text-neutral-100">
                Nationwide delivery across Nigeria.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100 md:text-3xl">
            Transformation stories
          </h2>
          <span className="text-sm text-neutral-500 dark:text-neutral-400">
            {customOrdersList.length} published
          </span>
        </div>

        {customOrdersList.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 p-10 text-center text-sm text-neutral-600 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-400">
            No custom stories yet. Check back soon.
          </div>
        ) : (
          <div className="grid gap-6">
            {customOrdersList.map((order) => {
              const details = toDetailsArray(order.details);
              const beforeImage =
                order.beforeImage ||
                "https://via.placeholder.com/600?text=Customer+Request";
              const afterImage =
                order.afterImage ||
                "https://via.placeholder.com/600?text=Final+Product";

              return (
                <article
                  key={order.id}
                  id={`order-${order.id}`}
                  className="scroll-mt-24 rounded-2xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-700 dark:bg-neutral-950"
                >
                  <div className="grid gap-6 p-5 md:p-6 lg:grid-cols-[1.05fr_0.95fr]">
                    <div className="space-y-4">
                      <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
                        {order.title}
                      </h3>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500 dark:text-neutral-400">
                            Inspiration
                          </p>
                          <div className="relative aspect-square overflow-hidden rounded-xl bg-neutral-100 dark:bg-neutral-900">
                            <Image
                              src={beforeImage}
                              alt={`${order.title} inspiration`}
                              fill
                              className="object-cover"
                              sizes="(min-width: 1024px) 320px, (min-width: 640px) 260px, 160px"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500 dark:text-neutral-400">
                            Final pair
                          </p>
                          <div className="relative aspect-square overflow-hidden rounded-xl bg-neutral-100 dark:bg-neutral-900">
                            <Image
                              src={afterImage}
                              alt={`${order.title} final pair`}
                              fill
                              className="object-cover"
                              sizes="(min-width: 1024px) 320px, (min-width: 640px) 260px, 160px"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-900">
                        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500 dark:text-neutral-400">
                          Story
                        </p>
                        {order.customerStory ? (
                          <div
                            className="prose prose-sm max-w-none text-neutral-700 dark:prose-invert dark:text-neutral-300"
                            dangerouslySetInnerHTML={{
                              __html: order.customerStory,
                            }}
                          />
                        ) : (
                          <p className="text-sm text-neutral-600 dark:text-neutral-400">
                            No story provided yet.
                          </p>
                        )}
                      </div>

                      {details.length > 0 ? (
                        <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-900">
                          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500 dark:text-neutral-400">
                            Details
                          </p>
                          <ul className="space-y-1 text-sm text-neutral-700 dark:text-neutral-300">
                            {details.map((detail, index) => (
                              <li key={index} className="flex items-start gap-2">
                                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-neutral-400" />
                                <span>{detail}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : null}

                      {order.completionTime ? (
                        <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-700 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300">
                          <span className="font-semibold">Completion Time:</span>{" "}
                          {order.completionTime}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-950 md:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
              Ready to create your own pair?
            </h2>
            <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
              Start a focused request flow and get a quote before payment.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href={
                customOrderFeatureEnabled ? "/custom-orders/request" : "/contact"
              }
              className="rounded-full bg-neutral-900 px-6 py-3 text-sm font-medium text-white transition hover:bg-neutral-700 dark:bg-white dark:text-black dark:hover:bg-neutral-200"
            >
              Start custom request
            </Link>
            <Link
              href="/products"
              className="rounded-full border border-neutral-300 px-6 py-3 text-sm font-medium text-neutral-900 transition hover:border-neutral-500 dark:border-neutral-700 dark:text-neutral-100 dark:hover:border-neutral-500"
            >
              Browse ready-made
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
