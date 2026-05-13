import { buildMarketingCampaignContent } from "./marketing-campaign-base";

interface MarketingEmailProps {
  campaign: any;
  subscriber: any;
}

export default function JustArrivedTemplate({
  campaign,
  subscriber,
}: MarketingEmailProps) {
  // Enhance campaign data with Just Arrived specific messaging (no emoji)
  const enhancedCampaign = {
    ...campaign,
    headerTitle: campaign.headerTitle || "Just Arrived",
    headerSubtitle: campaign.headerSubtitle || "Discover our latest collection",
    ctaButtonText: campaign.ctaButtonText || "Shop Now",
    ctaButtonUrl: campaign.ctaButtonUrl || "/products",
    footerText:
      campaign.footerText || "Don't miss out — these styles are limited.",
  };

  return buildMarketingCampaignContent(enhancedCampaign, subscriber);
}
