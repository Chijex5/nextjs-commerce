# Checkout Setup Guide

This guide will help you set up the checkout system with Paystack integration.

## Prerequisites

- PostgreSQL database
- Paystack account (get one at https://paystack.com)
- Node.js and npm/pnpm installed

## Step 1: Database Migration

Run the migration to add address fields to the users table:

### Option A: Using Prisma Migrate (Recommended)

```bash
# Generate Prisma client with new schema
npx prisma generate

# Run migration
npx prisma migrate dev --name add_user_addresses
```

### Option B: Manual SQL Execution

If you prefer to run the SQL directly:

```bash
# Connect to your database and run:
psql $DATABASE_URL -f prisma/migrations/add_user_addresses/migration.sql
```

Or execute this SQL directly:

```sql
ALTER TABLE "users"
ADD COLUMN IF NOT EXISTS "shipping_address" JSONB,
ADD COLUMN IF NOT EXISTS "billing_address" JSONB;
```

## Step 2: Configure Paystack

### 2.1 Get Paystack API Keys

1. Sign up or log in to [Paystack](https://dashboard.paystack.com)
2. Go to **Settings** → **API Keys & Webhooks**
3. Copy your **Test Public Key** and **Test Secret Key**

### 2.2 Add Keys to Environment

Add to your `.env` or `.env.local`:

```env
PAYSTACK_PUBLIC_KEY=pk_test_xxxxxxxxxxxxx
PAYSTACK_SECRET_KEY=sk_test_xxxxxxxxxxxxx
NEXTAUTH_URL=http://localhost:3000
```

### 2.3 Configure Webhook (Optional but Recommended)

1. In Paystack Dashboard, go to **Settings** → **API Keys & Webhooks**
2. Add webhook URL: `https://yourdomain.com/api/webhooks/paystack`
3. Save the configuration

**Note:** For local development, you can use tools like [ngrok](https://ngrok.com) to expose your local server:

```bash
ngrok http 3000
# Use the ngrok URL for webhook: https://xxxxx.ngrok.io/api/webhooks/paystack
```

## Step 3: Test the Implementation

### 3.1 Start Development Server

```bash
npm run dev
# or
pnpm dev
```

### 3.2 Test Checkout Flow

1. **Add products to cart**
   - Browse products at http://localhost:3000
   - Click "Add to Cart" on any product
2. **Open cart and proceed to checkout**

   - Click the cart icon in the navigation
   - Review items in cart
   - Click "Proceed to Checkout"

3. **Fill in checkout form**

   - Enter email and phone
   - Fill in shipping address
   - Optionally add different billing address
   - Review order summary

4. **Complete payment with test card**

   - Click "Proceed to Payment"
   - You'll be redirected to Paystack
   - Use Paystack test cards:

   **Successful Payment:**

   - Card Number: `4084 0840 8408 4081`
   - CVV: `408`
   - Expiry: Any future date
   - PIN: `0000`
   - OTP: `123456`

   **Failed Payment (for testing):**

   - Card Number: `0000 0000 0000 0000`

5. **Verify order creation**
   - After successful payment, you'll see the success page
   - Check "My Orders" page to see the order
   - Or use the order number to track

## Step 4: Production Deployment

### 4.1 Update Environment Variables

Replace test keys with production keys:

```env
PAYSTACK_PUBLIC_KEY=pk_live_xxxxxxxxxxxxx
PAYSTACK_SECRET_KEY=sk_live_xxxxxxxxxxxxx
NEXTAUTH_URL=https://yourdomain.com
```

### 4.2 Configure Production Webhook

In Paystack Dashboard:

1. Switch to **Live** mode
2. Add production webhook URL
3. Verify webhook is receiving events

### 4.3 SSL Certificate

Ensure your production site has a valid SSL certificate. Paystack requires HTTPS for webhooks.

## Troubleshooting

### Issue: "Payment gateway not configured"

**Solution:** Verify `PAYSTACK_SECRET_KEY` is set in your `.env` file

### Issue: Redirect not working after payment

**Solution:** Check `NEXTAUTH_URL` is set correctly in `.env`

### Issue: Cart is empty after adding items

**Solution:**

1. Check cookies are enabled in browser
2. Verify `cartId` cookie is being set
3. Check database connection

### Issue: Order not created after successful payment

**Solution:**

1. Check application logs for errors
2. Verify database connection
3. Check Paystack dashboard for payment status
4. Verify webhook is configured correctly

### Issue: Address fields not found in database

**Solution:** Run the database migration (see Step 1)

## Testing Checklist

Before going live, test these scenarios:

- [ ] Guest checkout (not logged in)
- [ ] Logged-in user checkout
- [ ] Save address to profile
- [ ] Use saved address
- [ ] Different billing address
- [ ] Successful payment
- [ ] Failed payment
- [ ] Order appears in "My Orders"
- [ ] Order tracking works
- [ ] Cart clears after successful payment
- [ ] Webhook receives notifications
- [ ] Mobile responsiveness

## Additional Resources

- [Paystack Documentation](https://paystack.com/docs)
- [Paystack Test Cards](https://paystack.com/docs/payments/test-payments)
- [Paystack Webhooks](https://paystack.com/docs/payments/webhooks)
- [Prisma Migrate](https://www.prisma.io/docs/concepts/components/prisma-migrate)

## Support

If you encounter issues:

1. Check application logs
2. Check Paystack dashboard for payment status
3. Verify environment variables are correct
4. Review the [CHECKOUT_IMPLEMENTATION.md](./CHECKOUT_IMPLEMENTATION.md) for detailed information

## Next Steps

After successful setup:

1. Customize shipping costs in `app/checkout/page.tsx`
2. Set up email notifications for orders
3. Configure order status management
4. Add more payment methods if needed
5. Set up automated order fulfillment
