import {
  Button,
  Column,
  Container,
  Hr,
  Img,
  Link,
  Row,
  Section,
  Text,
} from "../react-email-components";

interface MarketingEmailProps {
  campaign: any;
  subscriber: any;
}

export default function MarketingCampaignBase({
  campaign,
  subscriber,
}: MarketingEmailProps) {
  const productUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  return (
    <Container style={container}>
      {/* Header */}
      <Section style={headerSection}>
        <Text style={headerTitle}>{campaign.headerTitle || "D'FOOTPRINT"}</Text>
        {campaign.headerSubtitle && (
          <Text style={headerSubtitle}>{campaign.headerSubtitle}</Text>
        )}
      </Section>

      <Hr style={hr} />

      {/* Featured Products */}
      <Section style={productsSection}>
        <Row>
          {campaign.products.map((product: any, idx: number) => (
            <Column key={idx} style={productColumn}>
              <Link href={`${productUrl}/product/${product.handle}`}>
                <Img
                  src={`${productUrl}/images/product-placeholder.png`}
                  alt={product.title}
                  width="150"
                  height="150"
                  style={productImage}
                />
              </Link>
              <Text style={productTitle}>{product.title}</Text>
              {product.description && (
                <Text style={productDescription}>
                  {product.description.substring(0, 100)}...
                </Text>
              )}
              <Link
                href={`${productUrl}/product/${product.handle}`}
                style={productLink}
              >
                View Product
              </Link>
            </Column>
          ))}
        </Row>
      </Section>

      <Hr style={hr} />

      {/* CTA Button */}
      {campaign.ctaButtonText && campaign.ctaButtonUrl && (
        <Section style={ctaSection}>
          <Button href={campaign.ctaButtonUrl} style={button}>
            {campaign.ctaButtonText}
          </Button>
        </Section>
      )}

      <Hr style={hr} />

      {/* Footer */}
      <Section style={footerSection}>
        {campaign.footerText && (
          <Text style={footerText}>{campaign.footerText}</Text>
        )}
        <Text style={companyInfo}>
          D'FOOTPRINT | Perfect fit, perfect price
        </Text>
        <Text style={companyAddress}>
          <Link href="https://www.instagram.com/d__footprint">Instagram</Link>
          {" | "}
          <Link href="https://www.tiktok.com/@d_footprint">TikTok</Link>
          {" | "}
          <Link href="https://wa.me/2348121993874">WhatsApp</Link>
        </Text>
      </Section>
    </Container>
  );
}

// Styles
const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "20px 0",
  marginBottom: "64px",
};

const headerSection = {
  padding: "32px 20px",
  textAlign: "center" as const,
  backgroundColor: "#f8f8f8",
};

const headerTitle = {
  color: "#1a1a1a",
  fontSize: "28px",
  fontWeight: "bold",
  margin: "0 0 8px 0",
};

const headerSubtitle = {
  color: "#666666",
  fontSize: "16px",
  margin: "0",
};

const productsSection = {
  padding: "40px 20px",
};

const productColumn = {
  width: "48%",
  padding: "0 10px 20px",
  textAlign: "center" as const,
};

const productImage = {
  border: "1px solid #e0e0e0",
  borderRadius: "8px",
  display: "block",
  margin: "0 auto 12px",
};

const productTitle = {
  fontSize: "14px",
  fontWeight: "600",
  color: "#1a1a1a",
  margin: "0 0 6px 0",
};

const productDescription = {
  fontSize: "12px",
  color: "#666666",
  margin: "0 0 12px 0",
  lineHeight: "1.4",
};

const productLink = {
  color: "#0066cc",
  textDecoration: "underline",
  fontSize: "12px",
};

const hr = {
  borderColor: "#e0e0e0",
  margin: "0",
};

const ctaSection = {
  padding: "32px 20px",
  textAlign: "center" as const,
};

const button = {
  backgroundColor: "#1a1a1a",
  borderRadius: "4px",
  color: "#fff",
  fontSize: "16px",
  fontWeight: "bold",
  padding: "12px 32px",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
};

const footerSection = {
  padding: "32px 20px",
  backgroundColor: "#f8f8f8",
};

const footerText = {
  fontSize: "14px",
  color: "#666666",
  margin: "0 0 16px 0",
  lineHeight: "1.6",
};

const companyInfo = {
  fontSize: "12px",
  color: "#999999",
  margin: "0 0 8px 0",
};

const companyAddress = {
  fontSize: "12px",
  color: "#999999",
  margin: "0",
};
