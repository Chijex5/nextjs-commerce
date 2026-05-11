import MarketingCampaignBase from "./marketing-campaign-base";

interface MarketingEmailProps {
  campaign: any;
  subscriber: any;
}

export default function SaleTemplate({
  campaign,
  subscriber,
}: MarketingEmailProps) {
  // Enhance campaign data with Sale specific messaging
  const enhancedCampaign = {
    ...campaign,
    headerTitle: campaign.headerTitle || "🛍️ Limited Time Sale!",
    headerSubtitle: campaign.headerSubtitle || "Up to 50% off selected items",
    ctaButtonText: campaign.ctaButtonText || "Shop Sale",
    ctaButtonUrl: campaign.ctaButtonUrl || "/products?sort=sale",
    footerText:
      campaign.footerText ||
      "Offer valid for a limited time only. Hurry before items sell out!",
  };

  return (
    <MarketingCampaignBase
      campaign={enhancedCampaign}
      subscriber={subscriber}
    />
  );
}
