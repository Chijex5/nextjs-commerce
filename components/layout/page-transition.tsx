import type { ReactNode } from "react";

/**
 * Page entry fade. Pure CSS (see .page-enter in globals.css) so it runs on
 * first paint — it never waits for JavaScript, which previously kept every
 * page invisible until hydration finished on slower phones.
 */
export default function PageTransition({ children }: { children: ReactNode }) {
  return <div className="page-enter">{children}</div>;
}
