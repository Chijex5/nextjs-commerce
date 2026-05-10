import { sendEmail } from "./resend";
import { newsletterWelcomeEmailTemplate } from "./templates/newsletter-welcome";

export const sendNewsletterWelcomeEmail = async (data: {
  email: string;
  name?: string | null;
}) => {
  return sendEmail({
    to: data.email,
    from: "Chika from D'FOOTPRINT <chika@dfootprint.me>",
    replyTo: "chika@dfootprint.me",
    subject: "Welcome to the D'FOOTPRINT newsletter",
    html: newsletterWelcomeEmailTemplate({ name: data.name }),
  });
};