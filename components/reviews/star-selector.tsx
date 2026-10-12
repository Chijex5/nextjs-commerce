"use client";

import { useState } from "react";

interface StarSelectorProps {
  value: number;
  onChange: (value: number) => void;
  size?: "sm" | "md" | "lg";
}

export function StarSelector({
  value,
  onChange,
  size = "lg",
}: StarSelectorProps) {
  const [hoverValue, setHoverValue] = useState<number | null>(null);

  const sizeClasses = {
    sm: "text-xl",
    md: "text-2xl",
    lg: "text-3xl",
  };

  const getRatingText = (rating: number) => {
    const texts = ["", "Poor", "Fair", "Good", "Very Good", "Excellent"];
    return texts[rating] || "";
  };

  const displayValue = hoverValue !== null ? hoverValue : value;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-1 sm:gap-1.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            className={`${sizeClasses[size]} px-0.5 transition-colors focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current`}
            onClick={() => onChange(star)}
            onMouseEnter={() => setHoverValue(star)}
            onMouseLeave={() => setHoverValue(null)}
            aria-label={`Rate ${star} stars`}
          >
            <span
              className={
                star <= displayValue ? "text-fg" : "text-fg-3 opacity-40"
              }
            >
              ★
            </span>
          </button>
        ))}
      </div>
      {displayValue > 0 && (
        <p className="text-sm text-fg-2">{getRatingText(displayValue)}</p>
      )}
    </div>
  );
}
