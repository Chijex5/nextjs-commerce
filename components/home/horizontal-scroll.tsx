"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Pins a section and turns vertical scrolling into a sideways pan across its
 * track (desktop). On touch screens it stays a plain swipeable strip, which
 * feels native on phones.
 */
export function HorizontalScroll({
  children,
  count,
}: {
  children: ReactNode;
  count: number;
}) {
  const outer = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const [pinned, setPinned] = useState(false);
  const [height, setHeight] = useState<number>();
  const [index, setIndex] = useState(1);

  useEffect(() => {
    const mq = window.matchMedia(
      "(min-width: 768px) and (hover: hover) and (prefers-reduced-motion: no-preference)",
    );
    const apply = () => setPinned(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    if (!pinned) {
      setHeight(undefined);
      if (track.current) track.current.style.transform = "";
      return;
    }
    const o = outer.current!;
    const t = track.current!;
    let raf = 0;

    const measure = () => {
      const distance = t.scrollWidth - window.innerWidth;
      setHeight(window.innerHeight + Math.max(0, distance));
    };
    const update = () => {
      const distance = t.scrollWidth - window.innerWidth;
      const top = o.getBoundingClientRect().top;
      const p = Math.min(1, Math.max(0, -top / Math.max(1, distance)));
      t.style.transform = `translate3d(${-p * distance}px,0,0)`;
      setIndex(Math.min(count, Math.floor(p * count) + 1));
    };
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    };

    measure();
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", measure);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", measure);
    };
  }, [pinned, count]);

  return (
    <div ref={outer} style={pinned && height ? { height } : undefined}>
      <div
        className={
          pinned
            ? "sticky top-0 flex h-svh flex-col justify-center overflow-hidden"
            : ""
        }
      >
        <div
          ref={track}
          className={
            pinned
              ? "flex w-max items-end gap-4 px-12 will-change-transform"
              : "rail flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 sm:scroll-px-8 sm:px-8"
          }
        >
          {children}
        </div>
        <p className="mt-6 px-4 font-mono text-xs text-white/60 sm:px-8 md:px-12">
          {pinned ? (
            <>
              {String(index).padStart(2, "0")} /{" "}
              {String(count).padStart(2, "0")}
            </>
          ) : (
            <>Swipe →</>
          )}
        </p>
      </div>
    </div>
  );
}
