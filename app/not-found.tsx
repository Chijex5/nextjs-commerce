"use client";

import { ParticleLogo } from "components/brand/particle-logo";
import { buttonClass } from "components/ui/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const LINKS = [
  { href: "/products", label: "Shop all designs" },
  { href: "/custom-orders", label: "Custom orders" },
  { href: "/contact", label: "Contact us" },
];

/**
 * 404: the D'FOOTPRINT mark as a field of particles you can push around
 * with the cursor (or a finger), over a giant 404 and a way back.
 */
export default function NotFound() {
  const router = useRouter();
  const canvas = useRef<HTMLCanvasElement>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!canvas.current) return;
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    let logo: ParticleLogo | undefined;
    let cancelled = false;

    (async () => {
      const color = getComputedStyle(document.documentElement)
        .getPropertyValue("--brand-cream")
        .trim();
      const size = Math.min(
        460,
        Math.round(
          Math.min(
            window.innerWidth * (window.innerWidth >= 768 ? 0.4 : 0.8),
            window.innerHeight * (window.innerWidth >= 768 ? 0.6 : 0.45),
          ),
        ),
      );
      logo = await new ParticleLogo(canvas.current!, {
        src: "/brand/logo-mark.svg",
        color: color || "#000",
        logoSize: size,
        step: size > 320 ? 4 : 3,
        radius: 90,
      }).init();
      if (cancelled) return logo.destroy();
      if (reduce) {
        logo.progress = 1;
        return;
      }
      const { gsap } = await import("gsap");
      gsap.to(logo, { progress: 1, duration: 2, ease: "power3.out" });
    })().catch(() => {
      /* decorative only */
    });

    return () => {
      cancelled = true;
      logo?.destroy();
    };
  }, []);

  return (
    <section className="relative flex min-h-[calc(100svh-3.5rem)] flex-col overflow-hidden bg-canvas text-fg md:min-h-[calc(100svh-4rem)]">
      <p
        aria-hidden
        className="display pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 select-none text-center text-[48vw] leading-none text-fg/[0.04] md:text-[38vw]"
      >
        404
      </p>
      <canvas
        ref={canvas}
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[58%] w-full md:inset-y-0 md:left-1/2 md:h-full md:w-1/2"
      />

      <div className="relative mt-auto px-4 pb-10 sm:px-8 md:px-12">
        <p className="label text-fg-3">(404) — Page not found</p>
        <h1 className="display mt-3 text-[clamp(3rem,9vw,7rem)]">
          Lost your footing?
        </h1>
        <p className="mt-4 max-w-[46ch] text-fg-2">
          This page has walked off. Search for what you were after, or pick up
          where the good stuff is.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (query.trim())
              router.push(`/search?q=${encodeURIComponent(query.trim())}`);
          }}
          className="mt-8 flex max-w-xl items-end gap-3 border-b-2 border-fg"
        >
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            type="search"
            enterKeyHint="search"
            placeholder="Search slides, slippers…"
            aria-label="Search the store"
            className="h-14 min-w-0 flex-1 bg-transparent text-lg outline-none placeholder:text-fg-3 focus-visible:outline-none"
          />
          <button
            type="submit"
            aria-label="Search"
            className="mb-1 grid size-12 place-items-center bg-fg text-canvas"
          >
            <ArrowRight className="size-5" />
          </button>
        </form>

        <div className="mt-8 flex flex-wrap gap-2">
          <Link href="/" className={buttonClass("solid", "md")}>
            Back home
          </Link>
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={buttonClass("outline", "md")}
            >
              {l.label}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
