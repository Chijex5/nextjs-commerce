import { escapeHtml } from "./email-utils";

type CampaignProduct = {
  id: string;
  handle: string;
  title: string;
  description?: string | null;
  image?: string | null;
  price?: string | null;
};

type Campaign = {
  type: "JUST_ARRIVED" | "SALE" | "COLLECTION";
  headerTitle?: string | null;
  headerSubtitle?: string | null;
  footerText?: string | null;
  ctaButtonText?: string | null;
  ctaButtonUrl?: string | null;
  products: CampaignProduct[];
  name?: string;
};

type Subscriber = { name?: string | null; email?: string | null };

/**
 * Build the inner HTML content block for marketing campaigns.
 * This returns a string (not JSX) and is later passed into `baseTemplate`.
 */
export function buildMarketingCampaignContent(
  campaign: Campaign,
  subscriber: Subscriber,
  siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
): string {
  const placeholder = `${siteUrl}/images/product-placeholder.png`;
  const fullName = subscriber.name?.trim() || "there";
  const firstName = fullName.split(/\s+/)[0] || "there";

  const title = escapeHtml(
    campaign.headerTitle || "Handcrafted picks for you.",
  );
  const subtitle = escapeHtml(
    campaign.headerSubtitle ||
      "Here are a few pieces from our latest release, selected for quality, fit, and finish.",
  );
  const footer = escapeHtml(campaign.footerText || "");
  const ctaText = escapeHtml(campaign.ctaButtonText || "Browse the collection");
  const ctaUrl = escapeHtml(
    campaign.ctaButtonUrl && /^https?:\/\//i.test(campaign.ctaButtonUrl)
      ? campaign.ctaButtonUrl
      : `${siteUrl}${campaign.ctaButtonUrl?.startsWith("/") ? campaign.ctaButtonUrl : `/${campaign.ctaButtonUrl || "products"}`}`,
  );

  // Build product grid: two columns per row on desktop, single column on mobile
  const products = campaign.products || [];
  const productCells: string[] = [];
  for (let i = 0; i < products.length; i += 2) {
    const left = products[i];
    const right = products[i + 1];

    const leftHtml = left ? productCardHtml(left, placeholder, siteUrl) : "";
    const rightHtml = right ? productCardHtml(right, placeholder, siteUrl) : "";

    productCells.push(`
      <tr>
        <td style="vertical-align:top;padding:0 8px 18px;" width="50%">${leftHtml}</td>
        <td style="vertical-align:top;padding:0 8px 18px;" width="50%">${rightHtml}</td>
      </tr>
    `);
  }

  // Top visual treatments
  let topVisual = "";
  if (campaign.type === "JUST_ARRIVED") {
    topVisual = `<div style="background:#111111;color:#ffffff;padding:8px 12px;text-align:center;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;font-weight:700;margin:0 0 16px;">New arrival</div>`;
  } else if (campaign.type === "SALE") {
    topVisual = `<div style="border-left:4px solid #111111;padding:12px 16px;background:#f8f8f7;margin:0 0 16px;">
      <p style="margin:0;font-size:20px;font-weight:700;color:#111111;">${escapeHtml(campaign.headerTitle || "Special offer")}</p>
      <p style="margin:6px 0 0;color:#6b7280;font-size:14px;">${escapeHtml(campaign.headerSubtitle || "Limited time offer — details inside.")}</p>
    </div>`;
  } else if (campaign.type === "COLLECTION") {
    topVisual = `<div style="margin:0 0 16px;">
      <h1 style="margin:0 0 8px;font-family:Georgia,'Times New Roman',Times,serif;color:#111111;font-size:30px;font-weight:400;line-height:1.2;">${title}</h1>
      <p style="margin:0;color:#6b7280;font-size:15px;">${subtitle}</p>
    </div>`;
  }

  return `
    <div style="margin:0;">
      <p style="margin:0 0 10px;font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#9ca3af;font-weight:700;">${escapeHtml(campaign.type.replace(/_/g, " "))}</p>
      ${campaign.type === "COLLECTION" ? "" : `<h2 style="margin:0 0 12px;font-family:Georgia,'Times New Roman',Times,serif;color:#111111;font-size:22px;font-weight:400;line-height:1.3;">${title}</h2>`}
      ${campaign.type === "COLLECTION" ? "" : `<p style="margin:0 0 12px;font-size:14px;color:#374151;line-height:1.75;">Hi ${escapeHtml(firstName)}, ${subtitle}</p>`}

      ${topVisual}

      <div style="border-top:1px solid #e8e8e6;margin:18px 0 22px;"></div>

      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;" class="product-grid">
        ${productCells.join("\n")}
      </table>

      <div style="border-top:1px solid #e8e8e6;margin:22px 0 22px;"></div>

      <a href="${ctaUrl}" class="button" style="display:block;text-align:center;">${ctaText}</a>
      <a href="${escapeHtml(`${siteUrl}/products`)}" class="button-secondary" style="display:block;text-align:center;margin-top:10px;">Explore all products</a>

      ${footer ? `<div style="margin:24px 0 0;"><p style="margin:0;font-size:13px;color:#6b7280;line-height:1.7;">${footer}</p></div>` : ""}
    </div>
  `;
}

function productCardHtml(
  product: CampaignProduct,
  placeholder: string,
  siteUrl: string,
) {
  const productUrl = `${siteUrl}/product/${product.handle}`;
  const image = escapeHtml(product.image || placeholder);
  const title = escapeHtml(product.title);
  const description = product.description
    ? escapeHtml(truncate(product.description, 120))
    : "";
  const price = product.price
    ? `<p style="margin:0 0 8px;font-size:13px;color:#111111;font-weight:700;">${escapeHtml(product.price)}</p>`
    : "";

  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
      <tr>
        <td style="padding:0 0 8px;text-align:center;">
          <a href="${escapeHtml(productUrl)}" style="text-decoration:none;display:inline-block;">
            <img src="${image}" width="200" height="200" alt="${title}" style="display:block;width:200px;height:200px;object-fit:cover;border:1px solid #ededeb;border-radius:2px;margin:0 auto;" />
          </a>
        </td>
      </tr>
      <tr>
        <td style="padding:0 8px 0;text-align:left;">
          <p style="margin:0 0 6px;font-size:14px;color:#111111;font-weight:700;line-height:1.3;">${title}</p>
          ${price}
          ${description ? `<p style="margin:0 0 8px;font-size:13px;color:#6b7280;line-height:1.65;">${description}</p>` : ""}
          <a href="${escapeHtml(productUrl)}" style="font-size:12px;letter-spacing:.04em;text-transform:uppercase;color:#111111;font-weight:600;text-decoration:underline;text-underline-offset:2px;">View product</a>
        </td>
      </tr>
    </table>
  `;
}

function truncate(s: string, n: number) {
  const t = s.trim();
  return t.length > n ? `${t.slice(0, n)}…` : t;
}
