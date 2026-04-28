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
  { name: "Instagram", href: "https://instagram.com/d_foot.print", handle: "@dfootprint", note: "New drops, styling clips & behind the scenes" },
  { name: "TikTok", href: "https://tiktok.com/@d_footprint", handle: "@dfootprint", note: "Short-form videos, process reels & trends" },
  { name: "Twitter / X", href: "https://x.com/chikaahey", handle: "@dfootprint", note: "Updates, announcements & conversations" },
  { name: "Snapchat", href: "https://snapchat.com/t/To9LQPVS", handle: "@dfootprint", note: "Exclusive stories and daily behind the craft" },
  { name: "WhatsApp", href: "https://wa.me/2348121993874", handle: "Chat with us", note: "Sizing, custom requests and order updates" },
];

export default function SocialsPage() {
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

        .dp-wordmark { font-family:'Bebas Neue',sans-serif; }
        .dp-serif    { font-family:'Cormorant Garamond',serif; }
        .dp-sans     { font-family:'DM Sans',sans-serif; }
        .dp-label    { font-family:'DM Sans',sans-serif;font-size:.62rem;font-weight:500;letter-spacing:.26em;text-transform:uppercase;color:var(--dp-ember); }

        @keyframes dp-rise {
          from { opacity:0; transform:translateY(22px); }
          to   { opacity:1; transform:translateY(0); }
        }
        .dp-rise-1 { animation:dp-rise 1s cubic-bezier(.16,1,.3,1) .05s both; }
        .dp-rise-2 { animation:dp-rise 1s cubic-bezier(.16,1,.3,1) .2s both; }
        .dp-rise-3 { animation:dp-rise 1s cubic-bezier(.16,1,.3,1) .35s both; }

        .dp-grain::after {
          content:'';position:absolute;inset:0;pointer-events:none;z-index:0;
          background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.035'/%3E%3C/svg%3E");
        }

        .social-card {
          display: block;
          background: var(--dp-card);
          border: 1px solid var(--dp-border);
          padding: 1.5rem;
          text-decoration: none;
          position: relative;
          overflow: hidden;
          transition: border-color .3s, transform .55s cubic-bezier(.16,1,.3,1), box-shadow .55s cubic-bezier(.16,1,.3,1);
        }
        .social-card::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(191,90,40,0.07) 0%, transparent 60%);
          opacity: 0;
          transition: opacity .3s;
        }
        .social-card:hover {
          border-color: rgba(191,90,40,.35);
          transform: translateY(-4px);
          box-shadow: 0 18px 50px rgba(0,0,0,.4);
        }
        .social-card:hover::before { opacity: 1; }
        .social-card:hover .social-arrow { transform: translateX(4px); color: var(--dp-ember); }

        .social-arrow {
          transition: transform .3s cubic-bezier(.16,1,.3,1), color .3s;
          color: var(--dp-muted);
        }

        .whatsapp-card {
          background: var(--dp-charcoal);
          border: 1px solid rgba(191,90,40,.2);
        }
        .whatsapp-card:hover {
          border-color: rgba(191,90,40,.55);
        }
      `}</style>

      <div
        className="dp-sans dp-grain"
        style={{
          minHeight: "100vh",
          background: "var(--dp-ink)",
          color: "var(--dp-cream)",
          position: "relative",
        }}
      >
        {/* Atmospheric glow */}
        <div
          aria-hidden
          style={{
            position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
            background: "radial-gradient(ellipse 50% 45% at 80% 15%, rgba(191,90,40,0.11) 0%, transparent 70%), radial-gradient(ellipse 35% 35% at 10% 85%, rgba(192,137,42,0.07) 0%, transparent 70%)",
          }}
        />

        <div
          className="relative"
          style={{ maxWidth: 1800, margin: "0 auto", padding: "3.5rem clamp(1.5rem,4vw,4rem) 0", zIndex: 10 }}
        >

          {/* ── Hero ── */}
          <div className="dp-rise-1" style={{ marginBottom: "4rem" }}>
            <p className="dp-label" style={{ marginBottom: "1.25rem" }}>Connect with us</p>

            <div
              className="dp-wordmark"
              style={{
                fontSize: "clamp(4rem,12vw,10rem)",
                lineHeight: .88,
                letterSpacing: "-.01em",
                marginBottom: "2rem",
                display: "flex",
                flexWrap: "wrap",
                gap: "0 .4em",
              }}
            >
              <span style={{ color: "var(--dp-cream)" }}>FIND</span>
              <span style={{ WebkitTextStroke: "1.5px rgba(242,232,213,0.22)", color: "transparent" }}>US</span>
            </div>

            <div
              style={{
                display: "grid",
                gap: "2rem",
                gridTemplateColumns: "1fr",
                borderTop: "1px solid var(--dp-border)",
                paddingTop: "2rem",
              }}
              className="lg:grid-cols-2 lg:items-end"
            >
              <p
                className="dp-serif"
                style={{
                  fontSize: "clamp(1.1rem,2.2vw,1.6rem)",
                  fontWeight: 300,
                  fontStyle: "italic",
                  color: "var(--dp-sand)",
                  lineHeight: 1.5,
                  maxWidth: 520,
                }}
              >
                Stay close to new designs, styling clips, and delivery updates across every channel.
              </p>
              <div
                style={{
                  display: "flex",
                  gap: "2.5rem",
                  justifyContent: "flex-start",
                }}
                className="lg:justify-end"
              >
                {[["5", "Platforms"], ["Daily", "New content"], ["Fast", "Response time"]].map(([num, label]) => (
                  <div key={label}>
                    <p className="dp-wordmark" style={{ fontSize: "2.2rem", color: "var(--dp-gold)", lineHeight: 1 }}>{num}</p>
                    <p style={{ fontSize: ".65rem", color: "var(--dp-muted)", marginTop: ".3rem", fontFamily: "DM Sans, sans-serif", letterSpacing: ".08em" }}>{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Social cards grid ── */}
          <div className="dp-rise-2">
            <div
              style={{
                display: "grid",
                gap: ".75rem",
                gridTemplateColumns: "repeat(2, 1fr)",
              }}
              className="lg:grid-cols-4"
            >
              {/* First 4 platforms in the main grid */}
              {socialLinks.slice(0, 4).map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="social-card"
                >
                  <div style={{ position: "relative", zIndex: 1 }}>
                    <p
                      className="dp-label"
                      style={{ marginBottom: ".75rem" }}
                    >
                      {item.handle}
                    </p>
                    <h2
                      className="dp-serif"
                      style={{
                        fontSize: "1.5rem",
                        fontWeight: 600,
                        color: "var(--dp-cream)",
                        marginBottom: ".5rem",
                        lineHeight: 1.1,
                      }}
                    >
                      {item.name}
                    </h2>
                    <p
                      style={{
                        fontSize: ".72rem",
                        color: "var(--dp-muted)",
                        fontFamily: "DM Sans, sans-serif",
                        lineHeight: 1.55,
                        marginBottom: "1.5rem",
                      }}
                    >
                      {item.note}
                    </p>
                    <div style={{ display: "flex", alignItems: "center", gap: ".4rem" }}>
                      <span
                        style={{
                          fontSize: ".6rem",
                          fontFamily: "DM Sans, sans-serif",
                          fontWeight: 500,
                          letterSpacing: ".14em",
                          textTransform: "uppercase",
                          color: "var(--dp-sand)",
                          borderBottom: "1px solid rgba(191,90,40,.4)",
                          paddingBottom: 2,
                        }}
                      >
                        Open channel
                      </span>
                      <svg className="social-arrow" width="12" height="12" viewBox="0 0 16 16" fill="none">
                        <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  </div>

                  {/* Ghost platform name */}
                  <span
                    className="dp-wordmark"
                    aria-hidden
                    style={{
                      position: "absolute",
                      bottom: "-.5rem",
                      right: ".75rem",
                      fontSize: "4rem",
                      color: "rgba(242,232,213,0.04)",
                      lineHeight: 1,
                      userSelect: "none",
                      pointerEvents: "none",
                    }}
                  >
                    {item.name.split(" ")[0]!.toUpperCase()}
                  </span>
                </Link>
              ))}
            </div>

            {/* WhatsApp — full-width feature card */}
            {socialLinks[4] && (
              <Link
                href={socialLinks[4].href}
                target="_blank"
                rel="noreferrer noopener"
                className="social-card whatsapp-card"
                style={{ marginTop: ".75rem", display: "block" }}
              >
                <div
                  style={{
                    position: "relative",
                    zIndex: 1,
                    display: "grid",
                    gridTemplateColumns: "1fr auto",
                    alignItems: "center",
                    gap: "2rem",
                  }}
                >
                  <div>
                    <p className="dp-label" style={{ color: "var(--dp-gold)", marginBottom: ".6rem" }}>Direct support</p>
                    <h2
                      className="dp-serif"
                      style={{
                        fontSize: "clamp(1.4rem,3vw,2.2rem)",
                        fontWeight: 600,
                        color: "var(--dp-cream)",
                        marginBottom: ".4rem",
                      }}
                    >
                      WhatsApp — {socialLinks[4].handle}
                    </h2>
                    <p
                      style={{
                        fontSize: ".75rem",
                        color: "var(--dp-muted)",
                        fontFamily: "DM Sans, sans-serif",
                        lineHeight: 1.6,
                        maxWidth: 560,
                      }}
                    >
                      {socialLinks[4].note}. The fastest way to reach us — we typically respond within minutes.
                    </p>
                  </div>
                  <div
                    style={{
                      flexShrink: 0,
                      display: "flex",
                      alignItems: "center",
                      gap: ".5rem",
                      border: "1px solid rgba(191,90,40,.35)",
                      padding: ".75rem 1.5rem",
                      whiteSpace: "nowrap",
                    }}
                  >
                    <span
                      style={{
                        fontSize: ".65rem",
                        fontFamily: "DM Sans, sans-serif",
                        fontWeight: 500,
                        letterSpacing: ".14em",
                        textTransform: "uppercase",
                        color: "var(--dp-cream)",
                      }}
                    >
                      Start a chat
                    </span>
                    <svg className="social-arrow" width="13" height="13" viewBox="0 0 16 16" fill="none">
                      <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>

                <span
                  className="dp-wordmark"
                  aria-hidden
                  style={{
                    position: "absolute",
                    bottom: "-.8rem",
                    right: "1.5rem",
                    fontSize: "6rem",
                    color: "rgba(242,232,213,0.03)",
                    lineHeight: 1,
                    userSelect: "none",
                    pointerEvents: "none",
                  }}
                >
                  WHATSAPP
                </span>
              </Link>
            )}
          </div>

          {/* ── Ember CTA strip ── */}
          <div
            className="dp-rise-3"
            style={{
              margin: "4rem 0 0",
              borderTop: "1px solid var(--dp-border)",
              paddingTop: "2.5rem",
              paddingBottom: "5rem",
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "1.5rem",
            }}
          >
            <div>
              <p className="dp-label" style={{ marginBottom: ".4rem" }}>Not just online</p>
              <p
                className="dp-serif"
                style={{
                  fontSize: "clamp(1.1rem,2.5vw,1.8rem)",
                  fontWeight: 600,
                  color: "var(--dp-cream)",
                  maxWidth: 500,
                  lineHeight: 1.3,
                }}
              >
                Ready to order? Browse the full collection or start a custom request.
              </p>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: ".75rem" }}>
              <Link
                href="/products"
                style={{
                  display: "inline-flex", alignItems: "center", gap: ".5rem",
                  background: "var(--dp-cream)", color: "var(--dp-ink)",
                  fontFamily: "DM Sans, sans-serif", fontWeight: 500,
                  fontSize: ".72rem", letterSpacing: ".12em", textTransform: "uppercase",
                  padding: ".9rem 2rem", textDecoration: "none",
                  transition: "background .22s, color .22s",
                }}
              >
                Shop Collection
                <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </Link>
              <Link
                href="/custom-orders"
                style={{
                  display: "inline-flex", alignItems: "center", gap: ".5rem",
                  border: "1px solid rgba(242,232,213,.28)", color: "var(--dp-cream)",
                  fontFamily: "DM Sans, sans-serif", fontWeight: 500,
                  fontSize: ".72rem", letterSpacing: ".12em", textTransform: "uppercase",
                  padding: ".9rem 2rem", textDecoration: "none",
                  transition: "border-color .22s, background .22s",
                }}
              >
                Custom Orders
              </Link>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
}