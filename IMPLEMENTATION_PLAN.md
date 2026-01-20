# 🚀 D'FOOTPRINT Implementation Plan

**Created:** January 2026  
**Purpose:** Detailed implementation plan for all identified features  
**Email Service:** Resend (as specified)  
**Total Timeline:** 9-12 weeks  
**Reference:** REMAINING_FEATURES_ANALYSIS.md

---

## 📋 Overview

This plan outlines the step-by-step implementation of all missing features identified in the comprehensive analysis. Each phase is designed to deliver immediate business value while building toward a complete, optimized e-commerce platform.

**Current Status:** 40% feature-complete  
**Target Status:** 100% feature-complete  
**Email Service:** **Resend** (specified requirement)

---

## 🎯 Phase 1: Analytics Foundation (Week 1)

**Goal:** Implement complete tracking infrastructure to measure everything  
**Priority:** CRITICAL  
**Time:** 5 days

### Day 1: Google Analytics 4 Setup

#### Tasks:

1. Create GA4 property at [analytics.google.com](https://analytics.google.com)
2. Get Measurement ID (G-XXXXXXXXXX)
3. Install dependencies:

   ```bash
   npm install react-gtm-module
   ```

4. Create analytics utility file:

   ```typescript
   // lib/analytics/google-analytics.ts
   export const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

   // Validate GA_ID is set before using
   if (!GA_ID) {
     console.warn(
       "Google Analytics ID is not set. Analytics will not be tracked.",
     );
   }

   export const pageview = (url: string) => {
     if (typeof window !== "undefined" && window.gtag && GA_ID) {
       window.gtag("config", GA_ID, {
         page_path: url,
       });
     }
   };

   export const event = ({
     action,
     category,
     label,
     value,
   }: {
     action: string;
     category: string;
     label?: string;
     value?: number;
   }) => {
     if (typeof window !== "undefined" && window.gtag && GA_ID) {
       window.gtag("event", action, {
         event_category: category,
         event_label: label,
         value: value,
       });
     }
   };
   ```

5. Add to `app/layout.tsx`:

   ```typescript
   import Script from 'next/script';

   // In return statement, before </body>
   {process.env.NEXT_PUBLIC_GA_ID && (
     <>
       <Script
         src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
         strategy="afterInteractive"
       />
       <Script id="google-analytics" strategy="afterInteractive">
         {`
           window.dataLayer = window.dataLayer || [];
           function gtag(){dataLayer.push(arguments);}
           gtag('js', new Date());
           gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}');
         `}
       </Script>
     </>
   )}
   ```

6. Add to `.env.local`:

   ```env
   NEXT_PUBLIC_GA_ID="G-XXXXXXXXXX"
   ```

7. Test with GA Debugger Chrome extension

#### Deliverables:

- ✅ GA4 property created
- ✅ Tracking code installed
- ✅ Page views tracking
- ✅ Analytics utility functions

---

### Day 2: Facebook Pixel & TikTok Pixel

#### Facebook Pixel Tasks:

1. Create Facebook Pixel at [business.facebook.com](https://business.facebook.com)
2. Get Pixel ID

3. Create Facebook Pixel utility:

   ```typescript
   // lib/analytics/facebook-pixel.ts
   export const FB_PIXEL_ID = process.env.NEXT_PUBLIC_FB_PIXEL_ID;

   export const pageview = () => {
     if (typeof window !== "undefined" && window.fbq) {
       window.fbq("track", "PageView");
     }
   };

   export const event = (name: string, options = {}) => {
     if (typeof window !== "undefined" && window.fbq) {
       window.fbq("track", name, options);
     }
   };
   ```

4. Add to `app/layout.tsx`:
   ```typescript
   {process.env.NEXT_PUBLIC_FB_PIXEL_ID && (
     <Script id="facebook-pixel" strategy="afterInteractive">
       {`
         !function(f,b,e,v,n,t,s)
         {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
         n.callMethod.apply(n,arguments):n.queue.push(arguments)};
         if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
         n.queue=[];t=b.createElement(e);t.async=!0;
         t.src=v;s=b.getElementsByTagName(e)[0];
         s.parentNode.insertBefore(t,s)}(window, document,'script',
         'https://connect.facebook.net/en_US/fbevents.js');
         fbq('init', '${process.env.NEXT_PUBLIC_FB_PIXEL_ID}');
         fbq('track', 'PageView');
       `}
     </Script>
   )}
   ```

