"use client";

import { buttonClass } from "components/ui/button";
import { RotateCcw } from "lucide-react";
import Link from "next/link";

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

/** Full-page error in the editorial system: huge type, two clear ways out. */
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
    <section className="flex min-h-[80svh] flex-col justify-between bg-canvas px-4 pb-10 pt-10 text-fg sm:px-8 sm:pt-14 md:px-12">
      <div className="label flex justify-between text-fg-3">
        <span>(Error)</span>
        {error.digest ? <span>Ref {error.digest}</span> : null}
      </div>

      <div className="py-16">
        <h1 className="display text-[clamp(3.6rem,12vw,10rem)]">{title}</h1>
        <p className="mt-6 max-w-[48ch] text-lg text-fg-2">{message}</p>
        {reassurance ? (
          <p className="mt-2 max-w-[48ch] text-fg-3">{reassurance}</p>
        ) : null}
        <div className="mt-10 flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={resetAction}
            className={buttonClass("solid")}
          >
            <RotateCcw className="size-4" />
            Try again
          </button>
          <Link href={secondaryHref} className={buttonClass("outline")}>
            {secondaryLabel}
          </Link>
        </div>
      </div>

      <p className="text-sm text-fg-3">
        Still stuck?{" "}
        <Link href={supportHref} className="underline">
          Contact us
        </Link>{" "}
        and we&apos;ll sort it out.
      </p>
    </section>
  );
}
