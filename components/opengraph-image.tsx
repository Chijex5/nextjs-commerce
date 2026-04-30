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
  imageUrl?: string; // optional — product image or brand visual
};

export default async function OpengraphImage(
  props?: Props,
): Promise<ImageResponse> {
  const {
    title = siteName,
    description = "Where every stitch tells a story and every sole carries you further.",
    badge = "PREMIUM SLIDES",
    price,
    showLogo = true,
    imageUrl,
  } = props || {};

  const boldFile = await readFile(
    join(process.cwd(), "./fonts/Inter-Bold.ttf"),
  );
  const boldFont = Uint8Array.from(boldFile).buffer;

  // Truncate description so it never wraps past 2 lines
  const safeDescription =
    description.length > 90
      ? description.slice(0, 90).trimEnd() + "…"
      : description;

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "1200px",
          height: "630px",
          backgroundColor: "#0c0c0c",
          fontFamily: "Inter",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Subtle warm glow behind left content */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse at 25% 55%, rgba(217,123,58,0.07) 0%, transparent 60%)",
          }}
        />

        {/* ══════════ LEFT COLUMN ══════════ */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "60px 56px",
            width: "580px",
            gap: "0px",
          }}
        >
          {/* Logo */}
          {showLogo && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                marginBottom: "32px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "34px",
                  height: "34px",
                  border: "1.5px solid rgba(255,255,255,0.5)",
                  borderRadius: "4px",
                  color: "white",
                  fontSize: "13px",
                  fontWeight: 700,
                  letterSpacing: "-0.5px",
                }}
              >
                D'
              </div>
              <span
                style={{
                  color: "rgba(255,255,255,0.8)",
                  fontSize: "13px",
                  fontWeight: 700,
                  letterSpacing: "2.5px",
                  textTransform: "uppercase",
                }}
              >
                D'FOOTPRINT
              </span>
            </div>
          )}

          {/* Badge / Category */}
          <span
            style={{
              color: "#d97b3a",
              fontSize: "12px",
              fontWeight: 700,
              letterSpacing: "3px",
              textTransform: "uppercase",
              marginBottom: "10px",
            }}
          >
            {badge}
          </span>

          {/* Title */}
          <h1
            style={{
              color: "white",
              fontSize: "64px",
              fontWeight: 700,
              lineHeight: 1.0,
              margin: "0 0 20px 0",
              textTransform: "uppercase",
              letterSpacing: "-1px",
            }}
          >
            {title}
          </h1>

          {/* Divider */}
          <div
            style={{
              width: "48px",
              height: "2px",
              backgroundColor: "rgba(255,255,255,0.18)",
              marginBottom: "20px",
            }}
          />

          {/* Description */}
          <p
            style={{
              color: "rgba(255,255,255,0.5)",
              fontSize: "18px",
              fontStyle: "italic",
              lineHeight: 1.55,
              margin: "0 0 28px 0",
              maxWidth: "440px",
              fontWeight: 400,
            }}
          >
            {safeDescription}
          </p>

          {/* Price — only rendered if provided */}
          {price && (
            <span
              style={{
                color: "white",
                fontSize: "26px",
                fontWeight: 700,
                letterSpacing: "-0.5px",
                marginBottom: "24px",
              }}
            >
              {price}
            </span>
          )}

          {/* CTA */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "#d97b3a",
              color: "white",
              fontSize: "14px",
              fontWeight: 700,
              letterSpacing: "1px",
              padding: "14px 28px",
              borderRadius: "8px",
              width: "fit-content",
            }}
          >
            Shop Collection
          </div>
        </div>

        {/* ══════════ RIGHT COLUMN ══════════ */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            flex: 1,
            gap: "22px",
            padding: "60px 56px 60px 0",
            position: "relative",
          }}
        >
          {/* "Handcrafted in Nigeria" pill */}
          <div
            style={{
              display: "flex",
              position: "absolute",
              top: "48px",
              right: "0px",
              alignItems: "center",
              gap: "8px",
              backgroundColor: "rgba(255,255,255,0.07)",
              border: "1px solid rgba(255,255,255,0.13)",
              borderRadius: "999px",
              padding: "8px 18px",
              color: "rgba(255,255,255,0.8)",
              fontSize: "13px",
              fontWeight: 600,
            }}
          >
            <span style={{ color: "#d97b3a", fontSize: "10px" }}>✦</span>
            Handcrafted in Nigeria
          </div>

          {/* Image box */}
          <div
            style={{
              display: "flex",
              width: "280px",
              height: "280px",
              borderRadius: "24px",
              overflow: "hidden",
              backgroundColor: "#1a1a1a",
              border: "1px solid rgba(255,255,255,0.07)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imageUrl}
                alt={title}
                width={280}
                height={280}
                style={{ objectFit: "cover", width: "100%", height: "100%" }}
              />
            ) : (
              /* Brand monogram fallback */
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "10px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "80px",
                    height: "80px",
                    border: "2px solid rgba(255,255,255,0.18)",
                    borderRadius: "14px",
                    color: "rgba(255,255,255,0.45)",
                    fontSize: "26px",
                    fontWeight: 700,
                  }}
                >
                  D'
                </div>
                <span
                  style={{
                    color: "rgba(255,255,255,0.2)",
                    fontSize: "10px",
                    letterSpacing: "3px",
                    textTransform: "uppercase",
                  }}
                >
                  Footprint
                </span>
              </div>
            )}
          </div>

          {/* Brand wordmark below image */}
          <span
            style={{
              color: "white",
              fontSize: "28px",
              fontWeight: 700,
              letterSpacing: "3px",
              textTransform: "uppercase",
            }}
          >
            D'FOOTPRINT
          </span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: [
        {
          name: "Inter",
          data: boldFont,
          style: "normal",
          weight: 700,
        },
      ],
    },
  );
}