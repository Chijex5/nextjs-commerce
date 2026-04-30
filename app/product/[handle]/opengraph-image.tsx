import { ImageResponse } from "next/og";
import { getProduct } from "lib/database";

type Props = {
  params: Promise<{ handle: string }>;
};

export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image(props: Props) {
  const params = await props.params;
  const product = await getProduct(params.handle);

  if (!product) {
    return new Response("Product not found", { status: 404 });
  }

  const price = product.priceRange?.minVariantPrice
    ? `₦${Number(product.priceRange.minVariantPrice).toLocaleString("en-NG", {
        minimumFractionDigits: 2,
      })}`
    : undefined;

  const productImage = product.images?.[0]?.url ?? null;

  // Truncate description to keep layout clean
  const description =
    product.description && product.description.length > 80
      ? product.description.slice(0, 80).trimEnd() + "…"
      : product.description || "Handcrafted with excellence";

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "1200px",
          height: "630px",
          backgroundColor: "#0c0c0c",
          fontFamily: "sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* ── Subtle grain overlay via radial gradient ── */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse at 30% 50%, rgba(255,255,255,0.03) 0%, transparent 70%)",
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
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginBottom: "32px",
            }}
          >
            {/* D' monogram */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "36px",
                height: "36px",
                border: "1.5px solid rgba(255,255,255,0.6)",
                borderRadius: "4px",
                color: "white",
                fontSize: "14px",
                fontWeight: 700,
                letterSpacing: "-0.5px",
              }}
            >
              D'
            </div>
            <span
              style={{
                color: "rgba(255,255,255,0.85)",
                fontSize: "14px",
                fontWeight: 600,
                letterSpacing: "2px",
                textTransform: "uppercase",
              }}
            >
              D'FOOTPRINT
            </span>
          </div>

          {/* Category label */}
          <span
            style={{
              color: "#d97b3a",
              fontSize: "13px",
              fontWeight: 700,
              letterSpacing: "3px",
              textTransform: "uppercase",
              marginBottom: "10px",
            }}
          >
            PREMIUM SLIDES
          </span>

          {/* Product Title */}
          <h1
            style={{
              color: "white",
              fontSize: "58px",
              fontWeight: 900,
              lineHeight: 1.0,
              margin: "0 0 20px 0",
              textTransform: "uppercase",
              letterSpacing: "-1px",
            }}
          >
            {product.title}
          </h1>

          {/* Divider */}
          <div
            style={{
              width: "48px",
              height: "2px",
              backgroundColor: "rgba(255,255,255,0.2)",
              marginBottom: "20px",
            }}
          />

          {/* Description */}
          <p
            style={{
              color: "rgba(255,255,255,0.55)",
              fontSize: "17px",
              fontStyle: "italic",
              lineHeight: 1.5,
              margin: "0 0 28px 0",
              maxWidth: "440px",
            }}
          >
            {description}
          </p>

          {/* Price */}
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

          {/* CTA Button */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "#d97b3a",
              color: "white",
              fontSize: "15px",
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
            gap: "20px",
            padding: "60px 56px 60px 0",
            position: "relative",
          }}
        >
          {/* "Handcrafted in Nigeria" badge — top right */}
          <div
            style={{
              display: "flex",
              position: "absolute",
              top: "48px",
              right: "0px",
              alignItems: "center",
              gap: "7px",
              backgroundColor: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: "999px",
              padding: "8px 16px",
              color: "rgba(255,255,255,0.85)",
              fontSize: "13px",
              fontWeight: 500,
            }}
          >
            <span style={{ color: "#d97b3a", fontSize: "11px" }}>✦</span>
            Handcrafted in Nigeria
          </div>

          {/* Product image */}
          <div
            style={{
              display: "flex",
              width: "280px",
              height: "280px",
              borderRadius: "24px",
              overflow: "hidden",
              backgroundColor: "#1a1a1a",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            {productImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={productImage}
                alt={product.title}
                width={280}
                height={280}
                style={{ objectFit: "cover", width: "100%", height: "100%" }}
              />
            ) : (
              /* Fallback placeholder */
              <div
                style={{
                  display: "flex",
                  width: "100%",
                  height: "100%",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "rgba(255,255,255,0.2)",
                  fontSize: "13px",
                }}
              >
                No image
              </div>
            )}
          </div>

          {/* Brand name below image */}
          <span
            style={{
              color: "white",
              fontSize: "28px",
              fontWeight: 900,
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
      ...size,
    }
  );
}