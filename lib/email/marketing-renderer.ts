import { baseTemplate } from "@/lib/email/templates/base";

export type MarketingCampaignProduct = {
  id: string;
  handle: string;
  title: string;
  description?: string;
  image?: string;
  price?: string;
};

export type MarketingCampaign = {
  id: string;
  name: string;
  type: "JUST_ARRIVED" | "SALE" | "COLLECTION";
  subject: string;
  preheader?: string | null;
  headerTitle?: string | null;
  headerSubtitle?: string | null;
  footerText?: string | null;
  ctaButtonText?: string | null;
  ctaButtonUrl?: string | null;
  heroImageUrl?: string | null;
  products: MarketingCampaignProduct[];
};

export type MarketingSubscriber = {
  name?: string | null;
  email?: string | null;
};

type VariableContext = {
  campaign: MarketingCampaign;
  subscriber: MarketingSubscriber;
  siteUrl?: string;
};

const templateLabels: Record<MarketingCampaign["type"], string> = {
  JUST_ARRIVED: "New arrival",
  SALE: "Sale",
  COLLECTION: "Collection",
};

const templateDefaults: Record<
  MarketingCampaign["type"],
  { title: string; subtitle: string; cta: string; footer: string }
> = {
  JUST_ARRIVED: {
    title: "Fresh pieces just landed, {{firstName}}.",
    subtitle:
      "Be first to explore the latest Dfootprint drops selected for quality, fit, and finish.",
    cta: "Shop new arrivals",
    footer: "New styles move quickly. Pick your size before they sell out.",
  },
  SALE: {
    title: "A limited offer for you, {{firstName}}.",
    subtitle:
      "Use this campaign to explain the discount, sale window, coupon code, or special offer in plain language.",
    cta: "Shop the offer",
    footer:
      "Add discount terms, coupon details, deadlines, exclusions, or sales notes here.",
  },
  COLLECTION: {
    title: "A curated collection for you, {{firstName}}.",
    subtitle:
      "Explore a focused set of products grouped around one look, story, season, or customer need.",
    cta: "Browse collection",
    footer:
      "Need help choosing? Reply to this email and we will help you decide.",
  },
};

const htmlEscapeMap: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

