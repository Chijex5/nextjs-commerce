import MarketingCampaignBase from "./marketing-campaign-base";

interface MarketingEmailProps {
  campaign: any;
  subscriber: any;
}

export default function CollectionTemplate({
  campaign,
  subscriber,
}: MarketingEmailProps) {
  // Enhance campaign data with Collection specific messaging
  const enhancedCampaign = {
    ...campaign,
    headerTitle: campaign.headerTitle || "✨ New Collection",
    headerSubtitle:
      campaign.headerSubtitle || "Explore our latest curated selection",
    ctaButtonText: campaign.ctaButtonText || "Browse Collection",
    ctaButtonUrl: campaign.ctaButtonUrl || "/products",
    footerText:
      campaign.footerText ||
      "Exclusively designed and crafted with quality in mind.",
  };

  return (
    <MarketingCampaignBase
      campaign={enhancedCampaign}
      subscriber={subscriber}
    />
  );
}
