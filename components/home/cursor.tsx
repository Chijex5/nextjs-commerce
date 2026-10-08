"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Desktop-only cursor follower. Over elements with `data-cursor="Label"` it
 * shows a round label; over `data-cursor-img="url"` it shows a floating image
 * preview. Native cursor stays visible, and it never renders on touch screens
 * or when the visitor prefers reduced motion.
 */
export function Cursor() {
  const dot = useRef<HTMLDivElement>(null);
  const [label, setLabel] = useState<string | null>(null);
  const [image, setImage] = useState<string | null>(null);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const ok =
      window.matchMedia("(hover: hover) and (pointer: fine)").matches &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setEnabled(ok);
    if (!ok) return;

    let x = 0,
      y = 0,
      cx = 0,
      cy = 0,
      raf = 0;

    const move = (e: PointerEvent) => {
      x = e.clientX;
      y = e.clientY;
      const target = e.target as Element | null;
      const withLabel = target?.closest<HTMLElement>("[data-cursor]");
      const withImage = target?.closest<HTMLElement>("[data-cursor-img]");
      setLabel(withLabel?.dataset.cursor ?? null);
      setImage(withImage?.dataset.cursorImg ?? null);
    };

    const tick = () => {
      cx += (x - cx) * 0.18;
      cy += (y - cy) * 0.18;
      if (dot.current) {
        dot.current.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
      }
      raf = requestAnimationFrame(tick);
    };

    window.addEventListener("pointermove", move, { passive: true });
    raf = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener("pointermove", move);
      cancelAnimationFrame(raf);
    };
  }, []);

  if (!enabled) return null;

  return (
    <div
      ref={dot}
      aria-hidden
      className="pointer-events-none fixed left-0 top-0 z-[60]"
    >
      <div
        className={`absolute grid size-24 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white font-mono text-[11px] uppercase tracking-[0.14em] text-black mix-blend-difference transition-[scale,opacity] duration-300 ease-out ${
          label && !image ? "scale-100 opacity-100" : "scale-0 opacity-0"
        }`}
      >
        {label}
      </div>
      <div
        className={`absolute h-64 w-48 -translate-y-1/2 translate-x-8 overflow-hidden bg-neutral-900 transition-[scale,opacity] duration-300 ease-out ${
          image ? "scale-100 opacity-100" : "scale-75 opacity-0"
        }`}
      >
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`/_next/image?url=${encodeURIComponent(image)}&w=384&q=70`}
            alt=""
            className="size-full object-cover"
          />
        ) : null}
      </div>
    </div>
  );
}
