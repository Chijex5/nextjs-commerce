"use client";

import { useEffect, useRef, useState } from "react";
import { ParticleLogo } from "./particle-logo";

export const INTRO_KEY = "dfp-intro-seen";

/**
 * Runs before first paint (inlined in <head>): marks the intro as skipped
 * when it was already shown this session, motion is reduced, data saver is
 * on, or the visitor is a crawler — so the overlay never flashes.
 */
export const INTRO_SKIP_SCRIPT = `(function(){try{var d=document.documentElement;var s=sessionStorage.getItem('${INTRO_KEY}');var r=window.matchMedia('(prefers-reduced-motion: reduce)').matches;var c=navigator.connection&&navigator.connection.saveData;var b=/bot|crawl|spider|slurp|facebookexternalhit|whatsapp|telegram/i.test(navigator.userAgent);if(s||r||c||b){d.setAttribute('data-intro','skip');}else{d.setAttribute('data-intro-active','');setTimeout(function(){d.removeAttribute('data-intro-active');},6000);}}catch(e){}})();`;

/**
 * First-visit intro: thousands of particles fly in and assemble the
 * D'FOOTPRINT mark while a counter runs to 100, then the mark bursts apart
 * and the curtain lifts. Shown once per browser session.
 */
export function IntroLoader() {
  const root = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const count = useRef<HTMLSpanElement>(null);
  const bar = useRef<HTMLSpanElement>(null);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    const html = document.documentElement;
    if (html.getAttribute("data-intro") === "skip") {
      setGone(true);
      return;
    }

    let logo: ParticleLogo | undefined;
    let cancelled = false;
    const finish = () => {
      try {
        sessionStorage.setItem(INTRO_KEY, "1");
      } catch {
        /* private mode */
      }
      html.removeAttribute("data-intro-active");
      logo?.destroy();
      setGone(true);
    };

    (async () => {
      try {
        const [{ gsap }] = await Promise.all([import("gsap")]);
        if (cancelled || !canvas.current) return;
        const size = Math.min(
          420,
          Math.round(Math.min(window.innerWidth, window.innerHeight) * 0.62),
        );
        logo = await new ParticleLogo(canvas.current, {
          src: "/brand/logo-mark.svg",
          color: "#ffffff",
          logoSize: size,
          step: size > 320 ? 4 : 3,
        }).init();
        if (cancelled) return;

        const counter = { v: 0 };
        gsap
          .timeline({ onComplete: finish })
          .to(logo, { progress: 1, duration: 1.7, ease: "power2.inOut" }, 0)
          .to(
            counter,
            {
              v: 100,
              duration: 1.7,
              ease: "power2.inOut",
              onUpdate: () => {
                const v = Math.round(counter.v);
                if (count.current)
                  count.current.textContent = String(v).padStart(3, "0");
                if (bar.current)
                  bar.current.style.transform = `scaleX(${v / 100})`;
              },
            },
            0,
          )
          .to(logo, { scatter: 1, duration: 0.7, ease: "power2.in" }, "+=0.35")
          // Release the page (unlocks scroll, starts hero animations) as
          // the curtain begins to lift.
          .call(() => html.removeAttribute("data-intro-active"), [], "-=0.35")
          .to(
            root.current,
            {
              clipPath: "inset(0 0 100% 0)",
              duration: 0.8,
              ease: "expo.inOut",
            },
            "-=0.35",
          );
      } catch {
        finish();
      }
    })();

    return () => {
      cancelled = true;
      logo?.destroy();
      html.removeAttribute("data-intro-active");
    };
  }, []);

  if (gone) return null;

  return (
    <div
      ref={root}
      aria-hidden
      className="intro-loader fixed inset-0 z-[100] bg-ink text-paper"
      style={{ clipPath: "inset(0 0 0 0)" }}
    >
      <canvas ref={canvas} className="absolute inset-0 size-full" />
      <div className="label absolute inset-x-0 top-0 flex justify-between px-4 pt-5 text-white/60 sm:px-8 md:px-12">
        <span>D&apos;Footprint</span>
        <span>Handmade in Lagos</span>
      </div>
      <div className="absolute inset-x-0 bottom-0 px-4 pb-6 sm:px-8 md:px-12">
        <div className="flex items-end justify-between">
          <span
            ref={count}
            className="display text-[clamp(4rem,14vw,9rem)] leading-none"
          >
            000
          </span>
          <span className="label mb-3 text-white/60">Loading the workshop</span>
        </div>
        <span className="mt-4 block h-px bg-white/20">
          <span
            ref={bar}
            className="block h-px origin-left bg-white"
            style={{ transform: "scaleX(0)" }}
          />
        </span>
      </div>
    </div>
  );
}
