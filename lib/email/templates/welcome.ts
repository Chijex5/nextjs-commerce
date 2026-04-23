import { baseTemplate } from "./base";

interface WelcomeEmailData {
  name: string;
}

/**
 * Welcome email template
 * Sent when user subscribes to newsletter or creates account
 */
export const welcomeEmailTemplate = (data: WelcomeEmailData) => {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXTAUTH_URL ||
    "https://yourdomain.com";

  const firstName = data.name?.trim().split(/\s+/)[0] || "there";

  const content = `
    <p style="margin: 0 0 10px; font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; color: #9ca3af; font-weight: 700; font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif;">Welcome</p>
    <h2 style="margin: 0 0 20px;">Good to have you here, ${firstName}.</h2>

    <p>
      Every pair that leaves our workshop started as a conversation — a shape someone imagined, a fit they needed, a story worth wearing. That's what D'FOOTPRINT is. We make leather footwear by hand, right here in Lagos, and we take our time with every single one.
    </p>
    <p>
      You're now the first to know when something new comes off the bench.
    </p>

    <hr style="border: none; border-top: 1px solid #e8e8e6; margin: 28px 0;">

    <!-- What to expect — table-based for email client safety -->
    <p style="margin: 0 0 16px; font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; color: #737373; font-weight: 700; font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif;">What comes next</p>

    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; margin: 0 0 28px;">
      <tbody>
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #f0f0ee; vertical-align: top;">
            <p style="margin: 0 0 2px; font-size: 13px; font-weight: 700; color: #111111; font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif;">New arrivals first</p>
            <p style="margin: 0; font-size: 13px; color: #6b7280; font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6;">Each new design is announced to subscribers before it goes public.</p>
          </td>
        </tr>
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #f0f0ee; vertical-align: top;">
            <p style="margin: 0 0 2px; font-size: 13px; font-weight: 700; color: #111111; font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif;">Behind the bench</p>
            <p style="margin: 0; font-size: 13px; color: #6b7280; font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6;">Occasional notes on how pieces are made — materials, process, the details that matter.</p>
          </td>
        </tr>
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #f0f0ee; vertical-align: top;">
            <p style="margin: 0 0 2px; font-size: 13px; font-weight: 700; color: #111111; font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif;">Subscriber offers</p>
            <p style="margin: 0; font-size: 13px; color: #6b7280; font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6;">Discounts and early access that don't go anywhere else.</p>
          </td>
        </tr>
        <tr>
          <td style="padding: 12px 0; vertical-align: top;">
            <p style="margin: 0 0 2px; font-size: 13px; font-weight: 700; color: #111111; font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif;">Custom orders</p>
            <p style="margin: 0; font-size: 13px; color: #6b7280; font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6;">Want something made for you specifically? We'll walk you through how it works.</p>
          </td>
        </tr>
      </tbody>
    </table>

    <a href="${siteUrl}/products" class="button">See What's Available</a>
    <a href="${siteUrl}/custom-orders" class="button-secondary" style="margin-top: 10px;">Enquire About Custom Orders</a>

    <p style="margin: 28px 0 6px; font-size: 14px; color: #374151; line-height: 1.7; font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif;">
      Questions about sizing, materials, or delivery? Reply directly to this email — it goes straight to us.
    </p>

    <p style="font-size: 14px; color: #374151; margin: 20px 0 0; line-height: 1.7; font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif;">
      Glad you're here,<br>
      <strong style="color: #111111;">The D'FOOTPRINT Team</strong>
    </p>
  `;

  return baseTemplate(content);
};