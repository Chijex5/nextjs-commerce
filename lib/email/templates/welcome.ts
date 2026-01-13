import { baseTemplate } from './base';

interface WelcomeEmailData {
  name: string;
}

/**
 * Welcome email template
 * Sent when user subscribes to newsletter or creates account
 */
export const welcomeEmailTemplate = (data: WelcomeEmailData) => {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXTAUTH_URL || 'https://yourdomain.com';
  
  const content = `
    <h2>Welcome to D'FOOTPRINT</h2>
    <p>Hi ${data.name},</p>
    <p>Thank you for joining the D'FOOTPRINT family. We're excited to have you with us.</p>
    
    <p>At D'FOOTPRINT, every pair of footwear is handcrafted with care in Lagos, Nigeria. We create unique, high-quality pieces that tell a story.</p>
    
    <h3>What You Can Expect</h3>
    <p style="margin: 8px 0;"><strong>New Design Alerts</strong> – Be the first to see our latest creations</p>
    <p style="margin: 8px 0;"><strong>Exclusive Offers</strong> – Special discounts for subscribers</p>
    <p style="margin: 8px 0;"><strong>Behind the Scenes</strong> – Insights into our craft</p>
    <p style="margin: 8px 0;"><strong>Custom Orders</strong> – Learn how to get your dream footwear</p>
    
    <a href="${siteUrl}/products" class="button">Explore Our Collection</a>
    
    <p>Have questions? We're here to help. Just reply to this email.</p>
    <p>Best regards,<br>The D'FOOTPRINT Team</p>
  `;

  return baseTemplate(content);
};
