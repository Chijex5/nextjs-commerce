import { baseTemplate } from "./base";

interface OrderStatusUpdateData {
  orderNumber: string;
  customerName: string;
  oldStatus: string;
  newStatus: string;
  deliveryStatus?: string;
  trackingNumber?: string;
  estimatedArrival?: string;
}

/**
 * Order status update email template
 * Sent when order status changes (e.g., processing -> dispatch -> delivered)
 */
export const orderStatusUpdateTemplate = (data: OrderStatusUpdateData) => {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXTAUTH_URL ||
    "https://yourdomain.com";
  const orderUrl = `${siteUrl}/orders?orderNumber=${encodeURIComponent(data.orderNumber)}`;
  const supportUrl = `${siteUrl}/contact?order=${encodeURIComponent(data.orderNumber)}`;

  const normalize = (value?: string) => (value || "").toLowerCase().trim();
  const deliveryStatus = normalize(data.deliveryStatus);

  // ── Step resolution ──────────────────────────────────────────────────────
  const getCurrentStep = (): number => {
    if (["delivered", "completed"].includes(deliveryStatus)) return 4;
    if (["dispatch", "dispatched", "shipped"].includes(deliveryStatus)) return 3;
    if (["sorting", "in sorting", "in_sorting"].includes(deliveryStatus)) return 2;
    return 1;
  };
  const currentStep = getCurrentStep();

  // ── Headline — first thing the customer reads ────────────────────────────
  const getHeader = (): string => {
    if (currentStep === 4) return "Your order has arrived.";
    if (currentStep === 3) return "Your pair is on its way.";
    if (currentStep === 2) return "Your order is being sorted for dispatch.";
    return "Your pair is being handcrafted.";
  };

  // ── Body copy ────────────────────────────────────────────────────────────
  const getContextualMessage = (): string => {
    if (currentStep === 4) {
      return `We hope your new pair is everything you imagined. If you have any questions about the fit or finish, just reply to this email — we're always happy to help.`;
    }
    if (currentStep === 3) {
      return `Your handcrafted pair has left our workshop and is now in transit to you. ${data.trackingNumber ? "Use the tracking number below to follow its progress." : "We'll send another update once it's been delivered."}`;
    }
    if (currentStep === 2) {
      return `Your order has moved out of production and is being prepared for dispatch. We'll email you again as soon as it ships.`;
    }
    return `Our artisans are working on your pair right now. Every step is done by hand, so we take the time to make sure it's right. We'll update you when it moves to dispatch.`;
  };

  // ── Stepper ──────────────────────────────────────────────────────────────
  // Table-based: circles drawn with border, no unicode characters that
  // render inconsistently across Outlook / Gmail / Apple Mail.
  const steps = [
    { label: "Order confirmed" },
    { label: "In production" },
    { label: "Sorting for dispatch" },
    { label: "Shipped" },
    { label: "Delivered" },
  ];

  const stepperRows = steps
    .map((step, i) => {
      const isComplete = i < currentStep;
      const isCurrent = i === currentStep;
      const isPending = i > currentStep;

      const circleBg = isComplete ? "#111111" : isCurrent ? "#111111" : "#e5e7eb";
      const circleBorder = isPending ? "#d1d5db" : "#111111";
      const tickColor = isComplete ? "#ffffff" : "transparent";
      const dotColor = isCurrent ? "#ffffff" : "transparent";
      const connectorColor = isComplete ? "#111111" : "#e5e7eb";

      // Tick for complete, filled dot for current, empty for pending
      const innerHtml = isComplete
        ? `<span style="font-size: 10px; font-weight: 700; color: ${tickColor}; line-height: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif;">&#10003;</span>`
        : isCurrent
          ? `<span style="display: inline-block; width: 8px; height: 8px; background: ${dotColor}; border-radius: 50%; vertical-align: middle;"></span>`
          : "";

      return `
        <tr>
          <td width="22" style="padding: 0; vertical-align: top; text-align: center;">
            <table cellpadding="0" cellspacing="0" style="border-collapse: collapse; margin: 0 auto;">
              <tr>
                <td style="padding: 0;">
                  <!-- Circle -->
                  <div style="
                    width: 20px; height: 20px; border-radius: 50%;
                    background-color: ${circleBg};
                    border: 1.5px solid ${circleBorder};
                    text-align: center; line-height: 20px;
                    margin: 0 auto;
                  ">${innerHtml}</div>
                </td>
              </tr>
              ${
                i < steps.length - 1
                  ? `<tr>
                  <td style="padding: 0; text-align: center;">
                    <div style="width: 1.5px; height: 16px; background-color: ${connectorColor}; margin: 2px auto;"></div>
                  </td>
                </tr>`
                  : ""
              }
            </table>
          </td>
          <td style="padding: ${i < steps.length - 1 ? "0 0 18px" : "0"} 0 0 12px; vertical-align: top;">
            <span style="
              font-size: 13px;
              font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif;
              color: ${isCurrent ? "#111111" : isComplete ? "#374151" : "#9ca3af"};
              font-weight: ${isCurrent ? "700" : isComplete ? "500" : "400"};
              line-height: 20px;
            ">${step.label}${
              isCurrent
                ? ` <span style="
                    font-size: 10px; font-weight: 700; letter-spacing: 0.08em;
                    text-transform: uppercase; background: #111111; color: #fff;
                    padding: 2px 7px; border-radius: 2px; vertical-align: middle;
                    font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif;
                  ">Now</span>`
                : ""
            }</span>
          </td>
        </tr>
      `;
    })
    .join("");

  const firstName = data.customerName?.trim().split(/\s+/)[0] || "there";

  const content = `
    <p style="margin: 0 0 10px; font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; color: #9ca3af; font-weight: 700; font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif;">Order update · ${data.orderNumber}</p>
    <h2 style="margin: 0 0 20px;">${getHeader()}</h2>

    <p>Hi ${firstName},</p>
    <p>${getContextualMessage()}</p>

    <!-- Progress stepper -->
    <div class="info-box" style="margin-top: 24px;">
      <p style="margin: 0 0 16px; font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; color: #6b7280; font-weight: 700; font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif;">Where your order is</p>
      <table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
        <tbody>
          ${stepperRows}
        </tbody>
      </table>
    </div>

    ${
      data.trackingNumber
        ? `
    <div class="info-box" style="margin-top: 16px;">
      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
        <tr>
          <td style="vertical-align: top; padding: 0 0 8px;">
            <p style="margin: 0 0 2px; font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; color: #9ca3af; font-weight: 700; font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif;">Tracking number</p>
            <p style="margin: 0; font-size: 14px; font-weight: 600; color: #111111; font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif;">${data.trackingNumber}</p>
          </td>
          ${
            data.estimatedArrival
              ? `<td style="vertical-align: top; text-align: right; padding: 0 0 8px;">
              <p style="margin: 0 0 2px; font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; color: #9ca3af; font-weight: 700; font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif;">Est. arrival</p>
              <p style="margin: 0; font-size: 14px; font-weight: 600; color: #111111; font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif;">${data.estimatedArrival}</p>
            </td>`
              : ""
          }
        </tr>
      </table>
    </div>
    `
        : ""
    }

    <a href="${orderUrl}" class="button" style="margin-top: 24px;">View My Order</a>
    <a href="${supportUrl}" class="button-secondary" style="margin-top: 10px;">Contact Support</a>

    <p style="font-size: 13px; color: #9ca3af; font-style: italic; margin: 24px 0 0; font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6;">
      Something doesn't look right? Reply to this email and our team will sort it out straight away.
    </p>

    <p style="font-size: 14px; color: #374151; margin: 20px 0 0; line-height: 1.7; font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif;">
      <strong style="color: #111111;">The D'FOOTPRINT Team</strong>
    </p>
  `;

  return baseTemplate(content);
};