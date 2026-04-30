"use client";

import { useState, useMemo } from "react";
import type { FAQItem } from "app/faq/page";

const ChevronIcon = () => (
  <svg
    className="h-5 w-5 flex-shrink-0 opacity-40 transition-transform duration-300 group-data-[open]:rotate-180 group-data-[open]:opacity-90"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
  >
    <path d="M6 9l6 6 6-6" />
  </svg>
);

const SearchIcon = () => (
  <svg
    className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 opacity-30"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.35-4.35" />
  </svg>
);

interface Props {
  initialQuestions: FAQItem[];
}

export default function FAQSearchClient({ initialQuestions }: Props) {
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [openId, setOpenId] = useState<string | null>(null);

  const topics = useMemo(
    () => ["All", ...Array.from(new Set(initialQuestions.map((f) => f.topic)))],
    [initialQuestions]
  );

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return initialQuestions.filter((f) => {
      const matchTopic = activeFilter === "All" || f.topic === activeFilter;
      const plainAnswer = f.answer.replace(/<[^>]+>/g, "");
      const matchSearch =
        !q ||
        f.question.toLowerCase().includes(q) ||
        plainAnswer.toLowerCase().includes(q);
      return matchTopic && matchSearch;
    });
  }, [initialQuestions, query, activeFilter]);

  function toggle(id: string) {
    setOpenId((prev) => (prev === id ? null : id));
  }

  function handleFilterChange(topic: string) {
    setActiveFilter(topic);
    setOpenId(null);
  }

  return (
    <div>
      {/* Search */}
      <div className="relative mb-9">
        <SearchIcon />
        <input
          type="search"
          placeholder="Search any question…"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpenId(null); }}
          className="h-[52px] w-full rounded-xl border border-white/10 bg-white/[0.04] pl-12 pr-4 font-light text-sm text-[#F2E8D5] placeholder:text-[#6a5a48] outline-none transition-colors focus:border-white/25 focus:bg-white/[0.06]"
        />
      </div>

      {/* Topic filters */}
      <div className="mb-8 flex flex-wrap gap-2">
        {topics.map((t) => (
          <button
            key={t}
            onClick={() => handleFilterChange(t)}
            className={`rounded-full border px-4 py-1.5 text-xs font-normal tracking-wide transition-all ${
              activeFilter === t
                ? "border-[#C8793A] bg-[#C8793A] text-white"
                : "border-white/15 text-[#C9B99A] hover:border-white/30 hover:text-[#F2E8D5]"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Count */}
      <p className="mb-5 h-5 text-xs tracking-wide text-[#6a5a48]">
        {filtered.length === initialQuestions.length
          ? `${initialQuestions.length} questions`
          : `${filtered.length} of ${initialQuestions.length} questions`}
      </p>

      {/* Accordion */}
      <div className="border-t border-white/10">
        {filtered.length === 0 ? (
          <p className="py-12 text-center text-sm font-light text-[#6a5a48]">
            No results — try a different search or filter.
          </p>
        ) : (
          filtered.map((f) => {
            const isOpen = openId === f.id;
            return (
              <div
                key={f.id}
                className="group border-b border-white/10"
                data-open={isOpen ? "" : undefined}
              >
                <button
                  onClick={() => toggle(f.id)}
                  className="flex w-full items-center justify-between gap-4 py-5 text-left text-[#C9B99A] transition-colors hover:text-[#F2E8D5]"
                  aria-expanded={isOpen}
                >
                  <span
                    className={`flex-1 text-[15px] font-normal leading-snug transition-colors ${
                      isOpen ? "text-[#F2E8D5]" : ""
                    }`}
                  >
                    {f.question}
                  </span>
                  <ChevronIcon />
                </button>

                <div
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    isOpen ? "max-h-64 opacity-100" : "max-h-0 opacity-0"
                  }`}
                >
                  <p
                    className="max-w-[68ch] pb-5 text-sm font-light leading-[1.8] text-[#C9B99A] [&_strong]:font-normal [&_strong]:text-[#F2E8D5]"
                    dangerouslySetInnerHTML={{ __html: f.answer }}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}