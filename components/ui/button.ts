import clsx from "clsx";

type Variant = "solid" | "outline" | "inverse" | "inverse-outline";
type Size = "md" | "lg";

/**
 * Button styles shared by links and buttons. Square, uppercase, black & white.
 * `inverse*` variants are for use on top of photos / black bands.
 */
export function buttonClass(
  variant: Variant = "solid",
  size: Size = "lg",
  className?: string,
) {
  return clsx(
    "group inline-flex items-center justify-center gap-2 whitespace-nowrap font-semibold uppercase tracking-wide transition-[transform,background-color,color,border-color] duration-200 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50",
    size === "lg" ? "h-12 px-6 text-sm" : "h-10 px-4 text-xs",
    {
      "bg-fg text-canvas hover:opacity-85": variant === "solid",
      "border border-fg/40 text-fg hover:border-fg hover:bg-fg hover:text-canvas":
        variant === "outline",
      "bg-paper text-ink hover:bg-white/85": variant === "inverse",
      "border border-white/50 text-paper hover:bg-white hover:text-ink":
        variant === "inverse-outline",
    },
    className,
  );
}
