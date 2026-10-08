import Footer from "components/layout/footer";
import { Cursor } from "components/home/cursor";
import { HorizontalScroll } from "components/home/horizontal-scroll";
import { ProductCard } from "components/home/product-card";
import { Reveal } from "components/home/reveal";
import {
  CITY_PHOTO,
  CRAFT_PHOTOS,
  CUSTOM_PHOTO,
  HERO_PHOTOS,
  LOOKS,
  MANIFESTO_PHOTOS,
  type Photo,
} from "lib/data/editorial";
import { getHomeData } from "lib/data/home";
import { canonicalUrl, siteName } from "lib/seo";
import { ArrowUpRight } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import "./home.css";

const description =
  "D'FOOTPRINT — slides and slippers made by hand in Lagos. Shop ready-made designs or order your own. Delivery across Nigeria.";

export const metadata: Metadata = {
  description,
  alternates: { canonical: canonicalUrl("/") },
  openGraph: {
    title: siteName,
    description,
    url: canonicalUrl("/"),
    type: "website",
    images: ["/opengraph-image"],
  },
  twitter: {
    card: "summary_large_image",
    title: siteName,
    description,
    images: ["/opengraph-image"],
  },
};

const WHATSAPP_URL =
  process.env.NEXT_PUBLIC_WHATSAPP_URL || "https://wa.me/2348121993874";

const PAD = "px-4 sm:px-8 md:px-12";
const d = (ms: number) => ({ "--d": `${ms}ms` }) as CSSProperties;

const CRAFT_STEPS = [
  {
    title: "Pattern",
    body: "Each design starts as a paper pattern, traced and cut by hand.",
  },
  {
    title: "Stitch",
    body: "Straps and edges are stitched and reinforced where a pair works hardest.",
  },
  {
    title: "Sole",
    body: "The upper is fitted and set onto its sole, then left to cure.",
  },
  {
    title: "Finish",
    body: "Edges cleaned, pair checked side by side, packed and sent.",
  },
];

const CUSTOM_STEPS = [
  "Send a photo, a screenshot or an idea",
  "We confirm what's possible, your size and the price",
  "We make it by hand and deliver it anywhere in Nigeria",
];

const TICKER = [
  "Handmade in Lagos",
  "Delivery nationwide",
  "Secure checkout by Paystack",
  "Custom orders open",
  "Slides",
  "Slippers",
];

