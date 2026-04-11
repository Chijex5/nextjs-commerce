/**
 * Base email template
 * Clean, minimal styling matching the D'FOOTPRINT website aesthetic
 */
export const baseTemplate = (content: string) => {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXTAUTH_URL ||
    "https://yourdomain.com";
  const logoUrl = `${siteUrl}/d.png`;

  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>D'FOOTPRINT</title>
    <style>
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        line-height: 1.6;
        color: #333333;
        max-width: 640px;
        margin: 0 auto;
        padding: 16px 10px;
        background-color: #f5f5f5;
      }
      .email-container {
        background-color: #ffffff;
        border: 1px solid #e5e5e5;
        border-radius: 14px;
        overflow: hidden;
      }
      .header {
        padding: 28px 24px 20px;
        border-bottom: 1px solid #e5e5e5;
      }
      .logo {
        display: inline-block;
        text-decoration: none;
      }
      .logo img {
        width: 56px;
        height: 56px;
        display: block;
        border: 0;
      }
      .brand-text {
        margin-top: 10px;
        font-size: 13px;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: #171717;
        font-weight: 600;
      }
      .content {
        padding: 28px 24px 32px;
      }
      .button {
        display: block;
        width: 100%;
        box-sizing: border-box;
        padding: 13px 20px;
        background-color: #000000;
        color: #ffffff !important;
        text-decoration: none;
        border-radius: 999px;
        margin: 14px 0 0;
        font-weight: 600;
        font-size: 14px;
        line-height: 20px;
        text-align: center;
        min-height: 44px;
      }
      .button-secondary {
        display: block;
        width: 100%;
        box-sizing: border-box;
        padding: 13px 20px;
        background-color: #ffffff;
        color: #171717 !important;
        text-decoration: none;
        border: 1px solid #d4d4d4;
        border-radius: 999px;
        margin: 10px 0 0;
        font-weight: 600;
        font-size: 14px;
        line-height: 20px;
        text-align: center;
        min-height: 44px;
      }
      .button-ghost {
        display: block;
        width: 100%;
        box-sizing: border-box;
        padding: 13px 20px;
        background-color: #ffffff;
        color: #171717 !important;
        text-decoration: none;
        border: 1px solid #d4d4d4;
        border-radius: 999px;
        margin: 10px 0 0;
        font-weight: 500;
        font-size: 14px;
        line-height: 20px;
        text-align: center;
        min-height: 44px;
      }
      .footer {
        padding: 24px;
        border-top: 1px solid #e5e5e5;
        font-size: 13px;
        color: #737373;
      }
      .footer-links {
        margin: 16px 0 0;
      }
      .footer-links a {
        display: inline-block;
        padding: 12px 14px;
        min-height: 44px;
        box-sizing: border-box;
        margin: 0 6px 8px 0;
        border-radius: 999px;
        border: 1px solid #e5e5e5;
        color: #171717;
        text-decoration: none;
        font-weight: 500;
      }
      h2 {
        color: #000000;
        font-size: 28px;
        font-weight: 600;
        line-height: 1.25;
        margin: 0 0 12px 0;
      }
      h3 {
        color: #000000;
        font-size: 16px;
        font-weight: 600;
        margin: 22px 0 10px 0;
      }
      p {
        margin: 10px 0;
        color: #333333;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        margin: 18px 0;
      }
      th, td {
        padding: 14px 8px;
        text-align: left;
        border-bottom: 1px solid #e5e5e5;
      }
      th {
        font-weight: 600;
        font-size: 13px;
        color: #171717;
      }
      .info-box {
        border: 1px solid #e5e5e5;
        border-radius: 12px;
        padding: 16px;
        margin: 16px 0;
        background-color: #fafafa;
      }
      .info-box p {
        margin: 4px 0;
      }
      .support-note {
        margin-top: 14px;
        font-size: 13px;
        color: #525252;
      }
      @media (max-width: 640px) {
        body {
          padding: 12px 8px;
        }
        .header,
        .content,
        .footer {
          padding-left: 16px;
          padding-right: 16px;
        }
        h2 {
          font-size: 24px;
        }
        th,
        td {
          padding-top: 12px;
          padding-bottom: 12px;
          font-size: 13px;
        }
      }
    </style>
  </head>
  <body>
    <div class="email-container">
      <div class="header">
        <a class="logo" href="${siteUrl}" target="_blank" rel="noopener noreferrer">
          <img src="${logoUrl}" alt="D'FOOTPRINT" width="500" height="500" />
        </a>
        <div class="brand-text">D'FOOTPRINT</div>
      </div>
      <div class="content">
        ${content}
      </div>
      <div class="footer">
        <p style="margin: 0 0 8px 0; color: #171717; font-weight: 500;">D'FOOTPRINT</p>
        <p style="margin: 0 0 16px 0;">Handcrafted Footwear · Lagos, Nigeria</p>
        <p style="margin: 0 0 10px 0; color: #404040;">Need help with your order? support@dfootprint.me</p>
        <div class="footer-links">
          <a href="${siteUrl}">Store</a>
          <a href="${siteUrl}/account">Account</a>
          <a href="${siteUrl}/contact">Contact</a>
        </div>
        <p style="font-size: 12px; margin-top: 16px; color: #a3a3a3;">
          © ${new Date().getFullYear()} D'FOOTPRINT. All rights reserved.
        </p>
      </div>
    </div>
  </body>
  </html>
`;
};
