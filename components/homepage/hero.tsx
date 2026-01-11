import Link from "next/link";

export function Hero() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
          Handcrafted Footwear,
          <br />
          Made Just for You
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-neutral-600 dark:text-neutral-400">
          Discover beautifully crafted slippers and slides, made by hand with premium materials. 
          Each pair is a unique expression of comfort and style.
        </p>
        <div className="mt-10 flex items-center justify-center gap-x-6">
          <Link
            href="/products"
            className="rounded-full bg-black px-8 py-3 text-sm font-semibold text-white hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200"
          >
            Shop Now
          </Link>
          <Link
            href="/products?custom=true"
            className="text-sm font-semibold leading-6 text-neutral-900 dark:text-neutral-100"
          >
            Custom Orders <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