export function escapeHtml(value: unknown): string {
  return String(value ?? "").replace(
    /[&<>"']/g,
    (char) => htmlEscapeMap[char] ?? char,
  );
}

function normalizeUrl(url: string | null | undefined, siteUrl: string): string {
  if (!url) return `${siteUrl}/products`;
  if (/^https?:\/\//i.test(url)) return url;
  return `${siteUrl}${url.startsWith("/") ? url : `/${url}`}`;
}

export function renderVariables(
  value: string | null | undefined,
  {
    campaign,
    subscriber,
    siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  }: VariableContext,
): string {
  if (!value) return "";

  const fullName = subscriber.name?.trim() || "there";
  const firstName = fullName.split(/\s+/)[0] || "there";
  const featuredProduct = campaign.products[0];
  const variables: Record<string, string> = {
    name: fullName,
    firstName,
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

function renderParagraphs(markdownLikeText: string): string {
  return markdownLikeText
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph) => {
      const lines = paragraph
        .split("\n")
        .map((line) => escapeHtml(line.trim()))
        .join("<br />");
      return `<p style="margin:0 0 16px;font-size:14px;color:#374151;line-height:1.75;">${lines}</p>`;
    })
    .join("");
}

export function renderMarketingCampaignBody(
  campaign: MarketingCampaign,
  subscriber: MarketingSubscriber,
): string {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const defaults = templateDefaults[campaign.type];
  const context = { campaign, subscriber, siteUrl };
  const title = renderVariables(
    campaign.headerTitle || defaults.title,
    context,
  );
  const subtitle = renderVariables(
    campaign.headerSubtitle || defaults.subtitle,
    context,
  );
  const footer = renderVariables(
    campaign.footerText || defaults.footer,
    context,
  );
  const ctaText = renderVariables(
    campaign.ctaButtonText || defaults.cta,
    context,
  );
  const ctaUrl = normalizeUrl(
    renderVariables(campaign.ctaButtonUrl, context),
    siteUrl,
  );
  const heroUrl = campaign.heroImageUrl ? normalizeUrl(campaign.heroImageUrl, siteUrl) : null;
  const placeholder = `${siteUrl}/images/product-placeholder.png`;

  const productsHtml = campaign.products
    .map((product) => {
      const productUrl = `${siteUrl}/product/${product.handle}`;
      const description = product.description?.trim();
      const truncatedDescription =
        description && description.length > 130
          ? `${description.slice(0, 130)}…`
          : description;
      const price = product.price
        ? `<p style="margin:0 0 8px;font-size:13px;color:#111111;font-weight:700;">${escapeHtml(product.price)}</p>`
        : "";

      return `
        <tr>
          <td style="padding:0 0 18px;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
              <tr>
                <td width="112" valign="top" style="padding:0 14px 0 0;">
                  <a href="${escapeHtml(productUrl)}" style="text-decoration:none;">
                    <img src="${escapeHtml(product.image || placeholder)}" width="96" height="96" alt="${escapeHtml(product.title)}" style="display:block;width:96px;height:96px;object-fit:cover;border:1px solid #ededeb;border-radius:2px;" />
                  </a>
                </td>
                <td valign="top" style="padding:0;">
                  <p style="margin:0 0 6px;font-size:14px;color:#111111;font-weight:700;line-height:1.5;">${escapeHtml(product.title)}</p>
                  ${price}
                  ${truncatedDescription ? `<p style="margin:0 0 8px;font-size:13px;color:#6b7280;line-height:1.65;">${escapeHtml(truncatedDescription)}</p>` : ""}
                  <a href="${escapeHtml(productUrl)}" style="font-size:12px;letter-spacing:.04em;text-transform:uppercase;color:#111111;font-weight:600;text-decoration:underline;text-underline-offset:2px;">View product</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>`;
    })
    .join("");

  return `
    <div style="margin:0;">
      ${heroUrl ? `
      <div style="margin: -36px -40px 32px; overflow: hidden; background-color: #1a1a1a; line-height: 0;">
        <a href="${siteUrl}/products" target="_blank" rel="noopener noreferrer" style="display: block; text-decoration: none; line-height: 0;">
          <img src="${escapeHtml(heroUrl)}" alt="" width="600" style="display: block; width: 100%; max-width: 600px; height: auto; border: 0;" />
        </a>
      </div>
      ` : ""}
      <p style="margin:0 0 10px;font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#9ca3af;font-weight:700;">${escapeHtml(templateLabels[campaign.type])}</p>
      <h1 style="margin:0 0 16px;font-family:Georgia,'Times New Roman',Times,serif;color:#111111;font-size:26px;font-weight:400;line-height:1.3;letter-spacing:-.01em;">${escapeHtml(title)}</h1>
      ${renderParagraphs(subtitle)}
      <div style="border-top:1px solid #e8e8e6;margin:28px 0;"></div>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">${productsHtml}</table>
      <div style="border-top:1px solid #e8e8e6;margin:28px 0;"></div>
      <a href="${escapeHtml(ctaUrl)}" class="button" style="display:block;text-align:center;">${escapeHtml(ctaText)}</a>
      <a href="${escapeHtml(`${siteUrl}/products`)}" class="button-secondary" style="display:block;text-align:center;margin-top:10px;">Explore all products</a>
      <div style="margin:24px 0 0;">${renderParagraphs(footer)}</div>
    </div>`;
}

export function renderMarketingCampaignEmail(
  campaign: MarketingCampaign,
  subscriber: MarketingSubscriber,
  unsubscribeUrl: string,
): string {
  return baseTemplate(
    renderMarketingCampaignBody(campaign, subscriber),
    unsubscribeUrl,
  );
}

export function renderMarketingSubject(
  campaign: MarketingCampaign,
  subscriber: MarketingSubscriber,
): string {
  return renderVariables(campaign.subject, { campaign, subscriber });
}
