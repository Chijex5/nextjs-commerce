import { escapeHtml } from "./email-utils";

// ─── Types ────────────────────────────────────────────────────────────────────

export type MarketingCampaignProduct = {
  id: string;
  handle: string;
  title: string;
  description?: string | null;
  image?: string | null;
  price?: string | null;
  compareAtPrice?: string | null;
};

export type CampaignType = "JUST_ARRIVED" | "SALE" | "COLLECTION" | "CUSTOM";

// ─── Custom campaign blocks ─────────────────────────────────────────────────────
// A CUSTOM campaign is a composable list of blocks instead of a fixed template
// shape. Every block is a small, self-describing object that maps to one of the
// shared render helpers below.

export type CampaignBlock =
  | {
      type: "heading";
      text: string;
      eyebrow?: string;
      align?: "left" | "center";
    }
  | { type: "text"; text: string; style?: "normal" | "quote" }
  | { type: "image"; url: string; href?: string; alt?: string }
  | {
      type: "button";
      text: string;
      url: string;
      variant?: "primary" | "secondary";
    }
  | { type: "products" }
  | { type: "coupon"; code: string; label?: string; deadline?: string | null }
  | { type: "divider" }
  | { type: "spacer"; size?: "sm" | "md" | "lg" };

export const CAMPAIGN_BLOCK_TYPES: CampaignBlock["type"][] = [
  "heading",
  "text",
  "image",
  "products",
  "coupon",
  "button",
  "divider",
  "spacer",
];

export type MarketingCampaign = {
  id: string;
  name: string;
  type: CampaignType;
  subject: string;
  preheader?: string | null;
  headerTitle?: string | null;
  headerSubtitle?: string | null;
  footerText?: string | null;
  ctaButtonText?: string | null;
  ctaButtonUrl?: string | null;
  heroImageUrl?: string | null;
  discountPercentage?: number | null;
  couponCode?: string | null;
  saleDeadline?: Date | string | null;
  discountNote?: string | null;
  blocks?: CampaignBlock[] | null;
  products: MarketingCampaignProduct[];
};

export type MarketingSubscriber = {
  name?: string | null;
  email?: string | null;
};

