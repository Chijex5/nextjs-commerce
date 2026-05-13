import { escapeHtml } from "./email-utils";
import {
  MarketingCampaign,
  MarketingSubscriber,
  normalizeUrl,
  renderHeroImage,
  renderProductGrid,
  renderVariables,
} from "./marketing-campaign-base";

export function buildJustArrivedContent(
  campaign: MarketingCampaign,
  subscriber: MarketingSubscriber,
  siteUrl: string,
): string {
  const context = { campaign, subscriber, siteUrl };
  const title = renderVariables(
    campaign.headerTitle || "Fresh pieces just landed, {{firstName}}.",
    context,
  );
  const subtitle = renderVariables(
    campaign.headerSubtitle ||
      "New handmade pairs from the D'FOOTPRINT workshop, cut and finished with quiet precision.",
    context,
  );
  const ctaText = renderVariables(
    campaign.ctaButtonText || "Shop new arrivals",
    context,
  );
  const ctaUrl = normalizeUrl(
    renderVariables(campaign.ctaButtonUrl, context),
    siteUrl,
  );
  const footer = renderVariables(campaign.footerText, context);

  return `
    ${renderHeroImage(campaign, siteUrl, "D'FOOTPRINT new handmade footwear")}

    <p style="margin:0 0 10px;font-size:10px;letter-spacing:0.16em;text-transform:uppercase;color:#9ca3af;font-weight:700;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;">JUST DROPPED</p>
    <h2 style="margin:0 0 14px;font-family:Georgia,'Times New Roman',Times,serif;font-size:26px;line-height:1.3;font-weight:400;color:#111111;letter-spacing:-0.01em;">${escapeHtml(title)}</h2>
    <p style="margin:0;font-size:14px;color:#374151;line-height:1.75;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;">${escapeHtml(subtitle)}</p>

    ${renderProductGrid(campaign.products || [], siteUrl)}

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="width:100%;border-collapse:collapse;margin:28px 0 0;">
      <tr>
        <td style="padding:0;text-align:left;">
          <a href="${escapeHtml(ctaUrl)}" class="button">${escapeHtml(ctaText)}</a>
        </td>
      </tr>
    </table>

    ${
      footer
        ? `<p style="margin:20px 0 0;font-size:13px;font-style:italic;color:#6b7280;line-height:1.7;font-family:Georgia,'Times New Roman',Times,serif;">${escapeHtml(footer)}</p>`
        : ""
    }`;
}