#### TikTok Pixel Tasks:

1. Create TikTok Pixel at [ads.tiktok.com](https://ads.tiktok.com)
2. Get Pixel ID

3. Create TikTok Pixel utility:

   ```typescript
   // lib/analytics/tiktok-pixel.ts
   export const TIKTOK_PIXEL_ID = process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID;

   export const pageview = () => {
     if (typeof window !== "undefined" && window.ttq) {
       window.ttq.page();
     }
   };

   export const event = (name: string, options = {}) => {
     if (typeof window !== "undefined" && window.ttq) {
       window.ttq.track(name, options);
     }
   };
   ```

4. Add to `app/layout.tsx`:

   ```typescript
   {process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID && (
     <Script id="tiktok-pixel" strategy="afterInteractive">
       {`
         !function (w, d, t) {
           w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var o=document.createElement("script");o.type="text/javascript",o.async=!0,o.src=i+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};
           ttq.load('${process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID}');
           ttq.page();
         }(window, document, 'ttq');
       `}
     </Script>
   )}
   ```

5. Update `.env.local`:
   ```env
   NEXT_PUBLIC_FB_PIXEL_ID="XXXXXXXXXXXXX"
   NEXT_PUBLIC_TIKTOK_PIXEL_ID="XXXXXXXXXXXXX"
   ```

#### Deliverables:

- ✅ Facebook Pixel installed
- ✅ TikTok Pixel installed
- ✅ Both pixels tracking page views
- ✅ Event tracking utilities created

---

### Day 3-4: E-commerce Event Tracking

#### Tasks:

1. Create unified tracking service:

   ```typescript
   // lib/analytics/index.ts
   import * as ga from "./google-analytics";
   import * as fbPixel from "./facebook-pixel";
   import * as tiktok from "./tiktok-pixel";

   export const trackPageView = (url: string) => {
     ga.pageview(url);
     fbPixel.pageview();
     tiktok.pageview();
   };

   export const trackProductView = (product: {
     id: string;
     name: string;
     price: number;
     category?: string;
   }) => {
     ga.event({
       action: "view_item",
       category: "ecommerce",
       label: product.name,
       value: product.price,
     });

     fbPixel.event("ViewContent", {
       content_ids: [product.id],
       content_name: product.name,
       content_type: "product",
       value: product.price,
       currency: "NGN",
     });

     tiktok.event("ViewContent", {
       content_id: product.id,
       content_name: product.name,
       price: product.price,
       currency: "NGN",
     });
   };

   export const trackAddToCart = (product: {
     id: string;
     name: string;
     price: number;
     quantity: number;
   }) => {
     ga.event({
       action: "add_to_cart",
       category: "ecommerce",
       label: product.name,
       value: product.price * product.quantity,
     });

     fbPixel.event("AddToCart", {
       content_ids: [product.id],
       content_name: product.name,
       value: product.price * product.quantity,
       currency: "NGN",
     });

     tiktok.event("AddToCart", {
       content_id: product.id,
       quantity: product.quantity,
       price: product.price,
       currency: "NGN",
     });
   };

   export const trackInitiateCheckout = (cartValue: number) => {
     ga.event({
       action: "begin_checkout",
       category: "ecommerce",
       value: cartValue,
     });

     fbPixel.event("InitiateCheckout", {
       value: cartValue,
       currency: "NGN",
     });

     tiktok.event("InitiateCheckout", {
       value: cartValue,
       currency: "NGN",
     });
   };

   export const trackPurchase = (order: {
     orderId: string;
     value: number;
     items: Array<{ id: string; name: string; quantity: number }>;
   }) => {
     ga.event({
       action: "purchase",
       category: "ecommerce",
       label: order.orderId,
       value: order.value,
     });

     fbPixel.event("Purchase", {
       value: order.value,
       currency: "NGN",
       content_ids: order.items.map((item) => item.id),
     });

     tiktok.event("CompletePayment", {
       value: order.value,
       currency: "NGN",
       content_ids: order.items.map((item) => item.id),
     });
   };
   ```

2. Integrate tracking in components:

   - Add `trackProductView` to product page
   - Add `trackAddToCart` to add to cart action
   - Add `trackInitiateCheckout` to checkout page
   - Add `trackPurchase` to checkout success page

3. Test all events with browser dev tools and pixel helpers

