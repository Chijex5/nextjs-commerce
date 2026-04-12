"use client";

import { useState } from "react";

type Faq = {
  q: string;
  a: string;
};

export default function FaqAccordion({ faqs }: { faqs: Faq[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div>
      {faqs.map((faq, i) => {
        const isOpen = openIndex === i;

        return (
          <div key={faq.q} className="faq-item">
            <button
              className="faq-btn"
              onClick={() => setOpenIndex(isOpen ? null : i)}
              aria-expanded={isOpen}
            >
              <span
                style={{
                  fontSize: ".82rem",
                  fontFamily: "DM Sans, sans-serif",
                  color: "var(--dp-cream)",
                  fontWeight: 500,
                  paddingRight: "1rem",
                }}
              >
                {faq.q}
              </span>
              <span
                className="faq-icon"
                style={{
                  flexShrink: 0,
                  color: "var(--dp-ember)",
                  fontSize: "1.3rem",
                  lineHeight: 1,
                  transition: "transform .3s",
                  transform: isOpen ? "rotate(45deg)" : "rotate(0deg)",
                }}
              >
                +
              </span>
            </button>
            <div className={`faq-body${isOpen ? " open" : ""}`}>
              <p
                style={{
                  fontSize: ".78rem",
                  color: "var(--dp-muted)",
                  fontFamily: "DM Sans, sans-serif",
                  lineHeight: 1.65,
                }}
              >
                {faq.a}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
