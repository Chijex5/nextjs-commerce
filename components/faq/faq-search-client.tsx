"use client";
import Link from "next/link";
import { useMemo, useState } from "react";

type FAQItem = {
  id: string;
  question: string;
  answer: string;
  topic?: string;
};

export default function FAQSearchClient({
  initialQuestions,
}: {
  initialQuestions: FAQItem[];
}) {
  const [query, setQuery] = useState("");

  const normalized = (s: string) => s.toLowerCase().trim();

  const filtered = useMemo(() => {
    const q = normalized(query);
    if (!q) return initialQuestions;
    return initialQuestions.filter((item) => {
      return (
        normalized(item.question).includes(q) ||
        normalized(item.answer).includes(q) ||
        (item.topic && normalized(item.topic).includes(q))
      );
    });
  }, [query, initialQuestions]);

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search FAQs — try 'shipping', 'returns', or 'custom'"
          aria-label="Search FAQs"
          style={{
            width: "100%",
            padding: "10px 12px",
            fontSize: 16,
            borderRadius: 6,
            border: "1px solid rgba(0,0,0,0.12)",
          }}
        />
      </div>

      <div style={{ display: "grid", gap: 12 }}>
        {filtered.map((item) => (
          <article
            key={item.id}
            style={{
              padding: 16,
              border: "1px solid rgba(0,0,0,0.08)",
              background: "rgba(255,255,255,0.01)",
            }}
          >
            <p style={{ fontWeight: 600, marginBottom: 8 }}>{item.question}</p>
            <p style={{ color: "#c9b99a", lineHeight: 1.6 }}>{item.answer}</p>
            {item.topic ? (
              <p style={{ marginTop: 8, fontSize: 12, color: "#6a5a48" }}>
                Topic: {item.topic}
              </p>
            ) : null}
          </article>
        ))}

        {filtered.length === 0 ? (
          <div style={{ padding: 18, textAlign: "center", color: "#c9b99a" }}>
            No results. Try different keywords or{" "}
            <Link href="/contact">contact support</Link>.
          </div>
        ) : null}
      </div>
    </div>
  );
}