#### Deliverables:

- ✅ Unified tracking service
- ✅ Product view tracking
- ✅ Add to cart tracking
- ✅ Checkout tracking
- ✅ Purchase tracking
- ✅ All pixels firing correctly

---

### Day 5: Google Tag Manager (Optional but Recommended)

#### Tasks:

1. Create GTM container at [tagmanager.google.com](https://tagmanager.google.com)
2. Get GTM ID (GTM-XXXXXXX)

3. Add to `app/layout.tsx`:

   ```typescript
   {process.env.NEXT_PUBLIC_GTM_ID && (
     <>
       <Script id="google-tag-manager" strategy="afterInteractive">
         {`
           (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
           new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
           j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
           'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
           })(window,document,'script','dataLayer','${process.env.NEXT_PUBLIC_GTM_ID}');
         `}
       </Script>
       <noscript>
         <iframe
           src={`https://www.googletagmanager.com/ns.html?id=${process.env.NEXT_PUBLIC_GTM_ID}`}
           height="0"
           width="0"
           style={{ display: 'none', visibility: 'hidden' }}
         />
       </noscript>
     </>
   )}
   ```

4. Configure GA4, Facebook Pixel, and TikTok Pixel in GTM (future migration)

#### Deliverables:

- ✅ GTM installed
- ✅ Ready for future tag management

---

## 📧 Phase 2: Email Marketing with Resend (Week 2)

**Goal:** Implement complete email automation using Resend  
**Priority:** CRITICAL  
**Time:** 5 days  
**Email Service:** **Resend** (specified)

### Day 1: Resend Setup & Configuration

#### Tasks:

1. Sign up at [resend.com](https://resend.com)
2. Verify domain or use resend.dev for testing
3. Get API key from dashboard

4. Install Resend:

   ```bash
   npm install resend
   ```

5. Create Resend utility:

   ```typescript
   // lib/email/resend.ts
   import { Resend } from "resend";

   // Validate Resend API key
   if (!process.env.RESEND_API_KEY) {
     throw new Error("RESEND_API_KEY is not set in environment variables");
   }

   const resend = new Resend(process.env.RESEND_API_KEY);

   export const sendEmail = async ({
     to,
     subject,
     html,
     from = process.env.SMTP_FROM_EMAIL || "noreply@yourdomain.com",
   }: {
     to: string | string[];
     subject: string;
     html: string;
     from?: string;
   }) => {
     try {
       const data = await resend.emails.send({
         from,
         to,
         subject,
         html,
       });
       return { success: true, data };
     } catch (error) {
       // Log full error for debugging but don't expose to client
       console.error("Email sending error:", error);
       return {
         success: false,
         error: "Failed to send email. Please try again.",
       };
     }
   };
   ```

6. Add to `.env.local`:

   ```env
   RESEND_API_KEY="re_xxxxxxxxxxxxx"
   SMTP_FROM_EMAIL="noreply@yourdomain.com"
   SMTP_FROM_NAME="D'FOOTPRINT"
   ADMIN_EMAIL="admin@yourdomain.com"
   ```

7. Test email sending:
   ```typescript
   // Test in development
   const result = await sendEmail({
     to: "test@example.com",
     subject: "Test Email",
     html: "<h1>Test</h1><p>If you receive this, Resend is working!</p>",
   });
   ```

#### Deliverables:

- ✅ Resend account created
- ✅ API key configured
- ✅ Email utility function created
- ✅ Test email sent successfully

---

### Day 2: Email Templates

#### Tasks:

1. Create email template structure:

   ```typescript
   // lib/email/templates/base.ts
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
         }
         .header {
           text-align: center;
           padding: 20px 0;
           border-bottom: 2px solid #000;
         }
         .logo {
           font-size: 24px;
           font-weight: bold;
           color: #000;
         }
         .content {
           padding: 30px 0;
         }
         .button {
           display: inline-block;
           padding: 12px 24px;
           background-color: #000;
           color: #fff !important;
           text-decoration: none;
           border-radius: 4px;
           margin: 20px 0;
         }
         .footer {
           text-align: center;
           padding: 20px 0;
           border-top: 1px solid #ddd;
           font-size: 12px;
           color: #666;
         }
       </style>
     </head>
     <body>
       <div class="header">
         <div class="logo">D'FOOTPRINT</div>
         <p>Handcrafted Footwear from Lagos, Nigeria</p>
       </div>
       <div class="content">
         ${content}
       </div>
       <div class="footer">
         <p>D'FOOTPRINT - Handmade Footwear</p>
         <p>Lagos, Nigeria</p>
         <p>
           <a href="https://yourdomain.com">Visit our store</a> |
           <a href="https://yourdomain.com/account">Manage account</a>
         </p>
       </div>
     </body>
     </html>
   `;
   ```

