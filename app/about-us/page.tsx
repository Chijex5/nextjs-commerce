import Footer from "components/layout/footer";
import { Reveal } from "components/home/reveal";
import { buttonClass } from "components/ui/button";
import { CITY_PHOTO, CRAFT_PHOTOS, HERO_PHOTOS } from "lib/data/editorial";
import { canonicalUrl, siteName } from "lib/seo";
import { ArrowUpRight } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import "../home.css";

const title = "About";
const description =
  "Learn how D'FOOTPRINT designs handmade footwear in Lagos and delivers trusted quality nationwide across Nigeria.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: canonicalUrl("/about-us") },
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

const PROCESS = [
  {
    title: "Choose",
    body: "Choose from existing designs, submit a design to recreate, or request a custom edit. We confirm what's possible and give you an honest cost upfront.",
  },
  {
    title: "Made to order",
    body: "Your pair goes into production. Every pair is made to order — nothing pulled off a shelf. Materials selected, construction checked, finishing done right.",
  },
  {
    title: "Checked",
    body: "Before anything leaves, it goes through a proper quality check. If something's off, it gets fixed here — not after you've received it.",
  },
  {
    title: "Delivered",
    body: "Nationwide delivery across Nigeria. Updates at every stage. A real person reachable if anything needs sorting after delivery.",
  },
];

const PROMISES = [
  {
    title: "Honest timelines",
    body: "We tell you upfront how long your order will take. If something changes, you'll hear it from us first — not when you ask.",
  },
  {
    title: "Real support",
    body: "Sizing question, fit concern, post-delivery issue — reach out and it actually gets handled. That's part of what you're paying for.",
  },
  {
    title: "Consistency",
    body: "What you see is what you get — and it holds up the same way for a first-time buyer as it does for a returning customer.",
  },
];

