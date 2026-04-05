/**
 * Centralised animation variants and constants.
 *
 * Rules:
 *  - Use Framer Motion for UI / state transitions.
 *  - Timing: micro-interactions 150–200 ms, page/form transitions 250–400 ms.
 *  - Easing: ease-out for entry, ease-in for exit.
 *  - Every variant must respect `prefers-reduced-motion` (Framer Motion's
 *    MotionConfig handles this globally; individual overrides use `reducedMotion`).
 */

import type { Variants } from "framer-motion";

// ---------------------------------------------------------------------------
// Timing constants
// ---------------------------------------------------------------------------

export const DURATION = {
  micro: 0.15,
  fast: 0.2,
  normal: 0.3,
  slow: 0.4,
} as const;

export const EASE = {
  out: [0.0, 0.0, 0.2, 1.0] as const,
  in: [0.4, 0.0, 1.0, 1.0] as const,
  inOut: [0.4, 0.0, 0.2, 1.0] as const,
} as const;

// ---------------------------------------------------------------------------
// Reusable variants
// ---------------------------------------------------------------------------

/** Simple page-level fade-in on mount */
export const pageFadeIn: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: DURATION.normal, ease: EASE.out },
  },
};

/** Fade + subtle scale for modals / popovers */
export const modalVariants: Variants = {
  hidden: { opacity: 0, scale: 0.96, y: 4 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: DURATION.fast, ease: EASE.out },
  },
  exit: {
    opacity: 0,
    scale: 0.96,
    y: 4,
    transition: { duration: DURATION.micro, ease: EASE.in },
  },
};

/** Slide-up for toasts, banners, and inline feedback */
export const slideUp: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: DURATION.fast, ease: EASE.out },
  },
  exit: {
    opacity: 0,
    y: 6,
    transition: { duration: DURATION.micro, ease: EASE.in },
  },
};

/** Stagger parent — apply to list wrappers */
export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.05,
    },
  },
};

/** Individual stagger child — apply to each list item */
export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: DURATION.normal, ease: EASE.out },
  },
};

/** Fade-only for images and overlays */
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: DURATION.normal, ease: EASE.out },
  },
  exit: {
    opacity: 0,
    transition: { duration: DURATION.fast, ease: EASE.in },
  },
};
