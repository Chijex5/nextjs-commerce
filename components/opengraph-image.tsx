import { readFile } from "fs/promises";
import { siteName } from "lib/seo";
import { ImageResponse } from "next/og";
import { join } from "path";

export type Props = {
  title?: string;
  description?: string;
  badge?: string;
  price?: string;
  showLogo?: boolean;
  imageUrl?: string | null; // optional — product photo or brand visual
};

const INK = "#000000";
const PAPER = "#ffffff";
const GREY = "#6b6b6b";

/** Shrink long titles so they stay within three lines. */
function titleSize(title: string, hasImage: boolean) {
  const n = title.length;
  if (hasImage) return n > 34 ? 64 : n > 20 ? 80 : 104;
  return n > 40 ? 84 : n > 22 ? 112 : 148;
}

/**
 * Share card (1200×630) in the black & white street-editorial style:
 * white page, black condensed Archivo headline, mono labels, and the
 * product photo full-bleed on the right when there is one.
 */
export default async function OpengraphImage(
  props?: Props,
): Promise<ImageResponse> {
  const {
    title = siteName,
    description = "Handmade footwear, cut and stitched in Lagos.",
    badge = "Handmade footwear",
    price,
    showLogo = true,
    imageUrl,
  } = props || {};

  const [display, mono, logo] = await Promise.all([
    // Literal paths so Vercel's file tracing ships these with the function.
    readFile(join(process.cwd(), "fonts/archivo-condensed-800.ttf")),
    readFile(join(process.cwd(), "fonts/geist-mono-400.ttf")),
    readFile(join(process.cwd(), "public/brand/logo-mark-black.png")),
  ]);
  const logoSrc = `data:image/png;base64,${logo.toString("base64")}`;

  const safeDescription =
    description.length > 90
      ? description.slice(0, 90).trimEnd() + "…"
      : description;

  const hasImage = Boolean(imageUrl);
  const label = {
    fontFamily: "Mono",
    fontSize: 15,
    letterSpacing: "0.12em",
    textTransform: "uppercase" as const,
  };

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "1200px",
          height: "630px",
          backgroundColor: PAPER,
          color: INK,
        }}
      >
        {/* ── Copy ── */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: hasImage ? "680px" : "1200px",
            padding: "48px 56px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              paddingBottom: "18px",
              borderBottom: `4px solid ${INK}`,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              {showLogo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoSrc} width={44} height={44} alt="" />
              ) : null}
              <span style={{ ...label, color: INK }}>D&apos;Footprint</span>
            </div>
            <span style={{ ...label, color: GREY }}>{badge}</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                display: "flex",
                fontFamily: "Archivo",
                fontSize: titleSize(title, hasImage),
                lineHeight: 0.88,
                letterSpacing: "-0.01em",
                textTransform: "uppercase",
              }}
            >
              {title}
            </div>
            <div
              style={{
                display: "flex",
                marginTop: "24px",
                maxWidth: "560px",
                fontFamily: "Mono",
                fontSize: 20,
                lineHeight: 1.45,
                color: GREY,
              }}
            >
              {safeDescription}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
              paddingTop: "18px",
              borderTop: `1px solid ${INK}`,
            }}
          >
            {price ? (
              <span
                style={{ fontFamily: "Archivo", fontSize: 44, lineHeight: 1 }}
              >
                {price}
              </span>
            ) : (
              <span style={{ ...label, color: INK }}>Made by hand / Lagos</span>
            )}
            <span style={{ ...label, color: GREY }}>dfootprint.me</span>
          </div>
        </div>

        {/* ── Photo (or a black panel with the mark) ── */}
        {hasImage ? (
          <div
            style={{
              display: "flex",
              width: "520px",
              height: "630px",
              backgroundColor: INK,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl!}
              alt=""
              width={520}
              height={630}
              style={{ objectFit: "cover", width: "520px", height: "630px" }}
            />
          </div>
        ) : null}
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: [
        { name: "Archivo", data: display, style: "normal", weight: 800 },
        { name: "Mono", data: mono, style: "normal", weight: 400 },
      ],
    },
  );
}
