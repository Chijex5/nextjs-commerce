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
  const toWords = (value?: string) => {
    const normalized = normalize(value).replace(/[_-]+/g, " ");
    if (!normalized) return "status update";
    return normalized.replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const deliveryStatus = normalize(data.deliveryStatus);
  const newStatus = normalize(data.newStatus);
  const oldStatus = normalize(data.oldStatus);

  const steps = [
    { key: "confirmed", label: "Order Confirmed" },
    { key: "processing", label: "Processing" },
    { key: "sorting", label: "Sorting" },
    { key: "shipped", label: "Shipped" },
    { key: "delivered", label: "Delivered" },
  ];

  const getCurrentStep = () => {
    if (["delivered", "completed"].includes(deliveryStatus)) return 4;
    if (["dispatch", "dispatched", "shipped"].includes(deliveryStatus)) return 3;
    if (["sorting", "in sorting", "in_sorting"].includes(deliveryStatus)) return 2;
    return 1;
  };

  const currentStep = getCurrentStep();

  const getHeader = () => {
    if (currentStep === 4) return "Your order has been delivered";
    if (currentStep === 3) return "Your order has been shipped";
    if (currentStep === 2) return "Your order is now being sorted";
    return "Your order is in production";
  };

  const getContextualMessage = () => {
    if (currentStep === 2) {
      return "We have started sorting your items for delivery. Your order is still in processing and will move to shipped once it leaves our facility.";
    }
    if (currentStep === 3) {
      return "Your handcrafted pair has left our facility and is now on the way to you.";
    }
    if (currentStep === 4) {
      return "Your order has been marked as delivered. We hope your pair feels as good as it looks.";
    }
    return "Our artisans are currently handcrafting your pair with care. We will send another update when it moves to sorting.";
  };

  const updateLabel =
    oldStatus && oldStatus !== newStatus
      ? `${toWords(data.oldStatus)} -> ${toWords(data.newStatus)}`
      : deliveryStatus
        ? `${toWords(data.deliveryStatus)} stage`
        : toWords(data.newStatus);

  const stepperRows = steps
    .map((step, index) => {
      const isComplete = index < currentStep;
      const isCurrent = index === currentStep;
      const marker = isComplete ? "&#10003;" : isCurrent ? "&#9679;" : "&#9675;";
      const tone = isCurrent
        ? "color: #111827; font-weight: 600;"
        : isComplete
          ? "color: #1f2937;"
          : "color: #9ca3af;";

      return `<tr>
        <td style="width: 24px; padding: 8px 0; vertical-align: top; font-size: 14px; color: ${isCurrent ? "#111827" : isComplete ? "#1f2937" : "#9ca3af"};">${marker}</td>
        <td style="padding: 8px 0; font-size: 14px; ${tone}">${step.label}${isCurrent ? " (current)" : ""}</td>
      </tr>`;
    })
    .join("");

  const content = `
    <p style="margin: 0; font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase; color: #6b7280; font-weight: 600;">Order Update</p>
    <h2>${getHeader()}</h2>
    <p>Hi ${data.customerName},</p>
    <p>${getContextualMessage()}</p>
    
    <div class="info-box" style="margin-top: 14px;">
      <p style="margin: 0 0 8px; font-size: 13px; color: #4b5563;">Order ${data.orderNumber}</p>
      <p style="margin: 0; font-size: 14px; color: #111827;"><strong>What changed:</strong> ${updateLabel}</p>
    </div>

    <div class="info-box" style="margin-top: 14px;">
      <p style="margin: 0 0 10px; font-weight: 600; color: #111827;">Progress</p>
      <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 0;">
        <tbody>
          ${stepperRows}
        </tbody>
      </table>
    </div>
    
    ${
      data.trackingNumber
        ? `
    <div class="info-box" style="margin-top: 14px;">
      <p style="margin: 0 0 6px;"><strong>Tracking number:</strong> ${data.trackingNumber}</p>
      ${data.estimatedArrival ? `<p style="margin: 0;"><strong>Estimated arrival:</strong> ${data.estimatedArrival}</p>` : ""}
    </div>
    `
        : ""
    }
    
    <a href="${orderUrl}" class="button">View Order Details</a>
    <a href="${supportUrl}" class="button-secondary">Contact Support</a>
    
    <p style="margin-top: 12px; color: #4b5563;">You can view full order details anytime from your account.</p>
    
    <p class="support-note">If you need help with this update, reply to this email and we’ll assist right away.</p>
    <p>Best regards,<br>The D'FOOTPRINT Team</p>
  `;

  return baseTemplate(content);
};
