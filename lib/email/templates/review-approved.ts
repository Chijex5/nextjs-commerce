import { getEmailTemplate } from './base';

export function getReviewApprovedEmailTemplate(params: {
  customerName: string;
  productTitle: string;
  productHandle: string;
  reviewTitle: string;
  reviewComment: string;
  rating: number;
}): string {
  const { customerName, productTitle, productHandle, reviewTitle, reviewComment, rating} = params;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXTAUTH_URL || 'https://yourdomain.com';
  const productUrl = `${siteUrl}/product/${productHandle}`;

  const stars = '★'.repeat(rating) + '☆'.repeat(5 - rating);

  const content = `
    <div style="margin-bottom: 24px;">
      <h2 style="color: #000; font-size: 24px; font-weight: 600; margin: 0 0 16px 0;">Your Review is Live!</h2>
      <p style="color: #737373; font-size: 14px; line-height: 1.5; margin: 0 0 24px 0;">
        Hi ${customerName},
      </p>
      <p style="color: #737373; font-size: 14px; line-height: 1.5; margin: 0 0 24px 0;">
        Great news! Your review for <strong style="color: #000;">${productTitle}</strong> has been approved and is now live on our website.
      </p>
    </div>

    <div style="border: 1px solid #e5e5e5; padding: 24px; margin-bottom: 24px;">
      <h3 style="color: #000; font-size: 16px; font-weight: 600; margin: 0 0 8px 0;">Your Review</h3>
      <div style="color: #000; font-size: 18px; margin-bottom: 8px;">${stars}</div>
      ${reviewTitle ? `<p style="color: #000; font-size: 14px; font-weight: 600; margin: 0 0 8px 0;">${reviewTitle}</p>` : ''}
      ${reviewComment ? `<p style="color: #737373; font-size: 14px; line-height: 1.5; margin: 0;">${reviewComment}</p>` : ''}
    </div>

    <p style="color: #737373; font-size: 14px; line-height: 1.5; margin: 0 0 24px 0;">
      Thank you for sharing your experience. Your feedback helps other customers make informed decisions.
    </p>

    <div style="text-align: center; margin: 32px 0;">
      <a href="${productUrl}" style="display: inline-block; background-color: #000; color: #fff; text-decoration: none; padding: 12px 32px; font-size: 14px; font-weight: 500; border-radius: 4px;">
        View Your Review
      </a>
    </div>
  `;

  return getEmailTemplate(content);
}
