import { baseTemplate } from "./base";

// ─────────────────────────────────────────────────────────────────────────────
// IMAGE GENERATION PROMPTS
// Generate these with Midjourney / DALL-E 3 / Ideogram, then upload to:
//   https://www.dfootprint.me/emails/
//
// welcome-hero.jpg  (export at 1200 × 560px, 85% JPEG quality)
//   "Editorial product photography of a finished pair of handcrafted dark cognac
//    leather Oxford shoes resting on an aged dark oak workbench, single warm
//    amber lamp lighting from the left, artisan leather tools and thread softly
//    blurred in background bokeh, luxury fashion brand aesthetic, cinematic
//    depth of field, muted earthy tones, no text, no people, no watermarks,
//    4:2 aspect ratio"
//
// welcome-craft.jpg  (export at 1200 × 480px, 85% JPEG quality)
//   "Extreme macro photography of fine hand-stitching on dark cognac leather
//    shoe upper, warm directional side-lighting revealing grain texture and
//    cream-coloured thread detail, shallow depth of field, luxury craftsmanship
//    close-up, muted dark background, no text, no people, no watermarks"
// ─────────────────────────────────────────────────────────────────────────────

interface WelcomeEmailData {
  name: string;
}

/**
 * Welcome email template — flagship / CEO standard
 * Sent when a user creates an account or subscribes to the newsletter.
 *
 * Structure:
 *   1. Full-width hero image (workshop / finished product)
 *   2. Editorial headline + brand story
 *   3. Craft detail image with caption
 *   4. 2×2 subscriber benefit grid
 *   5. Dual CTA
 *   6. Personal sign-off
 */
