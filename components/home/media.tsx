import Image from "next/image";

/**
 * Media — the single image primitive for the image-first homepage.
 *
 * Drop it into any element that is `position: relative` and sized (an
 * aspect-ratio box, a full-bleed section, etc.). It fills that parent.
 *
 *   • When `src` is a real URL  → renders an optimised next/image.
 *   • When `src` is empty/undefined → renders a polished, on-brand MOCK
 *     placeholder so the layout reads as finished while you design.
 *
 * To go live, just set the `imageUrl` on the matching data object (or a
 * product's `featuredImage.url`) — nothing else has to change.
 */

const TONES = [
  { a: "#2A1C12", b: "#0C0805", glow: "rgba(191,90,40,0.20)" },
  { a: "#1E1510", b: "#0A0704", glow: "rgba(192,137,42,0.16)" },
  { a: "#241A13", b: "#0E0A06", glow: "rgba(191,90,40,0.14)" },
  { a: "#1B1712", b: "#0B0806", glow: "rgba(201,185,154,0.10)" },
  { a: "#2C1E13", b: "#100A06", glow: "rgba(192,137,42,0.20)" },
  { a: "#191209", b: "#080503", glow: "rgba(191,90,40,0.12)" },
];

function toneFrom(seed: string | number | undefined): number {
  if (typeof seed === "number") return Math.abs(seed) % TONES.length;
  if (!seed) return 0;
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return Math.abs(h) % TONES.length;
}

export function Media({
  src,
  alt,
  sizes,
  priority,
  brightness,
  tone,
  caption,
  className,
  imgClassName,
}: {
  src?: string | null;
  alt: string;
  sizes?: string;
  priority?: boolean;
  /** dim the photo so overlaid type stays legible, e.g. 0.7 */
  brightness?: number;
  /** pin a specific placeholder tone (0-5); otherwise derived from alt */
  tone?: number;
  /** short hint shown on the mock so you know what belongs here */
  caption?: string;
  className?: string;
  imgClassName?: string;
}) {
  if (src) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes ?? "100vw"}
        priority={priority}
        className={imgClassName ?? "object-cover"}
        style={brightness ? { filter: `brightness(${brightness})` } : undefined}
      />
    );
  }

  const t =
    TONES[tone !== undefined ? Math.abs(tone) % TONES.length : toneFrom(alt)]!;

  return (
    <div
      aria-label={alt}
      role="img"
      className={className}
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        background: `radial-gradient(120% 90% at 28% 18%, ${t.glow} 0%, transparent 55%), linear-gradient(150deg, ${t.a} 0%, ${t.b} 100%)`,
        filter: brightness ? `brightness(${brightness})` : undefined,
      }}
    >
      {/* diagonal sheen */}
      <span
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(115deg, transparent 42%, rgba(242,232,213,0.05) 50%, transparent 58%)",
        }}
      />
      {/* film grain */}
      <span
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.5,
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.05'/%3E%3C/svg%3E\")",
        }}
      />
      {/* centred mark */}
      <div
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "0.6rem",
          padding: "1rem",
          textAlign: "center",
        }}
      >
        <svg
          width="30"
          height="30"
          viewBox="0 0 24 24"
          fill="none"
          style={{ color: "rgba(191,90,40,0.65)" }}
          aria-hidden
        >
          <rect
            x="3"
            y="4"
            width="18"
            height="16"
            rx="1.5"
            stroke="currentColor"
            strokeWidth="1.2"
          />
          <path
            d="M3 16l5-5 4 4 3-3 6 6"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="8.5" cy="9" r="1.4" fill="currentColor" />
        </svg>
        <span
          style={{
            fontFamily: "var(--font-dm-sans), sans-serif",
            fontSize: "0.55rem",
            fontWeight: 500,
            letterSpacing: "0.32em",
            textTransform: "uppercase",
            color: "rgba(242,232,213,0.5)",
          }}
        >
          Image
        </span>
        {caption ? (
          <span
            style={{
              maxWidth: 220,
              fontFamily: "var(--font-dm-sans), sans-serif",
              fontSize: "0.6rem",
              lineHeight: 1.5,
              letterSpacing: "0.04em",
              color: "rgba(201,185,154,0.55)",
            }}
          >
            {caption}
          </span>
        ) : null}
      </div>
    </div>
  );
}

export default Media;
