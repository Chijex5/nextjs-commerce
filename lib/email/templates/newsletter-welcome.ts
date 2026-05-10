import { baseTemplate } from "./base";


interface NewsletterWelcomeEmailData {
  name?: string | null;
  unsubscribeUrl: string;
}

export const newsletterWelcomeEmailTemplate = (
  data: NewsletterWelcomeEmailData,
) => {
  const firstName = data.name?.trim().split(/\s+/)[0] || "there";
  
  const content = `
    <p style="margin: 0 0 10px; font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; color: #9ca3af; font-weight: 700; font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif;">Newsletter</p>
    <h2 style="margin: 0 0 20px;">You&apos;re on the list, ${firstName}.</h2>

    <p>
      Hi ${firstName}, I&apos;m Chika, founder of D&apos;FOOTPRINT. Thank you for subscribing to our newsletter.
    </p>
    <p>
      Expect first looks at new drops, behind-the-scenes notes from the workshop, styling ideas, and occasional subscriber-only updates.
    </p>
    <p>
      We keep the list thoughtful and quiet. No clutter, no noise, just the pieces and stories worth sharing.
    </p>

    <hr style="border: none; border-top: 1px solid #e8e8e6; margin: 28px 0;">

    <p style="margin: 0 0 6px; font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; color: #737373; font-weight: 700; font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif;">What happens next</p>

    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; margin: 0 0 28px;">
      <tbody>
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #f0f0ee; vertical-align: top;">
            <p style="margin: 0 0 2px; font-size: 13px; font-weight: 700; color: #111111; font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif;">New arrivals</p>
            <p style="margin: 0; font-size: 13px; color: #6b7280; font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6;">Hear about new releases before they go fully public.</p>
          </td>
        </tr>
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #f0f0ee; vertical-align: top;">
            <p style="margin: 0 0 2px; font-size: 13px; font-weight: 700; color: #111111; font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif;">Stories from the studio</p>
            <p style="margin: 0; font-size: 13px; color: #6b7280; font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6;">Short notes on craft, materials, and the thinking behind each design.</p>
          </td>
        </tr>
        <tr>
          <td style="padding: 12px 0; vertical-align: top;">
            <p style="margin: 0 0 2px; font-size: 13px; font-weight: 700; color: #111111; font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif;">Subscriber moments</p>
            <p style="margin: 0; font-size: 13px; color: #6b7280; font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6;">Occasional early access and offers reserved for the list.</p>
          </td>
        </tr>
      </tbody>
    </table>

    <a href="https://www.dfootprint.me/products" class="button">Browse the Collection</a>

    <p style="margin: 28px 0 6px; font-size: 14px; color: #374151; line-height: 1.7; font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif;">
      If you ever want to change how often you hear from us, just use the unsubscribe link in any email.
    </p>

    <p style="font-size: 14px; color: #374151; margin: 20px 0 0; line-height: 1.7; font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif;">
      Warmly,<br>
      <strong style="color: #111111;">Chika</strong><br>
      Founder, D&apos;FOOTPRINT
    </p>
  `;

  return baseTemplate(content, data.unsubscribeUrl);
};