# Email System Implementation - Complete Guide

**Implemented:** January 2026  
**Status:** Production Ready  
**Commit:** c56f37d

---

## 🎯 Overview

Complete email automation system with Google Email Markup, order notifications, status updates, and abandoned cart recovery.

---

## ✅ What Was Implemented

### 1. Order Confirmation with Google Email Markup (JSON-LD)

**File:** `lib/email/templates/order-confirmation-with-markup.ts`

**Features:**

- Full Schema.org Order markup for Gmail
- Structured data includes:
  - Merchant information (D'FOOTPRINT)
  - Order number, date, status
  - Customer details
  - Order items with prices
  - Delivery address
  - Expected arrival dates
  - View Order action button
- Beautiful HTML email template
- Itemized order list
- Shipping address display
- Track order CTA

**Integration:** Automatically sent after successful payment verification in `app/api/checkout/verify/route.ts`

**Google Email Markup Benefits:**

- Rich order cards in Gmail inbox
- Quick access to order tracking
- Professional appearance
- Reduces support inquiries
- Better customer experience

---

### 2. Google Email Markup Whitelisting Script

**File:** `scripts/send-google-test-email.js`

**Purpose:** Send test email to Google for Email Markup whitelisting approval

**Usage:**

```bash
# Set environment variables
export RESEND_API_KEY="re_xxxxxxxxxxxxx"
export SMTP_FROM_EMAIL="noreply@yourdomain.com"

# Run script
node scripts/send-google-test-email.js
```

**Output:**

```
🚀 Sending test email to Google for Email Markup whitelisting...
From: noreply@yourdomain.com
To: schema.whitelisting+sample@gmail.com
✅ Test email sent successfully!
📧 Email ID: xxxxx

📝 Next Steps:
1. Wait for Google to process your whitelisting request (can take 5-7 business days)
2. You will receive an email confirmation when approved
3. Once approved, Email Markup will work in Gmail for all your order emails
```

**Process:**

1. Run the script once
2. Wait 5-7 business days
3. Google approves and emails confirmation
4. All future order emails show rich markup in Gmail

---

### 3. Order Status Update Emails

**File:** `lib/email/templates/order-status-update.ts`

**Features:**

- Automatically sent when order status or delivery status changes
- Different templates for each status:
  - 📦 **Dispatch** - "Your Order Has Been Dispatched!"
  - 📋 **In Sorting** - "Order Update: In Sorting"
  - ✅ **Delivered** - "Order Delivered Successfully!"
  - 🛠️ **Production** - "Your Order is in Production"
  - ❌ **Cancelled** - "Order Cancelled"
- Shows status transition (old → new)
- Includes tracking number (if available)
- Estimated arrival date
- Track order button
- Contextual messaging

**Integration:** Automatically triggered in `app/api/admin/orders/[id]/route.ts` when admin updates order

**Example Flow:**

```
1. Admin changes order status from "processing" → "production"
   → Email sent: "Your Order is in Production"

2. Admin changes delivery status to "dispatch" + adds tracking
   → Email sent: "Your Order Has Been Dispatched!" with tracking number

3. Admin changes delivery status to "delivered"
   → Email sent: "Order Delivered Successfully!" with feedback request
```

---

### 4. Abandoned Cart Recovery System

#### Files:

- `lib/email/templates/abandoned-cart.ts` - Beautiful recovery email
- `app/api/abandoned-cart/route.ts` - API for tracking and sending
- `prisma/schema.prisma` - AbandonedCart database model

#### Database Schema:

```prisma
model AbandonedCart {
  id              String    @id @default(uuid())
  userId          String    // Logged-in user
  cartId          String    // Cart reference
  email           String
  customerName    String
  cartTotal       Decimal   // Total cart value
  items           Json      // Cart items with images
  emailSent       Boolean   @default(false)
  emailSentAt     DateTime?
  recovered       Boolean   @default(false)
  recoveredAt     DateTime?
  createdAt       DateTime  @default(now())
  expiresAt       DateTime  // 1 hour threshold

  user User @relation(...)
}
```

#### How It Works:

**Step 1: Track Cart (POST /api/abandoned-cart)**

```typescript
// Frontend: Track when logged-in user adds to cart
await fetch("/api/abandoned-cart", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    cartId: cart.id,
    items: cart.items.map((item) => ({
      productTitle: item.product.title,
      variantTitle: item.variant.title,
      quantity: item.quantity,
      price: item.variant.price,
      imageUrl: item.product.image,
    })),
    cartTotal: cart.total,
  }),
});
```

- Records cart with 1-hour expiration
- Updates if cart changes before expiration
- Only tracks logged-in users

**Step 2: Send Emails (GET /api/abandoned-cart)**

```bash
# Cron job calls this endpoint hourly
curl https://yourdomain.com/api/abandoned-cart
```

- Finds carts past 1-hour expiration
- Sends recovery email
- Marks as email sent
- Processes in batches (50 at a time)

**Step 3: Recovery Tracking**

- When user completes checkout, mark cart as recovered
- Track recovery metrics for ROI

#### Email Template Features:

- Shows up to 3 cart items with product images
- Displays total cart value (₦XX,XXX)
- "Why shop with D'FOOTPRINT" benefits
- **Complete Your Order** CTA button
- **View Your Cart** link
- One-time reminder (not spam)
- Professional, non-pushy tone

#### Expected Results:

- **Industry Average Recovery:** 10-15%
- **Additional Revenue:** Recover abandoned carts worth ₦X per month
- **Customer Experience:** Helpful reminder, not annoying
- **ROI Tracking:** Monitor recovered vs. sent emails

---

## 🚀 Setup Instructions

### Prerequisites

1. Resend account with verified domain
2. Environment variables set
3. Database migrated

### Step 1: Environment Variables

Add to `.env.local`:

```env
# Email (Resend)
RESEND_API_KEY="re_xxxxxxxxxxxxx"
SMTP_FROM_EMAIL="noreply@yourdomain.com"
SMTP_FROM_NAME="D'FOOTPRINT"
NEXT_PUBLIC_SITE_URL="https://yourdomain.com"
```

### Step 2: Database Migration

```bash
npx prisma db push
npx prisma generate
```

This adds the `AbandonedCart` table.

### Step 3: Google Email Markup Whitelisting

```bash
# Make sure environment variables are set
export RESEND_API_KEY="re_xxxxxxxxxxxxx"
export SMTP_FROM_EMAIL="noreply@yourdomain.com"

# Run the whitelisting script
node scripts/send-google-test-email.js
```

Wait 5-7 business days for Google approval.

### Step 4: Set Up Abandoned Cart Cron Job

**Option A: Vercel Cron (Recommended)**

Create `vercel.json` in project root:

```json
{
  "crons": [
    {
      "path": "/api/abandoned-cart",
      "schedule": "0 * * * *"
    }
  ]
}
```

This runs hourly at the top of each hour.

**Option B: External Cron Service**

Use [cron-job.org](https://cron-job.org) or similar:

- URL: `https://yourdomain.com/api/abandoned-cart`
- Schedule: Every hour
- Method: GET

**Option C: Manual Testing**

```bash
# Test abandoned cart email sending
curl https://yourdomain.com/api/abandoned-cart
```

### Step 5: Integrate Cart Tracking (Frontend)

Add to your cart component when user adds items:

```typescript
'use client';

import { useSession } from 'next-auth/react';

export function AddToCartButton({ product, variant }) {
  const { data: session } = useSession();

  const handleAddToCart = async () => {
    // ... existing add to cart logic ...

    // Track abandoned cart for logged-in users
    if (session?.user) {
      try {
        // Get updated cart data after adding
        const cart = await getCart();

        await fetch('/api/abandoned-cart', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            cartId: cart.id,
            items: cart.lines.map(line => ({
              productTitle: line.variant.product.title,
              variantTitle: line.variant.title,
              quantity: line.quantity,
              price: Number(line.variant.price),
              imageUrl: line.variant.product.images[0]?.url
            })),
            cartTotal: Number(cart.totalAmount)
          })
        });
      } catch (error) {
        // Don't fail add-to-cart if tracking fails
        console.error('Failed to track abandoned cart:', error);
      }
    }
  };

  return (
    <button onClick={handleAddToCart}>
      Add to Cart
    </button>
  );
}
```

---

## 📊 Testing

### Test Order Confirmation Email

1. Complete a test purchase
2. Check that order confirmation email is sent
3. Open email in Gmail to see rich markup (after whitelisting approval)
4. Verify all order details are correct

### Test Status Update Email

1. Go to admin orders page
2. Update an order status
3. Check that status update email is sent
4. Verify correct status shown in email

### Test Abandoned Cart Email

1. Log in as a user
2. Add items to cart
3. Don't checkout
4. Wait 1 hour
5. Manually trigger: `curl https://yourdomain.com/api/abandoned-cart`
6. Check that abandoned cart email is sent

---

## 📧 Email Examples

### Order Confirmation (with JSON-LD)

```
Subject: Order Confirmation #ORD-123456 - D'FOOTPRINT

Thank You for Your Order! 🎉

Hi John Doe,

We've received your order and it's being processed. Here are the details:

Order #ORD-123456
Order Date: January 13, 2026
Status: Processing

┌─────────────────────────────┬─────┬────────┐
│ Item                        │ Qty │  Price │
├─────────────────────────────┼─────┼────────┤
│ Leather Sandals - Size 42   │  1  │ ₦25,000│
└─────────────────────────────┴─────┴────────┘
                           Total: ₦25,000

Shipping Address:
John Doe
123 Main Street
Lagos, Lagos State
Nigeria

[Track Your Order]

Your order will be handcrafted with care. Production typically
takes 7-10 days, after which we'll ship it to you.

Best regards,
The D'FOOTPRINT Team
```

### Status Update (Dispatch)

```
Subject: Your Order Has Shipped! #ORD-123456 - D'FOOTPRINT

📦 Your Order Has Been Dispatched!

Hi John Doe,

Great news! Your order #ORD-123456 is on its way to you.

Previous Status: production
Current Status: processing
Delivery Status: dispatch

Tracking Number: ABC123456789
Estimated Arrival: January 20, 2026

[View Order Details]

Your handcrafted footwear has been carefully packaged and is
now being delivered to you.

Best regards,
The D'FOOTPRINT Team
```

### Abandoned Cart

```
Subject: You Left Something Behind - D'FOOTPRINT

🛍️ You Left Something Behind!

Hi John Doe,

We noticed you added some beautiful handcrafted footwear to
your cart but didn't complete your order. Don't worry, we've
saved your items for you!

Your Cart Items:
┌─────────────────────────────────────┬────────┐
│ Leather Sandals - Size 42           │ ₦25,000│
│ Classic Loafers - Size 41           │ ₦30,000│
└─────────────────────────────────────┴────────┘
                        Cart Total: ₦55,000

Why shop with D'FOOTPRINT?
• 100% Handcrafted with love in Lagos, Nigeria
• Premium quality materials
• Unique designs you won't find anywhere else
• Nationwide delivery

[Complete Your Order]

Need help? Just reply to this email.

Best regards,
The D'FOOTPRINT Team
```

---

## 📈 Monitoring & Metrics

### Order Confirmation Emails

- Track send success rate
- Monitor delivery rates (via Resend dashboard)
- Check for errors in logs

### Status Update Emails

- Count emails sent per status type
- Monitor customer engagement
- Track support inquiry reduction

### Abandoned Cart Recovery

- **Abandonment Rate:** Carts created / Orders completed
- **Email Send Rate:** Emails sent / Carts abandoned
- **Recovery Rate:** Orders recovered / Emails sent
- **Revenue Recovered:** Total value of recovered orders
- **ROI:** Revenue recovered / Email cost

Expected metrics:

- Abandonment rate: 60-80% (industry standard)
- Recovery rate: 10-15% (with good email)
- Revenue impact: +₦XX,XXX per month

---

## 🐛 Troubleshooting

### Emails Not Sending

1. Check Resend API key is set correctly
2. Verify sender email is verified in Resend
3. Check server logs for errors
4. Test with: `node scripts/send-google-test-email.js`

### Google Markup Not Showing

1. Confirm whitelisting email was sent
2. Wait full 5-7 business days for approval
3. Check spam folder for approval confirmation
4. Use same sender email in production as in test
5. Validate JSON-LD structure at [Google's Structured Data Testing Tool](https://search.google.com/structured-data/testing-tool)

### Abandoned Cart Not Tracking

1. Verify user is logged in
2. Check cart has items
3. Confirm POST request succeeds
4. Check database for AbandonedCart entries
5. Verify cron job is running

### Status Update Emails Not Sending

1. Check admin is authenticated
2. Verify order status actually changed
3. Check server logs for email errors
4. Test manually with order update

---

## 🔒 Security Notes

- All emails validated before sending
- User authentication required for abandoned cart tracking
- Email addresses sanitized
- No sensitive data in logs
- Proper error handling prevents information leakage

---

## 💰 Cost Considerations

### Resend Pricing

- Free tier: 100 emails/day
- Pro: $20/month for 50,000 emails
- Scale: Custom pricing

### Estimated Email Volume

- Order confirmations: ~X per day
- Status updates: ~2X per day (2 emails per order average)
- Abandoned carts: ~0.5X per day (assuming 70% abandonment, 1-hour delay)

**Total:** ~3.5X emails per day

Example: 10 orders/day = 35 emails/day = well within free tier

---

## 📚 Additional Resources

- [Resend Documentation](https://resend.com/docs)
- [Google Email Markup Guide](https://developers.google.com/gmail/markup)
- [Schema.org Order Specification](https://schema.org/Order)
- [Abandoned Cart Best Practices](https://www.shopify.com/blog/abandoned-cart-email)

---

## ✅ Checklist

**Setup:**

- [ ] Environment variables configured
- [ ] Database migrated (`npx prisma db push`)
- [ ] Google whitelisting script run
- [ ] Abandoned cart cron job set up
- [ ] Cart tracking integrated in frontend

**Testing:**

- [ ] Order confirmation email received
- [ ] Status update email received
- [ ] Abandoned cart email received
- [ ] All emails display correctly
- [ ] Google markup works (after approval)

**Monitoring:**

- [ ] Email send rates tracked
- [ ] Recovery rates monitored
- [ ] Error logs reviewed
- [ ] Customer feedback collected

---

**Status:** ✅ Complete and Production Ready  
**Last Updated:** January 2026  
**Maintenance:** Check Resend dashboard weekly for deliverability
