"use client";

import { useEffect } from "react";

/**
 * Lenis smooth scrolling on pointer devices. Touch keeps native scrolling
 * (it already feels right on phones). Pauses while something locks the page
 * (dialogs, sheets, the intro) and respects reduced motion.
 */
export function SmoothScroll() {
  useEffect(() => {
    if (
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      !window.matchMedia("(hover: hover) and (pointer: fine)").matches
    ) {
      return;
    }

    let lenis: import("lenis").default | undefined;
    let observer: MutationObserver | undefined;
    let cancelled = false;

    import("lenis").then(({ default: Lenis }) => {
      if (cancelled) return;
      lenis = new Lenis({
        lerp: 0.11,
        anchors: true,
        autoRaf: true,
        // Let drawers, sheets and rails scroll themselves.
        allowNestedScroll: true,
      });

      // Headless UI / our sheets lock scroll via overflow:hidden.
      const sync = () => {
        const locked =
          getComputedStyle(document.documentElement).overflow === "hidden" ||
          getComputedStyle(document.body).overflow === "hidden" ||
          document.documentElement.hasAttribute("data-intro-active");
        if (locked) lenis?.stop();
        else lenis?.start();
      };
      observer = new MutationObserver(sync);
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["style", "class", "data-intro-active"],
      });
      observer.observe(document.body, {
        attributes: true,
        attributeFilter: ["style", "class"],
      });
      sync();
    });

    return () => {
      cancelled = true;
      observer?.disconnect();
      lenis?.destroy();
    };
  }, []);

  return null;
}
