import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { SiTiktok } from "react-icons/si";
import { RiSnapchatLine } from "react-icons/ri";
import { FaInstagram } from "react-icons/fa6";
import { FaWhatsapp } from "react-icons/fa";
import { MdEmail } from "react-icons/md";
import { FaPhone } from "react-icons/fa";
import ContactForm from "components/contact/contact-form";
import Footer from "components/layout/footer";
import { canonicalUrl, siteName } from "lib/seo";

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

  return (
    <>
      <section className="relative overflow-hidden border-b border-neutral-200 bg-gradient-to-br from-amber-50 via-white to-stone-100 dark:border-neutral-800 dark:from-stone-950 dark:via-neutral-900 dark:to-neutral-950">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-24 top-10 h-64 w-64 rounded-full bg-amber-200/40 blur-3xl dark:bg-amber-500/10" />
          <div className="absolute right-16 top-1/3 h-72 w-72 rounded-full bg-rose-200/40 blur-3xl dark:bg-rose-500/10" />
          <div className="absolute bottom-12 left-1/3 h-64 w-64 rounded-full bg-emerald-200/30 blur-3xl dark:bg-emerald-500/10" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-neutral-500">
                Contact
              </p>
              <h1 className="mt-4 text-4xl font-bold tracking-tight text-neutral-900 dark:text-white sm:text-5xl">
                Let&apos;s craft your next pair together.
              </h1>
              <p className="mt-4 text-lg text-neutral-600 dark:text-neutral-400">
                Tell us about your custom order idea, sizing questions, or
                delivery timeline. We respond within 1 business day.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <span className="rounded-full border border-neutral-200 bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-neutral-700 shadow-sm backdrop-blur dark:border-neutral-800 dark:bg-neutral-900/70 dark:text-neutral-200">
                  Custom orders welcome
                </span>
                <span className="rounded-full border border-neutral-200 bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-neutral-700 shadow-sm backdrop-blur dark:border-neutral-800 dark:bg-neutral-900/70 dark:text-neutral-200">
                  Response time: 1 business day
                </span>
              </div>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                {primaryMethods.map((method) => (
                  <a
                    key={method.label}
                    href={method.href}
                    className="group rounded-2xl border border-neutral-200 bg-white/80 p-4 text-neutral-900 shadow-sm transition hover:-translate-y-0.5 hover:border-neutral-300 hover:shadow-md dark:border-neutral-800 dark:bg-neutral-950/70 dark:text-white dark:hover:border-neutral-700"
                  >
                    <div className="flex items-center gap-3 text-sm font-semibold">
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-900 text-white transition group-hover:scale-105 dark:bg-white dark:text-black">
                        {method.icon}
                      </span>
                      {method.label}
                    </div>
                    <p className="mt-3 text-sm font-medium text-neutral-900 dark:text-white">
                      {method.value}
                    </p>
                    <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                      {method.description}
                    </p>
                  </a>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <ContactForm />

              <div className="rounded-3xl border border-neutral-200 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/70">
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
                  Custom order essentials
                </h3>
                <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
                  Share references, preferred colors, sizes, and your desired
                  delivery date. We&apos;ll confirm availability and pricing.
                </p>
                <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                  <Link
                    href="/custom-orders"
                    className="inline-flex items-center justify-center rounded-full bg-neutral-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200"
                  >
                    View custom orders
                  </Link>
                  <Link
                    href="/products"
                    className="inline-flex items-center justify-center rounded-full border border-neutral-300 px-5 py-2.5 text-sm font-semibold text-neutral-900 transition hover:border-neutral-400 dark:border-neutral-700 dark:text-white dark:hover:border-neutral-600"
                  >
                    Browse ready-made
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {socialMethods.length > 0 ? (
            <div className="mt-14 rounded-3xl border border-neutral-200 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/70">
              <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-neutral-500">
                    Follow along
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-neutral-900 dark:text-white">
                    Behind the studio doors
                  </h2>
                  <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
                    New drops, process clips, and custom stories.
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  {socialMethods.map((method) => (
                    <a
                      key={method.label}
                      href={method.href}
                      target={method.isExternal ? "_blank" : undefined}
                      rel={method.isExternal ? "noreferrer" : undefined}
                      className="flex items-center gap-3 rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm font-semibold text-neutral-900 transition hover:border-neutral-300 dark:border-neutral-800 dark:bg-neutral-900 dark:text-white dark:hover:border-neutral-700"
                    >
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-900 text-white dark:bg-white dark:text-black">
                        {method.icon}
                      </span>
                      <span>{method.value}</span>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </section>
      <Footer />
    </>
  );
}
