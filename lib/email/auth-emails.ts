import { sendEmail } from "./resend";
import { magicLinkTemplate } from "./templates/magic-link";
import { otpTemplate } from "./templates/otp";

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

export const sendOtpEmail = async (data: {
  email: string;
  otp: string;
  purpose: string;
}) => {
  return sendEmail({
    to: data.email,
    subject: "Your verification code - D'FOOTPRINT",
    html: otpTemplate({ otp: data.otp, purpose: data.purpose }),
  });
};
