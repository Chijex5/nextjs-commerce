import type { Metadata } from "next";
import Image from "next/image";
import { db } from "lib/db";
import { customOrders } from "lib/db/schema";
import { canonicalUrl, siteName } from "lib/seo";
import { asc, desc, eq } from "drizzle-orm";

export const metadata: Metadata = {
  title: "Custom Orders Gallery",
  description:
    "See how we transform customer ideas into beautiful handmade footwear. Browse our gallery of custom orders and get inspired for your own design.",
  alternates: {
    canonical: canonicalUrl("/custom-orders"),
  },
  openGraph: {
    title: "Custom Orders Gallery",
    description:
      "See how we transform customer ideas into beautiful handmade footwear.",
    url: canonicalUrl("/custom-orders"),
    type: "website",
    images: ["/opengraph-image"],
  },
  twitter: {
    card: "summary_large_image",
    title: `Custom Orders Gallery | ${siteName}`,
    description:
      "See how we transform customer ideas into beautiful handmade footwear.",
    images: ["/opengraph-image"],
  },
};

const toDetailsArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
};

export default async function CustomOrdersPage() {
  const customOrdersList = await db
    .select()
    .from(customOrders)
    .where(eq(customOrders.isPublished, true))
    .orderBy(asc(customOrders.position), desc(customOrders.updatedAt));

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-12 text-center">
        <h1 className="text-3xl font-bold sm:text-4xl lg:text-5xl">
          Custom Orders Gallery
        </h1>
        <p className="mt-4 text-lg text-neutral-600 dark:text-neutral-400">
          Every pair tells a story. See how we bring our customers' visions to
          life.
        </p>
      </div>

      {/* Custom Orders Grid */}
      <div className="space-y-16">
        {customOrdersList.length === 0 ? (
          <div className="rounded-lg border border-dashed border-neutral-300 bg-neutral-50 p-8 text-center text-sm text-neutral-600 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-400">
            No custom orders yet. Check back soon for new stories.
          </div>
        ) : (
          customOrdersList.map((order) => {
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
                className="scroll-mt-24 rounded-lg border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-900"
              >
                <div className="grid gap-8 p-6 lg:grid-cols-2 lg:p-8">
                  {/* Images Section */}
                  <div className="space-y-4">
                    <h2 className="text-xl font-bold lg:text-2xl">
                      {order.title}
                    </h2>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                          Customer's Request
                        </p>
                        <div className="relative aspect-square overflow-hidden rounded-lg">
                          <Image
                            src={beforeImage}
                            alt="Customer request"
                            fill
                            className="object-cover"
                            sizes="(min-width: 1024px) 300px, (min-width: 640px) 250px, 150px"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                          Final Product
                        </p>
                        <div className="relative aspect-square overflow-hidden rounded-lg">
                          <Image
                            src={afterImage}
                            alt="Final product"
                            fill
                            className="object-cover"
                            sizes="(min-width: 1024px) 300px, (min-width: 640px) 250px, 150px"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Details Section */}
                  <div className="space-y-4">
                    <div>
                      <h3 className="mb-2 text-sm font-semibold">The Story</h3>
                      {order.customerStory ? (
                        <div
                          className="prose prose-sm max-w-none text-neutral-600 dark:text-neutral-400"
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

                    {details.length > 0 && (
                      <div>
                        <h3 className="mb-2 text-sm font-semibold">Details</h3>
                        <ul className="space-y-1 text-sm text-neutral-600 dark:text-neutral-400">
                          {details.map((detail, index) => (
                            <li key={index} className="flex items-start">
                              <span className="mr-2">•</span>
                              <span>{detail}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {order.completionTime && (
                      <div className="rounded-md bg-neutral-50 p-3 dark:bg-neutral-800">
                        <p className="text-xs text-neutral-600 dark:text-neutral-400">
                          <span className="font-semibold">
                            Completion Time:
                          </span>{" "}
                          {order.completionTime}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </article>
            );
          })
        )}
      </div>

      {/* CTA Section */}
      <div className="mt-16 rounded-lg border border-neutral-200 bg-neutral-50 p-8 text-center dark:border-neutral-700 dark:bg-neutral-900">
        <h2 className="text-2xl font-bold">Ready to Create Your Own?</h2>
        <p className="mt-2 text-neutral-600 dark:text-neutral-400">
          Share your design ideas with us and we'll bring them to life.
        </p>
        <div className="mt-6 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <a
            href="/contact"
            className="rounded-full bg-black px-6 py-3 text-sm font-semibold text-white hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200"
          >
            Contact Us
          </a>
          <a href="/products" className="text-sm font-semibold hover:underline">
            Browse Ready-Made Designs
          </a>
        </div>
      </div>
    </div>
  );
}
