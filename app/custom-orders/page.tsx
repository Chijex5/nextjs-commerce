// custom-orders/page.tsx

import FaqAccordion from "components/custom-orders/faq-accordion";
import Footer from "components/layout/footer";
import { getPublishedCustomOrders } from "lib/database";
import { canonicalUrl, siteName } from "lib/seo";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: `Custom Orders · ${siteName}`,
  description:
    "Commission a bespoke pair of handcrafted footwear, made exactly to your specification.",
  alternates: { canonical: canonicalUrl("/custom-orders") },
};

const STEPS = [
  {
    num: "01",
    title: "Submit Your Brief",
    body: "Tell us your vision — material, colour, sizing, and any reference images. The more detail, the better.",
  },
  {
    num: "02",
    title: "We Draft a Design",
    body: "Our artisans sketch the pair and share a concept with you within 48 hours for your approval.",
  },
  {
    num: "03",
    title: "Handcrafted For You",
    body: "Once approved, skilled hands get to work. Most orders complete within 7–14 days.",
  },
  {
    num: "04",
    title: "Delivered Nationwide",
    body: "Your bespoke pair is packaged with care and shipped to your door anywhere in Nigeria.",
  },
];

const MATERIALS = [
  { name: "Full-Grain Leather", note: "Durable, ages beautifully" },
  { name: "Suede", note: "Soft, luxurious finish" },
  { name: "Ankara / Adire", note: "Bold cultural expression" },
  { name: "Patent Leather", note: "High-gloss statement" },
  { name: "Raffia", note: "Natural, breathable weave" },
  { name: "Velvet", note: "Opulent evening wear" },
];

const FAQS = [
  {
    q: "How long does a custom order take?",
    a: "Typically 7–14 working days from design approval. Rush orders (3–5 days) are available on request.",
  },
  {
    q: "Do you ship outside Nigeria?",
    a: "Currently we deliver nationwide across Nigeria. International shipping is coming soon — join the waitlist.",
  },
  {
    q: "Can I see a sample before committing?",
    a: "Yes. We can produce a material swatch or sole sample for a small refundable deposit.",
  },
  {
    q: "What sizes do you make?",
    a: "EU 35–48 for standard lasts. We can also work from a foot tracing for non-standard sizing.",
  },
  {
    q: "Is a deposit required?",
    a: "A 50 % deposit secures your slot. The balance is due before dispatch.",
  },
];

