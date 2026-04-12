"use client";

interface StarRatingProps {
  rating: number;
  totalReviews?: number;
  showCount?: boolean;
  size?: "sm" | "md" | "lg";
}

export function StarRating({
  rating,
  totalReviews,
  showCount = false,
  size = "md",
}: StarRatingProps) {
  const sizePx = { sm: "14px", md: "17px", lg: "20px" };
  const px = sizePx[size];

  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "1px" }}>
        {[...Array(fullStars)].map((_, i) => (
          <span
            key={`full-${i}`}
            style={{ fontSize: px, color: "var(--gold, #C0892A)", lineHeight: 1 }}
          >
            ★
          </span>
        ))}
        {hasHalfStar && (
          <span style={{ position: "relative", display: "inline-block", fontSize: px, lineHeight: 1 }}>
            <span style={{ color: "rgba(242,232,213,0.15)" }}>★</span>
            <span
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                overflow: "hidden",
                width: "50%",
                color: "var(--gold, #C0892A)",
                display: "block",
              }}
            >
              ★
            </span>
          </span>
        )}
        {[...Array(emptyStars)].map((_, i) => (
          <span
            key={`empty-${i}`}
            style={{ fontSize: px, color: "rgba(242,232,213,0.15)", lineHeight: 1 }}
          >
            ★
          </span>
        ))}
      </div>
      {showCount && totalReviews !== undefined && (
        <span style={{
          fontSize: "12px",
          color: "var(--muted, #6A5A48)",
          letterSpacing: "0.04em",
        }}>
          ({totalReviews})
        </span>
      )}
    </div>
  );
}