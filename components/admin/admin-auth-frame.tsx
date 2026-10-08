"use client";

import { ParticleLogo } from "components/brand/particle-logo";
import LogoIcon from "components/icons/logo";
import Link from "next/link";
import { useEffect, useRef, type ReactNode } from "react";

/**
 * Split screen for the admin sign-in screens: a black panel where the
 * D'FOOTPRINT mark assembles from particles (and scatters under the
 * pointer), and the form on the right. Phones get just the form.
 */
export function AdminAuthFrame({
  eyebrow,
  title,
  intro,
  children,
}: {
  eyebrow: string;
  title: string;
  intro?: ReactNode;
  children: ReactNode;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const el = canvas.current;
    if (!el || el.offsetWidth === 0) return; // hidden on phones
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    let logo: ParticleLogo | undefined;
    let cancelled = false;

    (async () => {
      const size = Math.min(
        420,
        Math.round(Math.min(el.offsetWidth, el.offsetHeight) * 0.6),
      );
      logo = await new ParticleLogo(el, {
        src: "/brand/logo-mark.svg",
        color: "#ffffff",
        logoSize: size,
        step: 4,
        radius: 90,
      }).init();
      if (cancelled) return logo.destroy();
      if (reduce) {
        logo.progress = 1;
        return;
      }
      const { gsap } = await import("gsap");
      gsap.to(logo, { progress: 1, duration: 2.2, ease: "power3.out" });
    })().catch(() => {
      /* decorative only */
    });

    return () => {
      cancelled = true;
      logo?.destroy();
    };
  }, []);

  return (
    <div className="grid min-h-svh bg-canvas text-fg lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-ink text-paper lg:block">
        <canvas
          ref={canvas}
          aria-hidden
          className="absolute inset-0 size-full"
        />
        <div className="label absolute inset-x-0 top-0 flex justify-between px-12 pt-8 text-white/50">
          <span>D&apos;Footprint</span>
          <span>Workshop / Admin</span>
        </div>
        <p className="display absolute bottom-10 left-12 right-12 text-[clamp(3rem,5.5vw,5.5rem)]">
          Behind
          <br />
          the counter.
        </p>
      </div>

      <div className="flex flex-col px-4 py-6 sm:px-10 lg:px-16">
        <Link
          href="/"
          className="flex items-center gap-2.5 self-start"
          aria-label="Back to the store"
        >
          <LogoIcon className="!size-9" />
          <span className="label text-fg-3">Admin</span>
        </Link>

        <div className="my-auto w-full max-w-md py-12">
          <p className="label text-fg-3">{eyebrow}</p>
          <h1 className="display mt-3 text-[clamp(2.75rem,8vw,4.5rem)]">
            {title}
          </h1>
          {intro ? <p className="mt-4 text-fg-2">{intro}</p> : null}
          <div className="mt-10">{children}</div>
        </div>

        <p className="label text-fg-3">Authorised personnel only</p>
      </div>
    </div>
  );
}

/** Inline status line used by the admin auth forms. */
export function AuthNotice({
  tone,
  children,
}: {
  tone: "error" | "success";
  children: ReactNode;
}) {
  return (
    <p
      role={tone === "error" ? "alert" : "status"}
      className={
        tone === "error"
          ? "border-l-2 border-red-600 pl-3 text-sm text-red-600"
          : "border-l-2 border-fg pl-3 text-sm text-fg"
      }
    >
      {children}
    </p>
  );
}
