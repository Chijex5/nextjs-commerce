import ContactForm from "components/contact/contact-form";
import Footer from "components/layout/footer";
import { canonicalUrl, siteName } from "lib/seo";
import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { FaPhone, FaWhatsapp } from "react-icons/fa";
import { FaInstagram } from "react-icons/fa6";
import { MdEmail } from "react-icons/md";
import { RiSnapchatLine } from "react-icons/ri";
import { SiTiktok } from "react-icons/si";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Reach out to D'FOOTPRINT for custom orders, sizing help, or delivery questions. We'll respond within 1 business day.",
  alternates: {
    canonical: canonicalUrl("/contact"),
  },
  openGraph: {
    title: `Contact | ${siteName}`,
    description:
      "Reach out to D'FOOTPRINT for custom orders, sizing help, or delivery questions.",
    url: canonicalUrl("/contact"),
    type: "website",
    images: ["/opengraph-image"],
  },
  twitter: {
    card: "summary_large_image",
    title: `Contact | ${siteName}`,
    description:
      "Reach out to D'FOOTPRINT for custom orders, sizing help, or delivery questions.",
    images: ["/opengraph-image"],
  },
};

const sanitizePhone = (value: string) => value.replace(/[^+\d]/g, "");
const normalizeWhatsappNumber = (value: string) => value.replace(/[^\d]/g, "");

const getSocialHandle = (url: string) => {
  try {
    const { pathname, host } = new URL(url);
    const trimmed = pathname.replace(/\/+/g, "");
    if (!trimmed) return host;
    const withoutQuery = trimmed.split("?")[0];
    return withoutQuery?.startsWith("@") ? withoutQuery : `@${withoutQuery}`;
  } catch {
    return url;
  }
};

type ContactMethod = {
  label: string;
  description: string;
  value: string;
  href: string;
  icon: ReactNode;
  isExternal?: boolean;
};

