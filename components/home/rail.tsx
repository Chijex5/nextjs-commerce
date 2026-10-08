"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Horizontal, scroll-snapping product rail. Native touch scrolling on phones
 * (feels like an app carousel, zero JS needed to swipe); arrow buttons and a
 * progress line on larger screens.
 */
export function Rail({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  const track = useRef<HTMLUListElement>(null);
  const [progress, setProgress] = useState(0);
  const [edges, setEdges] = useState({ start: true, end: false });

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const update = () => {
      const max = el.scrollWidth - el.clientWidth;
      setProgress(max > 0 ? el.scrollLeft / max : 0);
      setEdges({ start: el.scrollLeft <= 4, end: el.scrollLeft >= max - 4 });
    };
    update();
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  const page = (dir: 1 | -1) => {
    const el = track.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: "smooth" });
  };

  return (
    <div>
      <ul
        ref={track}
        aria-label={label}
        className="rail -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-4 px-4 pb-2 sm:-mx-8 sm:scroll-px-8 sm:gap-4 sm:px-8 lg:-mx-12 lg:scroll-px-12 lg:px-12"
      >
        {children}
      </ul>

      <div className="mt-6 hidden items-center gap-6 md:flex">
        <div className="relative h-px flex-1 bg-line">
          <span
            className="absolute inset-y-0 left-0 bg-fg transition-[width] duration-300"
            style={{ width: `${Math.max(8, progress * 100)}%` }}
          />
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => page(-1)}
            disabled={edges.start}
            aria-label="Previous"
            className="grid size-11 place-items-center rounded-full border border-line text-fg transition hover:border-fg disabled:opacity-30"
          >
            <ArrowLeft className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => page(1)}
            disabled={edges.end}
            aria-label="Next"
            className="grid size-11 place-items-center rounded-full border border-line text-fg transition hover:border-fg disabled:opacity-30"
          >
            <ArrowRight className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
