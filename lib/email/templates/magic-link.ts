import { baseTemplate } from "./base";

interface MagicLinkData {
  loginUrl: string;
  name?: string;
}

/**
 * Magic link email template
 * Sent when user requests a passwordless sign-in link
 */
export const magicLinkTemplate = (data: MagicLinkData) => {
  const firstName = data.name?.trim().split(/\s+/)[0];
  const greeting = firstName ? `Hi ${firstName},` : `Hi,`;

  const content = `
    <p style="margin: 0 0 10px; font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; color: #9ca3af; font-weight: 700; font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif;">Sign in</p>
    <h2 style="margin: 0 0 20px;">Your sign-in link is ready.</h2>

    <p>${greeting}</p>
    <p>
      Use the button below to sign in to your D'FOOTPRINT account. This link is valid for <strong style="color: #111111;">15 minutes</strong> and can only be used once.
    </p>

    <a href="${data.loginUrl}" class="button" style="margin-top: 24px;">Sign In to My Account</a>

    <hr style="border: none; border-top: 1px solid #e8e8e6; margin: 32px 0 24px;">

    <!-- Fallback URL -->
    <p style="margin: 0 0 8px; font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; color: #737373; font-weight: 700; font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif;">Button not working?</p>
    <p style="font-size: 13px; color: #6b7280; line-height: 1.7; font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif; margin: 0 0 8px;">
      Copy and paste this link into your browser:
    </p>
    <p style="font-size: 12px; color: #374151; word-break: break-all; background: #f8f8f7; border-left: 3px solid #e5e7eb; padding: 10px 14px; border-radius: 0 4px 4px 0; margin: 0; font-family: 'Courier New', Courier, monospace; line-height: 1.6;">
      ${data.loginUrl}
    </p>

    <!-- Security notice -->
    <div class="info-box" style="margin-top: 24px;">
      <p style="margin: 0 0 4px; font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; color: #9ca3af; font-weight: 700; font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif;">Didn't request this?</p>
      <p style="margin: 0; font-size: 13px; color: #6b7280; line-height: 1.7; font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif;">
        You can safely ignore this email — no action is needed and your account has not been accessed. The link will expire on its own.
      </p>
    </div>

    <p style="font-size: 14px; color: #374151; margin: 28px 0 0; line-height: 1.7; font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif;">
      <strong style="color: #111111;">The D'FOOTPRINT Team</strong>
    </p>
  `;

  return baseTemplate(content);
};