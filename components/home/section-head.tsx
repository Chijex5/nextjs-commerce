import Link from "next/link";
import type { ReactNode } from "react";
import { Reveal } from "./reveal";

/** Numbered section heading: pink index, condensed display title, optional link. */
export function SectionHead({
  index,
  eyebrow,
  title,
  href,
  linkLabel,
}: {
  index: string;
  eyebrow: string;
  title: ReactNode;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <Reveal className="mb-8 flex items-end justify-between gap-6 sm:mb-12">
      <div>
        <p className="mb-4 flex items-center gap-3 text-[11px] font-medium uppercase tracking-[0.2em] text-fg-3">
          <span className="font-mono text-accent">{index}</span>
          <span className="h-px w-8 bg-line" />
          {eyebrow}
        </p>
        <h2 className="display text-[clamp(2.6rem,9vw,6.5rem)] text-fg">
          {title}
        </h2>
      </div>
      {href ? (
        <Link
          href={href}
          className="link-underline mb-2 hidden shrink-0 text-sm font-medium text-fg sm:inline-block"
        >
          {linkLabel ?? "View all"}
        </Link>
      ) : null}
    </Reveal>
  );
}
