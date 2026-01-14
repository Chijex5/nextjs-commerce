/**
 * Base email template
 * Clean, minimal styling matching the D'FOOTPRINT website aesthetic
 */
export const baseTemplate = (content: string) => {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXTAUTH_URL || 'https://yourdomain.com';
  
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
        max-width: 600px;
        margin: 0 auto;
        padding: 0;
        background-color: #ffffff;
      }
      .email-container {
        background-color: #ffffff;
        border: 1px solid #e5e5e5;
      }
      .header {
        padding: 32px 24px;
        border-bottom: 1px solid #e5e5e5;
      }
      .logo {
        font-size: 20px;
        font-weight: 600;
        letter-spacing: 0.5px;
        color: #000000;
        text-transform: uppercase;
      }
      .content {
        padding: 40px 24px;
      }
      .button {
        display: inline-block;
        padding: 12px 24px;
        background-color: #000000;
        color: #ffffff !important;
        text-decoration: none;
        border-radius: 4px;
        margin: 16px 0;
        font-weight: 500;
        font-size: 14px;
      }
      .footer {
        padding: 24px;
        border-top: 1px solid #e5e5e5;
        font-size: 13px;
        color: #737373;
      }
      .footer-links {
        margin: 12px 0;
      }
      .footer-links a {
        color: #171717;
        text-decoration: none;
        margin: 0 8px;
      }
      h2 {
        color: #000000;
        font-size: 24px;
        font-weight: 600;
        margin: 0 0 16px 0;
      }
      h3 {
        color: #000000;
        font-size: 16px;
        font-weight: 600;
        margin: 24px 0 12px 0;
      }
      p {
        margin: 12px 0;
        color: #333333;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        margin: 20px 0;
      }
      th, td {
        padding: 12px 8px;
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
        padding: 16px;
        margin: 20px 0;
      }
      .info-box p {
        margin: 4px 0;
      }
    </style>
  </head>
  <body>
    <div class="email-container">
      <div class="header">
        <div class="logo">D'FOOTPRINT</div>
      </div>
      <div class="content">
        ${content}
      </div>
      <div class="footer">
        <p style="margin: 0 0 8px 0; color: #171717; font-weight: 500;">D'FOOTPRINT</p>
        <p style="margin: 0 0 16px 0;">Handcrafted Footwear · Lagos, Nigeria</p>
        <div class="footer-links">
          <a href="${siteUrl}">Store</a> ·
          <a href="${siteUrl}/account">Account</a> ·
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
