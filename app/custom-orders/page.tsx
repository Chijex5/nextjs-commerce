import Footer from "components/layout/footer";
import { Reveal } from "components/home/reveal";
import { buttonClass } from "components/ui/button";
import { CUSTOM_PHOTO, CRAFT_PHOTOS } from "lib/data/editorial";
import { isMockData } from "lib/data/source";
import { getPublishedCustomOrders } from "lib/database";
import { canonicalUrl, siteName } from "lib/seo";
import { ArrowUpRight, Plus } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import "../home.css";

export const metadata: Metadata = {
  title: `Custom orders · ${siteName}`,
  description:
    "Send a photo or an idea and D'FOOTPRINT will tell you if it can be made by hand, and what it costs, before any work starts.",
  alternates: { canonical: canonicalUrl("/custom-orders") },
};

const WHATSAPP_URL =
  process.env.NEXT_PUBLIC_WHATSAPP_URL || "https://wa.me/2348121993874";

// Wording follows PRD §5: every request is reviewed, some edits cost more,
// not every request can be made, and nothing is instant.
const STEPS = [
  {
    title: "Show us",
    body: "Send a photo, a screenshot or a description — or pick one of our designs and tell us what to change.",
  },
  {
    title: "We review it",
    body: "Every request is looked at by hand. If it can't be made well, we'll tell you honestly.",
  },
  {
    title: "You approve",
    body: "We confirm what's possible, your size and the price. Some changes cost extra — you'll know before anything starts.",
  },
  {
    title: "Made & delivered",
    body: "Your pair is made by hand in Lagos and delivered anywhere in Nigeria.",
  },
];

const IDEAS = [
  "Remake a pair from a photo",
  "Remove a buckle",
  "Add roses or other details",
  "Change the colour",
  "Make an existing design in your size",
  "Something we haven't thought of",
];

const FAQS = [
  {
    q: "Can every request be made?",
    a: "No — and we'd rather say so up front. Every request is reviewed before we accept it, and we'll explain if something isn't possible.",
  },
  {
    q: "Does a custom pair cost more?",
    a: "Some changes do. We always confirm the final price with you before any work starts, so there are no surprises.",
  },
  {
    q: "How long does it take?",
    a: "It depends on the design. We'll give you a timeline when we confirm your request.",
  },
  {
    q: "Can I change one of your existing designs?",
    a: "Yes — tell us which design and what you'd like different, like removing a buckle or adding a detail.",
  },
  {
    q: "Do you deliver everywhere in Nigeria?",
    a: "Yes. The delivery fee for your state is shown before you pay.",
  },
];

