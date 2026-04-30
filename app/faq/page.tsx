import FAQSearchClient from "components/faq/faq-search-client";
import Footer from "components/layout/footer";
import { canonicalUrl, siteName } from "lib/seo";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: `FAQ · ${siteName}`,
  description: `Common questions about ordering, shipping, returns, sizing, and care.`,
  alternates: { canonical: canonicalUrl("/faq") },
};

type FAQItem = {
  id: string;
  question: string;
  answer: string;
  topic?: string;
};

const QUESTIONS: FAQItem[] = [
  {
    id: "q-order-leadtime",
    question: "How long does it take to receive my order?",
    answer:
      "Most ready-made pairs ship within 2–5 business days. Custom orders typically take 7–14 days depending on complexity.",
    topic: "Ordering & shipping",
  },
  {
    id: "q-track-order",
    question: "Can I track my shipment?",
    answer:
      "Yes — after dispatch we send a tracking number via email and WhatsApp when available. Use the tracking link to see live updates.",
    topic: "Ordering & shipping",
  },
  {
    id: "q-international",
    question: "Do you ship outside Nigeria?",
    answer:
      "Currently we ship nationwide across Nigeria. International shipping is coming soon — please contact us to discuss options.",
    topic: "Shipping to Nigeria vs. international",
  },
  {
    id: "q-returns-window",
    question: "What is your returns and refunds policy?",
    answer:
      "We accept returns within 14 days for eligible items. Custom orders are non-returnable unless defective. Refunds are processed within 5–10 business days after inspection.",
    topic: "Returns & refunds",
  },
  {
    id: "q-exchange",
    question: "Can I exchange sizes?",
    answer:
      "Yes — exchanges depend on stock availability. Contact support to start an exchange and we'll guide you through the steps.",
    topic: "Returns & refunds",
  },
  {
    id: "q-custom-orders",
    question: "How do custom orders work?",
    answer:
      "Submit your brief via the custom orders page. We'll draft a design and confirm materials, sizing, and cost before production begins.",
    topic: "Products & customization",
  },
  {
    id: "q-sizing",
    question: "How do I find the right size?",
    answer:
      "Visit our sizing guide for product-specific charts and a simple 3-step measuring flow. If still unsure, contact support with your measurements.",
    topic: "Products & customization",
  },
  {
    id: "q-payment-methods",
    question: "Which payment methods do you accept?",
    answer:
      "We accept bank transfers, card payments, and mobile money where available. Coupons and discounts are applied at checkout.",
    topic: "Payment & pricing",
  },
  {
    id: "q-coupons",
    question: "How do I use a coupon code?",
    answer:
      "Enter the coupon code at checkout in the Promo field. Some discounts exclude custom orders or sale items; check the coupon terms.",
    topic: "Payment & pricing",
  },
  {
    id: "q-account",
    question: "Do I need an account to order?",
    answer:
      "No — you can checkout as a guest. Creating an account gives faster checkout, order history, and easier returns.",
    topic: "Account & orders",
  },
  {
    id: "q-damaged",
    question: "What should I do if my pair arrives damaged?",
    answer:
      "Contact support within 48 hours with photos of the packaging and damage. We'll assess and provide a repair, replacement, or refund as appropriate.",
    topic: "Common troubleshooting (damage, fit issues)",
  },
  {
    id: "q-fit-issue",
    question: "What if the shoes don't fit well?",
    answer:
      "If fit is unexpected, reach out with your measurements and we can recommend an exchange, size adjustment, or custom solution.",
    topic: "Common troubleshooting (damage, fit issues)",
  },
  {
    id: "q-warranty",
    question: "Do you offer a warranty?",
    answer:
      "We stand by our craft; manufacturing defects reported within 30 days are eligible for repair or replacement. Normal wear is not covered.",
    topic: "Products & customization",
  },
];

export default function FAQPage() {
  return (
    <>
      <style>{`
        :root { --faq-ink: #0A0704; --faq-cream:#F2E8D5; --faq-sand:#C9B99A; }
        .faq-root { min-height:100vh; background:var(--faq-ink); color:var(--faq-cream); font-family:var(--font-dm-sans),sans-serif; }
        .faq-wrap { max-width:1100px; margin:0 auto; padding:32px 20px 64px; }
        .faq-title { font-family:var(--font-cormorant-garamond),serif; font-size:clamp(36px,6vw,62px); margin:8px 0 12px; }
        .faq-lead { color:var(--faq-sand); max-width:60ch; margin-bottom:18px; }
      `}</style>

      <div className="faq-root">
        <div className="faq-wrap">
          <p
            style={{
              letterSpacing: ".22em",
              textTransform: "uppercase",
              color: "#6a5a48",
              fontSize: 12,
            }}
          >
            Help
          </p>
          <h1 className="faq-title">Frequently asked questions</h1>
          <p className="faq-lead">
            Search or browse common questions about ordering, shipping, returns,
            sizing, care, and account management.
          </p>

          <FAQSearchClient initialQuestions={QUESTIONS} />

          <section style={{ marginTop: 28 }}>
            <p style={{ color: "#c9b99a" }}>
              Can't find an answer? <Link href="/contact">Contact support</Link>{" "}
              and we'll help.
            </p>
          </section>

          <div style={{ marginTop: 40 }}>
            <Footer />
          </div>
        </div>
      </div>
    </>
  );
}
