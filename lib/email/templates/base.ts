/**
 * Base email template
 * Provides consistent styling for all emails
 */
export const baseTemplate = (content: string) => `
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
        color: #333;
        max-width: 600px;
        margin: 0 auto;
        padding: 20px;
        background-color: #f5f5f5;
      }
      .email-container {
        background-color: #ffffff;
        border-radius: 8px;
        overflow: hidden;
      }
      .header {
        text-align: center;
        padding: 30px 20px;
        background-color: #000000;
        color: #ffffff;
      }
      .logo {
        font-size: 28px;
        font-weight: bold;
        letter-spacing: 1px;
      }
      .tagline {
        margin-top: 8px;
        font-size: 14px;
        opacity: 0.9;
      }
      .content {
        padding: 40px 30px;
      }
      .button {
        display: inline-block;
        padding: 14px 28px;
        background-color: #000;
        color: #fff !important;
        text-decoration: none;
        border-radius: 6px;
        margin: 20px 0;
        font-weight: 600;
      }
      .button:hover {
        background-color: #333;
      }
      .footer {
        text-align: center;
        padding: 30px 20px;
        background-color: #f9f9f9;
        border-top: 1px solid #eee;
        font-size: 13px;
        color: #666;
      }
      .footer-links {
        margin: 15px 0;
      }
      .footer-links a {
        color: #000;
        text-decoration: none;
        margin: 0 10px;
      }
      .social-links {
        margin-top: 20px;
      }
      h2 {
        color: #000;
        margin-top: 0;
      }
      p {
        margin: 15px 0;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        margin: 20px 0;
      }
      th, td {
        padding: 12px;
        text-align: left;
        border-bottom: 1px solid #eee;
      }
      th {
        background-color: #f9f9f9;
        font-weight: 600;
      }
    </style>
  </head>
  <body>
    <div class="email-container">
      <div class="header">
        <div class="logo">D'FOOTPRINT</div>
        <div class="tagline">Handcrafted Footwear from Lagos, Nigeria</div>
      </div>
      <div class="content">
        ${content}
      </div>
      <div class="footer">
        <p><strong>D'FOOTPRINT</strong></p>
        <p>Handmade Footwear with Love</p>
        <p>Lagos, Nigeria</p>
        <div class="footer-links">
          <a href="https://yourdomain.com">Visit Store</a> |
          <a href="https://yourdomain.com/account">My Account</a> |
          <a href="https://yourdomain.com/contact">Contact Us</a>
        </div>
        <p style="font-size: 12px; margin-top: 20px;">
          © ${new Date().getFullYear()} D'FOOTPRINT. All rights reserved.
        </p>
      </div>
    </div>
  </body>
  </html>
`;