2. Create order confirmation template:

   ```typescript
   // lib/email/templates/order-confirmation.ts
   import { baseTemplate } from "./base";

   export const orderConfirmationTemplate = (order: {
     orderNumber: string;
     customerName: string;
     totalAmount: number;
     items: Array<{
       productTitle: string;
       variantTitle: string;
       quantity: number;
       price: number;
     }>;
   }) => {
     const itemsHtml = order.items
       .map(
         (item) => `
         <tr>
           <td style="padding: 10px; border-bottom: 1px solid #eee;">
             ${item.productTitle} - ${item.variantTitle}
           </td>
           <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">
             ${item.quantity}
           </td>
           <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">
             ₦${item.price.toLocaleString()}
           </td>
         </tr>
       `,
       )
       .join("");

     const content = `
       <h2>Thank You for Your Order!</h2>
       <p>Hi ${order.customerName},</p>
       <p>We've received your order and it's being processed. Here are the details:</p>
       
       <h3>Order #${order.orderNumber}</h3>
       
       <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
         <thead>
           <tr style="background-color: #f5f5f5;">
             <th style="padding: 10px; text-align: left;">Item</th>
             <th style="padding: 10px; text-align: center;">Qty</th>
             <th style="padding: 10px; text-align: right;">Price</th>
           </tr>
         </thead>
         <tbody>
           ${itemsHtml}
         </tbody>
         <tfoot>
           <tr>
             <td colspan="2" style="padding: 10px; text-align: right; font-weight: bold;">Total:</td>
             <td style="padding: 10px; text-align: right; font-weight: bold;">
               ₦${order.totalAmount.toLocaleString()}
             </td>
           </tr>
         </tfoot>
       </table>
       
       <p>You'll receive another email when your order ships.</p>
       
       <a href="https://yourdomain.com/orders" class="button">Track Your Order</a>
       
       <p>If you have any questions, feel free to contact us.</p>
       <p>Best regards,<br>The D'FOOTPRINT Team</p>
     `;

     return baseTemplate(content);
   };
   ```

3. Create shipping notification template:

   ```typescript
   // lib/email/templates/shipping-notification.ts
   import { baseTemplate } from "./base";

   export const shippingNotificationTemplate = (order: {
     orderNumber: string;
     customerName: string;
     trackingNumber?: string;
     estimatedArrival?: string;
   }) => {
     const content = `
       <h2>Your Order Has Shipped! 📦</h2>
       <p>Hi ${order.customerName},</p>
       <p>Great news! Your order #${order.orderNumber} is on its way.</p>
       
       ${
         order.trackingNumber
           ? `<p><strong>Tracking Number:</strong> ${order.trackingNumber}</p>`
           : ""
       }
       ${
         order.estimatedArrival
           ? `<p><strong>Estimated Arrival:</strong> ${order.estimatedArrival}</p>`
           : ""
       }
       
       <a href="https://yourdomain.com/orders" class="button">Track Your Order</a>
       
       <p>Thank you for shopping with us!</p>
       <p>Best regards,<br>The D'FOOTPRINT Team</p>
     `;

     return baseTemplate(content);
   };
   ```

4. Create additional templates:
   - Welcome email
   - Password reset
   - Delivery confirmation
   - Abandoned cart email

#### Deliverables:

- ✅ Base email template
- ✅ Order confirmation template
- ✅ Shipping notification template
- ✅ Welcome email template
- ✅ Abandoned cart template

---

### Day 3: Newsletter Subscription

#### Tasks:

1. Create newsletter schema in database:

   ```prisma
   // Add to prisma/schema.prisma
   model NewsletterSubscriber {
     id            String   @id @default(uuid())
     email         String   @unique @db.VarChar(255)
     name          String?  @db.VarChar(255)
     status        String   @default("active") @db.VarChar(50) // active, unsubscribed
     subscribedAt  DateTime @default(now()) @map("subscribed_at")
     unsubscribedAt DateTime? @map("unsubscribed_at")

     @@index([email], name: "newsletter_subscribers_email_idx")
     @@map("newsletter_subscribers")
   }
   ```