// ─── Component ────────────────────────────────────────────────────────────────
export default async function CustomOrdersPage() {
  const customOrderRows = await getPublishedCustomOrders(6);

  return (
    <>
      {/* Reuse every token from the homepage <style> block; add only page-specific rules */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;0,700;1,300;1,600&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500&display=swap');

        :root {
          --dp-void:    #060402;
          --dp-ink:     #0A0704;
          --dp-charcoal:#191209;
          --dp-card:    #1E1510;
          --dp-cream:   #F2E8D5;
          --dp-sand:    #C9B99A;
          --dp-muted:   #6A5A48;
          --dp-ember:   #BF5A28;
          --dp-gold:    #C0892A;
          --dp-border:  rgba(242,232,213,0.09);
        }

        .dp-wordmark { font-family:'Bebas Neue',sans-serif; }
        .dp-serif    { font-family:'Cormorant Garamond',serif; }
        .dp-sans     { font-family:'DM Sans',sans-serif; }

        @keyframes dp-marquee {
          0%   { transform:translateX(0); }
          100% { transform:translateX(-50%); }
        }
        .dp-marquee { animation:dp-marquee 32s linear infinite; }

        @keyframes dp-rise {
          from { opacity:0; transform:translateY(28px); }
          to   { opacity:1; transform:translateY(0); }
        }
        .dp-rise-1 { animation:dp-rise 1s cubic-bezier(.16,1,.3,1) .05s both; }
        .dp-rise-2 { animation:dp-rise 1s cubic-bezier(.16,1,.3,1) .18s both; }
        .dp-rise-3 { animation:dp-rise 1s cubic-bezier(.16,1,.3,1) .32s both; }
        .dp-rise-4 { animation:dp-rise 1s cubic-bezier(.16,1,.3,1) .46s both; }

        .dp-lift { transition:transform .55s cubic-bezier(.16,1,.3,1), box-shadow .55s cubic-bezier(.16,1,.3,1); }
        .dp-lift:hover { transform:translateY(-5px); box-shadow:0 20px 60px rgba(0,0,0,.45); }

        .dp-zoom { overflow:hidden; }
        .dp-zoom img { transition:transform .7s cubic-bezier(.16,1,.3,1); }
        .dp-zoom:hover img { transform:scale(1.07); }

        .dp-btn-solid  { display:inline-flex;align-items:center;gap:.5rem;background:var(--dp-cream);color:var(--dp-ink);font-family:'DM Sans',sans-serif;font-weight:500;font-size:.72rem;letter-spacing:.12em;text-transform:uppercase;padding:.9rem 2.1rem;text-decoration:none;transition:background .22s,color .22s; }
        .dp-btn-solid:hover  { background:var(--dp-ember);color:var(--dp-cream); }

        .dp-btn-ghost  { display:inline-flex;align-items:center;gap:.5rem;border:1px solid rgba(242,232,213,.28);color:var(--dp-cream);font-family:'DM Sans',sans-serif;font-weight:500;font-size:.72rem;letter-spacing:.12em;text-transform:uppercase;padding:.9rem 2.1rem;text-decoration:none;transition:border-color .22s,background .22s; }
        .dp-btn-ghost:hover  { border-color:var(--dp-cream);background:rgba(242,232,213,.06); }

        .dp-btn-ember  { display:inline-flex;align-items:center;gap:.5rem;background:var(--dp-ember);color:var(--dp-cream);font-family:'DM Sans',sans-serif;font-weight:500;font-size:.72rem;letter-spacing:.12em;text-transform:uppercase;padding:.9rem 2.1rem;text-decoration:none;transition:opacity .22s; }
        .dp-btn-ember:hover  { opacity:.88; }

        .dp-rule  { border:none;border-top:1px solid var(--dp-border); }
        .dp-label { font-family:'DM Sans',sans-serif;font-size:.62rem;font-weight:500;letter-spacing:.26em;text-transform:uppercase;color:var(--dp-ember); }
        .dp-nav-link { color:var(--dp-muted);text-decoration:none;transition:color .2s; }
        .dp-nav-link:hover { color:var(--dp-cream); }
        .dp-h2  { font-family:'Cormorant Garamond',serif;font-weight:600;color:var(--dp-cream); }
        .dp-num { font-family:'Bebas Neue',sans-serif;font-size:5.5rem;line-height:1;color:rgba(242,232,213,.05);position:absolute;top:.25rem;left:.75rem;pointer-events:none;user-select:none; }
        .dp-pill { position:absolute;top:.5rem;left:.5rem;font-family:'DM Sans',sans-serif;font-size:.5rem;font-weight:500;letter-spacing:.16em;text-transform:uppercase;padding:2px 7px; }

        .dp-grain::after { content:'';position:absolute;inset:0;pointer-events:none;z-index:5;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.035'/%3E%3C/svg%3E"); }

        /* ── Page-specific ── */
        .co-input {
          width:100%; background:var(--dp-card); border:1px solid var(--dp-border);
          color:var(--dp-cream); font-family:'DM Sans',sans-serif; font-size:.82rem;
          padding:.85rem 1rem; outline:none; resize:none;
          transition:border-color .22s;
        }
        .co-input::placeholder { color:var(--dp-muted); }
        .co-input:focus { border-color:rgba(191,90,40,.55); }

        .co-label { font-family:'DM Sans',sans-serif; font-size:.62rem; font-weight:500; letter-spacing:.18em; text-transform:uppercase; color:var(--dp-muted); display:block; margin-bottom:.5rem; }

        .co-step-line { position:absolute; top:2.6rem; left:1.35rem; bottom:0; width:1px; background:var(--dp-border); }

        .co-mat-chip {
          background:var(--dp-card); border:1px solid var(--dp-border);
          padding:.65rem 1.1rem; display:flex; flex-direction:column; gap:.2rem;
          transition:border-color .22s, transform .35s cubic-bezier(.16,1,.3,1);
        }
        .co-mat-chip:hover { border-color:rgba(191,90,40,.45); transform:translateY(-3px); }

        .faq-item { border-top:1px solid var(--dp-border); }
        .faq-btn  { width:100%; display:flex; align-items:center; justify-content:space-between; padding:1.1rem 0; background:none; border:none; cursor:pointer; text-align:left; }
        .faq-body { overflow:hidden; max-height:0; transition:max-height .4s cubic-bezier(.16,1,.3,1), padding .4s; }
        .faq-body.open { max-height:200px; padding-bottom:1rem; }

        .co-before-after { position:relative; }
        .co-ba-label { position:absolute; top:.5rem; left:.5rem; font-family:'DM Sans',sans-serif; font-size:.5rem; font-weight:500; letter-spacing:.16em; text-transform:uppercase; padding:2px 7px; }
      `}</style>

      <div
        className="dp-sans"
        style={{ background: "var(--dp-ink)", color: "var(--dp-cream)" }}
      >
        {/* ══════════════════════════════════════════════════════════
            §1  HERO
        ══════════════════════════════════════════════════════════ */}
        <section
          className="dp-grain relative overflow-hidden"
          style={{ background: "var(--dp-ink)" }}
        >
          {/* Atmospheric glows */}
          <div
            className="pointer-events-none absolute"
            style={{
              width: 700,
              height: 700,
              borderRadius: "50%",
              background:
                "radial-gradient(circle, rgba(191,90,40,0.18) 0%, transparent 68%)",
              left: -180,
              top: -220,
              filter: "blur(90px)",
            }}
          />
          <div
            className="pointer-events-none absolute"
            style={{
              width: 500,
              height: 500,
              borderRadius: "50%",
              background:
                "radial-gradient(circle, rgba(192,137,42,0.1) 0%, transparent 70%)",
              right: "8%",
              bottom: -80,
              filter: "blur(70px)",
            }}
          />

          <div
            className="relative mx-auto px-6 pt-14 pb-20 md:px-10 lg:px-16"
            style={{ maxWidth: 1800, zIndex: 10 }}
          >
            {/* Sub-header bar */}
            <div className="dp-rise-1 mb-8 flex items-center justify-between">
              <span className="dp-label" style={{ color: "var(--dp-muted)" }}>
                Bespoke · Made to Order · Nationwide
              </span>
              <nav className="hidden md:flex items-center gap-8">
                {["Shop All", "Collections", "Home"].map((item) => (
                  <Link
                    key={item}
                    href={
                      item === "Shop All"
                        ? "/products"
                        : item === "Collections"
                          ? "/products"
                          : "/"
                    }
                    className="dp-label dp-nav-link"
                  >
                    {item}
                  </Link>
                ))}
              </nav>
            </div>

            {/* Giant wordmark */}
            <div
              className="dp-wordmark dp-rise-2"
              style={{
                fontSize: "clamp(4.5rem, 13vw, 12rem)",
                lineHeight: 0.88,
                letterSpacing: "-0.01em",
                display: "flex",
                flexWrap: "wrap",
                gap: "0 0.4em",
              }}
            >
              <span style={{ color: "var(--dp-cream)" }}>CUSTOM</span>
              <span
                style={{
                  WebkitTextStroke: "1.5px rgba(242,232,213,0.25)",
                  color: "transparent",
                }}
              >
                ORDERS
              </span>
            </div>

            {/* Tagline + CTAs */}
            <div className="dp-rise-3 mt-10 grid gap-10 lg:grid-cols-2 lg:items-end">
              <div className="space-y-7 pb-4">
                <p
                  className="dp-serif"
                  style={{
                    fontSize: "clamp(1.35rem, 2.8vw, 2.1rem)",
                    fontWeight: 300,
                    fontStyle: "italic",
                    lineHeight: 1.4,
                    color: "var(--dp-sand)",
                    maxWidth: 520,
                  }}
                >
                  Your vision, our hands. Commission a pair of handcrafted
                  footwear made precisely to your specification.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Link href="/custom-orders/request" className="dp-btn-solid">
                    Start Your Order
                    <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                      <path
                        d="M3 8h10M9 4l4 4-4 4"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </Link>
                  <Link href="#showcase" className="dp-btn-ghost">
                    See Past Work
                  </Link>
                </div>
              </div>

              {/* Stats strip */}
              <div
                className="grid grid-cols-3 gap-px"
                style={{
                  borderTop: "1px solid var(--dp-border)",
                  paddingTop: "2rem",
                }}
              >
                {[
                  ["200+", "Custom pairs crafted"],
                  ["7–14", "Days turnaround"],
                  ["100%", "Satisfaction rate"],
                ].map(([num, label]) => (
                  <div key={num} style={{ paddingRight: "2rem" }}>
                    <p
                      className="dp-wordmark"
                      style={{
                        fontSize: "2.8rem",
                        color: "var(--dp-gold)",
                        lineHeight: 1,
                      }}
                    >
                      {num}
                    </p>
                    <p
                      style={{
                        fontSize: ".7rem",
                        color: "var(--dp-muted)",
                        marginTop: ".35rem",
                        fontFamily: "DM Sans, sans-serif",
                        lineHeight: 1.4,
                      }}
                    >
                      {label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════
            §2  MARQUEE STRIP
        ══════════════════════════════════════════════════════════ */}
        <div
          style={{
            background: "var(--dp-ember)",
            padding: ".8rem 0",
            overflow: "hidden",
          }}
        >
          <div
            className="dp-marquee"
            style={{
              display: "flex",
              whiteSpace: "nowrap",
              alignItems: "center",
            }}
          >
            {Array.from({ length: 4 }).map((_, i) => (
              <span
                key={i}
                className="dp-wordmark"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "1.5rem",
                  paddingRight: "1.5rem",
                  fontSize: "1rem",
                  letterSpacing: ".14em",
                  color: "var(--dp-cream)",
                }}
              >
                <span>BESPOKE FOOTWEAR</span>
                <span
                  style={{
                    color: "rgba(242,232,213,0.45)",
                    fontSize: "0.7rem",
                  }}
                >
                  ✦
                </span>
                <span>HANDCRAFTED IN NIGERIA</span>
                <span
                  style={{
                    color: "rgba(242,232,213,0.45)",
                    fontSize: "0.7rem",
                  }}
                >
                  ✦
                </span>
                <span>MADE TO YOUR EXACT SPEC</span>
                <span
                  style={{
                    color: "rgba(242,232,213,0.45)",
                    fontSize: "0.7rem",
                  }}
                >
                  ✦
                </span>
                <span>7–14 DAY TURNAROUND</span>
                <span
                  style={{
                    color: "rgba(242,232,213,0.45)",
                    fontSize: "0.7rem",
                  }}
                >
                  ✦
                </span>
              </span>
            ))}
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════
            §3  HOW IT WORKS
        ══════════════════════════════════════════════════════════ */}
        <section
          className="mx-auto"
          style={{ maxWidth: 1800, padding: "5rem clamp(1.5rem,4vw,4rem)" }}
        >
          <div style={{ marginBottom: "3rem" }}>
            <p className="dp-label" style={{ marginBottom: ".5rem" }}>
              The Process
            </p>
            <h2
              className="dp-h2 dp-serif"
              style={{ fontSize: "clamp(1.8rem,3.5vw,3rem)", fontWeight: 600 }}
            >
              How It Works
            </h2>
          </div>

          <div
            style={{
              display: "grid",
              gap: "0",
              gridTemplateColumns: "repeat(1,1fr)",
            }}
            className="md:grid-cols-4"
          >
            {STEPS.map((step, i) => (
              <div
                key={step.num}
                style={{
                  position: "relative",
                  paddingLeft: "1rem",
                  borderLeft: "1px solid var(--dp-border)",
                  paddingBottom: "2.5rem",
                  marginLeft: i === 0 ? 0 : undefined,
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: "-0.55rem",
                    width: "1.1rem",
                    height: "1.1rem",
                    borderRadius: "50%",
                    background: "var(--dp-ember)",
                    border: "2px solid var(--dp-ink)",
                  }}
                />
                <p
                  className="dp-wordmark"
                  style={{
                    fontSize: "3.5rem",
                    color: "rgba(242,232,213,0.06)",
                    lineHeight: 1,
                    marginBottom: ".1rem",
                  }}
                >
                  {step.num}
                </p>
                <p
                  className="dp-label"
                  style={{ color: "var(--dp-ember)", marginBottom: ".5rem" }}
                >
                  {step.num}
                </p>
                <h3
                  className="dp-serif"
                  style={{
                    fontSize: "1.3rem",
                    fontWeight: 600,
                    color: "var(--dp-cream)",
                    marginBottom: ".6rem",
                  }}
                >
                  {step.title}
                </h3>
                <p
                  style={{
                    fontSize: ".78rem",
                    color: "var(--dp-muted)",
                    lineHeight: 1.6,
                    fontFamily: "DM Sans, sans-serif",
                    maxWidth: 240,
                  }}
                >
                  {step.body}
                </p>
              </div>
            ))}
          </div>
        </section>

        <hr className="dp-rule mx-6 md:mx-10 lg:mx-16" />

        {/* ══════════════════════════════════════════════════════════
            §4  PAST WORK / SHOWCASE
        ══════════════════════════════════════════════════════════ */}
        <section
          id="showcase"
          className="mx-auto"
          style={{ maxWidth: 1800, padding: "5rem clamp(1.5rem,4vw,4rem)" }}
        >
          <div
            style={{
              marginBottom: "2.5rem",
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "space-between",
            }}
          >
            <div>
              <p className="dp-label" style={{ marginBottom: ".5rem" }}>
                Bespoke gallery
              </p>
              <h2
                className="dp-h2 dp-serif"
                style={{
                  fontSize: "clamp(1.8rem,3.5vw,3rem)",
                  fontWeight: 600,
                }}
              >
                Past Custom Work
              </h2>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gap: ".75rem",
              gridTemplateColumns: "repeat(1,1fr)",
            }}
            className="md:grid-cols-3"
          >
            {customOrderRows.map((order, i) => {
              const isBig = i === 0;
              return (
                <div
                  key={order.id}
                  id={`order-${order.id}`}
                  className="dp-lift"
                  style={{
                    background: "var(--dp-card)",
                    border: "1px solid var(--dp-border)",
                    padding: "1rem",
                    gridColumn: isBig ? undefined : undefined,
                  }}
                >
                  {/* Before / After images */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: ".5rem",
                      marginBottom: ".875rem",
                    }}
                  >
                    <div
                      className="dp-zoom co-before-after"
                      style={{
                        position: "relative",
                        aspectRatio: "1",
                        background: "var(--dp-charcoal)",
                      }}
                    >
                      {order.beforeImage ? (
                        <Image
                          src={order.beforeImage}
                          alt={`${order.title} inspiration`}
                          fill
                          sizes="20vw"
                          className="object-cover"
                        />
                      ) : (
                        <div
                          style={{
                            position: "absolute",
                            inset: 0,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <span style={{ fontSize: "1.8rem", opacity: 0.18 }}>
                            ✦
                          </span>
                        </div>
                      )}
                      <span
                        className="co-ba-label"
                        style={{
                          background: "rgba(6,4,2,0.72)",
                          color: "var(--dp-sand)",
                        }}
                      >
                        Inspiration
                      </span>
                    </div>
                    <div
                      className="dp-zoom co-before-after"
                      style={{
                        position: "relative",
                        aspectRatio: "1",
                        background: "var(--dp-charcoal)",
                      }}
                    >
                      {order.afterImage ? (
                        <Image
                          src={order.afterImage}
                          alt={`${order.title} result`}
                          fill
                          sizes="20vw"
                          className="object-cover"
                        />
                      ) : (
                        <div
                          style={{
                            position: "absolute",
                            inset: 0,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <span style={{ fontSize: "1.8rem", opacity: 0.18 }}>
                            ◈
                          </span>
                        </div>
                      )}
                      <span
                        className="co-ba-label"
                        style={{
                          background: "rgba(191,90,40,0.85)",
                          color: "var(--dp-cream)",
                        }}
                      >
                        Result
                      </span>
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      justifyContent: "space-between",
                      gap: ".5rem",
                    }}
                  >
                    <div>
                      {order.customerStory && (
                        <p
                          className="dp-label"
                          style={{ marginBottom: ".3rem" }}
                        >
                          Story
                        </p>
                      )}
                      <p
                        style={{
                          fontSize: ".85rem",
                          fontFamily: "DM Sans, sans-serif",
                          color: "var(--dp-cream)",
                          fontWeight: 500,
                        }}
                      >
                        {order.title}
                      </p>
                      {order.customerStory && (
                        <p
                          style={{
                            fontSize: ".72rem",
                            color: "var(--dp-muted)",
                            marginTop: ".3rem",
                            fontFamily: "DM Sans, sans-serif",
                            lineHeight: 1.5,
                          }}
                        >
                          {order.customerStory}
                        </p>
                      )}
                    </div>
                    {order.completionTime && (
                      <div style={{ flexShrink: 0, textAlign: "right" }}>
                        <p
                          style={{
                            fontSize: ".5rem",
                            fontFamily: "DM Sans, sans-serif",
                            letterSpacing: ".14em",
                            textTransform: "uppercase",
                            color: "var(--dp-muted)",
                            marginBottom: ".2rem",
                          }}
                        >
                          Turnaround
                        </p>
                        <p
                          className="dp-wordmark"
                          style={{
                            fontSize: "1.1rem",
                            color: "var(--dp-gold)",
                          }}
                        >
                          {order.completionTime}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════
            §5  MATERIALS PALETTE
        ══════════════════════════════════════════════════════════ */}
        <section
          style={{ background: "var(--dp-charcoal)", padding: "4rem 0" }}
        >
          <div
            className="mx-auto"
            style={{ maxWidth: 1800, padding: "0 clamp(1.5rem,4vw,4rem)" }}
          >
            <div style={{ marginBottom: "2.5rem" }}>
              <p className="dp-label" style={{ marginBottom: ".5rem" }}>
                What we work with
              </p>
              <h2
                className="dp-h2 dp-serif"
                style={{
                  fontSize: "clamp(1.8rem,3.5vw,3rem)",
                  fontWeight: 600,
                }}
              >
                Materials &amp; Finishes
              </h2>
            </div>
            <div
              style={{
                display: "grid",
                gap: ".75rem",
                gridTemplateColumns: "repeat(2,1fr)",
              }}
              className="sm:grid-cols-3 lg:grid-cols-6"
            >
              {MATERIALS.map(({ name, note }) => (
                <div key={name} className="co-mat-chip">
                  <p
                    style={{
                      fontSize: ".82rem",
                      fontFamily: "DM Sans, sans-serif",
                      fontWeight: 500,
                      color: "var(--dp-cream)",
                    }}
                  >
                    {name}
                  </p>
                  <p
                    style={{
                      fontSize: ".68rem",
                      fontFamily: "DM Sans, sans-serif",
                      color: "var(--dp-muted)",
                    }}
                  >
                    {note}
                  </p>
                </div>
              ))}
            </div>
            <p
              style={{
                marginTop: "1.5rem",
                fontSize: ".72rem",
                fontFamily: "DM Sans, sans-serif",
                color: "var(--dp-muted)",
              }}
            >
              Don&apos;t see your preferred material? Mention it in your brief —
              we source widely.
            </p>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════
            §6  ORDER FORM
        ══════════════════════════════════════════════════════════ */}


        <hr className="dp-rule mx-6 md:mx-10 lg:mx-16" />

        {/* ══════════════════════════════════════════════════════════
            §7  FAQ
        ══════════════════════════════════════════════════════════ */}
        <section
          className="mx-auto"
          style={{ maxWidth: 1800, padding: "5rem clamp(1.5rem,4vw,4rem)" }}
        >
          <div className="grid gap-16 lg:grid-cols-2">
            <div>
              <p className="dp-label" style={{ marginBottom: ".5rem" }}>
                Questions
              </p>
              <h2
                className="dp-h2 dp-serif"
                style={{
                  fontSize: "clamp(1.8rem,3.5vw,3rem)",
                  fontWeight: 600,
                  marginBottom: "1rem",
                }}
              >
                Frequently Asked
              </h2>
              <p
                style={{
                  fontSize: ".78rem",
                  color: "var(--dp-muted)",
                  fontFamily: "DM Sans, sans-serif",
                  lineHeight: 1.6,
                  maxWidth: 400,
                }}
              >
                Still have questions? Reach us on WhatsApp — we&apos;re happy to
                chat through your brief.
              </p>
              <div style={{ marginTop: "1.5rem" }}>
                <a
                  href="https://wa.me/234XXXXXXXXXX"
                  className="dp-btn-ghost"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Chat on WhatsApp
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                    <path
                      d="M3 8h10M9 4l4 4-4 4"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </a>
              </div>
            </div>

            <div>
              <FaqAccordion faqs={FAQS} />
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════
            §8  FULL-WIDTH CTA BANNER (mirrors homepage §10)
        ══════════════════════════════════════════════════════════ */}
        <section
          style={{
            background: "var(--dp-ember)",
            padding: "5rem 1.5rem",
            textAlign: "center",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <span
            className="dp-wordmark"
            style={{
              position: "absolute",
              fontSize: "clamp(8rem,25vw,22rem)",
              color: "rgba(0,0,0,0.12)",
              lineHeight: 1,
              top: "50%",
              left: "50%",
              transform: "translate(-50%,-50%)",
              whiteSpace: "nowrap",
              pointerEvents: "none",
              userSelect: "none",
            }}
          >
            D&apos;FOOTPRINT
          </span>
          <div style={{ position: "relative", zIndex: 10 }}>
            <p
              className="dp-label"
              style={{ color: "rgba(242,232,213,0.55)", marginBottom: "1rem" }}
            >
              Still browsing?
            </p>
            <h2
              className="dp-serif"
              style={{
                fontSize: "clamp(1.8rem,4vw,3.5rem)",
                fontWeight: 600,
                color: "var(--dp-cream)",
                maxWidth: 580,
                margin: "0 auto 2rem",
                lineHeight: 1.25,
              }}
            >
              Explore our ready-made collection while you plan your custom pair.
            </h2>
            <Link
              href="/products"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: ".6rem",
                background: "var(--dp-cream)",
                color: "var(--dp-ember)",
                fontFamily: "DM Sans, sans-serif",
                fontWeight: 500,
                fontSize: ".72rem",
                letterSpacing: ".12em",
                textTransform: "uppercase",
                padding: "1rem 2.5rem",
                textDecoration: "none",
              }}
            >
              Shop the Collection
              <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                <path
                  d="M3 8h10M9 4l4 4-4 4"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
          </div>
        </section>
      </div>

      <Footer />
    </>
  );
}
