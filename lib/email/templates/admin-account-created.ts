import { baseTemplate } from "./base";

interface AdminAccountCreatedEmailData {
  name?: string | null;
  email: string;
  password: string;
}

export const adminAccountCreatedTemplate = (
  data: AdminAccountCreatedEmailData,
) => {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXTAUTH_URL ||
    "https://yourdomain.com";

  const displayName = data.name?.trim() || "there";

  const content = `
    <h2>Your admin account is ready</h2>
    <p>Hi ${displayName},</p>
    <p>An administrator account has been created for you on D'FOOTPRINT.</p>
    <div class="info-box">
      <p><strong>Email:</strong> ${data.email}</p>
      <p><strong>Temporary Password:</strong> ${data.password}</p>
      <p><strong>Admin Login:</strong> <a href="${siteUrl}/admin/login">${siteUrl}/admin/login</a></p>
    </div>
    <p>Please sign in and change this password immediately for security.</p>
    <a href="${siteUrl}/admin/login" class="button">Sign in to Admin</a>
    <p class="support-note">If you did not expect this account, contact support right away.</p>
  `;

  return baseTemplate(content);
};