export const welcomeEmailTemplate = (data: WelcomeEmailData) => {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXTAUTH_URL ||
    "https://yourdomain.com";

  const firstName = data.name?.trim().split(/\s+/)[0] || "there";

  // Hosted image URLs — update once generated and uploaded
  const heroImageUrl = "https://www.dfootprint.me/8D5A3D65-CEF8-4037-B693-D905381F84CC.png";
  const craftImageUrl = "https://www.dfootprint.me/EC4CE566-C882-4B4A-8F1E-BEBF6E8CD8C2.png";

  // ── 2×2 Subscriber benefit grid ─────────────────────────────────────────
  const features = [
    {
      number: "01",
      title: "New arrivals first",
      body: "Every new design reaches subscribers before it's announced anywhere else.",
    },
    {
      number: "02",
      title: "Behind the bench",
      body: "Notes on materials, process, and the decisions that go into each pair.",
    },
    {
      number: "03",
      title: "Subscriber offers",
      body: "Discounts and early access reserved for this list — nothing public.",
    },
    {
      number: "04",
      title: "Custom orders",
      body: "Your size, your colours, your design. We'll walk you through it.",
    },
  ];

  // Two table rows, two columns each — fully Outlook / Gmail safe
  const featureGridHtml = `
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; margin: 0;">
      <tr>
        <td width="50%" style="padding: 0 16px 20px 0; vertical-align: top;">
          <p style="margin: 0 0 5px; font-size: 10px; letter-spacing: 0.18em; text-transform: uppercase; color: #c4c4c4; font-weight: 700; font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif;">${features[0]?.number}</p>
          <p style="margin: 0 0 5px; font-size: 13px; font-weight: 700; color: #111111; font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif;">${features[0]?.title}</p>
          <p style="margin: 0; font-size: 13px; color: #6b7280; font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif; line-height: 1.65;">${features[0].body}</p>
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
    <p style="margin: 0 0 10px; font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; color: #9ca3af; font-weight: 700; font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif;">Welcome</p>
    <h2 style="margin: 0 0 20px;">A quick thank you from Chika, ${firstName}.</h2>

    <p>
      Hi ${firstName}, I'm Chika, founder of D'FOOTPRINT. Thank you for joining us and for trusting us with a place in your wardrobe.
    </p>
    <p>
      Every pair that leaves our workshop started as a conversation — a shape someone imagined, a fit they needed, a story worth wearing. That's what D'FOOTPRINT is. We make leather footwear by hand, right here in Lagos, and we take our time with every single one.
    </p>
    <p>
      If you just created your account, you're all set to explore, order, and come back whenever you need us. If you subscribed for updates, you'll be the first to hear when something new arrives.
    <!--
      HERO IMAGE — bleeds to the edges of the content zone.
      The negative margin pulls it past the 40px content padding so it sits
      flush against the card walls. background-color shows when images are off.
    -->
    <div style="margin: -36px -40px 32px; overflow: hidden; background-color: #1a1a1a; line-height: 0;">
      <a href="${siteUrl}/products" target="_blank" rel="noopener noreferrer" style="display: block; text-decoration: none; line-height: 0;">
        <img
          src="${heroImageUrl}"
          alt="A finished pair of handcrafted leather shoes resting at the D'FOOTPRINT workshop in Lagos"
          width="600"
          style="display: block; width: 100%; max-width: 600px; height: auto; border: 0;"
        />
      </a>
    </div>

    <!-- Eyebrow -->
    <p style="margin: 0 0 12px; font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; color: #9ca3af; font-weight: 700; font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif;">
      Welcome, ${firstName}
    </p>

    <!-- Editorial headline — Georgia, quiet confidence -->
    <h2 style="margin: 0 0 22px; font-size: 28px; line-height: 1.25; letter-spacing: -0.01em; color: #111111; font-weight: 400;">
      You've just joined a very small circle.
    </h2>

    <!-- Brand story — italic Georgia for the pull quote, sans for the follow-on -->
    <p style="font-size: 15px; color: #1a1a1a; line-height: 1.8; font-family: Georgia, 'Times New Roman', Times, serif; font-style: italic; margin: 0 0 16px; border-left: 3px solid #111111; padding-left: 16px;">
      "Every pair that leaves our workshop is made by hand — cut, stitched, and finished by artisans who care about the details long after anyone else has stopped looking."
    </p>
    <p style="font-size: 14px; color: #374151; line-height: 1.75; font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif; margin: 0;">
      That's the standard we hold at D'FOOTPRINT. You're now the first to know when a new pair comes off the bench, before it goes anywhere else.
    </p>

    <!-- Craft detail image with caption -->
    <div style="margin: 28px 0 0; background-color: #111111; border-radius: 2px; overflow: hidden; line-height: 0;">
      <a href="${siteUrl}/products" target="_blank" rel="noopener noreferrer" style="display: block; text-decoration: none; line-height: 0;">
        <img
          src="${craftImageUrl}"
          alt="Fine hand-stitching detail on a D'FOOTPRINT leather shoe upper"
          width="520"
          style="display: block; width: 100%; max-width: 520px; height: auto; border: 0; opacity: 0.95;"
        />
      </a>
      <p style="margin: 0; padding: 10px 16px 12px; font-size: 10px; color: #6b7280; letter-spacing: 0.1em; text-transform: uppercase; font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif; font-weight: 700; line-height: 1; background-color: #111111; color: #555555;">
        Every stitch. Every cut. By hand. — Lagos, Nigeria
      </p>
    </div>

    <!-- Divider -->
    <hr style="border: none; border-top: 1px solid #e8e8e6; margin: 32px 0 26px;">

    <!-- Feature grid header -->
    <p style="margin: 0 0 20px; font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; color: #737373; font-weight: 700; font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif;">
      What being a subscriber means
    </p>

    <!-- 2×2 Feature grid -->
    ${featureGridHtml}

    <!-- Divider -->
    <hr style="border: none; border-top: 1px solid #e8e8e6; margin: 28px 0 26px;">

    <!-- CTAs -->
    <a href="${siteUrl}/products" class="button" style="display: block; text-align: center;">Explore the Collection</a>
    <a href="${siteUrl}/custom-orders" class="button-secondary" style="display: block; text-align: center; margin-top: 10px;">Enquire About a Custom Pair</a>

    <!-- Closing -->
    <p style="margin: 28px 0 0; font-size: 14px; color: #6b7280; line-height: 1.7; font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif;">
      Questions about sizing, leather types, or delivery? Reply to this email — it comes straight to us, not a support queue.
    </p>

    <p style="font-size: 15px; color: #1a1a1a; margin: 22px 0 2px; font-family: Georgia, 'Times New Roman', Times, serif; font-style: italic; line-height: 1.4;">
      Glad you found us,
    </p>
    <p style="font-size: 13px; color: #111111; margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase;">
      The D'FOOTPRINT Team
    </p>
  `;

  return baseTemplate(content);
};