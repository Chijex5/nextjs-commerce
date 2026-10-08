"use client";

import clsx from "clsx";
import type { Menu } from "lib/shopify/types";
import { ArrowRight, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const SUGGESTIONS = ["Slides", "Slippers", "Men", "Women", "Leather", "Black"];

/** Full-screen search: big type input, quick suggestions, Esc to close. */
export function SearchOverlay({
  open,
  onClose,
  quickLinks,
}: {
  open: boolean;
  onClose: () => void;
  quickLinks: Menu[];
}) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [q, setQ] = useState("");

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const t = window.setTimeout(() => input.current?.focus(), 80);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.clearTimeout(t);
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  const go = (term: string) => {
    const value = term.trim();
    if (!value) return;
    onClose();
    router.push(`/search?q=${encodeURIComponent(value)}`);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Search"
      aria-hidden={!open}
      className={clsx(
        "fixed inset-0 z-50 flex flex-col bg-canvas text-fg transition-[opacity,transform] duration-500 ease-atelier",
        open
          ? "pointer-events-auto translate-y-0 opacity-100"
          : "pointer-events-none -translate-y-4 opacity-0",
      )}
    >
      <div className="flex h-14 items-center justify-between border-b border-line px-4 sm:px-8 md:h-16 md:px-12">
        <span className="label text-fg-3">Search</span>
        <button
          type="button"
          onClick={onClose}
          className="label flex items-center gap-2"
          tabIndex={open ? 0 : -1}
        >
          Close <X className="size-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-24 pt-10 sm:px-8 md:px-12 md:pt-16">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            go(q);
          }}
          className="flex items-end gap-4 border-b-2 border-fg pb-3"
        >
          <input
            ref={input}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            name="q"
            type="search"
            enterKeyHint="search"
            autoComplete="off"
            placeholder="Search"
            tabIndex={open ? 0 : -1}
            className="display w-full min-w-0 bg-transparent text-[clamp(3rem,12vw,8rem)] outline-none placeholder:text-fg/20 focus-visible:outline-none"
          />
          <button
            type="submit"
            aria-label="Search"
            tabIndex={open ? 0 : -1}
            className="mb-2 grid size-12 shrink-0 place-items-center bg-fg text-canvas transition-transform active:scale-95"
          >
            <ArrowRight className="size-5" />
          </button>
        </form>

        <div className="mt-12 grid gap-12 md:grid-cols-2">
          <div>
            <p className="label mb-4 text-fg-3">Popular</p>
            <ul className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <li key={s}>
                  <button
                    type="button"
                    onClick={() => go(s)}
                    tabIndex={open ? 0 : -1}
                    className="label h-10 border border-line px-4 transition-colors hover:border-fg hover:bg-fg hover:text-canvas"
                  >
                    {s}
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="label mb-4 text-fg-3">Browse</p>
            <ul className="border-t border-line">
              {quickLinks.map((item) => (
                <li key={item.path} className="border-b border-line">
                  <Link
                    href={item.path}
                    onClick={onClose}
                    tabIndex={open ? 0 : -1}
                    className="display flex items-center justify-between py-3 text-4xl transition-[padding] duration-300 hover:pl-3"
                  >
                    {item.title}
                    <ArrowRight className="size-5" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
