import Footer from "components/layout/footer";
import { PairIllustration } from "components/home/pair-illustration";
import { ProductCard } from "components/home/product-card";
import { Rail } from "components/home/rail";
import { Reveal } from "components/home/reveal";
import { SectionHead } from "components/home/section-head";
import { getHomeData } from "lib/data/home";
import { canonicalUrl, siteName } from "lib/seo";
import {
  ArrowRight,
  ArrowUpRight,
  Hand,
  MessageCircle,
  ShieldCheck,
  Truck,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import "./home.css";

const description =
  "D'FOOTPRINT — slides and slippers cut, stitched and finished by hand in Lagos. Shop ready-made designs or order your own. Delivery across Nigeria.";

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

const GUTTER = "px-4 sm:px-8 lg:px-12";
const WRAP = `mx-auto w-full max-w-[1600px] ${GUTTER}`;

const BTN_PRIMARY =
  "group inline-flex h-12 whitespace-nowrap items-center justify-center gap-2.5 rounded-full bg-signal px-6 text-sm font-semibold text-ink transition-[transform,background-color] duration-300 hover:bg-bone active:scale-[0.97]";
const BTN_GHOST_DARK =
  "inline-flex h-12 whitespace-nowrap items-center justify-center gap-2 rounded-full border border-bone/25 px-6 text-sm font-medium text-bone transition-colors duration-300 hover:border-bone hover:bg-bone/5 active:scale-[0.97]";

const CRAFT_STEPS = [
  {
    title: "Pattern & cut",
    body: "Every upper starts as a paper pattern, then is cut by hand from the material you see in the photos.",
  },
  {
    title: "Stitch",
    body: "Straps and edges are stitched and reinforced where a pair takes the most wear.",
  },
  {
    title: "Sole & shape",
    body: "The upper is fitted to its sole, glued, pressed and left to set before anything else happens.",
  },
  {
    title: "Finish & check",
    body: "Edges are cleaned, the pair is inspected side by side, then packed for delivery.",
  },
];

const CUSTOM_STEPS = [
  {
    title: "Show us",
    body: "Send a photo, a screenshot or an idea — or pick one of our designs to change.",
  },
  {
    title: "We confirm",
    body: "We reply with what's possible, your size and the price before any work starts.",
  },
  {
    title: "Made for you",
    body: "Your pair is made by hand and delivered to your door, anywhere in Nigeria.",
  },
];

const PROMISES = [
  {
    icon: Hand,
    title: "Made by hand",
    body: "Cut, stitched and finished in our Lagos workshop.",
  },
  {
    icon: Truck,
    title: "Nationwide delivery",
    body: "Delivered across Nigeria, with the fee shown before you pay.",
  },
  {
    icon: ShieldCheck,
    title: "Secure checkout",
    body: "Payments are processed securely by Paystack.",
  },
  {
    icon: MessageCircle,
    title: "Real people",
    body: "Questions about size or style? Talk to us on WhatsApp.",
  },
];

export default async function HomePage() {
  const { newArrivals, bestSellers, collections } = await getHomeData();
  const [feature, ...supporting] = bestSellers;

  return (
    <>
      {/* ── HERO ───────────────────────────────────────────────────── */}
      <section className="grain overflow-hidden bg-ink text-bone">
        <div
          className={`${WRAP} flex min-h-[calc(100svh-4rem)] flex-col pb-6 pt-6 sm:pt-10`}
        >
          <div className="rise flex items-center justify-between gap-4 font-mono text-[11px] uppercase tracking-[0.16em] text-bone/60">
            <span>Handmade in Lagos, Nigeria</span>
            <span className="hidden sm:inline">Slides · Slippers · Custom</span>
          </div>

          <div className="grid flex-1 items-center gap-10 py-10 lg:grid-cols-12 lg:gap-6 lg:py-0">
            <div className="lg:col-span-7">
              <h1 className="display text-[clamp(3.6rem,15.5vw,11.5rem)] lg:text-[clamp(5rem,8.4vw,9.5rem)]">
                <span
                  className="rise block"
                  style={{ "--d": "80ms" } as React.CSSProperties}
                >
                  Every pair
                </span>
                <span
                  className="rise block"
                  style={{ "--d": "180ms" } as React.CSSProperties}
                >
                  carries a
                </span>
                <span
                  className="rise accent block pr-[0.1em] text-[1.08em] leading-[0.9] text-signal"
                  style={{ "--d": "300ms" } as React.CSSProperties}
                >
                  fingerprint.
                </span>
              </h1>

              <div
                className="rise mt-8 flex flex-col gap-8 sm:mt-10 lg:flex-row lg:items-end lg:gap-12"
                style={{ "--d": "450ms" } as React.CSSProperties}
              >
                <p className="max-w-[34ch] text-base leading-relaxed text-bone/70 sm:text-lg">
                  Slides and slippers cut, stitched and finished by hand in
                  Lagos. Choose a design from the archive — or bring us yours
                  and we&apos;ll make it.
                </p>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Link href="/products" className={BTN_PRIMARY}>
                    Shop the archive
                    <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </Link>
                  <Link href="/custom-orders" className={BTN_GHOST_DARK}>
                    Start a custom order
                  </Link>
                </div>
              </div>
            </div>

            {/* Technical drawing of a pair — stands in for hero photography */}
            <div className="relative mx-auto w-full max-w-[280px] sm:max-w-[400px] lg:col-span-5 lg:max-w-[460px]">
              <div className="float">
                <PairIllustration
                  draw
                  style="band"
                  className="w-full text-bone"
                  title="Line drawing of a handmade pair of slides"
                />
              </div>
              <Annotation
                className="-left-[14%] top-[30%]"
                align="left"
                delay={2100}
              >
                Hand-cut strap
              </Annotation>
              <Annotation
                className="-right-[12%] top-[60%]"
                align="right"
                delay={2300}
              >
                Stitched by hand
              </Annotation>
              <Annotation
                className="-left-[8%] bottom-[6%]"
                align="left"
                delay={2500}
              >
                Shaped sole
              </Annotation>
            </div>
          </div>

          <ul
            className="rise grid grid-cols-2 border-t border-bone/15 pt-5 text-[13px] text-bone/70 sm:grid-cols-4"
            style={{ "--d": "650ms" } as React.CSSProperties}
          >
            {[
              "Made to last",
              "Delivery nationwide",
              "Paystack secured",
              "Custom orders open",
            ].map((item, i) => (
              <li key={item} className="flex items-center gap-2.5 py-1.5">
                <span className="font-mono text-[11px] text-signal">
                  {String(i + 1).padStart(2, "0")}
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── 01 NEW ARRIVALS ────────────────────────────────────────── */}
      {newArrivals.length > 0 ? (
        <section className="bg-canvas py-20 sm:py-28">
          <div className={WRAP}>
            <SectionHead
              index="01"
              eyebrow="New arrivals"
              title={
                <>
                  Fresh off <span className="accent">the</span> bench
                </>
              }
              href="/products"
              linkLabel="Shop all designs"
            />
            <Rail label="New arrivals">
              {newArrivals.map((product, i) => (
                <li
                  key={product.id}
                  className="w-[72vw] shrink-0 snap-start sm:w-[42vw] md:w-[31vw] lg:w-[calc((100%-3*1rem)/4)]"
                >
                  <ProductCard
                    product={product}
                    index={i}
                    sizes="(min-width:1024px) 25vw, (min-width:768px) 31vw, 72vw"
                    priority={i < 2}
                  />
                </li>
              ))}
            </Rail>
          </div>
        </section>
      ) : null}

      {/* ── 02 SHOP BY ─────────────────────────────────────────────── */}
      {collections.length > 0 ? (
        <section className="border-t border-line bg-canvas py-20 sm:py-28">
          <div className={WRAP}>
            <SectionHead
              index="02"
              eyebrow="Collections"
              title={
                <>
                  Find <span className="accent">your</span> fit
                </>
              }
              href="/search"
              linkLabel="All collections"
            />
            <ul className="grid grid-cols-2 gap-px overflow-hidden border border-line bg-line lg:grid-cols-4">
              {collections.map((collection, i) => (
                <Reveal
                  as="li"
                  key={collection.handle}
                  delay={i * 80}
                  className="bg-canvas"
                >
                  <Link
                    href={collection.path}
                    className="group relative flex aspect-square flex-col justify-between overflow-hidden p-4 transition-colors duration-500 hover:bg-fg hover:text-canvas sm:aspect-square sm:p-6"
                  >
                    <span className="flex items-start justify-between">
                      <span className="font-mono text-[11px] text-fg-3 transition-colors group-hover:text-canvas/60">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <ArrowUpRight className="size-5 transition-transform duration-500 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent" />
                    </span>
                    <span>
                      <span className="display block text-[clamp(2.2rem,7vw,4.5rem)]">
                        {collection.title}
                      </span>
                      <span className="mt-2 block text-sm text-fg-3 transition-colors group-hover:text-canvas/60">
                        {collection.productCount}{" "}
                        {collection.productCount === 1 ? "design" : "designs"}
                      </span>
                    </span>
                  </Link>
                </Reveal>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      {/* ── 03 THE CRAFT ───────────────────────────────────────────── */}
      <section className="border-t border-line bg-canvas py-20 sm:py-28">
        <div className={`${WRAP} grid gap-12 lg:grid-cols-12 lg:gap-6`}>
          <div className="lg:col-span-5">
            <div className="lg:sticky lg:top-28">
              <SectionHead
                index="03"
                eyebrow="The craft"
                title={
                  <>
                    Made <span className="accent">slowly,</span>
                    <br />
                    on purpose
                  </>
                }
              />
              <Reveal>
                <p className="max-w-[38ch] text-base leading-relaxed text-fg-2 sm:text-lg">
                  No factory line. Every D&apos;FOOTPRINT pair passes through
                  the same pair of hands, one step at a time — which is why no
                  two are ever exactly alike.
                </p>
                <Link
                  href="/about-us"
                  className="link-underline mt-8 inline-block text-sm font-medium text-fg"
                >
                  Read our story
                </Link>
              </Reveal>
            </div>
          </div>

          <ol className="relative lg:col-span-6 lg:col-start-7">
            <span
              aria-hidden
              className="stitch-y absolute bottom-6 left-[19px] top-6"
            />
            {CRAFT_STEPS.map((step, i) => (
              <Reveal
                as="li"
                key={step.title}
                className="relative grid grid-cols-[40px_1fr] gap-5 pb-12 last:pb-0 sm:gap-8 sm:pb-16"
              >
                <span className="relative z-10 grid size-10 place-items-center rounded-full border border-line bg-canvas font-mono text-xs text-accent">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="pt-1.5">
                  <h3 className="display text-[clamp(1.9rem,5vw,3rem)] text-fg">
                    {step.title}
                  </h3>
                  <p className="mt-3 max-w-[44ch] leading-relaxed text-fg-2">
                    {step.body}
                  </p>
                </div>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* ── 04 BEST SELLERS ────────────────────────────────────────── */}
      {feature ? (
        <section className="border-t border-line bg-canvas py-20 sm:py-28">
          <div className={WRAP}>
            <SectionHead
              index="04"
              eyebrow="Most loved"
              title={
                <>
                  Crowd <span className="accent">favourites</span>
                </>
              }
              href="/search?sort=trending-desc"
              linkLabel="Shop best sellers"
            />
            <div className="grid gap-x-3 gap-y-8 sm:gap-x-4 lg:grid-cols-2">
              <Reveal>
                <ProductCard
                  product={feature}
                  index={0}
                  size="feature"
                  sizes="(min-width:1024px) 50vw, 100vw"
                />
              </Reveal>
              <div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-4">
                {supporting.slice(0, 4).map((product, i) => (
                  <Reveal key={product.id} delay={(i % 2) * 90}>
                    <ProductCard
                      product={product}
                      index={i + 1}
                      sizes="(min-width:1024px) 25vw, 50vw"
                    />
                  </Reveal>
                ))}
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {/* ── 05 CUSTOM ORDERS ───────────────────────────────────────── */}
      <section className="grain overflow-hidden bg-ink py-20 text-bone sm:py-28">
        <div className={WRAP}>
          <Reveal className="mb-14 flex flex-col gap-10 lg:mb-20 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="mb-4 flex items-center gap-3 text-[11px] font-medium uppercase tracking-[0.2em] text-bone/50">
                <span className="font-mono text-signal">05</span>
                <span className="h-px w-8 bg-bone/20" />
                Custom orders
              </p>
              <h2 className="display text-[clamp(3rem,11vw,8.5rem)]">
                Got a design
                <br />
                <span className="accent text-signal">in mind?</span>
              </h2>
            </div>
            <p className="max-w-[36ch] text-base leading-relaxed text-bone/70 sm:text-lg">
              Change a strap, swap a colour, add a detail — or start from a
              photo. If it can be made by hand, we&apos;ll tell you how.
            </p>
          </Reveal>

          <ol className="grid gap-px overflow-hidden border border-bone/15 bg-bone/15 md:grid-cols-3">
            {CUSTOM_STEPS.map((step, i) => (
              <Reveal
                as="li"
                key={step.title}
                delay={i * 100}
                className="bg-ink p-6 sm:p-8"
              >
                <span className="font-mono text-xs text-signal">
                  Step {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="display mt-10 text-[clamp(2rem,4vw,2.75rem)] sm:mt-16">
                  {step.title}
                </h3>
                <p className="mt-3 max-w-[34ch] leading-relaxed text-bone/65">
                  {step.body}
                </p>
              </Reveal>
            ))}
          </ol>

          <Reveal className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Link href="/custom-orders" className={BTN_PRIMARY}>
              Start a custom order
              <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={BTN_GHOST_DARK}
            >
              <MessageCircle className="size-4" />
              Ask on WhatsApp
            </a>
          </Reveal>
        </div>
      </section>

      {/* ── PROMISES ───────────────────────────────────────────────── */}
      <section className="bg-canvas py-16 sm:py-20">
        <ul
          className={`${WRAP} grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4`}
        >
          {PROMISES.map(({ icon: Icon, title, body }, i) => (
            <Reveal as="li" key={title} delay={i * 70} className="flex gap-4">
              <span className="grid size-11 shrink-0 place-items-center rounded-full bg-plate text-fg">
                <Icon className="size-[18px]" strokeWidth={1.6} />
              </span>
              <div>
                <h3 className="font-semibold text-fg">{title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-fg-2">{body}</p>
              </div>
            </Reveal>
          ))}
        </ul>
      </section>

      {/* ── CLOSING ────────────────────────────────────────────────── */}
      <section className="overflow-hidden border-t border-line bg-canvas pt-20 sm:pt-28">
        <div className={WRAP}>
          <Reveal className="flex flex-col items-start gap-8 sm:flex-row sm:items-end sm:justify-between">
            <p className="display max-w-[14ch] text-[clamp(2.2rem,6vw,4.5rem)] text-fg">
              Walk in something <span className="accent text-accent">made</span>{" "}
              for you.
            </p>
            <Link
              href="/products"
              className="group inline-flex h-12 items-center gap-2.5 rounded-full bg-fg px-6 text-sm font-semibold text-canvas transition-transform duration-300 active:scale-[0.97]"
            >
              Shop now
              <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </Reveal>
          <div className="stitch-x mt-14" />
          <p
            aria-hidden
            className="display select-none whitespace-nowrap pt-4 text-center text-[16.5vw] leading-[0.8] text-fg 2xl:text-[16rem]"
          >
            D&apos;Footprint<span className="text-accent">.</span>
          </p>
        </div>
      </section>

      <Footer />
    </>
  );
}

function Annotation({
  children,
  className,
  align,
  delay,
}: {
  children: React.ReactNode;
  className: string;
  align: "left" | "right";
  delay: number;
}) {
  return (
    <span
      className={`rise absolute hidden items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-bone/60 sm:flex ${className} ${
        align === "right" ? "flex-row-reverse" : ""
      }`}
      style={{ "--d": `${delay}ms` } as React.CSSProperties}
    >
      <span className="size-1.5 rounded-full bg-signal" />
      <span className="h-px w-6 bg-bone/30" />
      <span className="bg-ink px-1.5 py-0.5">{children}</span>
    </span>
  );
}
