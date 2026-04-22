"use client";

import Link from "next/link";
import { motion } from "framer-motion";

type ErrorStateProps = {
  error: Error & { digest?: string };
  resetAction: () => void;
  title: string;
  message: string;
  reassurance?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
  supportHref?: string;
};

const containerTransition = {
  duration: 0.4,
  ease: [0.22, 1, 0.36, 1],
};

const buttonTransition = {
  duration: 0.18,
  ease: "easeOut",
};

export function ErrorState({
  error,
  resetAction,
  title,
  message,
  reassurance,
  secondaryHref = "/",
  secondaryLabel = "Go home",
  supportHref = "/contact",
}: ErrorStateProps) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0A0704] px-6 py-20 sm:px-10 sm:py-24">
      {/* Grain texture overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E\")",
        }}
      />

      {/* Decorative concentric rings */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[480px] w-[480px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#C0892A]/[0.07]" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#BF5A28]/[0.06]" />

      {/* Vertical deco rule */}
      <div className="pointer-events-none absolute bottom-0 left-12 top-0 w-px bg-gradient-to-b from-transparent via-[#C0892A]/10 to-transparent" />

      <motion.section
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={containerTransition}
        className="relative z-10 mx-auto flex min-h-[calc(100vh-10rem)] w-full max-w-2xl flex-col justify-center"
      >
        {/* Status badge */}
        <div className="mb-8 inline-flex w-fit items-center gap-2 rounded-[2px] border border-[#BF5A28]/30 bg-[#BF5A28]/10 px-3.5 py-1.5">
          <span className="inline-block h-[7px] w-[7px] animate-pulse rounded-full bg-[#BF5A28]" />
          <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-[#BF5A28]">
            Error encountered
          </span>
        </div>

        {/* Eyebrow */}
        <p className="mb-3.5 text-[10px] font-normal uppercase tracking-[0.2em] text-[#C0892A]/60">
          Something went wrong
        </p>

        {/* Headline */}
        <h1
          className="text-balance text-4xl font-semibold leading-[1.15] tracking-[-0.01em] text-[#F2E8D5] sm:text-5xl"
          style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
        >
          {title.split(" ").map((word, i, arr) =>
            i === arr.length - 1 ? (
              <span key={i} className="text-[#BF5A28]">
                {word}
              </span>
            ) : (
              <span key={i}>{word} </span>
            ),
          )}
        </h1>

        {/* Gold divider */}
        <div className="my-7 h-px w-10 bg-gradient-to-r from-[#C0892A] to-transparent" />

        {/* Message */}
        <p className="max-w-md text-pretty text-[15px] font-light leading-[1.8] text-[#F2E8D5]/60">
          {message}
        </p>

        {/* Reassurance */}
        {reassurance && (
          <p className="mt-2 max-w-md text-[13px] font-light leading-relaxed text-[#F2E8D5]/35">
            {reassurance}
          </p>
        )}

        {/* Actions */}
        <div className="mt-10 flex w-full flex-col gap-3 sm:max-w-sm sm:flex-row">
          <motion.button
            type="button"
            onClick={resetAction}
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.98 }}
            transition={buttonTransition}
            className="inline-flex items-center justify-center rounded-[2px] bg-[#BF5A28] px-7 py-3.5 text-[13px] font-medium uppercase tracking-[0.05em] text-[#F2E8D5] transition-colors hover:bg-[#d4622c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#BF5A28] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0704]"
          >
            Try again
          </motion.button>

          <motion.div
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.98 }}
            transition={buttonTransition}
            className="flex"
          >
            <Link
              href={secondaryHref}
              className="inline-flex w-full items-center justify-center rounded-[2px] border border-[#F2E8D5]/20 px-7 py-3.5 text-[13px] font-normal uppercase tracking-[0.05em] text-[#F2E8D5]/70 transition-colors hover:border-[#F2E8D5]/40 hover:text-[#F2E8D5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F2E8D5]/30 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0704]"
            >
              {secondaryLabel}
            </Link>
          </motion.div>
        </div>

        {/* Footer */}
        <div className="mt-8 flex flex-wrap items-center gap-5">
          <span className="text-[12px] text-[#F2E8D5]/35">
            Need help?{" "}
            <Link
              href={supportHref}
              className="border-b border-[#F2E8D5]/20 pb-px font-medium text-[#F2E8D5]/50 transition-colors hover:border-[#C0892A]/60 hover:text-[#C0892A]"
            >
              Contact support
            </Link>
          </span>

          {error.digest && (
            <span className="text-[10px] uppercase tracking-[0.12em] text-[#C0892A]/30">
              Ref: {error.digest}
            </span>
          )}
        </div>
      </motion.section>
    </main>
  );
}