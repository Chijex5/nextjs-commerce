"use client";

import { ShieldCheckIcon, TruckIcon, SparklesIcon, HeartIcon } from "@heroicons/react/24/outline";

interface TrustBadge {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const badges: TrustBadge[] = [
  {
    icon: <SparklesIcon className="h-6 w-6" />,
    title: "Handmade in Nigeria",
    description: "Crafted with care by skilled artisans",
  },
  {
    icon: <ShieldCheckIcon className="h-6 w-6" />,
    title: "Secure Checkout",
    description: "Safe & encrypted payment processing",
  },
  {
    icon: <TruckIcon className="h-6 w-6" />,
    title: "Nationwide Delivery",
    description: "We deliver across Nigeria",
  },
  {
    icon: <HeartIcon className="h-6 w-6" />,
    title: "100% Satisfaction",
    description: "Quality guaranteed or your money back",
  },
];

interface TrustBadgesProps {
  variant?: "grid" | "inline";
  showIcons?: boolean;
}

export function TrustBadges({ variant = "grid", showIcons = true }: TrustBadgesProps) {
  if (variant === "inline") {
    return (
      <div className="flex flex-wrap items-center justify-center gap-6 py-4">
        {badges.map((badge, index) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            {showIcons && <div className="text-neutral-600 dark:text-neutral-400">{badge.icon}</div>}
            <span className="font-medium text-neutral-900 dark:text-neutral-100">
              {badge.title}
            </span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {badges.map((badge, index) => (
        <div
          key={index}
          className="flex flex-col items-center rounded-lg border border-neutral-200 bg-white p-6 text-center transition-shadow hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900"
        >
          <div className="mb-3 text-black dark:text-white">{badge.icon}</div>
          <h3 className="mb-1 font-semibold text-black dark:text-white">{badge.title}</h3>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">{badge.description}</p>
        </div>
      ))}
    </div>
  );
}