type VariableContext = {
  campaign: MarketingCampaign;
  subscriber: MarketingSubscriber;
  siteUrl: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

export const templateLabels: Record<MarketingCampaign["type"], string> = {
  JUST_ARRIVED: "Just arrived",
  SALE: "Sale",
  COLLECTION: "Collection",
  CUSTOM: "Custom",
};

export function getFirstName(subscriber: MarketingSubscriber) {
  return subscriber.name?.trim().split(/\s+/)[0] || "there";
}

export function normalizeUrl(url: string | null | undefined, siteUrl: string) {
  if (!url) return `${siteUrl}/products`;
  if (/^https?:\/\//i.test(url)) return url;
  return `${siteUrl}${url.startsWith("/") ? url : `/${url}`}`;
}

export function renderVariables(
  value: string | null | undefined,
  { campaign, subscriber, siteUrl }: VariableContext,
) {
  if (!value) return "";
  const fullName = subscriber.name?.trim() || "there";
  const featuredProduct = campaign.products[0];
  const variables: Record<string, string> = {
    name: fullName,
    firstName: getFirstName(subscriber),
    email: subscriber.email || "",
    campaignName: campaign.name,
    campaignType: templateLabels[campaign.type],
    productCount: String(campaign.products.length),
    firstProduct: featuredProduct?.title || "",
    siteUrl,
  };
  return value.replace(/{{\s*([a-zA-Z][\w]*)\s*}}/g, (match, key) => {
    return Object.prototype.hasOwnProperty.call(variables, key)
      ? (variables[key] ?? "")
      : match;
  });
}

export function renderHeroImage(
  campaign: MarketingCampaign,
  siteUrl: string,
  alt = "D'FOOTPRINT handmade footwear",
) {
  if (!campaign.heroImageUrl) return "";
  const heroUrl = normalizeUrl(campaign.heroImageUrl, siteUrl);
  const heroHref = normalizeUrl(campaign.ctaButtonUrl, siteUrl);
  return `
    <div style="margin:-36px -40px 32px;overflow:hidden;background-color:#1a1a1a;line-height:0;">
      <a href="${escapeHtml(heroHref)}" target="_blank" rel="noopener noreferrer" style="display:block;text-decoration:none;line-height:0;">
        <img src="${escapeHtml(heroUrl)}" alt="${escapeHtml(alt)}" width="600" style="display:block;width:100%;max-width:600px;height:auto;border:0;" />
      </a>
    </div>`;
}

export function formatSaleDate(deadline: Date | string | null | undefined) {
  if (!deadline) return "";
  const date = deadline instanceof Date ? deadline : new Date(deadline);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-NG", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

// ─── Price rendering ──────────────────────────────────────────────────────────

function extractNumeric(formatted: string): number {
  return parseFloat(formatted.replace(/[^0-9.]/g, "")) || 0;
}

function extractSymbol(formatted: string): string {
  return formatted.replace(/[0-9.,\s]/g, "").trim();
}

function renderSaleBadge(pct: number): string {
  return `<p style="margin:8px 0 5px;line-height:1;"><span style="display:inline-block;background-color:#111111;color:#ffffff;font-size:10px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;padding:3px 8px;border-radius:2px;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;">${pct}% OFF</span></p>`;
}

function renderPriceHtml(
  product: MarketingCampaignProduct,
  discountPercentage?: number | null,
): string {
  if (!product.price) return "";

  // Case 1: product has its own compare-at price (per-product sale)
  if (product.compareAtPrice) {
    const origRaw = extractNumeric(product.compareAtPrice);
    const saleRaw = extractNumeric(product.price);
    const pct =
      origRaw > 0 && saleRaw < origRaw
        ? Math.round((1 - saleRaw / origRaw) * 100)
        : null;
    return `
      ${pct ? renderSaleBadge(pct) : ""}
      <p style="margin:4px 0 0;font-size:12px;line-height:1.6;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;">
        <span style="text-decoration:line-through;color:#9ca3af;">${escapeHtml(product.compareAtPrice)}</span>&nbsp;<span style="color:#111111;font-weight:700;font-size:13px;">${escapeHtml(product.price)}</span>
      </p>`;
  }

  // Case 2: campaign-level discount, no per-product compare-at
  if (discountPercentage != null && discountPercentage > 0) {
    const raw = extractNumeric(product.price);
    if (raw > 0) {
      const symbol = extractSymbol(product.price);
      const saleRaw = Math.round(raw * (1 - discountPercentage / 100));
      const origFormatted = escapeHtml(
        `${symbol} ${raw.toLocaleString("en-NG")}`,
      );
      const saleFormatted = escapeHtml(
        `${symbol} ${saleRaw.toLocaleString("en-NG")}`,
      );
      return `
        ${renderSaleBadge(discountPercentage)}
        <p style="margin:4px 0 0;font-size:12px;line-height:1.6;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;">
          <span style="text-decoration:line-through;color:#9ca3af;">${origFormatted}</span>&nbsp;<span style="color:#111111;font-weight:700;font-size:13px;">${saleFormatted}</span>
        </p>`;
    }
  }

  // Case 3: plain price, no discount
  return `<p style="margin:4px 0 0;font-size:12px;color:#6b7280;line-height:1.5;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;">${escapeHtml(product.price)}</p>`;
}

// ─── Product grid ─────────────────────────────────────────────────────────────

function renderProductVisual(
  product: MarketingCampaignProduct,
  productUrl: string,
) {
  if (!product.image) {
    return `
      <a href="${escapeHtml(productUrl)}" target="_blank" rel="noopener noreferrer" style="display:block;text-decoration:none;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" bgcolor="#f8f8f7" style="width:100%;height:200px;border-collapse:collapse;background-color:#f8f8f7;border-radius:2px;margin:0;">
          <tr><td height="200" style="height:200px;line-height:200px;font-size:0;padding:0;">&nbsp;</td></tr>
        </table>
      </a>`;
  }
  return `
    <a href="${escapeHtml(productUrl)}" target="_blank" rel="noopener noreferrer" style="display:block;text-decoration:none;line-height:0;">
      <img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.title)}" width="240" style="display:block;width:100%;height:200px;max-height:240px;object-fit:cover;border:0;border-radius:2px;" />
    </a>`;
}

function renderProductCell(
  product: MarketingCampaignProduct,
  siteUrl: string,
  layout: { paddingRight: number; paddingLeft: number },
  discountPercentage?: number | null,
) {
  const productUrl = normalizeUrl(`/product/${product.handle}`, siteUrl);
  // .mkt-col stacks to full width on mobile; .mkt-product-title / .mkt-product-link
  // pick up dark-mode colour overrides from the base template's stylesheet.
  return `
    <td width="50%" valign="top" class="mkt-col" style="width:50%;padding:0 ${layout.paddingRight}px 0 ${layout.paddingLeft}px;vertical-align:top;">
      ${renderProductVisual(product, productUrl)}
      <p class="mkt-product-title" style="margin:10px 0 0;font-size:13px;font-weight:700;color:#111111;line-height:1.4;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;">${escapeHtml(product.title)}</p>
      ${renderPriceHtml(product, discountPercentage)}
      <p style="margin:8px 0 0;line-height:1.4;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;">
        <a href="${escapeHtml(productUrl)}" target="_blank" rel="noopener noreferrer" class="mkt-product-link" style="font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#111111;font-weight:600;text-decoration:underline;text-underline-offset:3px;">View &rarr;</a>
      </p>
    </td>`;
}

// ─── Coupon box ─────────────────────────────────────────────────────────────────
// Shared between the SALE template and the CUSTOM "coupon" block so both render an
// identical dashed code card.

export function renderCouponBox(
  code: string | null | undefined,
  options: { label?: string; deadline?: string | null } = {},
): string {
  const couponCode = code?.trim().toUpperCase();
  if (!couponCode) return "";
  const label = options.label?.trim() || "USE CODE";
  const deadline = options.deadline?.trim();
  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="width:100%;border-collapse:collapse;margin:16px 0;">
      <tr>
        <td style="padding:14px 20px;text-align:center;border:1.5px dashed #111111;border-radius:2px;">
          <p style="margin:0 0 6px;font-size:10px;letter-spacing:0.16em;text-transform:uppercase;color:#9ca3af;font-weight:700;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;">${escapeHtml(label)}</p>
          <p style="margin:0;font-size:20px;font-weight:700;letter-spacing:0.15em;font-family:'Courier New',Courier,monospace;color:#111111;line-height:1.4;">${escapeHtml(couponCode)}</p>
          ${deadline ? `<p style="margin:6px 0 0;font-size:11px;color:#9ca3af;line-height:1.5;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;">Offer ends ${escapeHtml(deadline)}</p>` : ""}
        </td>
      </tr>
    </table>`;
}

export function renderProductGrid(
  products: MarketingCampaignProduct[],
  siteUrl: string,
  options: {
    rowPaddingBottom?: number;
    discountPercentage?: number | null;
  } = {},
) {
  const shownProducts = products.slice(0, 6);
  const hiddenCount = Math.max(products.length - shownProducts.length, 0);
  const rows: string[] = [];
  const rowPaddingBottom = options.rowPaddingBottom ?? 16;

  for (let i = 0; i < shownProducts.length; i += 2) {
    const left = shownProducts[i];
    const right = shownProducts[i + 1];
    rows.push(`
      <tr>
        ${left ? renderProductCell(left, siteUrl, { paddingRight: right ? 4 : 0, paddingLeft: 0 }, options.discountPercentage) : ""}
        ${right ? renderProductCell(right, siteUrl, { paddingRight: 0, paddingLeft: 4 }, options.discountPercentage) : ""}
      </tr>
      ${i + 2 < shownProducts.length ? `<tr><td colspan="2" height="${rowPaddingBottom}" style="height:${rowPaddingBottom}px;line-height:${rowPaddingBottom}px;font-size:0;padding:0;">&nbsp;</td></tr>` : ""}`);
  }

  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="width:100%;border-collapse:collapse;margin:28px 0 0;">
      ${rows.join("")}
    </table>
    ${hiddenCount > 0 ? `<p style="margin:14px 0 0;font-size:12px;color:#9ca3af;line-height:1.6;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;">+ ${hiddenCount} more in the collection</p>` : ""}`;
}
