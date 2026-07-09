import { escapeHtml } from "./email-utils";
import {
  MarketingCampaign,
  MarketingSubscriber,
  formatSaleDate,
  normalizeUrl,
  renderCouponBox,
  renderHeroImage,
  renderProductGrid,
  renderVariables,
} from "./marketing-campaign-base";

export function buildSaleContent(
  campaign: MarketingCampaign,
  subscriber: MarketingSubscriber,
  siteUrl: string,
): string {
  const context = { campaign, subscriber, siteUrl };
  const title = renderVariables(
    campaign.headerTitle || "A considered offer from D'FOOTPRINT.",
    context,
  );
  const subtitle = renderVariables(
    campaign.headerSubtitle || "Selected handmade styles for a limited time.",
    context,
  );
  const ctaText = renderVariables(
    campaign.ctaButtonText || "Shop the offer",
    context,
  );
  const ctaUrl = normalizeUrl(
    renderVariables(campaign.ctaButtonUrl, context),
    siteUrl,
  );
  const deadline = formatSaleDate(campaign.saleDeadline);
  const discountNote = renderVariables(campaign.discountNote, context);

  // discountPercentage is a number — use it directly, no escapeHtml needed
  const discountPct = campaign.discountPercentage ?? null;

  return `
    ${renderHeroImage(campaign, siteUrl, "D'FOOTPRINT sale footwear")}

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="width:100%;border-collapse:collapse;margin:0 0 16px;background-color:#f8f8f7;border-left:3px solid #111111;">
      <tr>
        <td style="padding:20px 16px;">
          ${
            discountPct
              ? `<p style="margin:0;font-family:Georgia,'Times New Roman',Times,serif;color:#111111;line-height:1;">
                   <span style="font-size:48px;font-weight:400;letter-spacing:-0.04em;">${discountPct}</span><span style="font-size:16px;letter-spacing:0.14em;text-transform:uppercase;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;font-weight:700;">% OFF</span>
                 </p>
                 <p style="margin:12px 0 0;font-size:14px;color:#374151;line-height:1.65;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;">${escapeHtml(title)}</p>`
              : `<h2 style="margin:0;font-family:Georgia,'Times New Roman',Times,serif;font-size:22px;line-height:1.3;font-weight:400;color:#111111;">${escapeHtml(title)}</h2>`
          }
          <p style="margin:10px 0 0;font-size:13px;color:#6b7280;line-height:1.7;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;">${escapeHtml(subtitle)}</p>
        </td>
      </tr>
    </table>

    ${renderCouponBox(campaign.couponCode, { deadline })}

    ${renderProductGrid(campaign.products || [], siteUrl, { discountPercentage: discountPct })}

    ${
      discountNote
        ? `<p style="margin:18px 0 0;font-size:12px;font-style:italic;color:#9ca3af;line-height:1.7;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;">${escapeHtml(discountNote)}</p>`
        : ""
    }

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="width:100%;border-collapse:collapse;margin:28px 0 0;">
      <tr>
        <td style="padding:0;text-align:left;">
          <a href="${escapeHtml(ctaUrl)}" class="button">${escapeHtml(ctaText)}</a>
        </td>
      </tr>
    </table>`;
}