2. Run migration:

   ```bash
   npx prisma db push
   npx prisma generate
   ```

3. Create newsletter API route:

   ```typescript
   // app/api/newsletter/subscribe/route.ts
   import { NextRequest, NextResponse } from "next/server";
   import { prisma } from "@/lib/prisma";
   import { sendEmail } from "@/lib/email/resend";
   import { welcomeEmailTemplate } from "@/lib/email/templates/welcome";

   export async function POST(request: NextRequest) {
     try {
       const { email, name } = await request.json();

       // Improved email validation
       const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
       if (!email || !emailRegex.test(email)) {
         return NextResponse.json(
           { error: "Valid email is required" },
           { status: 400 },
         );
       }

       // Check if already subscribed
       const existing = await prisma.newsletterSubscriber.findUnique({
         where: { email },
       });

       if (existing) {
         if (existing.status === "active") {
           return NextResponse.json(
             { message: "Already subscribed" },
             { status: 200 },
           );
         }

         // Resubscribe
         await prisma.newsletterSubscriber.update({
           where: { email },
           data: {
             status: "active",
             subscribedAt: new Date(),
             unsubscribedAt: null,
           },
         });
       } else {
         // New subscription
         await prisma.newsletterSubscriber.create({
           data: { email, name },
         });
       }

       // Send welcome email
       await sendEmail({
         to: email,
         subject: "Welcome to D'FOOTPRINT!",
         html: welcomeEmailTemplate({ name: name || "Friend" }),
       });

       return NextResponse.json(
         { message: "Successfully subscribed!" },
         { status: 200 },
       );
     } catch (error) {
       console.error("Newsletter subscription error:", error);
       return NextResponse.json(
         { error: "Failed to subscribe" },
         { status: 500 },
       );
     }
   }
   ```

4. Create newsletter form component:

   ```typescript
   // components/newsletter-form.tsx
   'use client';

   import { useState } from 'react';
   import { toast } from 'sonner';
   import LoadingDots from './loading-dots';

   export default function NewsletterForm() {
     const [email, setEmail] = useState('');
     const [name, setName] = useState('');
     const [loading, setLoading] = useState(false);

     const handleSubmit = async (e: React.FormEvent) => {
       e.preventDefault();
       setLoading(true);

       try {
         const response = await fetch('/api/newsletter/subscribe', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ email, name }),
         });

         const data = await response.json();

         if (response.ok) {
           toast.success(data.message || 'Successfully subscribed!');
           setEmail('');
           setName('');
         } else {
           toast.error(data.error || 'Failed to subscribe');
         }
       } catch (error) {
         toast.error('Something went wrong');
       } finally {
         setLoading(false);
       }
     };

     return (
       <form onSubmit={handleSubmit} className="flex flex-col gap-2">
         <input
           type="text"
           placeholder="Name (optional)"
           value={name}
           onChange={(e) => setName(e.target.value)}
           className="rounded-md border border-neutral-300 px-4 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
         />
         <div className="flex gap-2">
           <input
             type="email"
             placeholder="Enter your email"
             value={email}
             onChange={(e) => setEmail(e.target.value)}
             required
             className="flex-1 rounded-md border border-neutral-300 px-4 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
           />
           <button
             type="submit"
             disabled={loading}
             className="rounded-md bg-black px-6 py-2 text-sm text-white hover:bg-neutral-800 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-neutral-200"
           >
             {loading ? <LoadingDots className="bg-white" /> : 'Subscribe'}
           </button>
         </div>
         <p className="text-xs text-neutral-500">
           Get notified about new designs and special offers.
         </p>
       </form>
     );
   }
   ```

5. Add to footer:

   ```typescript
   // components/layout/footer.tsx
   import NewsletterForm from '../newsletter-form';

   // Add before closing footer tag
   <div className="border-t border-neutral-200 py-6 dark:border-neutral-700">
     <div className="mx-auto max-w-7xl px-4">
       <h3 className="mb-2 text-lg font-semibold">Stay Updated</h3>
       <NewsletterForm />
     </div>
   </div>
   ```

#### Deliverables:

- ✅ Newsletter database schema
- ✅ Subscribe API endpoint
- ✅ Newsletter form component
- ✅ Welcome email automation
- ✅ Form added to footer