export default function ContactPage() {
  const supportEmail =
    process.env.SUPPORT_EMAIL ||
    process.env.ADMIN_EMAIL ||
    process.env.SMTP_FROM_EMAIL ||
    "support@dfootprint.me";
  const supportPhone =
    process.env.NEXT_PUBLIC_SUPPORT_PHONE || process.env.SUPPORT_PHONE || "";
  const whatsappUrl = process.env.NEXT_PUBLIC_WHATSAPP_URL || "";
  const whatsappNumber =
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || supportPhone;
  const whatsappHref =
    whatsappUrl ||
    (whatsappNumber
      ? `https://wa.me/${normalizeWhatsappNumber(whatsappNumber)}`
      : "");
  const instagramUrl = process.env.NEXT_PUBLIC_INSTAGRAM_URL || "";
  const tiktokUrl = process.env.NEXT_PUBLIC_TIKTOK_URL || "";
  const snapchatUrl = process.env.NEXT_PUBLIC_SNAPCHAT_URL || "";

  const primaryMethods: ContactMethod[] = [
    {
      label: "Email",
      description: "Support, orders, and sizing help.",
      value: supportEmail,
      href: `mailto:${supportEmail}`,
      icon: <MdEmail className="h-5 w-5" />,
    },
    {
      label: "Phone",
      description: "Weekdays, 9am to 6pm WAT.",
      value: supportPhone,
      href: supportPhone ? `tel:${sanitizePhone(supportPhone)}` : "",
      icon: <FaPhone className="h-5 w-5" />,
    },
    {
      label: "WhatsApp",
      description: "Quick questions and order updates.",
      value: whatsappNumber || "Chat with us",
      href: whatsappHref,
      icon: <FaWhatsapp className="h-5 w-5" />,
    },
  ].filter((method) => method.value && method.href);

  const socialMethods: ContactMethod[] = [
    {
      label: "Instagram",
      description: "Behind the scenes and new drops.",
      value: instagramUrl ? getSocialHandle(instagramUrl) : "",
      href: instagramUrl,
      icon: <FaInstagram className="h-5 w-5" />,
      isExternal: true,
    },
    {
      label: "TikTok",
      description: "Process videos and styling tips.",
      value: tiktokUrl ? getSocialHandle(tiktokUrl) : "",
      href: tiktokUrl,
      icon: <SiTiktok className="h-5 w-5" />,
      isExternal: true,
    },
    {
      label: "Snapchat",
      description: "Quick updates from the studio.",
      value: snapchatUrl ? getSocialHandle(snapchatUrl) : "",
      href: snapchatUrl,
      icon: <RiSnapchatLine className="h-5 w-5" />,
      isExternal: true,
    },
  ].filter((method) => method.value && method.href);

  const totalChannels = primaryMethods.length + socialMethods.length;

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
          --dp-muted:   #8A7762;
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

        @keyframes dp-rise {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .dp-rise-1 { animation: dp-rise 0.9s cubic-bezier(0.16,1,0.3,1) 0.05s both; }
        .dp-rise-2 { animation: dp-rise 0.9s cubic-bezier(0.16,1,0.3,1) 0.18s both; }
        .dp-rise-3 { animation: dp-rise 0.9s cubic-bezier(0.16,1,0.3,1) 0.3s both; }
        .dp-rise-4 { animation: dp-rise 0.9s cubic-bezier(0.16,1,0.3,1) 0.42s both; }

        .dp-lift {
          transition: transform 0.45s cubic-bezier(0.16,1,0.3,1),
                      box-shadow 0.45s cubic-bezier(0.16,1,0.3,1);
        }
        .dp-lift:hover {
          transform: translateY(-4px);
          box-shadow: 0 16px 48px rgba(0,0,0,0.4);
        }

        .dp-rule { border: none; border-top: 1px solid var(--dp-border); margin: 0; }

        .dp-prose p {
          font-family: 'DM Sans', sans-serif;
          font-size: 0.88rem; line-height: 1.85;
          color: var(--dp-muted);
        }
        .dp-prose p + p { margin-top: 1.25rem; }
        .dp-prose strong { color: var(--dp-sand); font-weight: 500; }

        .dp-method-card {
          display: block;
          background: var(--dp-charcoal);
          border: 1px solid var(--dp-border);
          padding: 1rem;
          color: var(--dp-cream);
          text-decoration: none;
        }
        .dp-method-card:hover .dp-method-value {
          color: var(--dp-ember);
        }

        .dp-contact-link {
          display: inline-flex; align-items: center; gap: 0.4rem;
          font-family: 'DM Sans', sans-serif; font-size: 0.75rem; font-weight: 500;
          letter-spacing: 0.14em; text-transform: uppercase;
          color: var(--dp-cream); text-decoration: none;
          border-bottom: 1px solid var(--dp-ember); padding-bottom: 2px;
          transition: color 0.2s, border-color 0.2s;
        }
        .dp-contact-link:hover { color: var(--dp-ember); }
      `}</style>

      <div
        className="dp-sans"
        style={{
          background: "var(--dp-ink)",
          color: "var(--dp-cream)",
          minHeight: "100vh",
        }}
      >
        <section
          style={{
            position: "relative",
            overflow: "hidden",
            padding: "4rem clamp(1.5rem,4vw,4rem) 3.5rem",
            borderBottom: "1px solid var(--dp-border)",
          }}
        >
          <div
            style={{
              position: "absolute",
              width: 600,
              height: 600,
              borderRadius: "50%",
              background:
                "radial-gradient(circle, rgba(191,90,40,0.12) 0%, transparent 70%)",
              right: -100,
              top: -200,
              filter: "blur(70px)",
              pointerEvents: "none",
            }}
          />

          <div style={{ maxWidth: 1000, position: "relative", zIndex: 1 }}>
            <p
              className="dp-label dp-rise-1"
              style={{ marginBottom: "1.1rem" }}
            >
              Contact
            </p>

            <div style={{ position: "relative" }}>
              <span
                className="dp-wordmark"
                style={{
                  position: "absolute",
                  top: "-0.5rem",
                  left: "-0.1rem",
                  fontSize: "clamp(7rem, 20vw, 16rem)",
                  lineHeight: 1,
                  color: "rgba(242,232,213,0.04)",
                  pointerEvents: "none",
                  userSelect: "none",
                  zIndex: 0,
                }}
              >
                02
              </span>
              <h1
                className="dp-serif dp-rise-2"
                style={{
                  position: "relative",
                  zIndex: 1,
                  fontSize: "clamp(2rem, 5vw, 4rem)",
                  fontWeight: 600,
                  lineHeight: 1.15,
                  color: "var(--dp-cream)",
                  maxWidth: 780,
                }}
              >
                Let&apos;s craft your next pair together.
              </h1>
            </div>

            <p
              className="dp-rise-3"
              style={{
                fontFamily: "DM Sans, sans-serif",
                fontSize: "0.88rem",
                lineHeight: 1.75,
                color: "var(--dp-muted)",
                maxWidth: 620,
                marginTop: "1.25rem",
              }}
            >
              Reach out for custom orders, sizing guidance, product questions,
              and delivery planning. We reply quickly with clear next steps.
            </p>
          </div>
        </section>

        <section
          className="dp-rise-4"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            borderBottom: "1px solid var(--dp-border)",
          }}
        >
          {[
            {
              label: "Response",
              value: "1 Business Day",
              sub: "Average reply time",
            },
            {
              label: "Channels",
              value: `${totalChannels}`,
              sub: "Direct + social options",
            },
            {
              label: "Support",
              value: "Custom + Ready-made",
              sub: "Sizing and delivery help",
            },
          ].map(({ label, value, sub }, i) => (
            <div
              key={label}
              style={{
                padding: "1.75rem clamp(1.25rem,3vw,2.5rem)",
                borderRight: i < 2 ? "1px solid var(--dp-border)" : "none",
              }}
            >
              <p className="dp-label" style={{ marginBottom: "0.6rem" }}>
                {label}
              </p>
              <p
                className="dp-wordmark"
                style={{
                  fontSize: "clamp(1.4rem, 3vw, 2.2rem)",
                  color: "var(--dp-cream)",
                  lineHeight: 1,
                }}
              >
                {value}
              </p>
              <p
                style={{
                  fontFamily: "DM Sans, sans-serif",
                  fontSize: "0.68rem",
                  color: "var(--dp-muted)",
                  marginTop: "0.35rem",
                }}
              >
                {sub}
              </p>
            </div>
          ))}
        </section>

        <div
          style={{
            maxWidth: 1800,
            margin: "0 auto",
            padding: "4rem clamp(1.5rem,4vw,4rem)",
            display: "grid",
            gap: "3rem",
          }}
        >
          <section
            style={{
              display: "grid",
              gap: "2rem",
            }}
            className="lg:grid-cols-[1fr_1.2fr]"
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                gap: "1.5rem",
              }}
            >
              <div>
                <p className="dp-label" style={{ marginBottom: "0.75rem" }}>
                  How we help
                </p>
                <hr
                  className="dp-rule"
                  style={{ width: "2.5rem", borderColor: "var(--dp-ember)" }}
                />
              </div>
              <blockquote
                className="dp-serif"
                style={{
                  fontSize: "clamp(1.25rem, 2.5vw, 1.7rem)",
                  fontWeight: 300,
                  fontStyle: "italic",
                  color: "var(--dp-sand)",
                  lineHeight: 1.55,
                  borderLeft: "2px solid var(--dp-ember)",
                  paddingLeft: "1.25rem",
                }}
              >
                &ldquo;Tell us what you need. We&apos;ll help you place the
                right order without guesswork.&rdquo;
              </blockquote>
            </div>

            <div
              style={{
                background: "var(--dp-charcoal)",
                border: "1px solid var(--dp-border)",
                padding: "2rem clamp(1.25rem,3vw,2.25rem)",
              }}
            >
              <div className="dp-prose">
                <p>
                  Contact D&apos;FOOTPRINT for{" "}
                  <strong>custom design requests</strong>, sizing confirmation,
                  and delivery timeline support.
                </p>
                <p>
                  For faster replies, include key details such as size,
                  preferred style, color direction, and your target delivery
                  date.
                </p>
                <p>
                  You can also send reference photos through available channels.
                  We&apos;ll confirm what is possible and provide pricing
                  guidance.
                </p>
              </div>
            </div>
          </section>

          <hr className="dp-rule" />

          <section
            style={{ display: "grid", gap: "1.5rem" }}
            className="md:grid-cols-2"
          >
            <div
              className="dp-lift"
              style={{
                background: "var(--dp-charcoal)",
                border: "1px solid var(--dp-border)",
                padding: "1.75rem",
              }}
            >
              <p className="dp-label" style={{ marginBottom: "1rem" }}>
                Direct methods
              </p>
              <div style={{ display: "grid", gap: "0.85rem" }}>
                {primaryMethods.map((method) => (
                  <a
                    key={method.label}
                    href={method.href}
                    className="dp-method-card"
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.65rem",
                      }}
                    >
                      <span
                        style={{
                          display: "inline-flex",
                          width: "2rem",
                          height: "2rem",
                          borderRadius: "999px",
                          alignItems: "center",
                          justifyContent: "center",
                          background: "var(--dp-ink)",
                          color: "var(--dp-cream)",
                        }}
                      >
                        {method.icon}
                      </span>
                      <span
                        className="dp-label"
                        style={{ color: "var(--dp-sand)" }}
                      >
                        {method.label}
                      </span>
                    </div>
                    <p
                      className="dp-method-value"
                      style={{
                        marginTop: "0.65rem",
                        color: "var(--dp-cream)",
                        fontSize: "0.86rem",
                        transition: "color 0.2s",
                        lineHeight: 1.5,
                      }}
                    >
                      {method.value}
                    </p>
                    <p
                      style={{
                        marginTop: "0.25rem",
                        color: "var(--dp-muted)",
                        fontSize: "0.74rem",
                      }}
                    >
                      {method.description}
                    </p>
                  </a>
                ))}
              </div>

              {socialMethods.length > 0 ? (
                <>
                  <hr className="dp-rule" style={{ margin: "1.25rem 0" }} />
                  <p className="dp-label" style={{ marginBottom: "0.8rem" }}>
                    Social links
                  </p>
                  <div
                    style={{ display: "flex", flexWrap: "wrap", gap: "0.6rem" }}
                  >
                    {socialMethods.map((method) => (
                      <a
                        key={method.label}
                        href={method.href}
                        target={method.isExternal ? "_blank" : undefined}
                        rel={method.isExternal ? "noreferrer" : undefined}
                        className="dp-contact-link"
                      >
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                          }}
                        >
                          {method.icon}
                        </span>
                        {method.value}
                      </a>
                    ))}
                  </div>
                </>
              ) : null}
            </div>

            <div
              className="dp-lift"
              style={{
                background: "var(--dp-card)",
                border: "1px solid var(--dp-border)",
                padding: "1.75rem",
                display: "grid",
                gap: "1.25rem",
              }}
            >
              <p className="dp-label">Send a message</p>
              <ContactForm />
            </div>
          </section>

          <section
            style={{
              background: "var(--dp-ember)",
              padding: "2.5rem clamp(1.5rem,4vw,3rem)",
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "1.5rem",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <span
              className="dp-wordmark"
              style={{
                position: "absolute",
                right: "-1rem",
                top: "50%",
                transform: "translateY(-50%)",
                fontSize: "clamp(4rem,12vw,9rem)",
                lineHeight: 1,
                color: "rgba(0,0,0,0.1)",
                pointerEvents: "none",
                userSelect: "none",
                whiteSpace: "nowrap",
              }}
            >
              CONTACT
            </span>
            <div style={{ position: "relative", zIndex: 1 }}>
              <p
                className="dp-serif"
                style={{
                  fontSize: "clamp(1.2rem,2.5vw,1.75rem)",
                  fontWeight: 600,
                  color: "var(--dp-cream)",
                  lineHeight: 1.3,
                }}
              >
                Ready to start your order?
              </p>
              <p
                style={{
                  fontFamily: "DM Sans, sans-serif",
                  fontSize: "0.78rem",
                  color: "rgba(242,232,213,0.7)",
                  marginTop: "0.3rem",
                }}
              >
                Explore products or submit a custom request with your style
                brief.
              </p>
            </div>
            <div
              style={{
                display: "flex",
                gap: "0.75rem",
                flexWrap: "wrap",
                position: "relative",
                zIndex: 1,
              }}
            >
              <Link
                href="/products"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  background: "var(--dp-cream)",
                  color: "var(--dp-ink)",
                  fontFamily: "DM Sans, sans-serif",
                  fontWeight: 500,
                  fontSize: "0.68rem",
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  padding: "0.8rem 1.75rem",
                  textDecoration: "none",
                  transition: "opacity 0.2s",
                }}
              >
                Browse Products
                <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M3 8h10M9 4l4 4-4 4"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </Link>
              <Link
                href="/custom-orders"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  border: "1px solid rgba(242,232,213,0.4)",
                  color: "var(--dp-cream)",
                  fontFamily: "DM Sans, sans-serif",
                  fontWeight: 500,
                  fontSize: "0.68rem",
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  padding: "0.8rem 1.75rem",
                  textDecoration: "none",
                  transition: "border-color 0.2s",
                }}
              >
                Start Custom Order
              </Link>
            </div>
          </section>
        </div>
      </div>
      <Footer />
    </>
  );
}
