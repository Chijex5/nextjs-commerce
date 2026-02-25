import Footer from "components/layout/footer";
import { canonicalUrl, siteName } from "lib/seo";
import type { Metadata } from "next";
import Link from "next/link";

const title = "About";
const description =
  "Learn how D'FOOTPRINT designs handmade footwear in Lagos and delivers trusted quality nationwide across Nigeria.";

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: canonicalUrl("/about-us"),
  },
  openGraph: {
    title: `${title} | ${siteName}`,
    description,
    url: canonicalUrl("/about-us"),
    type: "website",
    images: ["/opengraph-image"],
  },
  twitter: {
    card: "summary_large_image",
    title: `${title} | ${siteName}`,
    description,
    images: ["/opengraph-image"],
  },
};

export default function AboutUsPage() {
  return (
    <>
      <div className="mx-auto w-full max-w-[1800px] px-4 pb-16 pt-8 md:px-6 md:pt-10 lg:px-8">
        <div className="mx-auto max-w-5xl space-y-8">
          <header className="space-y-4 border-b border-neutral-200 pb-6 dark:border-neutral-800 md:pb-8">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-neutral-500 dark:text-neutral-400">
              About us
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-neutral-900 md:text-5xl dark:text-neutral-100">
              Handmade footwear built with care, clarity, and consistency.
            </h1>
            <p className="max-w-3xl text-sm leading-7 text-neutral-600 md:text-base dark:text-neutral-400">
              D&apos;FOOTPRINT is a Lagos-based handmade footwear brand focused
              on comfort, clean finishing, and reliable delivery across Nigeria.
            </p>
          </header>

          <section className="grid gap-4 md:grid-cols-3">
            <InfoCard title="Handmade process" value="Produced on demand" />
            <InfoCard title="Base" value="Lagos, Nigeria" />
            <InfoCard title="Delivery" value="Nationwide coverage" />
          </section>

          <section className="rounded-2xl border border-neutral-200 bg-white p-6 md:p-8 dark:border-neutral-800 dark:bg-neutral-950">
            <div className="space-y-5 text-sm leading-7 text-neutral-700 md:text-base dark:text-neutral-300">
              <p>
                We started D&apos;FOOTPRINT to solve a simple problem: getting
                quality handmade slippers and slides that look good, fit well,
                and last.
              </p>
              <p>
                Every order is handled with practical quality checks—from
                material selection and finishing to delivery prep. We also
                support approved custom requests, so customers can personalize
                designs without confusion about what is possible.
              </p>
              <p>
                Our goal is to make online ordering feel clear and trustworthy:
                straightforward pricing, honest production timelines, and direct
                support when you need it.
              </p>
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-950">
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                Why customers trust us
              </h2>
              <ul className="mt-4 space-y-2 text-sm text-neutral-600 dark:text-neutral-400">
                <li>• Transparent updates on order and delivery progress.</li>
                <li>• Case-by-case support for issues and fit concerns.</li>
                <li>• Product catalog plus custom order flexibility.</li>
              </ul>
            </div>

            <div className="rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-950">
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                Need help before ordering?
              </h2>
              <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-400">
                If you need sizing guidance, custom requests, or delivery
                clarification, contact us directly and we&apos;ll help you place
                the right order.
              </p>
              <Link
                href="/contact"
                className="mt-4 inline-block rounded-full border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-900 hover:border-neutral-500 dark:border-neutral-700 dark:text-neutral-100 dark:hover:border-neutral-500"
              >
                Contact D&apos;FOOTPRINT
              </Link>
            </div>
          </section>
        </div>
      </div>
      <Footer />
    </>
  );
}

function InfoCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-950">
      <p className="text-xs uppercase tracking-[0.12em] text-neutral-500 dark:text-neutral-400">
        {title}
      </p>
      <p className="mt-2 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
        {value}
      </p>
    </div>
  );
}
