import { baseTemplate } from "@/lib/email/templates/base";
import { buildCollectionContent } from "@/lib/email/templates/marketing-collection";
import { buildJustArrivedContent } from "@/lib/email/templates/marketing-just-arrived";
import { buildSaleContent } from "@/lib/email/templates/marketing-sale";
import {
  MarketingCampaign,
  MarketingCampaignProduct,
  MarketingSubscriber,
  renderVariables,
} from "@/lib/email/templates/marketing-campaign-base";

export type {
  MarketingCampaign,
  MarketingCampaignProduct,
  MarketingSubscriber,
};

function getSiteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
}

export function renderMarketingCampaignBody(
  campaign: MarketingCampaign,
  subscriber: MarketingSubscriber,
  siteUrl = getSiteUrl(),
): string {
  switch (campaign.type) {
    case "JUST_ARRIVED":
      return buildJustArrivedContent(campaign, subscriber, siteUrl);
    case "SALE":
      return buildSaleContent(campaign, subscriber, siteUrl);
    case "COLLECTION":
    default:
      return buildCollectionContent(campaign, subscriber, siteUrl);
  }
}

export function renderMarketingCampaignEmail(
  campaign: MarketingCampaign,
  subscriber: MarketingSubscriber,
  unsubscribeUrl: string,
): string {
  const siteUrl = getSiteUrl();
  return baseTemplate(
    renderMarketingCampaignBody(campaign, subscriber, siteUrl),
    unsubscribeUrl,
  );
}

export function renderMarketingSubject(
  campaign: MarketingCampaign,
  subscriber: MarketingSubscriber,
): string {
  return renderVariables(campaign.subject, {
    campaign,
    subscriber,
    siteUrl: getSiteUrl(),
  });
}
