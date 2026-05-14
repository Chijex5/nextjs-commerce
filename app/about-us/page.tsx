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

export default function AboutUsPage() {
  return (
    <>
      <style>{`
        :root {
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

        .dp-wordmark { font-family: var(--font-bebas-neue), sans-serif; letter-spacing: 0.1em; }
        .dp-serif    { font-family: var(--font-cormorant-garamond), serif; }
        .dp-sans     { font-family: var(--font-dm-sans), sans-serif; }
        .dp-label {
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.6rem; font-weight: 500;
          letter-spacing: 0.26em; text-transform: uppercase;
          color: var(--dp-ember);
        }

        @keyframes dp-rise {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .dp-rise-1 { animation: dp-rise 0.9s cubic-bezier(0.16,1,0.3,1) 0.05s both; }
        .dp-rise-2 { animation: dp-rise 0.9s cubic-bezier(0.16,1,0.3,1) 0.18s both; }
        .dp-rise-3 { animation: dp-rise 0.9s cubic-bezier(0.16,1,0.3,1) 0.3s  both; }
        .dp-rise-4 { animation: dp-rise 0.9s cubic-bezier(0.16,1,0.3,1) 0.42s both; }
        .dp-rise-5 { animation: dp-rise 0.9s cubic-bezier(0.16,1,0.3,1) 0.54s both; }

        .dp-lift {
          transition: transform 0.45s cubic-bezier(0.16,1,0.3,1),
                      box-shadow 0.45s cubic-bezier(0.16,1,0.3,1);
        }
        .dp-lift:hover {
          transform: translateY(-4px);
          box-shadow: 0 16px 48px rgba(0,0,0,0.4);
        }

        .dp-contact-link {
          display: inline-flex; align-items: center; gap: 0.4rem;
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.68rem; font-weight: 500;
          letter-spacing: 0.14em; text-transform: uppercase;
          color: var(--dp-cream); text-decoration: none;
          border-bottom: 1px solid var(--dp-ember); padding-bottom: 2px;
          transition: color 0.2s, border-color 0.2s;
        }
        .dp-contact-link:hover { color: var(--dp-ember); }

        .dp-rule { border: none; border-top: 1px solid var(--dp-border); margin: 0; }

        /* ── Story prose ── */
        .dp-prose p {
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.88rem; line-height: 1.9;
          color: var(--dp-muted);
        }
        .dp-prose p + p { margin-top: 1.3rem; }
        .dp-prose strong { color: var(--dp-sand); font-weight: 500; }

        /* ── Section header with flanking rules ── */
        .dp-section-head {
          display: flex; align-items: center; gap: 1rem;
          margin-bottom: 2.5rem;
        }
        .dp-section-head .ember-dash {
          width: 2rem; height: 1px;
          background: var(--dp-ember); flex-shrink: 0;
        }
        .dp-section-head .full-rule {
          flex: 1; height: 1px; background: var(--dp-border);
        }

        /* ── Timeline ── */
        .dp-timeline-item {
          display: grid;
          grid-template-columns: 1.75rem 1fr;
          gap: 0 1.25rem;
          padding-bottom: 2.25rem;
          position: relative;
        }
        .dp-timeline-item:last-child { padding-bottom: 0; }
        .dp-timeline-dot {
          width: 8px; height: 8px; border-radius: 50%;
          background: var(--dp-ember);
          margin-top: 0.42rem; justify-self: center;
          position: relative; z-index: 1;
        }
        .dp-timeline-item:not(:last-child) .dp-timeline-dot::after {
          content: '';
          position: absolute;
          top: 10px; left: 50%; transform: translateX(-50%);
          width: 1px; height: calc(100% + 1.25rem);
          background: var(--dp-border);
        }
        .dp-timeline-label {
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.58rem; font-weight: 500;
          letter-spacing: 0.2em; text-transform: uppercase;
          color: var(--dp-ember); margin-bottom: 0.4rem;
        }
        .dp-timeline-body {
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.82rem; line-height: 1.8;
          color: var(--dp-muted);
        }
        .dp-timeline-body strong { color: var(--dp-sand); font-weight: 500; }

        /* ── Trust list ── */
        .dp-trust-item {
          display: flex; align-items: flex-start; gap: 0.85rem;
          padding: 1rem 0;
          border-bottom: 1px solid var(--dp-border);
        }
        .dp-trust-item:last-child { border-bottom: none; }

        /* ── What we make pill list ── */
        .dp-make-item {
          display: flex; align-items: center; gap: 0.6rem;
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.79rem; color: var(--dp-muted);
          padding: 0.6rem 0;
          border-bottom: 1px solid var(--dp-border);
        }
        .dp-make-item:last-child { border-bottom: none; }
      `}</style>

      <div
        className="dp-sans"
        style={{ background: "var(--dp-ink)", color: "var(--dp-cream)", minHeight: "100vh" }}
      >

        {/* ══════════════════════════════════════════════
            HERO
        ══════════════════════════════════════════════ */}
        <section
          style={{
            position: "relative", overflow: "hidden",
            padding: "4rem clamp(1.5rem,4vw,4rem) 3.5rem",
            borderBottom: "1px solid var(--dp-border)",
          }}
        >
          {/* Atmospheric glows */}
          <div style={{
            position: "absolute", width: 700, height: 700, borderRadius: "50%",
            background: "radial-gradient(circle,rgba(191,90,40,0.11) 0%,transparent 70%)",
            right: -120, top: -220, filter: "blur(80px)", pointerEvents: "none",
          }} />
          <div style={{
            position: "absolute", width: 400, height: 400, borderRadius: "50%",
            background: "radial-gradient(circle,rgba(192,137,42,0.07) 0%,transparent 70%)",
            left: -80, bottom: -100, filter: "blur(60px)", pointerEvents: "none",
          }} />

          <div style={{ maxWidth: 1000, position: "relative", zIndex: 1 }}>
            <p className="dp-label dp-rise-1" style={{ marginBottom: "1.1rem" }}>About Us</p>

            <div style={{ position: "relative" }}>
              <span
                className="dp-wordmark"
                style={{
                  position: "absolute", top: "-0.5rem", left: "-0.1rem",
                  fontSize: "clamp(7rem,20vw,15rem)", lineHeight: 1,
                  color: "rgba(242,232,213,0.035)",
                  pointerEvents: "none", userSelect: "none", zIndex: 0,
                }}
              >
                01
              </span>
              <h1
                className="dp-serif dp-rise-2"
                style={{
                  position: "relative", zIndex: 1,
                  fontSize: "clamp(2rem,5vw,3.75rem)",
                  fontWeight: 600, lineHeight: 1.15,
                  color: "var(--dp-cream)", maxWidth: 820,
                }}
              >
                Built in Lagos. Worn across Nigeria. Made by hand — every single time.
              </h1>
            </div>

            <p
              className="dp-rise-3"
              style={{
                fontFamily: "var(--font-dm-sans),sans-serif",
                fontSize: "0.88rem", lineHeight: 1.8,
                color: "var(--dp-muted)", maxWidth: 560, marginTop: "1.4rem",
              }}
            >
              D&apos;FOOTPRINT started with one person, one skill, and more demand than expected. Every pair of slippers, slides, and custom pieces still starts and ends with the same set of hands — crafted carefully, checked honestly, delivered anywhere in Nigeria.
            </p>
          </div>
        </section>

        {/* ══════════════════════════════════════════════
            STAT STRIP
        ══════════════════════════════════════════════ */}
        <section
          className="dp-rise-4"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3,1fr)",
            borderBottom: "1px solid var(--dp-border)",
          }}
        >
          {[
            { label: "Process",  value: "On Demand",  sub: "Every pair made to order" },
            { label: "Base",     value: "Lagos",      sub: "Nigeria" },
            { label: "Delivery", value: "Nationwide", sub: "All 36 states covered" },
          ].map(({ label, value, sub }, i) => (
            <div
              key={label}
              style={{
                padding: "1.75rem clamp(1.25rem,3vw,2.5rem)",
                borderRight: i < 2 ? "1px solid var(--dp-border)" : "none",
              }}
            >
              <p className="dp-label" style={{ marginBottom: "0.6rem" }}>{label}</p>
              <p
                className="dp-wordmark"
                style={{ fontSize: "clamp(1.4rem,3vw,2.2rem)", color: "var(--dp-cream)", lineHeight: 1 }}
              >
                {value}
              </p>
              <p style={{ fontFamily: "var(--font-dm-sans),sans-serif", fontSize: "0.68rem", color: "var(--dp-muted)", marginTop: "0.35rem" }}>
                {sub}
              </p>
            </div>
          ))}
        </section>

        {/* ══════════════════════════════════════════════
            MAIN BODY
        ══════════════════════════════════════════════ */}
        <div
          style={{
            maxWidth: 1200, margin: "0 auto",
            padding: "5rem clamp(1.5rem,4vw,4rem)",
            display: "grid", gap: "5rem",
          }}
        >

          {/* ── ORIGIN STORY ─────────────────────────── */}
          <section className="dp-rise-4">
            <div className="dp-section-head">
              <div className="ember-dash" />
              <p className="dp-label">The origin</p>
              <div className="full-rule" />
            </div>

            {/* Pull quote — full width, editorial */}
            <blockquote
              className="dp-serif"
              style={{
                fontSize: "clamp(1.4rem,2.8vw,2rem)",
                fontWeight: 300, fontStyle: "italic",
                color: "var(--dp-sand)", lineHeight: 1.55,
                borderLeft: "2px solid var(--dp-ember)",
                paddingLeft: "1.5rem",
                maxWidth: 780,
                marginBottom: "3rem",
              }}
            >
              &ldquo;It didn&apos;t start as a business. It started as something I just knew how to do well.&rdquo;
            </blockquote>

            {/* Story prose — full width, two columns on wide screens */}
            <div
              style={{
                background: "var(--dp-charcoal)",
                border: "1px solid var(--dp-border)",
                padding: "2.5rem clamp(1.5rem,4vw,3rem)",
              }}
            >
              <div
                className="dp-prose"
                style={{
                  columns: "2 480px",
                  columnGap: "3rem",
                }}
              >
                <p>
                  D&apos;FOOTPRINT started the way most real things do — not with a business
                  plan, but with a skill and a demand that kept growing. A few pairs made for
                  people close by. Then more requests. Then orders from people who&apos;d never
                  met the maker but trusted what they&apos;d seen.
                </p>
                <p>
                  The gap was obvious to anyone who&apos;d bought footwear in Lagos:{" "}
                  <strong>you could find plenty of options, but almost none you could trust.</strong>{" "}
                  Market slippers that look sharp in the stall and fall apart before the month
                  is out. Online sellers with no accountability and no follow-up. It was a
                  space that needed something built differently.
                </p>
                <p>
                  So that&apos;s what D&apos;FOOTPRINT became — a handmade footwear brand
                  where every pair is made to order, by one person, with genuine care for how
                  it holds up. Not mass-produced. Not passed through multiple hands with no
                  one responsible. <strong>One maker. One standard. Every time.</strong>
                </p>
                <p>
                  There&apos;s no physical store, and that&apos;s by design. Ordering directly
                  means honest production timelines, real updates at every stage, and someone
                  who actually picks up when something needs sorting. That&apos;s the version
                  of this business we set out to build — and it&apos;s the one we run today.
                </p>
              </div>
            </div>
          </section>

          <hr className="dp-rule" />

          {/* ── WHAT WE MAKE + HOW IT WORKS ─────────── */}
          <section className="dp-rise-5">
            <div className="dp-section-head">
              <div className="ember-dash" />
              <p className="dp-label">The craft &amp; process</p>
              <div className="full-rule" />
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(300px,1fr))",
                gap: "1.5rem",
                alignItems: "start",
              }}
            >
              {/* What we make */}
              <div
                className="dp-lift"
                style={{
                  background: "var(--dp-charcoal)",
                  border: "1px solid var(--dp-border)",
                  padding: "2rem",
                }}
              >
                <p className="dp-label" style={{ marginBottom: "1.25rem" }}>What we make</p>
                <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
                  {[
                    "Slippers",
                    "Slides",
                    "Custom handmade footwear",
                    "Personalised edits on existing designs",
                  ].map((item) => (
                    <li key={item} className="dp-make-item">
                      <span style={{ color: "var(--dp-ember)", fontSize: "0.7rem", flexShrink: 0 }}>◈</span>
                      {item}
                    </li>
                  ))}
                </ul>

                <div style={{ marginTop: "1.75rem", paddingTop: "1.75rem", borderTop: "1px solid var(--dp-border)" }}>
                  <p className="dp-label" style={{ marginBottom: "1rem" }}>Custom orders — what&apos;s possible</p>
                  <p style={{ fontFamily: "var(--font-dm-sans),sans-serif", fontSize: "0.8rem", color: "var(--dp-muted)", lineHeight: 1.8 }}>
                    Submit a design image to be recreated, or request approved edits on
                    existing styles — removing buckles, adding roses, changing colours.
                    Some edits carry an additional cost, which we confirm before you pay.
                    Not sure what&apos;s possible? Ask first. No pressure, no upsell.
                  </p>
                </div>
              </div>

              {/* How an order works — timeline */}
              <div
                className="dp-lift"
                style={{
                  background: "var(--dp-card)",
                  border: "1px solid var(--dp-border)",
                  padding: "2rem",
                }}
              >
                <p className="dp-label" style={{ marginBottom: "1.5rem" }}>How an order works</p>
                <div>
                  {[
                    {
                      step: "01 — You order",
                      body: "Choose from existing designs, submit a design to recreate, or request a custom edit. We confirm what's possible and give you an honest cost upfront.",
                    },
                    {
                      step: "02 — We make it",
                      body: "Your pair goes into production. Every pair is made to order — nothing pulled off a shelf. Materials selected, construction checked, finishing done right.",
                    },
                    {
                      step: "03 — Checked and packed",
                      body: "Before anything leaves, it goes through a proper quality check. If something's off, it gets fixed here — not after you've received it.",
                    },
                    {
                      step: "04 — Delivered to you",
                      body: "Nationwide delivery across Nigeria. Updates at every stage. A real person reachable if anything needs sorting after delivery.",
                    },
                  ].map(({ step, body }, i, arr) => (
                    <div key={step} className="dp-timeline-item">
                      <div className="dp-timeline-dot" />
                      <div>
                        <p className="dp-timeline-label">{step}</p>
                        <p className="dp-timeline-body">{body}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <hr className="dp-rule" />

          {/* ── TRUST + CONTACT ───────────────────────── */}
          <section>
            <div className="dp-section-head">
              <div className="ember-dash" />
              <p className="dp-label">Why customers trust us</p>
              <div className="full-rule" />
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(300px,1fr))",
                gap: "1.5rem",
                alignItems: "start",
              }}
            >
              {/* Trust points */}
              <div
                className="dp-lift"
                style={{
                  background: "var(--dp-charcoal)",
                  border: "1px solid var(--dp-border)",
                  padding: "2rem",
                }}
              >
                <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
                  {[
                    {
                      icon: "◈",
                      title: "Honest timelines",
                      body: "We tell you upfront how long your order will take. If something changes, you'll hear it from us first — not when you ask.",
                    },
                    {
                      icon: "⊛",
                      title: "Real support",
                      body: "Sizing question, fit concern, post-delivery issue — reach out and it actually gets handled. That's part of what you're paying for.",
                    },
                    {
                      icon: "✺",
                      title: "Consistency",
                      body: "One maker, one standard. What you see is what you get — and it holds up the same way for a first-time buyer as it does for a returning customer.",
                    },
                  ].map(({ icon, title, body }) => (
                    <li key={title} className="dp-trust-item">
                      <span style={{ fontSize: "0.9rem", color: "var(--dp-ember)", flexShrink: 0, lineHeight: 1.5 }}>
                        {icon}
                      </span>
                      <div>
                        <p style={{
                          fontFamily: "var(--font-dm-sans),sans-serif",
                          fontSize: "0.8rem", fontWeight: 500,
                          color: "var(--dp-sand)", marginBottom: "0.3rem",
                        }}>
                          {title}
                        </p>
                        <p style={{
                          fontFamily: "var(--font-dm-sans),sans-serif",
                          fontSize: "0.78rem", color: "var(--dp-muted)", lineHeight: 1.75,
                        }}>
                          {body}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Contact CTA */}
              <div
                className="dp-lift"
                style={{
                  background: "var(--dp-card)",
                  border: "1px solid var(--dp-border)",
                  padding: "2rem",
                  display: "flex", flexDirection: "column",
                  justifyContent: "space-between", gap: "2rem",
                }}
              >
                <div>
                  <p className="dp-label" style={{ marginBottom: "1rem" }}>Have questions before you order?</p>
                  <p style={{ fontFamily: "var(--font-dm-sans),sans-serif", fontSize: "0.82rem", color: "var(--dp-muted)", lineHeight: 1.8 }}>
                    Sizing guidance, custom request details, delivery timelines — whatever&apos;s
                    on your mind, reach out before you buy. We&apos;d rather answer your questions
                    upfront than sort complications after delivery.
                  </p>
                  <p style={{ fontFamily: "var(--font-dm-sans),sans-serif", fontSize: "0.82rem", color: "var(--dp-muted)", lineHeight: 1.8, marginTop: "1rem" }}>
                    There&apos;s one person handling every message — so you&apos;re always talking
                    to the same person who made, or will make, your pair.
                  </p>
                </div>

                <div style={{ position: "relative" }}>
                  <span
                    className="dp-wordmark"
                    style={{
                      position: "absolute", bottom: "3rem", right: 0,
                      fontSize: "3.5rem", lineHeight: 1,
                      color: "rgba(242,232,213,0.04)",
                      pointerEvents: "none", userSelect: "none", whiteSpace: "nowrap",
                    }}
                  >
                    D&apos;FOOTPRINT
                  </span>
                  <Link href="/contact" className="dp-contact-link">
                    Contact D&apos;FOOTPRINT
                    <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                      <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </Link>
                </div>
              </div>
            </div>
          </section>

          {/* ── BOTTOM CTA BANNER ─────────────────────── */}
          <section
            style={{
              background: "var(--dp-ember)",
              padding: "2.75rem clamp(1.5rem,4vw,3.5rem)",
              display: "flex", flexWrap: "wrap",
              alignItems: "center", justifyContent: "space-between",
              gap: "1.5rem",
              position: "relative", overflow: "hidden",
            }}
          >
            <span
              className="dp-wordmark"
              style={{
                position: "absolute", right: "-1rem", top: "50%",
                transform: "translateY(-50%)",
                fontSize: "clamp(4rem,12vw,9rem)", lineHeight: 1,
                color: "rgba(0,0,0,0.09)",
                pointerEvents: "none", userSelect: "none", whiteSpace: "nowrap",
              }}
            >
              SHOP NOW
            </span>
            <div style={{ position: "relative", zIndex: 1 }}>
              <p className="dp-serif" style={{ fontSize: "clamp(1.25rem,2.5vw,1.85rem)", fontWeight: 600, color: "var(--dp-cream)", lineHeight: 1.25 }}>
                Ready to find your pair?
              </p>
              <p style={{ fontFamily: "var(--font-dm-sans),sans-serif", fontSize: "0.78rem", color: "rgba(242,232,213,0.72)", marginTop: "0.35rem" }}>
                Browse handcrafted slippers and slides — or tell us exactly what you want made.
              </p>
            </div>
            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", position: "relative", zIndex: 1 }}>
              <Link
                href="/products"
                style={{
                  display: "inline-flex", alignItems: "center", gap: "0.4rem",
                  background: "var(--dp-cream)", color: "var(--dp-ink)",
                  fontFamily: "var(--font-dm-sans),sans-serif", fontWeight: 500,
                  fontSize: "0.68rem", letterSpacing: "0.14em", textTransform: "uppercase",
                  padding: "0.85rem 1.85rem", textDecoration: "none",
                  transition: "opacity 0.2s",
                }}
              >
                Shop Collection
                <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                  <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
              <Link
                href="/custom-orders"
                style={{
                  display: "inline-flex", alignItems: "center",
                  border: "1px solid rgba(242,232,213,0.4)", color: "var(--dp-cream)",
                  fontFamily: "var(--font-dm-sans),sans-serif", fontWeight: 500,
                  fontSize: "0.68rem", letterSpacing: "0.14em", textTransform: "uppercase",
                  padding: "0.85rem 1.85rem", textDecoration: "none",
                  transition: "border-color 0.2s",
                }}
              >
                Custom Orders
              </Link>
            </div>
          </section>

        </div>
      </div>

      <Footer />
    </>
  );
}