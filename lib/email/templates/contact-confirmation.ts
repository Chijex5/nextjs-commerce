import { baseTemplate } from "./base";

interface ContactConfirmationData {
  name?: string;
}

const firstName = (value?: string) => {
  if (!value) return "";
  const trimmed = value.trim();
  if (!trimmed) return "";
  return trimmed.split(/\s+/)[0];
};

export const contactConfirmationTemplate = (data: ContactConfirmationData) => {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXTAUTH_URL ||
    "https://yourdomain.com";

  const greetingName = firstName(data.name);

  const content = `
    <p style="margin: 0 0 10px; font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; color: #9ca3af; font-weight: 700; font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif;">Message received</p>
    <h2 style="margin: 0 0 20px;">We'll be in touch shortly${greetingName ? `, ${greetingName}` : ""}.</h2>

    <p>
      Your message has landed with us. Someone from our team will read it and get back to you within <strong style="color: #111111;">one business day</strong> — usually sooner.
    </p>

    <div class="info-box">
      <p style="margin: 0 0 6px; font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; color: #9ca3af; font-weight: 700; font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif;">While you wait</p>
      <p style="margin: 0; font-size: 13px; color: #374151; line-height: 1.7; font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif;">
        If you're asking about a <strong style="color: #111111;">custom order</strong>, it helps to have a few things ready when we reply — your size, preferred colours, any reference images, and whether you need it by a specific date. The more detail, the faster we can put together a quote.
      </p>
    </div>

    <p style="margin: 20px 0 8px; font-size: 14px; color: #374151; font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif; line-height: 1.7;">
      Curious about our process in the meantime? Our custom order page walks through how it works from enquiry to delivery.
    </p>

    <a href="${siteUrl}/custom-orders" class="button">How Custom Orders Work</a>
    <a href="${siteUrl}/products" class="button-ghost" style="display: inline-block; margin-top: 14px;">Browse the collection</a>

    <p style="font-size: 14px; color: #374151; margin: 28px 0 0; line-height: 1.7; font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif;">
      Speak soon,<br>
      <strong style="color: #111111;">The D'FOOTPRINT Team</strong>
    </p>
  `;

  return baseTemplate(content);
};