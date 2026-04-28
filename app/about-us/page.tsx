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
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Cormorant+Garamond:ital,wght@0,300;0,600;1,300;1,600&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500&display=swap');

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

        .dp-wordmark { font-family: 'Bebas Neue', sans-serif; letter-spacing: 0.1em; }
        .dp-serif    { font-family: 'Cormorant Garamond', serif; }
        .dp-sans     { font-family: 'DM Sans', sans-serif; }
        .dp-label    {
          font-family: 'DM Sans', sans-serif;
          font-size: 0.75rem; font-weight: 500;
          letter-spacing: 0.26em; text-transform: uppercase;
          color: var(--dp-ember);
        }

        /* Rise animation */
        @keyframes dp-rise {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .dp-rise-1 { animation: dp-rise 0.9s cubic-bezier(0.16,1,0.3,1) 0.05s both; }
        .dp-rise-2 { animation: dp-rise 0.9s cubic-bezier(0.16,1,0.3,1) 0.18s both; }
        .dp-rise-3 { animation: dp-rise 0.9s cubic-bezier(0.16,1,0.3,1) 0.3s both; }
        .dp-rise-4 { animation: dp-rise 0.9s cubic-bezier(0.16,1,0.3,1) 0.42s both; }

        /* Card lift */
        .dp-lift {
          transition: transform 0.45s cubic-bezier(0.16,1,0.3,1),
                      box-shadow 0.45s cubic-bezier(0.16,1,0.3,1);
        }
        .dp-lift:hover {
          transform: translateY(-4px);
          box-shadow: 0 16px 48px rgba(0,0,0,0.4);
        }

        /* Contact link */
        .dp-contact-link {
          display: inline-flex; align-items: center; gap: 0.4rem;
          font-family: 'DM Sans', sans-serif; font-size: 0.75rem; font-weight: 500;
          letter-spacing: 0.14em; text-transform: uppercase;
          color: var(--dp-cream); text-decoration: none;
          border-bottom: 1px solid var(--dp-ember); padding-bottom: 2px;
          transition: color 0.2s, border-color 0.2s;
        }
        .dp-contact-link:hover { color: var(--dp-ember); }

        /* Divider line */
        .dp-rule { border: none; border-top: 1px solid var(--dp-border); margin: 0; }

        /* Prose paragraph */
        .dp-prose p {
          font-family: 'DM Sans', sans-serif;
          font-size: 0.88rem; line-height: 1.85;
          color: var(--dp-muted);
        }
        .dp-prose p + p { margin-top: 1.25rem; }
        .dp-prose strong { color: var(--dp-sand); font-weight: 500; }

        /* Trust list item */
        .dp-trust-item {
          display: flex; align-items: flex-start; gap: 0.75rem;
          padding: 0.875rem 0;
          border-bottom: 1px solid var(--dp-border);
        }
        .dp-trust-item:last-child { border-bottom: none; }
      `}</style>

      <div
        className="dp-sans"
        style={{ background: "var(--dp-ink)", color: "var(--dp-cream)", minHeight: "100vh" }}
      >
        {/* ── HERO HEADER ───────────────────────────────────────── */}
        <section
          style={{
            position: "relative", overflow: "hidden",
            padding: "4rem clamp(1.5rem,4vw,4rem) 3.5rem",
            borderBottom: "1px solid var(--dp-border)",
          }}
        >
          {/* Atmospheric glow */}
          <div
            style={{
              position: "absolute", width: 600, height: 600, borderRadius: "50%",
              background: "radial-gradient(circle, rgba(191,90,40,0.12) 0%, transparent 70%)",
              right: -100, top: -200, filter: "blur(70px)", pointerEvents: "none",
            }}
          />

          <div style={{ maxWidth: 1000, position: "relative", zIndex: 1 }}>
            <p className="dp-label dp-rise-1" style={{ marginBottom: "1.1rem" }}>
              About Us
            </p>

            {/* Giant chapter number */}
            <div style={{ position: "relative" }}>
              <span
                className="dp-wordmark"
                style={{
                  position: "absolute", top: "-0.5rem", left: "-0.1rem",
                  fontSize: "clamp(7rem, 20vw, 16rem)", lineHeight: 1,
                  color: "rgba(242,232,213,0.04)",
                  pointerEvents: "none", userSelect: "none",
                  zIndex: 0,
                }}
              >
                01
              </span>
              <h1
                className="dp-serif dp-rise-2"
                style={{
                  position: "relative", zIndex: 1,
                  fontSize: "clamp(2rem, 5vw, 4rem)",
                  fontWeight: 600, lineHeight: 1.15,
                  color: "var(--dp-cream)",
                  maxWidth: 780,
                }}
              >
                Handmade footwear built with care, clarity, and consistency.
              </h1>
            </div>

            <p
              className="dp-rise-3"
              style={{
                fontFamily: "DM Sans, sans-serif", fontSize: "0.88rem",
                lineHeight: 1.75, color: "var(--dp-muted)",
                maxWidth: 580, marginTop: "1.25rem",
              }}
            >
              D&apos;FOOTPRINT is a Lagos-based handmade footwear brand focused
              on comfort, clean finishing, and reliable delivery across Nigeria.
            </p>
          </div>
        </section>

        {/* ── STAT STRIP ────────────────────────────────────────── */}
        <section
          className="dp-rise-4"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            borderBottom: "1px solid var(--dp-border)",
          }}
        >
          {[
            { label: "Process", value: "On Demand", sub: "Every pair made to order" },
            { label: "Base", value: "Lagos", sub: "Nigeria" },
            { label: "Delivery", value: "Nationwide", sub: "All states covered" },
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
                style={{ fontSize: "clamp(1.4rem, 3vw, 2.2rem)", color: "var(--dp-cream)", lineHeight: 1 }}
              >
                {value}
              </p>
              <p
                style={{
                  fontFamily: "DM Sans, sans-serif", fontSize: "0.68rem",
                  color: "var(--dp-muted)", marginTop: "0.35rem",
                }}
              >
                {sub}
              </p>
            </div>
          ))}
        </section>

        {/* ── MAIN CONTENT ──────────────────────────────────────── */}
        <div
          style={{
            maxWidth: 1800, margin: "0 auto",
            padding: "4rem clamp(1.5rem,4vw,4rem)",
            display: "grid",
            gap: "3rem",
          }}
        >
          {/* Story */}
          <section
            style={{
              display: "grid",
              gap: "2rem",
            }}
            className="lg:grid-cols-[1fr_1.2fr]"
          >
            {/* Left: section label + pull quote */}
            <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: "1.5rem" }}>
              <div>
                <p className="dp-label" style={{ marginBottom: "0.75rem" }}>Our story</p>
                <hr className="dp-rule" style={{ width: "2.5rem", borderColor: "var(--dp-ember)" }} />
              </div>
              <blockquote
                className="dp-serif"
                style={{
                  fontSize: "clamp(1.25rem, 2.5vw, 1.7rem)",
                  fontWeight: 300, fontStyle: "italic",
                  color: "var(--dp-sand)", lineHeight: 1.55,
                  borderLeft: "2px solid var(--dp-ember)",
                  paddingLeft: "1.25rem",
                }}
              >
                &ldquo;Quality handmade footwear that looks good, fits well, and actually lasts.&rdquo;
              </blockquote>
            </div>

            {/* Right: prose */}
            <div
              style={{
                background: "var(--dp-charcoal)",
                border: "1px solid var(--dp-border)",
                padding: "2rem clamp(1.25rem,3vw,2.25rem)",
              }}
            >
              <div className="dp-prose">
                <p>
                  We started D&apos;FOOTPRINT to solve a simple problem: getting
                  quality handmade slippers and slides that{" "}
                  <strong>look good, fit well, and last.</strong>
                </p>
                <p>
                  Every order is handled with practical quality checks — from
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
            </div>
          </section>

          <hr className="dp-rule" />

          {/* Trust + Contact grid */}
          <section
            style={{ display: "grid", gap: "1.5rem" }}
            className="md:grid-cols-2"
          >
            {/* Why customers trust us */}
            <div
              className="dp-lift"
              style={{
                background: "var(--dp-charcoal)",
                border: "1px solid var(--dp-border)",
                padding: "1.75rem",
              }}
            >
              <p className="dp-label" style={{ marginBottom: "1rem" }}>Why customers trust us</p>
              <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
                {[
                  {
                    icon: "◈",
                    text: "Transparent updates on order and delivery progress.",
                  },
                  {
                    icon: "⊛",
                    text: "Case-by-case support for issues and fit concerns.",
                  },
                  {
                    icon: "✺",
                    text: "Product catalog plus custom order flexibility.",
                  },
                ].map(({ icon, text }) => (
                  <li key={text} className="dp-trust-item">
                    <span
                      style={{
                        fontSize: "0.9rem", color: "var(--dp-ember)",
                        flexShrink: 0, lineHeight: 1.5,
                      }}
                    >
                      {icon}
                    </span>
                    <span
                      style={{
                        fontFamily: "DM Sans, sans-serif",
                        fontSize: "0.8rem", color: "var(--dp-muted)", lineHeight: 1.65,
                      }}
                    >
                      {text}
                    </span>
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
                padding: "1.75rem",
                display: "flex", flexDirection: "column", justifyContent: "space-between", gap: "1.5rem",
              }}
            >
              <div>
                <p className="dp-label" style={{ marginBottom: "1rem" }}>Need help before ordering?</p>
                <p
                  style={{
                    fontFamily: "DM Sans, sans-serif", fontSize: "0.82rem",
                    color: "var(--dp-muted)", lineHeight: 1.75,
                  }}
                >
                  If you need sizing guidance, custom requests, or delivery
                  clarification, reach out directly and we&apos;ll help you
                  place the right order.
                </p>
              </div>

              {/* Decorative ghost wordmark */}
              <div style={{ position: "relative" }}>
                <span
                  className="dp-wordmark"
                  style={{
                    position: "absolute", bottom: "3.5rem", right: 0,
                    fontSize: "4rem", lineHeight: 1,
                    color: "rgba(242,232,213,0.04)",
                    pointerEvents: "none", userSelect: "none",
                    whiteSpace: "nowrap",
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
          </section>

          {/* Bottom CTA banner */}
          <section
            style={{
              background: "var(--dp-ember)",
              padding: "2.5rem clamp(1.5rem,4vw,3rem)",
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
                color: "rgba(0,0,0,0.1)", pointerEvents: "none", userSelect: "none",
                whiteSpace: "nowrap",
              }}
            >
              SHOP NOW
            </span>
            <div style={{ position: "relative", zIndex: 1 }}>
              <p className="dp-serif" style={{ fontSize: "clamp(1.2rem,2.5vw,1.75rem)", fontWeight: 600, color: "var(--dp-cream)", lineHeight: 1.3 }}>
                Ready to find your pair?
              </p>
              <p style={{ fontFamily: "DM Sans, sans-serif", fontSize: "0.78rem", color: "rgba(242,232,213,0.7)", marginTop: "0.3rem" }}>
                Browse our full collection of handcrafted slippers and slides.
              </p>
            </div>
            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", position: "relative", zIndex: 1 }}>
              <Link
                href="/products"
                style={{
                  display: "inline-flex", alignItems: "center", gap: "0.4rem",
                  background: "var(--dp-cream)", color: "var(--dp-ink)",
                  fontFamily: "DM Sans, sans-serif", fontWeight: 500,
                  fontSize: "0.68rem", letterSpacing: "0.14em", textTransform: "uppercase",
                  padding: "0.8rem 1.75rem", textDecoration: "none",
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
                  fontFamily: "DM Sans, sans-serif", fontWeight: 500,
                  fontSize: "0.68rem", letterSpacing: "0.14em", textTransform: "uppercase",
                  padding: "0.8rem 1.75rem", textDecoration: "none",
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