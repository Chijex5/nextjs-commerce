"use client";

import { AddToCart } from "components/cart/add-to-cart";
import LoadingDots from "components/loading-dots";
import Price from "components/price";
import Prose from "components/prose";
import { trackProductView } from "lib/analytics";
import { Product, ProductVariant } from "lib/shopify/types";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { VariantSelector } from "./variant-selector";

export function ProductDescription({
  product,
  reviewAggregate,
}: {
  product: Product;
  reviewAggregate?: { averageRating: number | null; reviewCount: number };
}) {
  const searchParams = useSearchParams();
  const [alertEmail, setAlertEmail] = useState("");
  const [alertLoading, setAlertLoading] = useState(false);

  const urlSelection = useMemo(() => {
    const selection: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      selection[key] = value;
    });
    return selection;
  }, [searchParams]);

  const [selectedOptions, setSelectedOptions] =
    useState<Record<string, string>>(urlSelection);

  useEffect(() => {
    setSelectedOptions((current) => {
      const keys = new Set([
        ...Object.keys(current),
        ...Object.keys(urlSelection),
      ]);
      for (const key of keys) {
        if ((current[key] ?? "") !== (urlSelection[key] ?? ""))
          return urlSelection;
      }
      return current;
    });
  }, [urlSelection]);

  const selectedVariant = product.variants.find((variant: ProductVariant) =>
    variant.selectedOptions.every(
      (option) => option.value === selectedOptions[option.name.toLowerCase()],
    ),
  );

  const displayVariant = selectedVariant || product.variants[0];
  const displayPrice = displayVariant
    ? displayVariant.price
    : product.priceRange.maxVariantPrice;

  const formatPrice = (amount: string, currencyCode: string) =>
    new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currencyCode,
      currencyDisplay: "narrowSymbol",
    }).format(parseFloat(amount));

  useEffect(() => {
    if (!displayPrice?.amount) return;
    trackProductView({
      id: product.id,
      name: product.title,
      price: parseFloat(displayPrice.amount),
    });
  }, [product.id, product.title, displayPrice.amount]);

  const handleAlertSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!alertEmail) return;
    setAlertLoading(true);
    try {
      const response = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: alertEmail }),
      });
      const data = await response.json();
      if (response.ok) {
        toast.success(data.message || "You're on the list!");
        setAlertEmail("");
      } else {
        toast.error(data.error || "Couldn't subscribe. Try again.");
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setAlertLoading(false);
    }
  };

  const hasVariedPricing =
    product.priceRange.minVariantPrice.amount !==
    product.priceRange.maxVariantPrice.amount;

  const ratingLabel =
    reviewAggregate && reviewAggregate.reviewCount > 0
      ? `${reviewAggregate.averageRating?.toFixed(1) ?? "0.0"} / 5 (${reviewAggregate.reviewCount} reviews)`
      : "No reviews yet";

  return (
    <>
      <style>{`
        .pd-root { display: flex; flex-direction: column; gap: 0; }

        /* ── TITLE BLOCK ── */
        .pd-header {
          padding-bottom: 28px;
          border-bottom: 1px solid rgba(242,232,213,0.09);
          margin-bottom: 28px;
        }
        .pd-eyebrow {
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 0.26em;
          text-transform: uppercase;
          color: var(--terra, #BF5A28);
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .pd-eyebrow::before {
          content: '';
          display: block;
          width: 24px;
          height: 1px;
          background: var(--terra, #BF5A28);
        }
        .pd-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(32px, 4vw, 52px);
          font-weight: 300;
          line-height: 1.0;
          color: var(--cream, #F2E8D5);
          margin-bottom: 18px;
        }
        .pd-pills {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 18px;
        }
        .pd-pill {
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          padding: 6px 14px;
          border: 1px solid rgba(242,232,213,0.09);
          color: var(--muted, #6A5A48);
          background: rgba(242,232,213,0.03);
        }
        .pd-pill-active {
          border-color: rgba(191,90,40,0.45);
          color: var(--cream, #F2E8D5);
          background: rgba(191,90,40,0.12);
        }

        /* ── PRICE ── */
        .pd-price-row {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 12px;
        }
        .pd-price-badge {
          padding: 10px 20px;
          background: var(--terra, #BF5A28);
          font-size: 16px;
          font-weight: 500;
          color: var(--cream, #F2E8D5);
        }
        .pd-price-badge p,
        .pd-price-badge span {
          color: var(--cream, #F2E8D5) !important;
          font-size: 16px !important;
          font-weight: 500 !important;
        }
        .pd-price-range {
          font-size: 12px;
          color: var(--muted, #6A5A48);
          letter-spacing: 0.04em;
        }

        /* ── DESCRIPTION ── */
        .pd-prose-wrap {
          margin-bottom: 24px;
        }
        .pd-prose-wrap p,
        .pd-prose-wrap li,
        .pd-prose-wrap span {
          font-size: 14px;
          line-height: 1.75;
          color: var(--sand, #C9B99A);
        }

        /* ── TRUST BULLETS ── */
        .pd-trust {
          border: 1px solid rgba(242,232,213,0.09);
          background: rgba(242,232,213,0.02);
          padding: 20px;
          margin-bottom: 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .pd-trust-item {
          display: flex;
          align-items: flex-start;
          gap: 14px;
        }
        .pd-trust-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--terra, #BF5A28);
          flex-shrink: 0;
          margin-top: 5px;
        }
        .pd-trust-title {
          font-size: 13px;
          font-weight: 500;
          color: var(--cream, #F2E8D5);
          margin-bottom: 3px;
        }
        .pd-trust-sub {
          font-size: 12px;
          color: var(--muted, #6A5A48);
          line-height: 1.5;
        }

        /* ── ALERT FORM ── */
        .pd-alert-form {
          margin-top: 16px;
          border: 1px solid rgba(242,232,213,0.09);
          background: rgba(242,232,213,0.02);
          padding: 18px 20px;
        }
        .pd-alert-title {
          font-size: 13px;
          font-weight: 500;
          color: var(--cream, #F2E8D5);
          margin-bottom: 4px;
        }
        .pd-alert-sub {
          font-size: 11px;
          color: var(--muted, #6A5A48);
          margin-bottom: 14px;
          letter-spacing: 0.03em;
        }
        .pd-alert-row {
          display: flex;
          gap: 8px;
        }
        .pd-alert-input {
          flex: 1;
          background: rgba(10,7,4,0.6);
          border: 1px solid rgba(242,232,213,0.09);
          color: var(--cream, #F2E8D5);
          font-family: 'DM Sans', sans-serif;
          font-size: 12px;
          padding: 10px 14px;
          outline: none;
          transition: border-color 0.2s;
        }
        .pd-alert-input::placeholder { color: var(--muted, #6A5A48); }
        .pd-alert-input:focus { border-color: rgba(191,90,40,0.5); }
        .pd-alert-btn {
          background: var(--terra, #BF5A28);
          border: none;
          color: var(--cream, #F2E8D5);
          font-family: 'DM Sans', sans-serif;
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          padding: 10px 18px;
          cursor: pointer;
          transition: background 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          min-width: 96px;
        }
        .pd-alert-btn:hover { background: #a34d22; }
        .pd-alert-btn:disabled { opacity: 0.5; cursor: not-allowed; }
      `}</style>

      <div className="pd-root">
        {/* Header */}
        <div className="pd-header">
          <div className="pd-eyebrow">Product details</div>
          <h1 className="pd-title">{product.title}</h1>

          <div className="pd-pills">
            <span
              className={`pd-pill ${product.availableForSale ? "pd-pill-active" : ""}`}
            >
              {product.availableForSale ? "In stock" : "Out of stock"}
            </span>
            <span className="pd-pill">{ratingLabel}</span>
          </div>

          <div className="pd-price-row">
            <div className="pd-price-badge">
              <Price
                amount={displayPrice.amount}
                currencyCode={displayPrice.currencyCode}
              />
            </div>
            {hasVariedPricing && (
              <span className="pd-price-range">
                {formatPrice(
                  product.priceRange.minVariantPrice.amount,
                  product.priceRange.minVariantPrice.currencyCode,
                )}{" "}
                —{" "}
                {formatPrice(
                  product.priceRange.maxVariantPrice.amount,
                  product.priceRange.maxVariantPrice.currencyCode,
                )}
              </span>
            )}
          </div>
        </div>

        {/* Variant selector */}
        <VariantSelector
          options={product.options}
          variants={product.variants}
          selectedOptions={selectedOptions}
          onOptionChangeAction={(name, value) =>
            setSelectedOptions((current) => ({ ...current, [name]: value }))
          }
        />

        {/* Description */}
        {product.descriptionHtml ? (
          <div className="pd-prose-wrap">
            <Prose
              className="text-sm leading-relaxed"
              html={product.descriptionHtml}
            />
          </div>
        ) : null}

        {/* Trust bullets */}
        <div className="pd-trust">
          {[
            {
              title: "Handcrafted quality",
              sub: "Made by hand in Lagos with attention to every detail.",
            },
            {
              title: "Nationwide delivery",
              sub: "We deliver across Nigeria with secure packaging.",
            },
            {
              title: "Custom requests",
              sub: "Need a different fit or style? Custom orders are welcome.",
            },
          ].map((item) => (
            <div key={item.title} className="pd-trust-item">
              <span className="pd-trust-dot" />
              <div>
                <p className="pd-trust-title">{item.title}</p>
                <p className="pd-trust-sub">{item.sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Add to cart */}
        <AddToCart product={product} selectedOptions={selectedOptions} />

        {/* Restock alert form */}
        <form onSubmit={handleAlertSubmit} className="pd-alert-form">
          <p className="pd-alert-title">Get restock & price drop alerts</p>
          <p className="pd-alert-sub">We will only send the good stuff.</p>
          <div className="pd-alert-row">
            <input
              type="email"
              value={alertEmail}
              onChange={(e) => setAlertEmail(e.target.value)}
              placeholder="you@email.com"
              required
              className="pd-alert-input"
            />
            <button
              type="submit"
              disabled={alertLoading}
              className="pd-alert-btn"
            >
              {alertLoading ? (
                <LoadingDots className="bg-[#F2E8D5]" />
              ) : (
                "Notify me"
              )}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
