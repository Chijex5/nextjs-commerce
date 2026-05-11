import MarketingCampaignBase from "./marketing-campaign-base";

interface MarketingEmailProps {
  campaign: any;
  subscriber: any;
}

export default function JustArrivedTemplate({
  campaign,
  subscriber,
}: MarketingEmailProps) {
  // Enhance campaign data with Just Arrived specific messaging
  const enhancedCampaign = {
    ...campaign,
    headerTitle: campaign.headerTitle || "🎉 Just Arrived!",
    headerSubtitle: campaign.headerSubtitle || "Discover our latest collection",
    ctaButtonText: campaign.ctaButtonText || "Shop Now",
    ctaButtonUrl: campaign.ctaButtonUrl || "/products",
    footerText:
      campaign.footerText ||
      "Don't miss out! These styles are flying off the shelves.",
  };

  return (
    <MarketingCampaignBase
      campaign={enhancedCampaign}
      subscriber={subscriber}
    />
  );
}
