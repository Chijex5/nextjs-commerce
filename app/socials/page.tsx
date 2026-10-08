import Footer from "components/layout/footer";
import { canonicalUrl, siteName } from "lib/seo";
import type { Metadata } from "next";
import LogoIcon from "components/icons/logo";
import { HERO_PHOTOS } from "lib/data/editorial";
import { ArrowUpRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import "../home.css";

const title = "Socials";
const description =
  "Follow D'FOOTPRINT on social platforms for new releases, product videos, and order updates.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: canonicalUrl("/socials") },
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
  {
    name: "Instagram",
    href: "https://instagram.com/d_foot.print",
    handle: "@dfootprint",
    note: "New drops, styling clips & behind the scenes",
  },
  {
    name: "TikTok",
    href: "https://tiktok.com/@d_footprint",
    handle: "@dfootprint",
    note: "Short-form videos, process reels & trends",
  },
  {
    name: "Twitter / X",
    href: "https://x.com/chikaahey",
    handle: "@dfootprint",
    note: "Updates, announcements & conversations",
  },
  {
    name: "Snapchat",
    href: "https://snapchat.com/t/To9LQPVS",
    handle: "@dfootprint",
    note: "Exclusive stories and daily behind the craft",
  },
  {
    name: "WhatsApp",
    href: "https://wa.me/2348121993874",
    handle: "Chat with us",
    note: "Sizing, custom requests and order updates",
  },
];

const SHOP_LINKS = [
  {
    name: "Shop new in",
    href: "/search?sort=latest-desc",
    note: "Fresh off the bench",
  },
  {
    name: "All designs",
    href: "/products",
    note: "Slides & slippers, made by hand",
  },
  {
    name: "Custom orders",
    href: "/custom-orders",
    note: "Your idea. Our hands.",
  },
];

/** Link-in-bio page (TikTok / Instagram bios point here). */
export default function SocialsPage() {
  const photo = HERO_PHOTOS[1]!;

  return (
    <>
      <section className="grid min-h-[calc(100svh-3.5rem)] bg-canvas text-fg md:min-h-[calc(100svh-4rem)] lg:grid-cols-2">
        <div className="relative h-[42svh] overflow-hidden bg-ink lg:h-auto">
          <Image
            src={photo.src}
            alt={photo.alt}
            fill
            priority
            sizes="(min-width:1024px) 50vw, 100vw"
            className="hero-zoom object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 flex items-end gap-3 p-4 text-paper sm:p-8">
            <LogoIcon className="size-14 !fill-white" />
            <div>
              <p className="display text-4xl">D&apos;Footprint</p>
              <p className="label text-white/70">Handmade in Lagos</p>
            </div>
          </div>
        </div>

        <div className="px-4 py-8 sm:px-8 lg:py-16">
          <p className="label mb-3 text-fg-3">(Shop)</p>
          <ul className="border-t border-fg">
            {SHOP_LINKS.map((l) => (
              <LinkRow key={l.href} {...l} />
            ))}
          </ul>
          <p className="label mb-3 mt-10 text-fg-3">(Follow &amp; chat)</p>
          <ul className="border-t border-fg">
            {socialLinks.map((l) => (
              <LinkRow
                key={l.name}
                name={l.name}
                href={l.href}
                note={l.note}
                external
              />
            ))}
          </ul>
        </div>
      </section>
      <Footer />
    </>
  );
}

function LinkRow({
  name,
  href,
  note,
  external,
}: {
  name: string;
  href: string;
  note: string;
  external?: boolean;
}) {
  const inner = (
    <>
      <span>
        <span className="display block text-[clamp(2rem,6vw,3rem)]">
          {name}
        </span>
        <span className="text-sm text-fg-3">{note}</span>
      </span>
      <ArrowUpRight className="size-6 shrink-0 transition-transform duration-300 group-hover:-translate-y-1 group-hover:translate-x-1" />
    </>
  );
  const cls =
    "group flex items-center justify-between gap-4 border-b border-line py-4 transition-[padding] duration-300 active:bg-plate md:hover:pl-3";
  return (
    <li>
      {external ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={cls}
        >
          {inner}
        </a>
      ) : (
        <Link href={href} className={cls}>
          {inner}
        </Link>
      )}
    </li>
  );
}
