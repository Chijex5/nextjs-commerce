import clsx from "clsx";

/**
 * Top-down line drawing of a pair of slides / slippers — the brand's stand-in
 * for photography. Outline and straps use currentColor; the hand-stitch line
 * is the pink accent. `draw` animates the outline being "stitched" in (hero).
 */

export type PairStyle = "band" | "twin" | "cross" | "loafer";

export const PAIR_STYLES: PairStyle[] = ["band", "cross", "twin", "loafer"];

// One left sole in a 120×260 box; the right foot is the mirror image.
const SOLE =
  "M62 8C86 8 104 26 108 56C111 80 106 104 100 124C95 142 96 160 98 180C100 204 98 232 84 246C72 257 48 257 38 246C26 232 26 206 28 182C30 160 26 140 20 118C13 92 12 60 22 36C30 18 44 8 62 8Z";

const STRAPS: Record<PairStyle, string[]> = {
  band: ["M16 80C42 68 82 68 108 80L104 128C80 118 44 118 22 128Z"],
  twin: [
    "M16 72C42 62 82 62 108 72L107 90C82 81 42 81 18 92Z",
    "M18 106C44 97 80 97 105 106L102 124C80 116 44 116 22 126Z",
  ],
  cross: ["M17 74L104 112L101 132L21 96Z", "M107 74L22 120L19 100L103 66Z"],
  loafer: [
    "M22 36C30 18 44 8 62 8C86 8 104 26 108 56C111 80 106 104 102 122C80 110 42 110 20 120C13 92 12 60 22 36Z",
  ],
};

function Sole({ style, draw }: { style: PairStyle; draw?: boolean }) {
  return (
    <>
      <path
        d={SOLE}
        pathLength={1}
        className={clsx(draw && "pair-draw")}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.4}
      />
      <path
        d={SOLE}
        transform="translate(60 130) scale(0.86) translate(-60 -130)"
        fill="none"
        stroke="var(--color-accent)"
        strokeWidth={1.2}
        strokeDasharray="3 4"
        strokeLinecap="round"
        className={clsx(draw && "pair-fade pair-fade-1")}
      />
      {STRAPS[style].map((d) => (
        <path
          key={d}
          d={d}
          fill="currentColor"
          className={clsx(draw && "pair-fade pair-fade-2")}
        />
      ))}
    </>
  );
}

export function PairIllustration({
  style = "band",
  draw,
  className,
  title,
}: {
  style?: PairStyle;
  draw?: boolean;
  className?: string;
  title?: string;
}) {
  return (
    <svg
      viewBox="0 0 280 300"
      className={className}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      <g transform="translate(14 22) rotate(-7 60 130)">
        <Sole style={style} draw={draw} />
      </g>
      <g transform="translate(266 18) scale(-1 1) rotate(-7 60 130)">
        <Sole style={style} draw={draw} />
      </g>
    </svg>
  );
}

/** Stable style pick for a product so the same design always gets the same drawing. */
export function pairStyleFor(seed: string): PairStyle {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return PAIR_STYLES[Math.abs(h) % PAIR_STYLES.length]!;
}
