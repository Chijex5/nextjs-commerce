"use client";

import { ReactNode } from "react";

export default function MobileFilterBar({ children }: { children: ReactNode }) {
  return (
    <div className="sticky top-16 z-30 -mx-4 border-b border-neutral-200 bg-white/95 px-4 py-4 backdrop-blur-sm md:hidden dark:border-neutral-800 dark:bg-neutral-900/95">
      {children}
    </div>
  );
}
