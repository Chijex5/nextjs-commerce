import { buildMarketingCampaignContent } from "./marketing-campaign-base";

interface MarketingEmailProps {
  campaign: any;
  subscriber: any;
}

export default function SaleTemplate({
  campaign,
  subscriber,
}: MarketingEmailProps) {
  // Enhance campaign data with Sale specific messaging (no emoji)
  const enhancedCampaign = {
    ...campaign,
    headerTitle: campaign.headerTitle || "Limited time sale",
    headerSubtitle: campaign.headerSubtitle || "Up to 50% off selected items",
    ctaButtonText: campaign.ctaButtonText || "Shop Sale",
    ctaButtonUrl: campaign.ctaButtonUrl || "/products?sort=sale",
    footerText:
      campaign.footerText ||
      "Offer valid for a limited time only. Terms apply.",
  };

  return buildMarketingCampaignContent(enhancedCampaign, subscriber);
}
