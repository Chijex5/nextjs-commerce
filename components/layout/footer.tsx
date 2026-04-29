import FooterMenu from "components/layout/footer-menu";
import LogoSquare from "components/logo-square";
import NewsletterForm from "components/newsletter-form";
import { getMenu } from "lib/database";
import Link from "next/link";
import { Suspense } from "react";
import { FaInstagram, FaSnapchat, FaTiktok, FaWhatsapp } from "react-icons/fa";

const { COMPANY_NAME, SITE_NAME } = process.env;

const SOCIAL_LINKS = [
  {
    label: "Instagram",
    href: "https://instagram.com/d__footprint",
    icon: <FaInstagram />,
  },
  {
    label: "WhatsApp",
    href: "https://wa.me/2348121993874",
    icon: <FaWhatsapp />,
  },
  {
    label: "TikTok",
    href: "https://tiktok.com/@d_footprint",
    icon: <FaTiktok />,
  },
  {
    label: "Snapchat",
    href: "https://snapchat.com/t/To9LQPVS",
    icon: <FaSnapchat />,
  },
];

export default async function Footer() {
  const currentYear = new Date().getFullYear();
  const copyrightDate = 2023 + (currentYear > 2023 ? `-${currentYear}` : "");
  const menu = await getMenu("footer-menu");
  const copyrightName = COMPANY_NAME || SITE_NAME || "";

  return (
    <>
      <style>{`

        :root {
          --dp-ink:     #0A0704;
          --dp-void:    #06040200;
          --dp-charcoal:#191209;
          --dp-cream:   #F2E8D5;
          --dp-sand:    #C9B99A;
          --dp-muted:   #6A5A48;
          --dp-ember:   #BF5A28;
          --dp-gold:    #C0892A;
          --dp-border:  rgba(242,232,213,0.09);
        }

        .dp-footer-wordmark { font-family: var(--font-bebas-neue), sans-serif; letter-spacing: 0.1em; }
        .dp-footer-serif    { font-family: var(--font-cormorant-garamond), serif; }
        .dp-footer-sans     { font-family: var(--font-dm-sans), sans-serif; }

        .dp-footer-link {
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.78rem;
          color: var(--dp-muted);
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.2rem 0;
          position: relative;
          transition: color 0.2s;
        }
        .dp-footer-link::after {
          content: '';
          position: absolute;
          bottom: 0; left: 0;
          width: 0; height: 1px;
          background: var(--dp-ember);
          transition: width 0.3s cubic-bezier(0.16,1,0.3,1);
        }
        .dp-footer-link:hover { color: var(--dp-cream); }
        .dp-footer-link:hover::after { width: 100%; }

        .dp-footer-social {
          display: flex; align-items: center; justify-content: center;
          width: 2.1rem; height: 2.1rem;
          border: 1px solid var(--dp-border);
          color: var(--dp-muted);
          text-decoration: none;
          transition: border-color 0.2s, color 0.2s, background 0.2s;
        }
        .dp-footer-social:hover {
          border-color: var(--dp-ember);
          color: var(--dp-ember);
          background: rgba(191,90,40,0.06);
        }

        .dp-footer-label {
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.6rem;
          font-weight: 500;
          letter-spacing: 0.26em;
          text-transform: uppercase;
          color: var(--dp-ember);
          margin-bottom: 1.1rem;
          display: block;
        }

        /* Newsletter input override */
        .dp-newsletter-wrap input,
        .dp-newsletter-wrap [type="email"] {
          background: rgba(242,232,213,0.04) !important;
          border: none !important;
          border-bottom: 1px solid var(--dp-border) !important;
          border-radius: 0 !important;
          color: var(--dp-cream) !important;
          font-family: var(--font-dm-sans), sans-serif !important;
          font-size: 0.8rem !important;
          padding: 0.6rem 0 !important;
          outline: none !important;
          width: 100% !important;
          transition: border-color 0.2s !important;
        }
        .dp-newsletter-wrap input::placeholder { color: var(--dp-muted) !important; }
        .dp-newsletter-wrap input:focus { border-bottom-color: var(--dp-ember) !important; }
        .dp-newsletter-wrap button,
        .dp-newsletter-wrap [type="submit"] {
          background: var(--dp-ember) !important;
          color: var(--dp-cream) !important;
          border: none !important;
          border-radius: 0 !important;
          font-family: var(--font-dm-sans), sans-serif !important;
          font-size: 0.68rem !important;
          font-weight: 500 !important;
          letter-spacing: 0.14em !important;
          text-transform: uppercase !important;
          padding: 0.65rem 1.4rem !important;
          cursor: pointer !important;
          transition: opacity 0.2s !important;
          white-space: nowrap !important;
          flex-shrink: 0 !important;
        }
        .dp-newsletter-wrap button:hover { opacity: 0.85 !important; }
      `}</style>

      <footer
        className="dp-footer-sans"
        style={{
          background: "var(--dp-charcoal)",
          color: "var(--dp-muted)",
          borderTop: "1px solid var(--dp-border)",
        }}
      >
        {/* ── TOP ACCENT LINE ─────────────────────────────────── */}
        <div
          style={{
            height: 2,
            background:
              "linear-gradient(90deg, var(--dp-ember) 0%, var(--dp-gold) 50%, transparent 100%)",
          }}
        />

        {/* ── MAIN FOOTER GRID ────────────────────────────────── */}
        <div
          className="mx-auto w-full"
          style={{
            maxWidth: 1800,
            display: "grid",
            gridTemplateColumns: "repeat(1, 1fr)",
            gap: "3rem",
            padding: "4rem clamp(1.5rem, 4vw, 4rem) 3rem",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(1, 1fr)",
              gap: "3rem",
            }}
            className="md:grid-cols-[1.4fr_0.9fr_0.9fr_1.3fr]"
          >
            {/* ── COL 1: Brand ──────────────────────────────────── */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "1.25rem",
              }}
            >
              <Link
                href="/"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.6rem",
                  textDecoration: "none",
                }}
              >
                <LogoSquare size="sm" />
                <span
                  className="dp-footer-wordmark"
                  style={{ fontSize: "1.1rem", color: "var(--dp-cream)" }}
                >
                  {SITE_NAME}
                </span>
              </Link>

              <p
                className="dp-footer-serif"
                style={{
                  fontSize: "1.05rem",
                  fontWeight: 300,
                  fontStyle: "italic",
                  color: "var(--dp-sand)",
                  lineHeight: 1.6,
                  maxWidth: 280,
                }}
              >
                Handcrafted footwear made with care in Lagos, Nigeria.
              </p>

              <p
                style={{
                  fontSize: "0.74rem",
                  color: "var(--dp-muted)",
                  lineHeight: 1.65,
                  maxWidth: 300,
                }}
              >
                Built for daily comfort and timeless style. Every pair shaped by
                hand, designed to last.
              </p>

              {/* Socials */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  paddingTop: "0.25rem",
                }}
              >
                {SOCIAL_LINKS.map(({ label, href, icon }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="dp-footer-social"
                    aria-label={label}
                  >
                    {icon}
                  </a>
                ))}
              </div>
            </div>

            {/* ── COL 2: Quick links ────────────────────────────── */}
            <div>
              <span className="dp-footer-label">Navigate</span>
              <Suspense
                fallback={
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.6rem",
                    }}
                  >
                    {[80, 60, 90, 70].map((w) => (
                      <div
                        key={w}
                        style={{
                          height: "0.75rem",
                          width: `${w}%`,
                          borderRadius: 2,
                          background: "rgba(242,232,213,0.07)",
                          animation: "pulse 1.5s ease-in-out infinite",
                        }}
                      />
                    ))}
                  </div>
                }
              >
                <FooterMenu menu={menu} />
              </Suspense>
            </div>

            {/* ── COL 3: Info ───────────────────────────────────── */}
            <div>
              <span className="dp-footer-label">Info</span>
              <ul
                style={{
                  listStyle: "none",
                  margin: 0,
                  padding: 0,
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.65rem",
                }}
              >
                {[
                  { title: "About Us", path: "/about-us" },
                  { title: "Sizing Guide", path: "/sizing-guide" },
                  { title: "Care Instructions", path: "/care-instructions" },
                  { title: "FAQ", path: "/faq" },
                  { title: "Privacy Policy", path: "/privacy" },
                  { title: "Shipping Returns", path: "/shipping-returns" },
                ].map(({ title, path }) => (
                  <li key={title}>
                    <Link href={path} className="dp-footer-link">
                      {title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* ── COL 4: Newsletter ─────────────────────────────── */}
            <div>
              <span className="dp-footer-label">Stay in the loop</span>
              <p
                style={{
                  fontSize: "0.78rem",
                  color: "var(--dp-muted)",
                  lineHeight: 1.65,
                  marginBottom: "1.25rem",
                }}
              >
                New drops, restocks, and exclusive offers — straight to your
                inbox.
              </p>
              <div className="dp-newsletter-wrap">
                <NewsletterForm />
              </div>

              {/* Contact nudge */}
              <div
                style={{
                  marginTop: "1.75rem",
                  paddingTop: "1.25rem",
                  borderTop: "1px solid var(--dp-border)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.35rem",
                }}
              >
                <span
                  className="dp-footer-label"
                  style={{ marginBottom: "0.4rem" }}
                >
                  Get in touch
                </span>
                <a
                  href="mailto:hello@dfootprint.me"
                  className="dp-footer-link"
                  style={{ fontSize: "0.74rem" }}
                >
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                  hello@dfootprint.me
                </a>
                <a
                  href="https://wa.me/2348121993874"
                  className="dp-footer-link"
                  style={{ fontSize: "0.74rem" }}
                >
                  <FaWhatsapp style={{ marginRight: "0.3rem" }} />
                  WhatsApp us
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* ── BOTTOM BAR ──────────────────────────────────────── */}
        <div style={{ borderTop: "1px solid var(--dp-border)" }}>
          <div
            className="mx-auto w-full"
            style={{
              maxWidth: 1800,
              padding: "1.1rem clamp(1.5rem, 4vw, 4rem)",
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "0.75rem",
            }}
          >
            <p
              style={{
                fontSize: "0.65rem",
                color: "var(--dp-muted)",
                letterSpacing: "0.06em",
              }}
            >
              &copy; {copyrightDate}{" "}
              <span style={{ color: "var(--dp-sand)" }}>
                {copyrightName}
                {copyrightName.length && !copyrightName.endsWith(".")
                  ? "."
                  : ""}
              </span>{" "}
              All rights reserved.
            </p>

            {/* Centre: tiny wordmark */}
            <span
              className="dp-footer-wordmark"
              style={{
                fontSize: "0.75rem",
                color: "var(--dp-muted)",
                letterSpacing: "0.2em",
                opacity: 0.5,
              }}
            >
              D&apos;FOOTPRINT
            </span>

            <p
              style={{
                fontSize: "0.65rem",
                color: "var(--dp-muted)",
                letterSpacing: "0.06em",
              }}
            >
              Quality handmade footwear for every occasion.
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}
