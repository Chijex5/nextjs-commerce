"use client";

import { motion, MotionConfig } from "framer-motion";
import { pageFadeIn } from "lib/motion";
import type { ReactNode } from "react";

/**
 * Wraps every page in a fade-in entry animation.
 * MotionConfig ensures all child animations respect
 * `prefers-reduced-motion` automatically.
 */
export default function PageTransition({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={pageFadeIn}
        style={{ minHeight: "inherit" }}
      >
        {children}
      </motion.div>
    </MotionConfig>
  );
}
