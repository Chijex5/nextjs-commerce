import Link from "next/link";

export function CustomCTA() {
  return (
    <section className="border-y border-neutral-200 bg-neutral-50 py-16 dark:border-neutral-700 dark:bg-neutral-900">
      <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Have a Unique Design in Mind?
        </h2>
        <p className="mt-6 text-lg text-neutral-600 dark:text-neutral-400">
          We specialize in bringing your footwear ideas to life. Submit your
          design reference or let us know what modifications you'd like, and our
          team will work with you to create the perfect pair. All custom orders
          are reviewed for feasibility and pricing.
        </p>
        <div className="mt-10 flex items-center justify-center gap-x-6">
          <Link
            href="/products"
            className="rounded-full bg-black px-8 py-3 text-sm font-semibold text-white hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200"
          >
            Browse Designs
          </Link>
          <Link
            href="/contact"
            className="text-sm font-semibold leading-6 text-neutral-900 dark:text-neutral-100"
          >
            Contact Us <span aria-hidden="true">→</span>
          </Link>
        </div>
        <p className="mt-6 text-xs text-neutral-500 dark:text-neutral-500">
          Note: Custom orders require approval and may have additional costs or
          extended production times.
        </p>
      </div>
    </section>
  );
}
