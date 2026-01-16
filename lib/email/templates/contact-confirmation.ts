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

export const contactConfirmationTemplate = (
  data: ContactConfirmationData,
) => {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXTAUTH_URL ||
    "https://yourdomain.com";
  const greetingName = firstName(data.name);

  const content = `
    <h2>We received your message</h2>
    <p>Hi ${greetingName || "there"},</p>
    <p>Thanks for reaching out to D'FOOTPRINT. Our team will reply within 1 business day.</p>
    <p>If your request is for a custom order, feel free to share inspiration photos, preferred colors, and sizing notes when we respond.</p>

    <a href="${siteUrl}/custom-orders" class="button">View Custom Orders</a>

    <p>Talk soon,<br />The D'FOOTPRINT Team</p>
  `;

  return baseTemplate(content);
};
