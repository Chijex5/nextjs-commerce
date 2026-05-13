import { escapeHtml } from "./email-utils";
import {
  MarketingCampaign,
  MarketingSubscriber,
  normalizeUrl,
  renderHeroImage,
  renderProductGrid,
  renderVariables,
} from "./marketing-campaign-base";

export function buildCollectionContent(
  campaign: MarketingCampaign,
  subscriber: MarketingSubscriber,
  siteUrl: string,
): string {
  const context = { campaign, subscriber, siteUrl };
  const title = renderVariables(
    campaign.headerTitle || "A focused edit for {{firstName}}.",
    context,
  );
  const subtitle = renderVariables(
    campaign.headerSubtitle ||
      "A quiet selection of handmade pairs, chosen for their shape, material, and finish.",
    context,
  );
  const footer = renderVariables(campaign.footerText, context);
  const ctaText = renderVariables(
    campaign.ctaButtonText || "Browse collection",
    context,
  );
  const ctaUrl = normalizeUrl(
    renderVariables(campaign.ctaButtonUrl, context),
    siteUrl,
  );
  const allProductsUrl = normalizeUrl("/products", siteUrl);

  return `
    ${renderHeroImage(campaign, siteUrl, "D'FOOTPRINT curated footwear edit")}

    <p style="margin:0 0 10px;font-size:10px;letter-spacing:0.16em;text-transform:uppercase;color:#9ca3af;font-weight:700;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;">THE EDIT</p>
    <h2 style="margin:0 0 24px;font-family:Georgia,'Times New Roman',Times,serif;font-size:28px;line-height:1.25;font-weight:400;color:#111111;letter-spacing:-0.01em;">${escapeHtml(title)}</h2>
    <p style="font-size:15px;color:#1a1a1a;line-height:1.8;font-family:Georgia,'Times New Roman',Times,serif;font-style:italic;margin:0 0 28px;border-left:3px solid #111111;padding-left:16px;">${escapeHtml(subtitle)}</p>

    ${renderProductGrid(campaign.products || [], siteUrl, { rowPaddingBottom: 20 })}

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="width:100%;border-collapse:collapse;margin:30px 0 0;">
      <tr>
        <td style="padding:0 0 10px;text-align:left;">
          <a href="${escapeHtml(ctaUrl)}" class="button">${escapeHtml(ctaText)}</a>
        </td>
      </tr>
      <tr>
        <td style="padding:0;text-align:left;">
          <a href="${escapeHtml(allProductsUrl)}" class="button-secondary">Explore all styles</a>
        </td>
      </tr>
    </table>

    ${
      footer
        ? `<p style="margin:20px 0 0;font-size:13px;color:#6b7280;line-height:1.7;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;">${escapeHtml(footer)}</p>`
        : ""
    }`;
}
