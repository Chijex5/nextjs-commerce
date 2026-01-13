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
    <h2>Welcome to D'FOOTPRINT! 👋</h2>
    <p>Hi ${data.name},</p>
    <p>Thank you for joining the D'FOOTPRINT family! We're thrilled to have you with us.</p>
    
    <p>At D'FOOTPRINT, every pair of footwear is handcrafted with love and attention to detail in Lagos, Nigeria. We believe in creating unique, high-quality pieces that tell a story.</p>
    
    <h3>What You Can Expect:</h3>
    <ul>
      <li><strong>New Design Alerts:</strong> Be the first to know about our latest creations</li>
      <li><strong>Exclusive Offers:</strong> Special discounts just for our subscribers</li>
      <li><strong>Behind the Scenes:</strong> Insights into our handcrafting process</li>
      <li><strong>Custom Order Tips:</strong> Learn how to get your dream footwear made</li>
    </ul>
    
    <a href="${siteUrl}/products" class="button">Explore Our Collection</a>
    
    <p>Have questions? We're always here to help. Just reply to this email!</p>
    <p>Welcome aboard!</p>
    <p>Best regards,<br>The D'FOOTPRINT Team</p>
  `;

  return baseTemplate(content);
};
