import { baseTemplate } from "./base";

const purposeLabels: Record<string, string> = {
  add_password: "add a password to your account",
  verify_email: "verify your email address",
};

export const otpTemplate = (data: { otp: string; purpose: string }) => {
  const purposeLabel = purposeLabels[data.purpose] ?? "verify your account";

  const content = `
    <h2>Your verification code</h2>
    <p>Use the code below to ${purposeLabel}. It expires in <strong>10 minutes</strong>.</p>

    <div style="text-align: center; margin: 32px 0;">
      <div style="display: inline-block; background: #f5f5f5; border: 1px dashed #d4d4d4; border-radius: 12px; padding: 20px 40px;">
        <p style="font-family: monospace; font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #171717; margin: 0;">
          ${data.otp}
        </p>
      </div>
    </div>

    <div class="info-box">
      <p><strong>Didn't request this?</strong></p>
      <p>You can safely ignore this email. No changes have been made to your account.</p>
    </div>
  `;

  return baseTemplate(content);
};