export default function AboutUsPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-canvas px-4 pb-16 pt-10 text-fg sm:px-8 sm:pt-14 md:px-12">
        <p className="label mb-6 text-fg-3">(About) — D&apos;FOOTPRINT</p>
        <h1 className="display text-[clamp(3.6rem,12.5vw,13rem)]">
          <span className="line">
            <span>Built in Lagos.</span>
          </span>
          <span className="line">
            <span style={{ "--d": "120ms" } as React.CSSProperties}>
              Worn across
            </span>
          </span>
          <span className="line">
            <span style={{ "--d": "240ms" } as React.CSSProperties}>
              Nigeria.
            </span>
          </span>
        </h1>
        <div className="mt-10 grid gap-8 md:grid-cols-12">
          <p className="max-w-[48ch] text-lg leading-relaxed text-fg-2 md:col-span-6 md:col-start-7">
            D&apos;FOOTPRINT started with one person, one skill, and more demand
            than expected. Every pair of slippers, slides and custom pieces
            still starts and ends with the same set of hands.
          </p>
        </div>
      </section>

      <section className="relative h-[80svh] overflow-hidden bg-ink">
        <Image
          src={CITY_PHOTO.src}
          alt={CITY_PHOTO.alt}
          fill
          sizes="100vw"
          className="parallax develop object-cover"
        />
      </section>

      {/* Quote + story */}
      <section className="grid gap-12 bg-ink px-4 py-24 text-paper sm:px-8 md:px-12 lg:grid-cols-12 lg:py-32">
        <Reveal className="lg:col-span-6">
          <p className="label mb-6 text-white/50">(01) — The beginning</p>
          <blockquote className="text-[clamp(1.8rem,3.6vw,3.2rem)] font-medium leading-[1.15] tracking-tight">
            &ldquo;It didn&apos;t start as a business. It started as something I
            just knew how to do well.&rdquo;
          </blockquote>
          <p className="label mt-6 text-white/50">
            — Founder, D&apos;FOOTPRINT
          </p>
        </Reveal>
        <Reveal className="space-y-5 text-lg leading-relaxed text-white/75 lg:col-span-5 lg:col-start-8">
          <p>
            It started the way most real things do — not with a business plan,
            but with a skill and a demand that kept growing. A few pairs made
            for people close by. Then more requests. Then orders from people
            who&apos;d never met the maker but trusted what they&apos;d seen.
          </p>
          <p>
            The gap was obvious to anyone who&apos;d bought footwear in Lagos:{" "}
            <strong className="text-paper">
              plenty of options, almost none you could trust.
            </strong>{" "}
            Market slippers that look sharp in the stall and fall apart before
            the month is out. Online sellers with no accountability.
          </p>
          <p>
            So D&apos;FOOTPRINT became a handmade footwear brand where every
            pair is made to order, by one person, with genuine care for how it
            holds up. There&apos;s no physical store — by design. Ordering
            directly means honest timelines, real updates, and someone who
            actually picks up.
          </p>
        </Reveal>
      </section>

      {/* Statement */}
      <section className="bg-canvas px-4 py-24 text-center text-fg sm:px-8 md:px-12 lg:py-32">
        <Reveal>
          <p className="display text-[clamp(3.4rem,11vw,11rem)]">
            One maker.
            <br />
            One standard.
            <br />
            Every time.
          </p>
        </Reveal>
      </section>

      {/* Process */}
      <section className="border-t border-line bg-canvas px-4 py-24 text-fg sm:px-8 md:px-12">
        <p className="label mb-5 text-fg-3">(02) — The craft &amp; process</p>
        <ol className="border-t border-fg">
          {PROCESS.map((step, i) => (
            <li
              key={step.title}
              data-cursor-img={CRAFT_PHOTOS[i]?.src}
              className="group grid grid-cols-[3rem_1fr] items-baseline gap-x-4 border-b border-line py-6 sm:grid-cols-[6rem_1fr_1fr] sm:py-8"
            >
              <span className="label text-fg-3 sm:pl-2">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="display text-[clamp(2.6rem,7vw,6rem)] transition-transform duration-500 md:group-hover:translate-x-4">
                {step.title}
              </h3>
              <p className="col-start-2 mt-3 max-w-[44ch] text-fg-2 sm:col-start-3 sm:mt-0 sm:self-center">
                {step.body}
              </p>
            </li>
          ))}
        </ol>
      </section>

      {/* Promises */}
      <section className="grid border-t border-line bg-canvas text-fg lg:grid-cols-2">
        <div className="relative min-h-[60svh] overflow-hidden">
          <Image
            src={HERO_PHOTOS[1]!.src}
            alt={HERO_PHOTOS[1]!.alt}
            fill
            sizes="(min-width:1024px) 50vw, 100vw"
            className="develop object-cover"
          />
        </div>
        <div className="px-4 py-20 sm:px-8 md:px-12">
          <p className="label mb-8 text-fg-3">(03) — Why customers trust us</p>
          <ul className="space-y-10">
            {PROMISES.map((p) => (
              <Reveal as="li" key={p.title}>
                <h3 className="display text-[clamp(2.2rem,4vw,3.25rem)]">
                  {p.title}
                </h3>
                <p className="mt-3 max-w-[46ch] leading-relaxed text-fg-2">
                  {p.body}
                </p>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      {/* CTA */}
      <section className="grid gap-px border-t border-line bg-line md:grid-cols-2">
        <div className="bg-ink px-4 py-16 text-paper sm:px-8 md:px-12">
          <p className="label text-white/50">Questions before you order?</p>
          <p className="mt-4 max-w-[40ch] text-white/75">
            Sizing, custom requests, delivery — you&apos;re always talking to
            the same person who made, or will make, your pair.
          </p>
          <Link
            href="/contact"
            className={buttonClass("inverse", "lg", "mt-8")}
          >
            Contact us
          </Link>
        </div>
        <div className="bg-canvas px-4 py-16 text-fg sm:px-8 md:px-12">
          <p className="label text-fg-3">Ready to find your pair?</p>
          <p className="mt-4 max-w-[40ch] text-fg-2">
            Browse handcrafted slippers and slides — or tell us exactly what you
            want made.
          </p>
          <div className="mt-8 flex flex-col gap-2 sm:flex-row">
            <Link href="/products" className={buttonClass("solid")}>
              Shop all designs
              <ArrowUpRight className="size-4" />
            </Link>
            <Link href="/custom-orders" className={buttonClass("outline")}>
              Custom orders
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
