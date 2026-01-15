import { baseTemplate } from "./base";

export const magicLinkTemplate = (data: { loginUrl: string }) => {
  const content = `
    <h2>Sign in to D'FOOTPRINT</h2>
    <p>Use the button below to sign in. This link expires in 15 minutes.</p>

    <a href="${data.loginUrl}" class="button">Sign in</a>

    <p style="font-size: 13px; color: #525252;">
      If the button doesn’t work, copy and paste this link into your browser:
    </p>
    <p style="font-size: 12px; color: #525252; word-break: break-all;">
      ${data.loginUrl}
    </p>

    <div class="info-box">
      <p><strong>Didn’t request this?</strong></p>
      <p>You can safely ignore this email. Your account is still secure.</p>
    </div>
  `;

  return baseTemplate(content);
};
