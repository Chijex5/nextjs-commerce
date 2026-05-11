import { Container, Img, Link, Text } from "../react-email-components";

interface MarketingEmailProps {
  campaign: {
    type: "JUST_ARRIVED" | "SALE" | "COLLECTION";
    headerTitle?: string | null;
    headerSubtitle?: string | null;
    footerText?: string | null;
    ctaButtonText?: string | null;
    ctaButtonUrl?: string | null;
    products: Array<{
      id: string;
      handle: string;
      title: string;
      description?: string;
      image?: string;
    }>;
  };
  subscriber: {
    name?: string | null;
    email?: string | null;
  };
}

const DESCRIPTION_MAX_LENGTH = 120;

export default function MarketingCampaignBase({
  campaign,
  subscriber,
}: MarketingEmailProps) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const productPlaceholder = `${siteUrl}/images/product-placeholder.png`;
  const firstName = subscriber?.name?.trim()?.split(/\s+/)[0] || "there";

  const normalizeUrl = (url?: string | null) => {
    if (!url) return undefined;
    if (/^https?:\/\//i.test(url)) return url;
    return `${siteUrl}${url.startsWith("/") ? url : `/${url}`}`;
  };

  const campaignTypeLabel = campaign.type.replace(/_/g, " ").toLowerCase();
  const primaryCtaText = campaign.ctaButtonText || "Browse the Collection";
  const primaryCtaUrl =
    normalizeUrl(campaign.ctaButtonUrl) || `${siteUrl}/products`;

  return (
    <Container style={container}>
      <Text style={eyebrow}>{campaignTypeLabel}</Text>
      <Text style={title}>
        {campaign.headerTitle || "Handcrafted picks we chose for you."}
      </Text>

      <Text style={intro}>
        Hi {firstName},{" "}
        {campaign.headerSubtitle ||
          "Here are a few pieces from our latest release, selected for quality, fit, and finish."}
      </Text>

      <div style={divider} />

      {campaign.products.map((product) => {
        const productHref = `${siteUrl}/product/${product.handle}`;
        const image = product.image || productPlaceholder;
        const description = product.description?.trim();
        return (
          <div key={product.id} style={productRow}>
            <Link href={productHref} style={imageLink}>
              <Img
                src={image}
                alt={product.title}
                width="96"
                height="96"
                style={productImage}
              />
            </Link>
            <div style={productContent}>
              <Text style={productTitle}>{product.title}</Text>
              {description && (
                <Text style={productDescription}>
                  {description.length > DESCRIPTION_MAX_LENGTH
                    ? `${description.slice(0, DESCRIPTION_MAX_LENGTH)}…`
                    : description}
                </Text>
              )}
              <Link href={productHref} style={productLink}>
                View product
              </Link>
            </div>
          </div>
        );
      })}

      <div style={divider} />

      <Link href={primaryCtaUrl} className="button" style={button}>
        {primaryCtaText}
      </Link>
      <Link
        href={`${siteUrl}/products`}
        className="button-secondary"
        style={secondaryButton}
      >
        Explore all products
      </Link>

      {campaign.footerText && (
        <Text style={footerNote}>{campaign.footerText}</Text>
      )}
    </Container>
  );
}

const container = {
  margin: "0",
};

const eyebrow = {
  margin: "0 0 10px",
  fontSize: "11px",
  letterSpacing: "0.12em",
  textTransform: "uppercase" as const,
  color: "#9ca3af",
  fontWeight: 700,
};

const title = {
  margin: "0 0 16px",
  fontFamily: "Georgia, 'Times New Roman', Times, serif",
  color: "#111111",
  fontSize: "26px",
  fontWeight: 400,
  lineHeight: 1.3,
  letterSpacing: "-0.01em",
};

const intro = {
  margin: "0",
  fontSize: "14px",
  color: "#374151",
  lineHeight: 1.75,
};

const divider = {
  borderTop: "1px solid #e8e8e6",
  margin: "28px 0",
};

const productRow = {
  display: "table",
  width: "100%",
  borderCollapse: "collapse" as const,
  marginBottom: "16px",
};

const imageLink = {
  display: "table-cell",
  width: "108px",
  verticalAlign: "top" as const,
  textDecoration: "none",
};

const productImage = {
  width: "96px",
  height: "96px",
  borderRadius: "2px",
  display: "block",
  border: "1px solid #ededeb",
  objectFit: "cover" as const,
};

const productContent = {
  display: "table-cell",
  verticalAlign: "top" as const,
  paddingLeft: "12px",
};

const productTitle = {
  margin: "0 0 6px",
  fontSize: "14px",
  color: "#111111",
  fontWeight: 700,
  lineHeight: 1.5,
};

const productDescription = {
  margin: "0 0 8px",
  fontSize: "13px",
  color: "#6b7280",
  lineHeight: 1.65,
};

const productLink = {
  fontSize: "12px",
  letterSpacing: "0.04em",
  textTransform: "uppercase" as const,
  color: "#111111",
  fontWeight: 600,
  textDecoration: "underline",
  textUnderlineOffset: "2px",
};

const button = {
  display: "block",
  textAlign: "center" as const,
};

const secondaryButton = {
  display: "block",
  textAlign: "center" as const,
  marginTop: "10px",
};

const footerNote = {
  margin: "24px 0 0",
  fontSize: "13px",
  color: "#6b7280",
  lineHeight: 1.7,
};