export default async function CustomOrdersPage() {
  const showcase = isMockData ? [] : await getPublishedCustomOrders(6);

  return (
    <>
      {/* Hero */}
      <section className="grid bg-ink text-paper lg:grid-cols-2">
        <div className="flex flex-col justify-between gap-12 px-4 pb-12 pt-10 sm:px-8 sm:pt-14 md:px-12 lg:min-h-[calc(100svh-4rem)]">
          <p className="label text-white/60">(Custom orders)</p>
          <div>
            <h1 className="display text-[clamp(4rem,13vw,10rem)]">
              <span className="line">
                <span>Your idea.</span>
              </span>
              <span className="line">
                <span style={{ "--d": "120ms" } as React.CSSProperties}>
                  Our hands.
                </span>
              </span>
            </h1>
            <p className="mt-8 max-w-[44ch] text-lg text-white/75">
              Send us a photo or describe the pair you want. We&apos;ll tell you
              if it can be made by hand — and what it costs — before any work
              starts.
            </p>
            <div className="mt-8 flex flex-col gap-2 sm:flex-row">
              <Link
                href="/custom-orders/request"
                className={buttonClass("inverse")}
              >
                Start a request
                <ArrowUpRight className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </Link>
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonClass("inverse-outline")}
              >
                Ask on WhatsApp
              </a>
            </div>
          </div>
        </div>
        <div className="relative min-h-[60svh] overflow-hidden">
          <Image
            src={CUSTOM_PHOTO.src}
            alt={CUSTOM_PHOTO.alt}
            fill
            priority
            sizes="(min-width:1024px) 50vw, 100vw"
            className="hero-zoom object-cover"
          />
        </div>
      </section>

      {/* How it works */}
      <section className="bg-canvas px-4 py-24 text-fg sm:px-8 sm:py-32 md:px-12">
        <Reveal className="mb-14 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="label mb-5 text-fg-3">(01) — How it works</p>
            <h2 className="display text-[clamp(3rem,9vw,7.5rem)]">
              Four steps.
              <br />
              No surprises.
            </h2>
          </div>
          <p className="max-w-[40ch] text-fg-2 sm:text-lg">
            Custom work is never instant. Every pair is reviewed, priced and
            agreed with you before it&apos;s made.
          </p>
        </Reveal>
        <ol className="grid gap-px border border-line bg-line md:grid-cols-2 xl:grid-cols-4">
          {STEPS.map((step, i) => (
            <Reveal
              as="li"
              key={step.title}
              delay={i * 90}
              className="flex flex-col bg-canvas p-6 sm:p-8"
            >
              <span className="label text-fg-3">
                Step {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="display mt-14 text-[clamp(2.2rem,4vw,3rem)]">
                {step.title}
              </h3>
              <p className="mt-3 leading-relaxed text-fg-2">{step.body}</p>
            </Reveal>
          ))}
        </ol>
      </section>

      {/* Ideas */}
      <section className="grid border-t border-line bg-canvas text-fg lg:grid-cols-2">
        <div className="relative min-h-[50svh] overflow-hidden lg:min-h-0">
          <Image
            src={CRAFT_PHOTOS[1]!.src}
            alt={CRAFT_PHOTOS[1]!.alt}
            fill
            sizes="(min-width:1024px) 50vw, 100vw"
            className="develop object-cover"
          />
        </div>
        <div className="px-4 py-20 sm:px-8 md:px-12 lg:py-28">
          <p className="label mb-5 text-fg-3">(02) — What you can ask for</p>
          <ul className="border-t border-fg">
            {IDEAS.map((idea, i) => (
              <Reveal
                as="li"
                key={idea}
                delay={i * 60}
                className="flex items-baseline gap-5 border-b border-line py-5"
              >
                <span className="label text-fg-3">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="display text-[clamp(1.8rem,4vw,3rem)]">
                  {idea}
                </span>
              </Reveal>
            ))}
          </ul>
          <p className="mt-6 text-sm text-fg-3">
            All requests are subject to review. Some changes cost extra.
          </p>
        </div>
      </section>

      {/* Showcase (published custom orders) */}
      {showcase.length ? (
        <section className="border-t border-line bg-canvas px-4 py-24 text-fg sm:px-8 md:px-12">
          <p className="label mb-5 text-fg-3">(03) — Made to order</p>
          <h2 className="display mb-12 text-[clamp(3rem,9vw,7.5rem)]">
            Before &amp; after
          </h2>
          <ul className="grid gap-10 md:grid-cols-2 xl:grid-cols-3">
            {showcase.map((order) => (
              <Reveal as="li" key={order.id}>
                <div className="grid grid-cols-2 gap-1">
                  {[
                    { src: order.beforeImage, label: "Reference" },
                    { src: order.afterImage, label: "Made" },
                  ].map((img) => (
                    <div
                      key={img.label}
                      className="relative aspect-[4/5] overflow-hidden bg-plate"
                    >
                      {img.src ? (
                        <Image
                          src={img.src}
                          alt={`${order.title} — ${img.label.toLowerCase()}`}
                          fill
                          sizes="(min-width:1280px) 16vw, (min-width:768px) 25vw, 50vw"
                          className="object-cover"
                        />
                      ) : null}
                      <span className="label absolute left-2 top-2 bg-canvas px-1.5 py-0.5">
                        {img.label}
                      </span>
                    </div>
                  ))}
                </div>
                <h3 className="mt-4 font-medium">{order.title}</h3>
                {order.customerStory ? (
                  <p className="mt-1 line-clamp-3 text-sm text-fg-2">
                    {order.customerStory}
                  </p>
                ) : null}
              </Reveal>
            ))}
          </ul>
        </section>
      ) : null}

      {/* FAQ */}
      <section className="grid gap-12 border-t border-line bg-canvas px-4 py-24 text-fg sm:px-8 md:px-12 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <p className="label mb-5 text-fg-3">(FAQ)</p>
          <h2 className="display text-[clamp(3rem,8vw,6rem)]">
            Good questions.
          </h2>
        </div>
        <div className="border-t border-fg lg:col-span-7">
          {FAQS.map((faq) => (
            <details key={faq.q} className="group border-b border-line">
              <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-6 py-4 text-lg font-medium [&::-webkit-details-marker]:hidden">
                {faq.q}
                <Plus className="size-5 shrink-0 transition-transform duration-300 group-open:rotate-45" />
              </summary>
              <p className="max-w-[60ch] pb-6 leading-relaxed text-fg-2">
                {faq.a}
              </p>
            </details>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-ink px-4 py-20 text-paper sm:px-8 md:px-12">
        <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <p className="display text-[clamp(3rem,10vw,8rem)]">
            Got a design
            <br />
            in mind?
          </p>
          <Link
            href="/custom-orders/request"
            className={buttonClass("inverse")}
          >
            Start a request
            <ArrowUpRight className="size-4" />
          </Link>
        </div>
      </section>

      <Footer />
    </>
  );
}
