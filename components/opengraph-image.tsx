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
};

export default async function OpengraphImage(
  props?: Props,
): Promise<ImageResponse> {
  const {
    title = siteName,
    description = "Handcrafted in Nigeria",
    badge = "PREMIUM SLIDES",
    price,
    showLogo = true,
  } = props || {};

  const boldFile = await readFile(
    join(process.cwd(), "./fonts/Inter-Bold.ttf"),
  );
  const boldFont = Uint8Array.from(boldFile).buffer;

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          height: "100%",
          width: "100%",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "space-between",
          backgroundColor: "#000000",
          padding: "60px",
          fontFamily: "Inter",
        }}
      >
        {/* Top Section - Badge & Logo */}
        <div
          style={{
            display: "flex",
            width: "100%",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
          >
            <div
              style={{
                fontSize: "14px",
                fontWeight: "600",
                color: "#F4A855",
                letterSpacing: "2px",
                textTransform: "uppercase",
              }}
            >
              {badge}
            </div>
          </div>

          {showLogo && (
            <div
              style={{
                fontSize: "28px",
                fontWeight: "700",
                color: "#FFFFFF",
                letterSpacing: "3px",
              }}
            >
              D'FOOTPRINT
            </div>
          )}
        </div>

        {/* Middle Section - Main Content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "24px",
            flex: 1,
            justifyContent: "center",
          }}
        >
          <h1
            style={{
              fontSize: "72px",
              fontWeight: "700",
              color: "#FFFFFF",
              margin: "0",
              lineHeight: "1.1",
              maxWidth: "600px",
            }}
          >
            {title}
          </h1>

          <p
            style={{
              fontSize: "24px",
              fontWeight: "400",
              color: "#CCCCCC",
              margin: "0",
              maxWidth: "600px",
              lineHeight: "1.5",
              fontStyle: "italic",
            }}
          >
            {description}
          </p>
        </div>

        {/* Bottom Section - Price & CTA */}
        <div
          style={{
            display: "flex",
            width: "100%",
            justifyContent: "space-between",
            alignItems: "flex-end",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
          >
            {price && (
              <div
                style={{
                  fontSize: "32px",
                  fontWeight: "700",
                  color: "#FFFFFF",
                }}
              >
                {price}
              </div>
            )}
            <div
              style={{
                fontSize: "16px",
                fontWeight: "600",
                color: "#000000",
                backgroundColor: "#F4A855",
                padding: "12px 32px",
                borderRadius: "8px",
              }}
            >
              Shop Collection
            </div>
          </div>
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
