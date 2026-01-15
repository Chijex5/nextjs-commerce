import { sendEmail } from "./resend";
import { magicLinkTemplate } from "./templates/magic-link";

export const sendMagicLinkEmail = async (data: {
  email: string;
  loginUrl: string;
}) => {
  return sendEmail({
    to: data.email,
    subject: "Your sign-in link - D'FOOTPRINT",
    html: magicLinkTemplate({ loginUrl: data.loginUrl }),
  });
};
