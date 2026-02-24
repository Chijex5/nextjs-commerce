import Footer from "components/layout/footer";
import { canonicalUrl, siteName } from "lib/seo";
import type { Metadata } from "next";
import Link from "next/link";

const title = "Socials";
const description =
  "Follow D'FOOTPRINT on social platforms for new releases, product videos, and order updates.";

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: canonicalUrl("/socials"),
  },
  openGraph: {
    title: `${title} | ${siteName}`,
    description,
    url: canonicalUrl("/socials"),
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

const socialLinks = [
  { name: "Instagram", href: "https://instagram.com", handle: "@dfootprint" },
  { name: "TikTok", href: "https://tiktok.com", handle: "@dfootprint" },
  { name: "Twitter / X", href: "https://x.com", handle: "@dfootprint" },
  { name: "Snapchat", href: "https://snapchat.com", handle: "@dfootprint" },
  {
    name: "WhatsApp",
    href: "https://wa.me/2340000000000",
    handle: "Chat with us",
  },
];

export default function SocialsPage() {
  return (
    <>
      <div className="mx-auto w-full max-w-[1800px] px-4 pb-16 pt-8 md:px-6 md:pt-10 lg:px-8">
        <div className="mx-auto max-w-4xl space-y-8">
          <header className="space-y-4 border-b border-neutral-200 pb-6 dark:border-neutral-800 md:pb-8">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-neutral-500 dark:text-neutral-400">
              Socials
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-neutral-900 md:text-5xl dark:text-neutral-100">
              Follow D&apos;FOOTPRINT everywhere.
            </h1>
            <p className="max-w-2xl text-sm leading-7 text-neutral-600 md:text-base dark:text-neutral-400">
              Stay updated on new designs, styling clips, and delivery updates
              across all our social channels.
            </p>
          </header>

          <section className="grid gap-4 sm:grid-cols-2">
            {socialLinks.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                target="_blank"
                rel="noreferrer"
                className="rounded-2xl border border-neutral-200 bg-white p-5 transition-colors hover:border-neutral-400 dark:border-neutral-800 dark:bg-neutral-950 dark:hover:border-neutral-600"
              >
                <p className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                  {item.name}
                </p>
                <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                  {item.handle}
                </p>
                <p className="mt-3 text-xs font-medium uppercase tracking-[0.12em] text-neutral-500 dark:text-neutral-400">
                  Open channel
                </p>
              </Link>
            ))}
          </section>

          <section className="rounded-2xl border border-neutral-200 bg-white p-6 text-sm text-neutral-600 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-400">
            Prefer direct support? Use WhatsApp for quick questions about
            sizing, custom requests, and order updates.
          </section>
        </div>
      </div>
      <Footer />
    </>
  );
}