export default async function HomePage() {
  const { newArrivals } = await getHomeData();
  const newIn = newArrivals.slice(0, 8);

  return (
    <>
      <Cursor />

      {/* ── HERO: street triptych + giant type ─────────────────────── */}
      <section className="relative h-[calc(100svh-7.5rem-env(safe-area-inset-bottom))] min-h-[520px] md:h-[calc(100svh-4rem)] overflow-hidden bg-ink text-paper">
        <div className="absolute inset-0 grid grid-cols-1 gap-[3px] md:grid-cols-3">
          {HERO_PHOTOS.map((photo, i) => (
            <div
              key={photo.src}
              className={`relative overflow-hidden ${i === 1 ? "" : "hidden md:block"}`}
            >
              <Image
                src={photo.src}
                alt={photo.alt}
                fill
                priority={i === 1}
                sizes="(min-width:768px) 34vw, 100vw"
                className={`hero-zoom object-cover ${i === 0 ? "grayscale" : ""}`}
                style={d(i * 120)}
              />
            </div>
          ))}
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-black/30" />

        <div
          className={`relative flex h-full flex-col justify-between ${PAD} pb-5 pt-5`}
        >
          <div
            className="fade-in label flex justify-between gap-6"
            style={d(600)}
          >
            <span>D&apos;Footprint — Lagos, NG</span>
            <span className="hidden sm:inline">
              Handmade slides &amp; slippers
            </span>
            <span>6.52° N, 3.38° E</span>
          </div>

          <div>
            <h1 className="display text-[clamp(4.2rem,19vw,7rem)] md:text-[13.2vw]">
              <span className="line">
                <span style={d(150)}>Made by hand</span>
              </span>
              <span className="line">
                <span style={d(280)}>in Lagos.</span>
              </span>
            </h1>
            <div
              className="fade-in mt-6 flex flex-col gap-5 border-t border-white/30 pt-4 sm:flex-row sm:items-center sm:justify-between"
              style={d(900)}
            >
              <p className="label max-w-[46ch] leading-relaxed text-white/80">
                Slides and slippers cut, stitched and finished by hand. Pick a
                design — or bring your own.
              </p>
              <div className="flex gap-2">
                <Link
                  href="/products"
                  className="group inline-flex h-12 flex-1 items-center justify-center gap-2 bg-paper px-6 text-sm font-semibold uppercase tracking-wide text-ink transition-transform active:scale-[0.97] sm:flex-none"
                >
                  Shop new in
                  <ArrowUpRight className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </Link>
                <Link
                  href="/custom-orders"
                  className="inline-flex h-12 flex-1 items-center justify-center border border-white/50 px-6 text-sm font-semibold uppercase tracking-wide transition-colors hover:bg-white hover:text-ink active:scale-[0.97] sm:flex-none"
                >
                  Custom
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TICKER ─────────────────────────────────────────────────── */}
      <div className="overflow-hidden border-b border-line bg-canvas py-3 text-fg">
        <div className="ticker flex w-max">
          {[0, 1].map((n) => (
            <ul key={n} aria-hidden={n === 1} className="label flex shrink-0">
              {TICKER.map((t) => (
                <li key={t} className="flex items-center gap-6 pr-6">
                  {t}
                  <span className="size-1.5 bg-fg" />
                </li>
              ))}
            </ul>
          ))}
        </div>
      </div>

      {/* ── 01 MANIFESTO: type with photos set inline ──────────────── */}
      <section className={`bg-canvas py-24 text-fg sm:py-36 ${PAD}`}>
        <Reveal>
          <p className="label mb-10 text-fg-3">(01) — The house</p>
          <p className="display text-[clamp(2.6rem,7.4vw,8rem)] leading-[0.92]">
            We make{" "}
            <span className="whitespace-nowrap">
              slides
              <InlinePhoto photo={MANIFESTO_PHOTOS[0]!} />
            </span>{" "}
            and slippers by hand in{" "}
            <span className="whitespace-nowrap">
              Lagos
              <InlinePhoto photo={MANIFESTO_PHOTOS[1]!} />,
            </span>{" "}
            one pair at a{" "}
            <span className="whitespace-nowrap">
              time
              <InlinePhoto photo={MANIFESTO_PHOTOS[2]!} />.
            </span>{" "}
            No factory. No shortcuts.
          </p>
        </Reveal>
        <Reveal className="mt-12 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <p className="max-w-[44ch] text-base leading-relaxed text-fg-2 sm:text-lg">
            Every D&apos;FOOTPRINT pair is made for real streets — the heat, the
            hustle, the long days. Made for men and women. Made to be worn, not
            kept in a box.
          </p>
          <Link
            href="/about-us"
            className="label link-underline self-start sm:self-auto"
          >
            Our story
          </Link>
        </Reveal>
      </section>

      {/* ── 02 NEW IN: staggered editorial grid ────────────────────── */}
      {newIn.length > 0 ? (
        <section
          className={`border-t border-line bg-canvas pb-28 pt-10 text-fg sm:pb-40 ${PAD}`}
        >
          <div className="label mb-10 flex items-baseline justify-between sm:mb-16">
            <span className="text-fg-3">(02) — New in</span>
            <Link href="/products" className="link-underline">
              Shop all
            </Link>
          </div>
          <ul className="grid grid-cols-2 gap-x-3 gap-y-10 sm:gap-x-4 lg:grid-cols-4">
            {newIn.map((product, i) => (
              <li
                key={product.id}
                className={
                  i % 2 === 1 ? "translate-y-10 lg:translate-y-24" : ""
                }
              >
                <Reveal delay={(i % 4) * 80}>
                  <ProductCard
                    product={product}
                    index={i}
                    sizes="(min-width:1024px) 25vw, 50vw"
                  />
                </Reveal>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* ── CITY: full-bleed parallax photo with type ──────────────── */}
      <section className="relative h-[110svh] overflow-hidden bg-ink text-paper">
        <Image
          src={CITY_PHOTO.src}
          alt={CITY_PHOTO.alt}
          fill
          sizes="100vw"
          className="parallax develop object-cover"
        />
        <div className="absolute inset-0 bg-black/35" />
        <div
          className={`relative flex h-full flex-col justify-between py-6 ${PAD}`}
        >
          <p className="label">(03) — The city</p>
          <Reveal>
            <h2 className="display text-[clamp(3.8rem,15vw,15rem)]">
              The street
              <br />
              is the runway.
            </h2>
          </Reveal>
          <p className="label flex justify-between text-white/80">
            <span>Lagos, Nigeria</span>
            <span>Built for real streets</span>
          </p>
        </div>
      </section>

      {/* ── 04 LOOKBOOK: pinned sideways scroll ────────────────────── */}
      <section className="bg-ink pb-16 pt-24 text-paper md:pb-0 md:pt-0">
        <div className={`md:hidden ${PAD} mb-8`}>
          <p className="label mb-4 text-white/60">(04) — On foot</p>
          <h2 className="display text-[clamp(3rem,15vw,5rem)]">
            Worn by everyone
          </h2>
        </div>
        <HorizontalScroll count={LOOKS.length + 1}>
          <div className="hidden w-[38vw] shrink-0 flex-col justify-end pr-8 md:flex">
            <p className="label mb-6 text-white/60">(04) — On foot</p>
            <h2 className="display text-[8.5vw]">
              Worn by
              <br />
              everyone.
            </h2>
            <p className="mt-6 max-w-[34ch] text-white/70">
              Men, women, weekdays, weekends. Scroll the looks →
            </p>
          </div>
          {LOOKS.map((look, i) => (
            <Link
              key={look.src}
              href={look.href}
              data-cursor="Shop"
              className="group w-[78vw] shrink-0 snap-start sm:w-[46vw] md:w-auto"
            >
              <div
                className={`relative overflow-hidden ${
                  i % 2
                    ? "aspect-[4/5] md:h-[58svh]"
                    : "aspect-[3/4] md:h-[70svh]"
                } md:aspect-[3/4]`}
              >
                <Image
                  src={look.src}
                  alt={look.alt}
                  fill
                  sizes="(min-width:768px) 40vw, 78vw"
                  className="object-cover transition-transform duration-[1.2s] ease-atelier group-hover:scale-[1.05]"
                />
              </div>
              <p className="label mt-3 flex justify-between gap-4">
                <span className="text-white/50">
                  Look {String(i + 1).padStart(2, "0")}
                </span>
                <span>{look.caption}</span>
              </p>
            </Link>
          ))}
        </HorizontalScroll>
      </section>

      {/* ── 05 CRAFT: hover list with floating photo ───────────────── */}
      <section className={`bg-canvas py-24 text-fg sm:py-36 ${PAD}`}>
        <div className="mb-14 grid gap-8 sm:mb-20 lg:grid-cols-2">
          <Reveal>
            <p className="label mb-6 text-fg-3">(05) — The craft</p>
            <h2 className="display text-[clamp(3rem,10vw,9rem)]">
              No factory.
              <br />
              One workshop.
            </h2>
          </Reveal>
          <Reveal className="self-end lg:justify-self-end">
            <p className="max-w-[40ch] text-base leading-relaxed text-fg-2 sm:text-lg">
              Four steps, the same pair of hands. That&apos;s why no two pairs
              are ever exactly alike.
            </p>
          </Reveal>
        </div>

        <ol className="border-t border-fg">
          {CRAFT_STEPS.map((step, i) => (
            <li
              key={step.title}
              data-cursor-img={CRAFT_PHOTOS[i]?.src}
              className="group grid grid-cols-[3rem_1fr] items-baseline gap-x-4 border-b border-line py-6 transition-colors duration-500 sm:grid-cols-[6rem_1fr_1fr] sm:py-8 md:hover:bg-fg md:hover:text-canvas"
            >
              <span className="label text-fg-3 sm:pl-2 md:group-hover:text-canvas/60">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="display text-[clamp(2.6rem,7vw,6rem)] transition-transform duration-500 md:group-hover:translate-x-4">
                {step.title}
              </h3>
              <p className="col-start-2 mt-3 max-w-[38ch] text-fg-2 sm:col-start-3 sm:mt-0 sm:self-center md:group-hover:text-canvas/70">
                {step.body}
              </p>
            </li>
          ))}
        </ol>
      </section>

      {/* ── 06 CUSTOM ORDERS ───────────────────────────────────────── */}
      <section className="grid bg-ink text-paper lg:grid-cols-2">
        <div className="relative min-h-[70svh] overflow-hidden">
          <Image
            src={CUSTOM_PHOTO.src}
            alt={CUSTOM_PHOTO.alt}
            fill
            sizes="(min-width:1024px) 50vw, 100vw"
            className="develop object-cover"
          />
        </div>
        <div
          className={`flex flex-col justify-between gap-16 py-16 sm:py-24 ${PAD}`}
        >
          <Reveal>
            <p className="label mb-6 text-white/60">(06) — Custom orders</p>
            <h2 className="display text-[clamp(3.4rem,11vw,8.5rem)]">
              Your idea.
              <br />
              Our hands.
            </h2>
          </Reveal>
          <Reveal>
            <ol className="border-t border-white/25">
              {CUSTOM_STEPS.map((step, i) => (
                <li
                  key={step}
                  className="grid grid-cols-[3rem_1fr] border-b border-white/25 py-4 text-white/85"
                >
                  <span className="label pt-1 text-white/50">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
            <div className="mt-8 flex flex-col gap-2 sm:flex-row">
              <Link
                href="/custom-orders"
                className="group inline-flex h-12 items-center justify-center gap-2 bg-paper px-6 text-sm font-semibold uppercase tracking-wide text-ink transition-transform active:scale-[0.97]"
              >
                Start a custom order
                <ArrowUpRight className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </Link>
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-12 items-center justify-center border border-white/50 px-6 text-sm font-semibold uppercase tracking-wide transition-colors hover:bg-white hover:text-ink active:scale-[0.97]"
              >
                Chat on WhatsApp
              </a>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── CLOSING WORDMARK ───────────────────────────────────────── */}
      <section className="overflow-hidden bg-canvas pt-16 text-fg">
        <div className={`label flex justify-between ${PAD}`}>
          <span>Made by hand in Lagos</span>
          <Link href="/products" className="link-underline">
            Shop now
          </Link>
        </div>
        <p
          aria-hidden
          className="display select-none whitespace-nowrap pt-6 text-center text-[17.4vw] leading-[0.78]"
        >
          D&apos;Footprint
        </p>
      </section>

      <Footer />
    </>
  );
}

function InlinePhoto({ photo }: { photo: Photo }) {
  return (
    <span className="inline-photo" data-cursor-img={photo.src}>
      <Image
        src={photo.src}
        alt=""
        fill
        sizes="160px"
        className="develop object-cover"
      />
    </span>
  );
}
