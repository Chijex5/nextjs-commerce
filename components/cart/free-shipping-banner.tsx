"use client";

interface FreeShippingBannerProps {
  cartTotal: number;
  threshold?: number;
}

export default function FreeShippingBanner({
  cartTotal,
  threshold = 50000,
}: FreeShippingBannerProps) {
  const remaining = threshold - cartTotal;
  const progress = Math.min((cartTotal / threshold) * 100, 100);
  const qualified = cartTotal >= threshold;

  if (qualified) {
    return (
      <div className="border border-neutral-200 bg-white p-4">
        <p className="text-sm font-medium text-neutral-900">
          You've qualified for FREE SHIPPING!
        </p>
        <div className="mt-2 h-2 w-full bg-neutral-100">
          <div className="h-full bg-neutral-900" style={{ width: "100%" }} />
        </div>
      </div>
    );
  }

  return (
    <div className="border border-neutral-200 bg-white p-4">
      <p className="text-sm text-neutral-700">
        Add{" "}
        <span className="font-medium text-neutral-900">
          ₦{remaining.toFixed(2)}
        </span>{" "}
        more for <span className="font-medium">FREE SHIPPING!</span>
      </p>
      <div className="mt-2 h-2 w-full bg-neutral-100">
        <div
          className="h-full bg-neutral-900 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
