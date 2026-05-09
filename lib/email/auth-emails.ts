import { sendEmail } from "./resend";
import { adminAccountCreatedTemplate } from "./templates/admin-account-created";
import { adminPasswordResetTemplate } from "./templates/admin-password-reset";
import { magicLinkTemplate } from "./templates/magic-link";
import { otpTemplate } from "./templates/otp";
import { welcomeEmailTemplate } from "./templates/welcome";

export const sendMagicLinkEmail = async (data: {
  email: string;
  loginUrl: string;
  purpose?: "signin" | "signup";
}) => {
  const purpose = data.purpose ?? "signin";

  return sendEmail({
    to: data.email,
    subject:
      purpose === "signup"
        ? "Finish setting up your D'FOOTPRINT account"
        : "Your sign-in link - D'FOOTPRINT",
    html: magicLinkTemplate({
      loginUrl: data.loginUrl,
      purpose,
    }),
  });
};

export const sendWelcomeEmail = async (data: {
  email: string;
  name?: string | null;
}) => {
  return sendEmail({
    to: data.email,
    from: "Chika <chika@dfootprint.me>",
    replyTo: "chika@dfootprint.me",
    subject: "Welcome to D'FOOTPRINT",
    html: welcomeEmailTemplate({ name: data.name || "there" }),
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

export const sendAdminCredentialsEmail = async (data: {
  email: string;
  name?: string | null;
  password: string;
}) => {
  return sendEmail({
    to: data.email,
    subject: "Your admin account credentials - D'FOOTPRINT",
    html: adminAccountCreatedTemplate({
      email: data.email,
      name: data.name,
      password: data.password,
    }),
  });
};

export const sendAdminPasswordResetEmail = async (data: {
  email: string;
  resetUrl: string;
  expiresInMinutes: number;
}) => {
  return sendEmail({
    to: data.email,
    subject: "Reset your admin password - D'FOOTPRINT",
    html: adminPasswordResetTemplate({
      resetUrl: data.resetUrl,
      expiresInMinutes: data.expiresInMinutes,
    }),
  });
};
