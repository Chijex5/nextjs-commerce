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

export type FAQItem = {
  id: string;
  question: string;
  answer: string;
  topic: string;
};

const QUESTIONS: FAQItem[] = [
  { id: "q1", question: "How long does it take to receive my order?", answer: "Most ready-made pairs ship within <strong>2–5 business days</strong>. Custom orders typically take 7–14 days depending on complexity.", topic: "Ordering & shipping" },
  { id: "q2", question: "Can I track my shipment?", answer: "Yes — after dispatch we send a <strong>tracking number</strong> via email and WhatsApp when available. Use the tracking link to see live updates.", topic: "Ordering & shipping" },
  { id: "q3", question: "Do you ship outside Nigeria?", answer: "Currently we ship nationwide across Nigeria. <strong>International shipping is coming soon</strong> — please contact us to discuss options.", topic: "Ordering & shipping" },
  { id: "q4", question: "What is your returns and refunds policy?", answer: "We accept returns within <strong>14 days</strong> for eligible items. Custom orders are non-returnable unless defective. Refunds are processed within 5–10 business days after inspection.", topic: "Returns & refunds" },
  { id: "q5", question: "Can I exchange sizes?", answer: "Yes — exchanges depend on stock availability. <strong>Contact support</strong> to start an exchange and we'll guide you through the steps.", topic: "Returns & refunds" },
  { id: "q6", question: "How do custom orders work?", answer: "Submit your brief via the custom orders page. We'll draft a design and confirm materials, sizing, and cost <strong>before production begins</strong>.", topic: "Products & customization" },
  { id: "q7", question: "How do I find the right size?", answer: "Visit our <strong>sizing guide</strong> for product-specific charts and a simple 3-step measuring flow. If still unsure, contact support with your measurements.", topic: "Products & customization" },
  { id: "q8", question: "Which payment methods do you accept?", answer: "We accept <strong>bank transfers, card payments</strong>, and mobile money where available. Coupons and discounts are applied at checkout.", topic: "Payment & pricing" },
  { id: "q9", question: "How do I use a coupon code?", answer: "Enter the coupon code at checkout in the <strong>Promo field</strong>. Some discounts exclude custom orders or sale items; check the coupon terms.", topic: "Payment & pricing" },
  { id: "q10", question: "Do I need an account to order?", answer: "No — you can checkout as a guest. Creating an account gives <strong>faster checkout, order history</strong>, and easier returns.", topic: "Account & orders" },
  { id: "q11", question: "What if my pair arrives damaged?", answer: "Contact support within <strong>48 hours</strong> with photos of the packaging and damage. We'll provide a repair, replacement, or refund as appropriate.", topic: "Troubleshooting" },
  { id: "q12", question: "What if the shoes don't fit well?", answer: "Reach out with your measurements and we can recommend an <strong>exchange, size adjustment</strong>, or custom solution.", topic: "Troubleshooting" },
  { id: "q13", question: "Do you offer a warranty?", answer: "Manufacturing defects reported within <strong>30 days</strong> are eligible for repair or replacement. Normal wear is not covered.", topic: "Products & customization" },
];

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-[#0A0704] text-[#F2E8D5]">
      <div className="mx-auto max-w-[860px] px-5 pb-20 pt-14 md:px-8 md:pt-16">

        {/* Hero */}
        <p className="mb-5 text-[11px] font-medium uppercase tracking-[.25em] text-[#6a5a48]">
          Help center
        </p>
        <h1 className="mb-4 font-[family-name:var(--font-cormorant-garamond)] text-[clamp(38px,7vw,68px)] font-semibold leading-[1.05]">
          Frequently <em className="font-normal italic text-[#C9B99A]">asked</em>
          <br />questions
        </h1>
        <p className="mb-10 max-w-[52ch] text-[15px] font-light leading-[1.75] text-[#C9B99A]">
          Everything about ordering, shipping, returns, sizing, and care. Can't
          find what you need? We're one message away.
        </p>

        {/* Interactive search + filter + accordion */}
        <FAQSearchClient initialQuestions={QUESTIONS} />

        {/* Bottom CTA */}
        <div className="mt-14 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-8">
          <p className="text-sm font-light text-[#C9B99A]">
            Still can't find what you're looking for?
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-5 py-2.5 text-sm text-[#F2E8D5] transition-colors hover:border-white/30 hover:bg-white/10"
          >
            Contact support
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </Link>
        </div>

        <div className="mt-12">
          <Footer />
        </div>
      </div>
    </div>
  );
}