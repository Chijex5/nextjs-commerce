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
            className={`${sizeClasses[size]} rounded px-0.5 transition-colors focus:outline-none focus:ring-2 focus:ring-neutral-400 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-neutral-500 dark:focus:ring-offset-neutral-950`}
            onClick={() => onChange(star)}
            onMouseEnter={() => setHoverValue(star)}
            onMouseLeave={() => setHoverValue(null)}
            aria-label={`Rate ${star} stars`}
          >
            <span
              className={
                star <= displayValue
                  ? "text-amber-500"
                  : "text-neutral-300 dark:text-neutral-700"
              }
            >
              ★
            </span>
          </button>
        ))}
      </div>
      {displayValue > 0 && (
        <p className="text-sm text-neutral-600 dark:text-neutral-300">
          {getRatingText(displayValue)}
        </p>
      )}
    </div>
  );
}
