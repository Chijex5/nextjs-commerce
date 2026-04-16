import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import CustomOrderRequestSection from "components/custom-orders/custom-order-request-section";
import { canonicalUrl, siteName } from "lib/seo";

export const metadata: Metadata = {
  title: "Start a Custom Order",
  description:
    "Submit your custom footwear request, upload references, and receive a quote before payment.",
  alternates: {
    canonical: canonicalUrl("/custom-orders/request"),
  },
  openGraph: {
    title: `Start a Custom Order | ${siteName}`,
    description:
      "Submit your custom footwear request and receive a quote before payment.",
    url: canonicalUrl("/custom-orders/request"),
    type: "website",
    images: ["/opengraph-image"],
  },
  twitter: {
    card: "summary_large_image",
    title: `Start a Custom Order | ${siteName}`,
    description:
      "Submit your custom footwear request and receive a quote before payment.",
    images: ["/opengraph-image"],
  },
};

export default function CustomOrderRequestPage() {
  const customOrderFeatureEnabled =
    process.env.CUSTOM_ORDER_REQUESTS_ENABLED === "true";

  return (
    <>
      <style>{`
        .cor-nav-link {
          display: inline-flex; align-items: center; gap: .4rem;
          font-family: 'DM Sans', sans-serif;
          font-size: .65rem; font-weight: 500;
          letter-spacing: .14em; text-transform: uppercase;
          color: var(--dp-muted);
          border: 1px solid var(--dp-border);
          padding: .55rem 1.1rem;
          text-decoration: none;
          transition: border-color .22s, color .22s;
        }
        .cor-nav-link:hover { border-color: rgba(191,90,40,.4); color: var(--dp-sand); }
      `}</style>

      <div style={{ margin: "0 auto", padding: "3.5rem clamp(1.5rem,4vw,4rem) 5rem" }}>

        {/* ── Page header card ── */}
        <div
          style={{
            background: "var(--dp-card)",
            border: "1px solid var(--dp-border)",
            padding: "2rem",
            marginBottom: "1.5rem",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Ghost watermark */}
          <span
            className="dp-wordmark"
            aria-hidden
            style={{
              position: "absolute",
              bottom: "-.75rem",
              right: "1rem",
              fontSize: "6rem",
              color: "rgba(242,232,213,0.04)",
              lineHeight: 1,
              userSelect: "none",
              pointerEvents: "none",
            }}
          >
            BESPOKE
          </span>

          <div style={{ position: "relative", zIndex: 1 }}>
            <p className="dp-label" style={{ marginBottom: ".75rem" }}>D&apos;FOOTPRINT</p>

            <h1
              className="dp-wordmark"
              style={{
                fontSize: "clamp(2.4rem,7vw,5rem)",
                lineHeight: .9,
                letterSpacing: "-.01em",
                marginBottom: "1rem",
              }}
            >
              <span style={{ color: "var(--dp-cream)" }}>CREATE A</span>{" "}
              <span style={{ WebkitTextStroke: "1.5px rgba(242,232,213,0.22)", color: "transparent" }}>CUSTOM PAIR</span>
            </h1>

            <p
              style={{
                fontFamily: "DM Sans, sans-serif",
                fontSize: ".78rem",
                color: "var(--dp-muted)",
                lineHeight: 1.7,
                maxWidth: 560,
                marginBottom: "1.75rem",
              }}
            >
              Share your design brief and references — we review and send a quote before any payment is taken.
            </p>

            <div style={{ display: "flex", flexWrap: "wrap", gap: ".5rem" }}>
              <Link href="/custom-orders" className="cor-nav-link">
                ← Custom gallery
              </Link>
              <Link href="/orders" className="cor-nav-link">
                Track request or order →
              </Link>
            </div>
          </div>
        </div>

        {/* ── Form section or states ── */}
        {customOrderFeatureEnabled ? (
          <Suspense
            fallback={
              <div
                style={{
                  background: "var(--dp-card)",
                  border: "1px solid var(--dp-border)",
                  padding: "2rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "1rem",
                }}
              >
                <span
                  style={{
                    width: "1rem", height: "1rem", borderRadius: "50%",
                    border: "2px solid var(--dp-border)",
                    borderTopColor: "var(--dp-ember)",
                    animation: "dp-spin .8s linear infinite",
                    flexShrink: 0,
                    display: "inline-block",
                  }}
                />
                <style>{`@keyframes dp-spin { to { transform: rotate(360deg); } }`}</style>
                <p style={{ fontFamily: "DM Sans, sans-serif", fontSize: ".75rem", color: "var(--dp-muted)", letterSpacing: ".08em" }}>
                  Loading request form…
                </p>
              </div>
            }
          >
            <CustomOrderRequestSection />
          </Suspense>
        ) : (
          <div
            style={{
              background: "var(--dp-card)",
              border: "1px solid rgba(191,90,40,.2)",
              padding: "2rem",
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
            }}
          >
            <span style={{ color: "var(--dp-ember)", fontSize: "1.2rem" }}>⊛</span>
            <p
              className="dp-serif"
              style={{ fontSize: "1.2rem", fontWeight: 600, color: "var(--dp-cream)" }}
            >
              Custom requests are currently unavailable
            </p>
            <p style={{ fontFamily: "DM Sans, sans-serif", fontSize: ".75rem", color: "var(--dp-muted)", lineHeight: 1.65, maxWidth: 480 }}>
              We&apos;re temporarily pausing new requests. Please reach out directly via WhatsApp or email and we&apos;ll help you personally.
            </p>
            <Link
              href="/socials"
              style={{
                display: "inline-flex", alignItems: "center", gap: ".5rem",
                background: "var(--dp-ember)", color: "var(--dp-cream)",
                fontFamily: "DM Sans, sans-serif", fontWeight: 500,
                fontSize: ".68rem", letterSpacing: ".12em", textTransform: "uppercase",
                padding: ".75rem 1.5rem", textDecoration: "none",
                transition: "opacity .22s", alignSelf: "flex-start",
              }}
            >
              Contact us
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>
          </div>
        )}
      </div>
    </>
  );
}