---

### Day 4-5: Order Email Automation

#### Tasks:

1. Create email service wrapper:

   ```typescript
   // lib/email/order-emails.ts
   import { sendEmail } from "./resend";
   import { orderConfirmationTemplate } from "./templates/order-confirmation";
   import { shippingNotificationTemplate } from "./templates/shipping-notification";

   export const sendOrderConfirmation = async (order: any) => {
     return sendEmail({
       to: order.email,
       subject: `Order Confirmation #${order.orderNumber}`,
       html: orderConfirmationTemplate(order),
     });
   };

   export const sendShippingNotification = async (order: any) => {
     return sendEmail({
       to: order.email,
       subject: `Your Order Has Shipped! #${order.orderNumber}`,
       html: shippingNotificationTemplate(order),
     });
   };
   ```

2. Integrate with checkout success:

   ```typescript
   // app/checkout/success/page.tsx or wherever order is created
   import { sendOrderConfirmation } from "@/lib/email/order-emails";

   // After order is created
   await sendOrderConfirmation({
     orderNumber: order.orderNumber,
     customerName: order.customerName,
     email: order.email,
     totalAmount: order.totalAmount,
     items: order.items,
   });
   ```

3. Create admin endpoint for shipping notifications:

   ```typescript
   // app/api/admin/orders/[id]/ship/route.ts
   import { sendShippingNotification } from "@/lib/email/order-emails";

   export async function POST(
     request: NextRequest,
     { params }: { params: { id: string } },
   ) {
     // Update order status to 'dispatch'
     // Then send email
     await sendShippingNotification(order);

     return NextResponse.json({ success: true });
   }
   ```

4. Test all email flows:
   - Place test order → receive confirmation email
   - Update order to dispatch → receive shipping email

#### Deliverables:

- ✅ Order confirmation automation
- ✅ Shipping notification automation
- ✅ Email integration with checkout
- ✅ Admin shipping notification endpoint

---

## ⭐ Phase 3: Customer Engagement (Week 3-4)

**Goal:** Build trust and social proof  
**Priority:** HIGH  
**Time:** 10 days

### Week 3: Product Reviews System

#### Day 1-2: Database & Backend

1. Create reviews schema:

   ```prisma
   model Review {
     id          String   @id @default(uuid())
     productId   String   @map("product_id")
     userId      String?  @map("user_id")
     orderId     String?  @map("order_id")
     rating      Int      // 1-5
     title       String?  @db.VarChar(255)
     comment     String?  @db.Text
     images      String[] @default([])
     isVerified  Boolean  @default(false) @map("is_verified")
     helpfulCount Int     @default(0) @map("helpful_count")
     status      String   @default("pending") @db.VarChar(50)
     createdAt   DateTime @default(now()) @map("created_at")
     updatedAt   DateTime @default(now()) @updatedAt @map("updated_at")

     product Product @relation(fields: [productId], references: [id], onDelete: Cascade)
     user    User?   @relation(fields: [userId], references: [id])

     @@index([productId], name: "reviews_product_id_idx")
     @@index([userId], name: "reviews_user_id_idx")
     @@index([status], name: "reviews_status_idx")
     @@map("reviews")
   }
   ```

2. Create API routes for reviews (CRUD)
3. Add verified purchase checking logic

#### Day 3-4: Frontend Components

1. Review submission form
2. Review display component with star ratings
3. Review images gallery
4. Review helpful voting

#### Day 5: Admin Moderation

1. Admin reviews page
2. Approve/reject functionality
3. Reply to reviews feature

---

### Week 4: Additional Engagement Features

1. **Testimonials Section** (2 days)

   - Homepage testimonial carousel
   - Admin testimonial management

2. **Size Guide** (1 day)

   - Size chart modal component
   - Add to product pages

3. **Trust Badges** (1 day)

   - Create badge components
   - Add to checkout and footer

4. **Live Chat Widget** (1 day)
   - Integrate Crisp or Tawk.to
   - Configure chat settings

---

## 💰 Phase 4: Marketing & Conversion (Week 5)

**Goal:** Drive sales with promotions and recovery  
**Priority:** HIGH  
**Time:** 5 days

### Coupon System (3 days)

1. Database schema for coupons
2. Coupon validation API
3. Apply coupon in checkout
4. Admin coupon management interface

### Abandoned Cart Recovery (2 days)

1. Track cart abandonment
2. Create abandoned cart email template
3. Schedule email series (3 emails over 3 days)
4. Track recovery conversions

---

## 🛠️ Phase 5: Admin Enhancements (Week 6)

**Goal:** Improve operational efficiency  
**Priority:** MEDIUM  
**Time:** 5 days

### Dashboard Analytics (2 days)

1. Revenue charts (Chart.js or Recharts)
2. Order count trends
3. Top products widget
4. Low stock alerts

### Inventory Management (2 days)

1. Stock quantity tracking
2. Low stock alerts
3. Out of stock automation
4. Inventory history log

### Reports & Exports (1 day)

1. Sales report generator
2. Product performance report
3. CSV export functionality

---

## 🔍 Phase 6: SEO & Performance (Week 7)

**Goal:** Improve discoverability and speed  
**Priority:** MEDIUM  
**Time:** 5 days

### SEO Enhancements (3 days)

1. Enhanced schema markup (Organization, BreadcrumbList, Reviews)
2. Meta description audit and optimization
3. Alt text optimization
4. Internal linking improvements
5. Blog infrastructure (optional)

### Performance Monitoring (2 days)

1. Integrate Vercel Analytics
2. Set up Sentry for error tracking
3. Implement Web Vitals monitoring
4. Performance optimization audit

---

## ♿ Phase 7: UX & Accessibility (Week 8)

**Goal:** Improve usability for all users  
**Priority:** MEDIUM  
**Time:** 5 days

### Accessibility Audit (3 days)

1. ARIA labels comprehensive audit
2. Keyboard navigation testing and fixes
3. Screen reader testing
4. Color contrast fixes
5. Focus management improvements

### UX Features (2 days)

1. Wishlist functionality
2. Product comparison
3. Breadcrumb navigation
4. Better empty states

---

## 🔒 Phase 8: Security & Polish (Week 9)

**Goal:** Secure the platform and final testing  
**Priority:** MEDIUM  
**Time:** 5 days

### Security (3 days)

1. Security headers configuration
2. Rate limiting implementation
3. CAPTCHA on forms
4. 2FA for admin accounts
5. GDPR compliance (cookie consent, privacy policy)

### Testing & QA (2 days)

1. Comprehensive manual testing
2. Fix bugs and issues
3. Performance optimization
4. Final deployment checklist

---

## 📊 Success Metrics

Track these metrics to measure implementation success:

### Analytics Metrics

- ✅ GA4 tracking active
- ✅ Conversion rate baseline established
- ✅ Cart abandonment rate tracked

### Email Metrics

- ✅ Newsletter subscribers growth
- ✅ Email open rates (target: >20%)
- ✅ Email click-through rates (target: >3%)
- ✅ Cart recovery rate (target: 10-15%)

### Engagement Metrics

- ✅ Number of reviews collected
- ✅ Average rating
- ✅ Review conversion impact

### Sales Metrics

- ✅ Coupon usage rate
- ✅ Average order value
- ✅ Revenue growth week-over-week

---

## 🚨 Quick Implementation Checklist

### Week 1: Analytics

- [ ] Create GA4 property
- [ ] Install GA4 tracking code
- [ ] Create Facebook Pixel
- [ ] Install Facebook Pixel
- [ ] Create TikTok Pixel
- [ ] Install TikTok Pixel
- [ ] Implement e-commerce event tracking
- [ ] Test all pixels with browser tools

### Week 2: Email (Resend)

- [ ] Sign up for Resend account
- [ ] Get and configure API key
- [ ] Create email templates
- [ ] Build newsletter subscription
- [ ] Add newsletter form to footer
- [ ] Implement order confirmation emails
- [ ] Implement shipping notification emails
- [ ] Test all email flows

### Week 3-4: Engagement

- [ ] Create reviews database schema
- [ ] Build review submission form
- [ ] Create review display component
- [ ] Build admin review moderation
- [ ] Create testimonials section
- [ ] Add size guide modal
- [ ] Implement trust badges
- [ ] Integrate live chat widget

### Week 5: Marketing

- [ ] Create coupon database schema
- [ ] Build coupon validation API
- [ ] Integrate coupons in checkout
- [ ] Create admin coupon interface
- [ ] Implement cart abandonment tracking
- [ ] Create abandoned cart email series

### Week 6: Admin

- [ ] Build dashboard analytics
- [ ] Implement inventory management
- [ ] Create reports generator
- [ ] Add export functionality

### Week 7: SEO & Performance

- [ ] Add enhanced schema markup
- [ ] Audit and fix meta descriptions
- [ ] Optimize alt texts
- [ ] Set up performance monitoring
- [ ] Optimize images and assets

### Week 8: Accessibility & UX

- [ ] Conduct accessibility audit
- [ ] Fix ARIA labels
- [ ] Test keyboard navigation
- [ ] Implement wishlist
- [ ] Add breadcrumbs

### Week 9: Security

- [ ] Configure security headers
- [ ] Implement rate limiting
- [ ] Add CAPTCHA to forms
- [ ] Enable 2FA for admins
- [ ] GDPR compliance check
- [ ] Final testing and bug fixes

---

## 📝 Environment Variables Needed

Add these to `.env.local`:

```env
# Analytics
NEXT_PUBLIC_GA_ID="G-XXXXXXXXXX"
NEXT_PUBLIC_FB_PIXEL_ID="XXXXXXXXXXXXX"
NEXT_PUBLIC_TIKTOK_PIXEL_ID="XXXXXXXXXXXXX"
NEXT_PUBLIC_GTM_ID="GTM-XXXXXXX"

