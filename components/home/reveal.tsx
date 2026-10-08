"use client";

import { useEffect, useRef, type ElementType, type ReactNode } from "react";

/**
 * Fades + lifts its content in the first time it scrolls into view.
 * The hidden start state lives in CSS behind `(scripting: enabled)` and
 * `prefers-reduced-motion: no-preference`, so content is never hidden for
 * no-JS visitors or people who opt out of motion.
 */
export function Reveal({
  as: Tag = "div",
  delay = 0,
  className,
  children,
}: {
  as?: ElementType;
  delay?: number;
  className?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          el.dataset.shown = "";
          observer.disconnect();
        }
      },
      { rootMargin: "0px 0px -8% 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      data-reveal=""
      className={className}
      style={
        delay ? ({ "--d": `${delay}ms` } as React.CSSProperties) : undefined
      }
    >
      {children}
    </Tag>
  );
}
