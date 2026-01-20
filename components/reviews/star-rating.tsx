"use client";

interface StarRatingProps {
  rating: number; // 0-5, can be decimal
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
  const sizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
  };

  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  return (
    <div className="flex items-center gap-1">
      <div className={`flex items-center ${sizeClasses[size]}`}>
        {[...Array(fullStars)].map((_, i) => (
          <span key={`full-${i}`} className="text-black">
            ★
          </span>
        ))}
        {hasHalfStar && (
          <span className="relative">
            <span className="text-neutral-300">★</span>
            <span
              className="absolute left-0 top-0 overflow-hidden text-black"
              style={{ width: "50%" }}
            >
              ★
            </span>
          </span>
        )}
        {[...Array(emptyStars)].map((_, i) => (
          <span key={`empty-${i}`} className="text-neutral-300">
            ★
          </span>
        ))}
      </div>
      {showCount && totalReviews !== undefined && (
        <span className="text-sm text-neutral-500">({totalReviews})</span>
      )}
    </div>
  );
}