# Email (Resend - SPECIFIED)
RESEND_API_KEY="re_xxxxxxxxxxxxx"
SMTP_FROM_EMAIL="noreply@yourdomain.com"
SMTP_FROM_NAME="D'FOOTPRINT"
ADMIN_EMAIL="admin@yourdomain.com"

# WhatsApp
NEXT_PUBLIC_WHATSAPP_NUMBER="+234XXXXXXXXXX"

# Feature Flags (optional)
NEXT_PUBLIC_ENABLE_REVIEWS="true"
NEXT_PUBLIC_ENABLE_NEWSLETTER="true"
```

---

## 🎯 Priority Order

If you can only implement some features, prioritize in this order:

1. **Analytics** (Week 1) - MUST HAVE - Can't improve without data
2. **Email with Resend** (Week 2) - MUST HAVE - Direct revenue impact
3. **Reviews** (Week 3) - MUST HAVE - Trust and conversion
4. **Coupons** (Week 5 - Part 1) - SHOULD HAVE - Marketing capability
5. **Inventory** (Week 6 - Part 2) - SHOULD HAVE - Operational necessity
6. **Dashboard** (Week 6 - Part 1) - SHOULD HAVE - Business visibility
7. Everything else - NICE TO HAVE

---

## 📚 Resources

### Resend Documentation

- [Resend Docs](https://resend.com/docs)
- [Resend Next.js Guide](https://resend.com/docs/send-with-nextjs)
- [Resend Email Templates](https://resend.com/docs/api-reference/emails/send-email)

### Analytics

- [GA4 Implementation Guide](https://developers.google.com/analytics/devguides/collection/ga4)
- [Facebook Pixel Documentation](https://developers.facebook.com/docs/meta-pixel)
- [TikTok Pixel Guide](https://ads.tiktok.com/help/article?aid=10000357)

### Testing Tools

- [GA Debugger Chrome Extension](https://chrome.google.com/webstore/detail/google-analytics-debugger/)
- [Facebook Pixel Helper](https://chrome.google.com/webstore/detail/facebook-pixel-helper/)
- [TikTok Pixel Helper](https://chrome.google.com/webstore/detail/tiktok-pixel-helper/)

---

## ✅ Definition of Done

Each feature is complete when:

- [ ] Code is written and tested
- [ ] Works on desktop and mobile
- [ ] No console errors
- [ ] Performance impact checked
- [ ] Documentation updated
- [ ] Environment variables documented
- [ ] Admin training materials created (if applicable)
- [ ] Metrics tracking configured
- [ ] Deployed to production
- [ ] Tested in production

---

## 🎉 Conclusion

This plan provides a complete roadmap to implement all identified features using **Resend for email** as specified. The phased approach ensures you can deliver value incrementally while building toward a complete, optimized platform.

**Total Timeline:** 9 weeks  
**Expected Outcome:** 100% feature-complete platform with 30-50% revenue increase

**Next Step:** Start with Phase 1 - Analytics Foundation (Week 1)

---

**Document Version:** 1.0  
**Last Updated:** January 2026  
**Email Service:** Resend (as specified)  
**Status:** Ready for implementation
