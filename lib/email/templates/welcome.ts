import { baseTemplate } from "./base";

interface WelcomeEmailData {
  name: string;
}

export const welcomeEmailTemplate = (data: WelcomeEmailData) => {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXTAUTH_URL ||
    "https://yourdomain.com";

  const firstName = data.name?.trim().split(/\s+/)[0] || "there";

  const heroImageUrl = "https://www.dfootprint.me/image1.png";
  const craftImageUrl = "https://www.dfootprint.me/image2.png";

  // ── 2×2 Account benefit grid ─────────────────────────────────────────────
  // These are account creation benefits — not newsletter copy.
  const features = [
    {
      number: "01",
      title: "Your orders, always there",
      body: "Every purchase lives in your account. Track status, view history, reorder anytime.",
    },
    {
      number: "02",
      title: "Faster checkout",
      body: "Your address is saved. Next time you shop, you confirm and go — nothing to re-enter.",
    },
    {
      number: "03",
      title: "Early access",
      body: "Account holders see new arrivals and restocks before they're announced publicly.",
    },
    {
      number: "04",
      title: "Custom orders",
      body: "Request a custom pair and follow it from quote to delivery — all from your dashboard.",
    },
  ];

  const featureGridHtml = `
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; margin: 0;">
      <tr>
        <td width="50%" style="padding: 0 16px 20px 0; vertical-align: top;">
          <p style="margin: 0 0 5px; font-size: 10px; letter-spacing: 0.18em; text-transform: uppercase; color: #c4c4c4; font-weight: 700; font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif;">${features[0]?.number}</p>
          <p style="margin: 0 0 5px; font-size: 13px; font-weight: 700; color: #111111; font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif;">${features[0]?.title}</p>
          <p style="margin: 0; font-size: 13px; color: #6b7280; font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif; line-height: 1.65;">${features[0]?.body}</p>
        </td>
        <td width="50%" style="padding: 0 0 20px 0; vertical-align: top;">
          <p style="margin: 0 0 5px; font-size: 10px; letter-spacing: 0.18em; text-transform: uppercase; color: #c4c4c4; font-weight: 700; font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif;">${features[1]?.number}</p>
          <p style="margin: 0 0 5px; font-size: 13px; font-weight: 700; color: #111111; font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif;">${features[1]?.title}</p>
          <p style="margin: 0; font-size: 13px; color: #6b7280; font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif; line-height: 1.65;">${features[1]?.body}</p>
        </td>
      </tr>
      <tr>
        <td width="50%" style="padding: 0 16px 0 0; vertical-align: top;">
          <p style="margin: 0 0 5px; font-size: 10px; letter-spacing: 0.18em; text-transform: uppercase; color: #c4c4c4; font-weight: 700; font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif;">${features[2]?.number}</p>
          <p style="margin: 0 0 5px; font-size: 13px; font-weight: 700; color: #111111; font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif;">${features[2]?.title}</p>
          <p style="margin: 0; font-size: 13px; color: #6b7280; font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif; line-height: 1.65;">${features[2]?.body}</p>
        </td>
        <td width="50%" style="padding: 0; vertical-align: top;">
          <p style="margin: 0 0 5px; font-size: 10px; letter-spacing: 0.18em; text-transform: uppercase; color: #c4c4c4; font-weight: 700; font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif;">${features[3]?.number}</p>
          <p style="margin: 0 0 5px; font-size: 13px; font-weight: 700; color: #111111; font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif;">${features[3]?.title}</p>
          <p style="margin: 0; font-size: 13px; color: #6b7280; font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif; line-height: 1.65;">${features[3]?.body}</p>
        </td>
      </tr>
    </table>
  `;

  const content = `
    <!--
      HERO IMAGE — full bleed, sits at the very top of the content zone.
      Negative margin pulls past the 40px content padding to flush against card edges.
      Dark background shows when images are blocked.
    -->
    <div style="margin: -36px -40px 32px; overflow: hidden; background-color: #1a1a1a; line-height: 0;">
      <a href="${siteUrl}/products" target="_blank" rel="noopener noreferrer" style="display: block; text-decoration: none; line-height: 0;">
        <img
          src="${heroImageUrl}"
          alt="D'FOOTPRINT handcrafted slides and slippers"
          width="600"
          style="display: block; width: 100%; max-width: 600px; height: auto; border: 0;"
        />
      </a>
    </div>

    <!-- Eyebrow — single, at the top, not repeated -->
    <p style="margin: 0 0 10px; font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; color: #9ca3af; font-weight: 700; font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif;">
      Welcome, ${firstName}
    </p>

    <!-- Single headline — founder note and brand statement merged into one -->
    <h2 style="margin: 0 0 20px; font-size: 26px; line-height: 1.3; letter-spacing: -0.01em; color: #111111; font-weight: 400;">
      A personal note from Chika.
    </h2>

    <!-- Founder intro — warm, direct, one paragraph -->
    <p style="font-size: 14px; color: #374151; line-height: 1.75; font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif; margin: 0 0 16px;">
      Hi ${firstName}, I'm Chika — I started D'FOOTPRINT because I wanted footwear that was made properly.
      Not assembled somewhere and shipped here, but cut and stitched by hand in Lagos, with real leather,
      by people who take their time with it. That's still exactly what we do.
    </p>

    <!-- Brand pull quote — italic Georgia, left rule -->
    <p style="font-size: 15px; color: #1a1a1a; line-height: 1.8; font-family: Georgia, 'Times New Roman', Times, serif; font-style: italic; margin: 0 0 16px; border-left: 3px solid #111111; padding-left: 16px;">
      "Every pair that leaves our workshop is finished by artisans who care about the details long after anyone else has stopped looking."
    </p>

    <!-- Follow-on — account context -->
    <p style="font-size: 14px; color: #374151; line-height: 1.75; font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif; margin: 0;">
      Your account is ready. Here's what it gives you.
    </p>

    <!-- Craft detail image -->
    <div style="margin: 28px 0 0; background-color: #111111; border-radius: 2px; overflow: hidden; line-height: 0;">
      <a href="${siteUrl}/products" target="_blank" rel="noopener noreferrer" style="display: block; text-decoration: none; line-height: 0;">
        <img
          src="${craftImageUrl}"
          alt="Close-up of hand-stitched leather detail on a D'FOOTPRINT slide"
          width="520"
          style="display: block; width: 100%; max-width: 520px; height: auto; border: 0; opacity: 0.95;"
        />
      </a>
      <p style="margin: 0; padding: 10px 16px 12px; font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase; font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif; font-weight: 700; line-height: 1; background-color: #111111; color: #555555;">
        Every stitch. Every cut. By hand. &mdash; Lagos, Nigeria
      </p>
    </div>

    <!-- Divider -->
    <hr style="border: none; border-top: 1px solid #e8e8e6; margin: 32px 0 26px;">

    <!-- Feature grid header -->
    <p style="margin: 0 0 20px; font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; color: #737373; font-weight: 700; font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif;">
      What your account gives you
    </p>

    <!-- 2×2 Account benefit grid -->
    ${featureGridHtml}

    <!-- Divider -->
    <hr style="border: none; border-top: 1px solid #e8e8e6; margin: 28px 0 26px;">

    <!-- CTAs -->
    <a href="${siteUrl}/products" class="button" style="display: block; text-align: center;">Explore the Collection</a>
    <a href="${siteUrl}/custom-orders" class="button-secondary" style="display: block; text-align: center; margin-top: 10px;">Enquire About a Custom Pair</a>

    <!-- Closing note -->
    <p style="margin: 28px 0 0; font-size: 14px; color: #6b7280; line-height: 1.7; font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif;">
      Questions about sizing, materials, or delivery? Reply to this email — it comes straight to us.
    </p>

    <!-- Sign-off -->
    <p style="font-size: 15px; color: #1a1a1a; margin: 22px 0 2px; font-family: Georgia, 'Times New Roman', Times, serif; font-style: italic; line-height: 1.4;">
      Glad you're here,
    </p>
    <p style="font-size: 13px; color: #111111; margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase;">
      Chika &amp; The D&rsquo;FOOTPRINT Team
    </p>
  `;

  return baseTemplate(content);
};