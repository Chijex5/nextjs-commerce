/**
 * Base email template — D'FOOTPRINT
 * Editorial quiet-luxury aesthetic.
 *
 * LOGO REQUIREMENTS:
 *   File:        d-light.png  (already hosted at /d-light.png)
 *   Format:      PNG, transparent background
 *   Mark colour: #FFFFFF (pure white) — renders cleanly on the dark header
 *   Size:        Export at 120×120px minimum for retina sharpness
 *
 *   No dark variant needed. Gmail ignores prefers-color-scheme on images,
 *   so dual-logo switching adds complexity with no reliable benefit.
 *   One white-on-transparent logo works across every client.
 */
export const baseTemplate = (content: string) => {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXTAUTH_URL ||
    "https://yourdomain.com";

  const logoUrl = "https://www.dfootprint.me/d-light.png";

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <title>D'FOOTPRINT</title>
  <style>
    /* ── Reset ──────────────────────────────────────────────────────────────── */
    * { box-sizing: border-box; }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.65;
      color: #1a1a1a;
      margin: 0;
      padding: 32px 16px 48px;
      background-color: #efefed;
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
    }

    /* ── Outer wrapper ───────────────────────────────────────────────────────── */
    .email-wrapper {
      max-width: 600px;
      margin: 0 auto;
    }

    /* ── Container card ──────────────────────────────────────────────────────── */
    .email-container {
      background-color: #ffffff;
      border-radius: 4px;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.06);
    }

    /* ── Header ──────────────────────────────────────────────────────────────── */
    /*
     * Dark panel — brand weight on open.
     * Logo sits on pure black, no border/box-shadow on the img tag.
     * White transparent-bg PNG logo renders cleanly here.
     */
    .header {
      background-color: #111111;
      padding: 32px 40px 28px;
      text-align: center;
    }
    .header a {
      display: inline-block;
      text-decoration: none;
    }
    .header-logo {
      display: block;
      width: 52px;
      height: 52px;
      margin: 0 auto 12px;
      border: 0;
      /* No background, no border-radius — transparent PNG sits directly on dark bg */
    }
    .header-wordmark {
      display: block;
      font-family: Georgia, 'Times New Roman', Times, serif;
      font-size: 10px;
      letter-spacing: 0.3em;
      text-transform: uppercase;
      color: #737373;
      font-weight: 400;
      margin: 0;
      text-decoration: none;
    }

    /* ── Content zone ────────────────────────────────────────────────────────── */
    .content {
      padding: 36px 40px 40px;
    }

    /* ── Typography ──────────────────────────────────────────────────────────── */
    h2 {
      font-family: Georgia, 'Times New Roman', Times, serif;
      color: #111111;
      font-size: 26px;
      font-weight: 400;
      line-height: 1.3;
      letter-spacing: -0.01em;
      margin: 0 0 16px;
    }
    h3 {
      font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif;
      color: #111111;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      margin: 28px 0 12px;
    }
    p {
      font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif;
      margin: 10px 0;
      color: #3d3d3d;
      font-size: 14px;
      line-height: 1.7;
    }

    /* ── Info box ────────────────────────────────────────────────────────────── */
    .info-box {
      border-left: 3px solid #111111;
      border-radius: 0 4px 4px 0;
      padding: 14px 16px;
      margin: 20px 0;
      background-color: #f8f8f7;
    }
    .info-box p {
      margin: 4px 0;
      font-size: 13px;
    }

    /* ── Table ───────────────────────────────────────────────────────────────── */
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif;
    }
    th, td {
      padding: 12px 8px;
      text-align: left;
    }
    th {
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: #737373;
    }

    /* ── Buttons ─────────────────────────────────────────────────────────────── */

    /* Primary — solid black */
    .button {
      display: inline-block;
      padding: 14px 28px;
      background-color: #111111;
      color: #ffffff !important;
      text-decoration: none;
      border-radius: 2px;
      font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif;
      font-weight: 600;
      font-size: 13px;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      text-align: center;
      line-height: 1;
      min-height: 44px;
      vertical-align: middle;
    }

    /* Secondary — white bg, solid dark border */
    .button-secondary {
      display: inline-block;
      padding: 13px 28px;
      background-color: #ffffff;
      color: #111111 !important;
      text-decoration: none;
      border: 1.5px solid #111111;
      border-radius: 2px;
      font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif;
      font-weight: 600;
      font-size: 13px;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      text-align: center;
      line-height: 1;
      min-height: 44px;
      vertical-align: middle;
    }

    /* Ghost — underline text link only, no border, no background */
    .button-ghost {
      display: inline-block;
      padding: 4px 0;
      background-color: transparent;
      color: #111111 !important;
      text-decoration: underline;
      text-underline-offset: 3px;
      font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif;
      font-weight: 500;
      font-size: 13px;
      letter-spacing: 0.02em;
      text-align: center;
    }

    /* ── Divider ─────────────────────────────────────────────────────────────── */
    .divider {
      border: none;
      border-top: 1px solid #e8e8e6;
      margin: 28px 0;
    }

    /* ── Support note ────────────────────────────────────────────────────────── */
    .support-note {
      font-size: 12px;
      color: #737373;
      font-style: italic;
      margin-top: 20px;
      font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif;
    }

    /* ── Footer ──────────────────────────────────────────────────────────────── */
    .footer {
      background-color: #f8f8f7;
      border-top: 1px solid #e8e8e6;
      padding: 28px 40px 32px;
      text-align: center;
    }
    .footer-brand {
      font-family: Georgia, 'Times New Roman', Times, serif;
      font-size: 12px;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      color: #111111;
      font-weight: 400;
      margin: 0 0 4px;
    }
    .footer-tagline {
      font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif;
      font-size: 11px;
      color: #b5b5b5;
      margin: 0 0 20px;
      letter-spacing: 0.02em;
    }
    .footer-links {
      margin: 0 0 16px;
    }
    .footer-links a {
      font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif;
      font-size: 12px;
      color: #525252;
      text-decoration: none;
      letter-spacing: 0.04em;
      padding: 0 12px;
      border-right: 1px solid #d4d4d4;
      line-height: 1;
    }
    .footer-links a:last-child {
      border-right: none;
    }
    .footer-support {
      font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif;
      font-size: 12px;
      color: #9ca3af;
      margin: 0 0 16px;
    }
    .footer-support a {
      color: #374151;
      text-decoration: underline;
      text-underline-offset: 2px;
    }
    .footer-copy {
      font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif;
      font-size: 11px;
      color: #c4c4c4;
      margin: 0;
      letter-spacing: 0.02em;
    }

    /* ── Dark mode — content only, not header (header is already dark) ───────── */
    /*
     * Gmail ignores prefers-color-scheme, so these only fire in Apple Mail,
     * Outlook for Mac, and some webmail clients. Safe to keep — non-destructive
     * in clients that don't support it.
     */
    @media (prefers-color-scheme: dark) {
      body { background-color: #1a1a1a !important; }

      .email-container {
        background-color: #1f1f1f !important;
        box-shadow: 0 1px 3px rgba(0,0,0,0.4) !important;
      }

      .content { background-color: #1f1f1f !important; }

      h2 { color: #f5f5f5 !important; }
      h3 { color: #d4d4d4 !important; }
      p  { color: #b0b0b0 !important; }

      .info-box {
        background-color: #2a2a2a !important;
        border-left-color: #d4d4d4 !important;
      }
      .info-box p { color: #a3a3a3 !important; }

      th { color: #737373 !important; }
      td { color: #c0c0c0 !important; }

      .button {
        background-color: #f5f5f5 !important;
        color: #111111 !important;
      }
      .button-secondary {
        background-color: transparent !important;
        color: #f5f5f5 !important;
        border-color: #555555 !important;
      }
      .button-ghost { color: #d4d4d4 !important; }

      .footer {
        background-color: #181818 !important;
        border-top-color: #2d2d2d !important;
      }
      .footer-brand   { color: #f5f5f5 !important; }
      .footer-tagline { color: #444444 !important; }
      .footer-links a { color: #737373 !important; border-right-color: #333333 !important; }
      .footer-support { color: #444444 !important; }
      .footer-support a { color: #d4d4d4 !important; }
      .footer-copy    { color: #3a3a3a !important; }
    }

    /* ── Outlook dark mode ───────────────────────────────────────────────────── */
    [data-ogsc] .email-container,
    [data-ogsb] .email-container { background-color: #1f1f1f !important; }
    [data-ogsc] h2, [data-ogsb] h2 { color: #f5f5f5 !important; }
    [data-ogsc] p,  [data-ogsb] p  { color: #b0b0b0 !important; }

    /* ── Mobile ──────────────────────────────────────────────────────────────── */
    @media (max-width: 600px) {
      body { padding: 16px 10px 40px; }

      .header  { padding: 24px 24px 20px; }
      .content { padding: 28px 24px 32px; }
      .footer  { padding: 24px 24px 28px; }

      h2 { font-size: 22px !important; }

      .button,
      .button-secondary {
        display: block !important;
        width: 100% !important;
        text-align: center !important;
      }
    }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="email-container">

      <!-- ── Header ─────────────────────────────────────────────────────────── -->
      <!--
        Single logo only. White mark on transparent PNG background.
        No dual-image switching — Gmail doesn't support it and it creates
        the white-box artefact visible in the current render.
      -->
      <div class="header">
        <a href="${siteUrl}" target="_blank" rel="noopener noreferrer">
          <img
            src="${logoUrl}"
            alt="D'FOOTPRINT"
            width="52"
            height="52"
            style="display:block; width:52px; height:52px; margin:0 auto 12px; border:0;"
          />
          <span style="display:block; font-family:Georgia,'Times New Roman',Times,serif; font-size:10px; letter-spacing:0.3em; text-transform:uppercase; color:#737373; font-weight:400; text-decoration:none;">
            D&rsquo;FOOTPRINT
          </span>
        </a>
      </div>

      <!-- ── Content ──────────────────────────────────────────────────────── -->
      <div class="content">
        ${content}
      </div>

      <!-- ── Footer ───────────────────────────────────────────────────────── -->
      <div class="footer">
        <p class="footer-brand">D&rsquo;FOOTPRINT</p>
        <p class="footer-tagline">Handcrafted Footwear &middot; Lagos, Nigeria</p>

        <div class="footer-links">
          <a href="${siteUrl}" target="_blank" rel="noopener noreferrer">Shop</a>
          <a href="${siteUrl}/account" target="_blank" rel="noopener noreferrer">Account</a>
          <a href="${siteUrl}/contact" target="_blank" rel="noopener noreferrer">Contact</a>
        </div>

        <p class="footer-support">
          Questions? <a href="mailto:support@dfootprint.me">support@dfootprint.me</a>
        </p>

        <p class="footer-copy">
          &copy; ${new Date().getFullYear()} D&rsquo;FOOTPRINT. All rights reserved.
        </p>
      </div>

    </div>
  </div>
</body>
</html>
`;
};