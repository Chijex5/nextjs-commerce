import { sendEmail } from "./resend";
import { newsletterWelcomeEmailTemplate } from "./templates/newsletter-welcome";
import { generateUnsubscribeToken } from "@/app/api/unsubscribe/route";

export const sendNewsletterWelcomeEmail = async (data: {
  email: string;
  name?: string | null;
}) => {
  const token = generateUnsubscribeToken(data.email);
  const unsubUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/api/unsubscribe?token=${token}&email=${encodeURIComponent(data.email)}`;

  return sendEmail({
    to: data.email,
    from: "Chika from D'FOOTPRINT <chika@dfootprint.me>",
    replyTo: "chika@dfootprint.me",
    subject: "Welcome to the D'FOOTPRINT newsletter",
    html: newsletterWelcomeEmailTemplate({ name: data.name, unsubscribeUrl: unsubUrl }),
    headers: {
      "List-Unsubscribe": `<${unsubUrl}>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    },
  });
};