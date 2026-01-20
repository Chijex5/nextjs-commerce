"use client";

import Link from "next/link";
import Image from "next/image";

interface CustomOrder {
  id: string;
  beforeImage: string | null;
  afterImage: string | null;
  title: string;
}

export function CustomShowcase({ orders }: { orders: CustomOrder[] }) {
  if (orders.length === 0) {
    return (
      <section className="relative overflow-hidden border-t border-neutral-200 bg-gradient-to-b from-white via-neutral-50/50 to-white py-16 dark:border-neutral-700 dark:from-black dark:via-neutral-900/50 dark:to-black">
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-dashed border-neutral-300 bg-white/70 p-10 text-center text-sm text-neutral-600 shadow-sm dark:border-neutral-700 dark:bg-neutral-900/80 dark:text-neutral-400">
            Custom order stories are coming soon. Check back for fresh
            before-and-after transformations.
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative overflow-hidden border-t border-neutral-200 bg-gradient-to-b from-white via-neutral-50/50 to-white py-16 dark:border-neutral-700 dark:from-black dark:via-neutral-900/50 dark:to-black">
      {/* Decorative background elements */}
      <div className="pointer-events-none absolute inset-0 opacity-20">
        <div className="absolute left-1/4 top-20 h-96 w-96 rounded-full bg-gradient-to-br from-purple-400/30 to-pink-400/30 blur-3xl" />
        <div className="absolute right-1/4 bottom-20 h-96 w-96 rounded-full bg-gradient-to-br from-blue-400/30 to-cyan-400/30 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mb-12 text-center">
          <div className="mb-2 inline-block">
            <span className="rounded-full bg-gradient-to-r from-purple-500/10 to-pink-500/10 px-4 py-1.5 text-xs font-medium uppercase tracking-wider text-purple-700 dark:from-purple-500/20 dark:to-pink-500/20 dark:text-purple-300">
              Custom Creations
            </span>
          </div>
          <h2 className="mb-4 bg-gradient-to-r from-neutral-900 via-neutral-800 to-neutral-900 bg-clip-text text-4xl font-bold tracking-tight text-transparent dark:from-neutral-100 dark:via-neutral-200 dark:to-neutral-100 sm:text-5xl">
            From Vision to Reality
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-neutral-600 dark:text-neutral-400">
            See how we transform your ideas into handcrafted masterpieces
          </p>
          <div className="mx-auto mt-4 h-1 w-24 rounded-full bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500" />
        </div>

        {/* Showcase Grid */}
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {orders.map((order, index) => {
            const beforeImage =
              order.beforeImage ||
              "https://via.placeholder.com/400?text=Customer+Request";
            const afterImage =
              order.afterImage ||
              "https://via.placeholder.com/400?text=Final+Product";

            return (
              <Link
                key={order.id}
                href={`/custom-orders#order-${order.id}`}
                className="group relative opacity-0"
                style={{
                  animation: `fadeInUp 600ms ease-out ${index * 100}ms forwards`,
                }}
              >
                {/* Card Container */}
                <div className="relative overflow-hidden rounded-2xl bg-white shadow-lg ring-1 ring-neutral-200/50 transition-all duration-300 group-hover:shadow-2xl group-hover:ring-neutral-300 dark:bg-neutral-900 dark:ring-neutral-800/50 dark:group-hover:ring-neutral-700">
                  {/* Before/After Grid */}
                  <div className="grid grid-cols-2 gap-3 p-5">
                    {/* Before Image */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                          Inspiration
                        </span>
                        <svg
                          className="h-4 w-4 text-neutral-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                          />
                        </svg>
                      </div>
                      <div className="relative aspect-square overflow-hidden rounded-xl ring-1 ring-neutral-200 dark:ring-neutral-800">
                        <Image
                          src={beforeImage}
                          alt="Customer inspiration"
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-110"
                          sizes="(min-width: 1024px) 200px, (min-width: 640px) 300px, 150px"
                        />
                      </div>
                    </div>

                    {/* After Image */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-wider text-neutral-900 dark:text-neutral-100">
                          Our Creation
                        </span>
                        <svg
                          className="h-4 w-4 text-green-500"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </div>
                      <div className="relative aspect-square overflow-hidden rounded-xl ring-2 ring-green-500/50 dark:ring-green-500/30">
                        <Image
                          src={afterImage}
                          alt="Final product"
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-110"
                          sizes="(min-width: 1024px) 200px, (min-width: 640px) 300px, 150px"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="border-t border-neutral-200 bg-gradient-to-br from-neutral-50 to-neutral-100 px-5 py-4 dark:border-neutral-800 dark:from-neutral-800/50 dark:to-neutral-900/50">
                    <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                      {order.title}
                    </p>
                    <p className="mt-1 flex items-center text-xs text-neutral-600 transition-colors group-hover:text-neutral-900 dark:text-neutral-400 dark:group-hover:text-neutral-100">
                      View transformation story
                      <svg
                        className="ml-1 h-3 w-3 transition-transform group-hover:translate-x-1"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Call to Action */}
        <div className="mt-12 text-center">
          <Link
            href="/custom-orders"
            className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 px-8 py-4 text-sm font-semibold text-white shadow-xl transition-all duration-300 hover:scale-105 hover:shadow-2xl"
          >
            <span>Explore All Custom Creations</span>
            <svg
              className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 8l4 4m0 0l-4 4m4-4H3"
              />
            </svg>
          </Link>
        </div>
      </div>

      {/* Add the fadeInUp animation */}
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </section>
  );
}
