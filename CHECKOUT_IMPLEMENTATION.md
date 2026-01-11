# Checkout System with Paystack Integration

This document describes the checkout implementation for D'FOOTPRINT e-commerce platform.

## Overview

The checkout system provides a complete end-to-end payment flow using Paystack as the payment gateway. It handles:

- Customer information collection (email, phone)
- Shipping and billing address management
- Order creation and tracking
- Payment processing via Paystack
- Order confirmation

## Features

### 1. User-Friendly Checkout Flow

- **Contact Information**: Email and phone number
- **Shipping Address**: Full address form with all required fields
- **Billing Address**: Option to use same as shipping or provide separate
- **Order Summary**: Real-time cart display with items, prices, and totals
- **Address Saving**: Logged-in users can save addresses to their profile

### 2. Paystack Integration

- Secure payment processing
- NGN currency support
- Automatic amount calculation (including shipping)
- Payment verification
- Webhook support for payment notifications

### 3. Order Management

- Automatic order number generation
- Order status tracking
- Order history for logged-in users
- Guest checkout support
- Order tracking by order number

## Database Schema

### User Model Updates

Added address fields to the `User` model:

```prisma
model User {
  // ... existing fields
  shippingAddress Json?     @map("shipping_address")
  billingAddress  Json?     @map("billing_address")
  // ...
}
```

### Order Model

The `Order` model stores:

- Customer information (name, email, phone)
- Shipping and billing addresses (JSON)
- Order items with product details
- Order status and tracking
- Payment amounts

## API Endpoints

### 1. GET `/api/cart`

Fetches the current user's cart.

**Response:**

```json
{
  "cart": {
    "id": "cart-id",
    "lines": [...],
    "cost": {...}
  }
}
```

### 2. POST `/api/checkout/initialize`

Initializes a payment with Paystack.

**Request:**

```json
{
  "email": "customer@example.com",
  "phone": "+234XXXXXXXXXX",
  "shippingAddress": {
    "firstName": "John",
    "lastName": "Doe",
    "address": "123 Main St",
    "city": "Lagos",
    "state": "Lagos",
    "postalCode": "100001",
    "country": "Nigeria"
  },
  "billingAddress": {...},
  "saveAddress": true
}
```

**Response:**

```json
{
  "authorizationUrl": "https://checkout.paystack.com/...",
  "reference": "paystack-reference"
}
```

### 3. GET `/api/checkout/verify?reference=xxx`

Verifies payment and creates order.

**Flow:**

1. Verifies payment with Paystack
2. Creates order in database
3. Clears cart
4. Saves addresses (if requested)
5. Redirects to success page

### 4. POST `/api/webhooks/paystack`

Receives payment notifications from Paystack.

**Headers:**

- `x-paystack-signature`: HMAC signature for verification

## Configuration

### Environment Variables

Add the following to your `.env` file:

```env
# Paystack Configuration
PAYSTACK_PUBLIC_KEY=pk_test_xxxxxxxxxxxxx
PAYSTACK_SECRET_KEY=sk_test_xxxxxxxxxxxxx

# Application URL (for callbacks)
NEXTAUTH_URL=http://localhost:3000
```

### Paystack Dashboard Setup

1. Go to [Paystack Dashboard](https://dashboard.paystack.com)
2. Navigate to Settings > API Keys & Webhooks
3. Copy your API keys to `.env`
4. Add webhook URL: `https://yourdomain.com/api/webhooks/paystack`

## Usage

### For Customers

1. **Add items to cart** from product pages
2. **Click "Proceed to Checkout"** in cart modal
3. **Fill in contact information** and addresses
4. **Review order summary** on the right sidebar
5. **Click "Proceed to Payment"** to go to Paystack
6. **Complete payment** on Paystack page
7. **Return to success page** after payment

### For Logged-in Users

Additional features:

- Email and phone pre-filled from profile
- Option to save addresses for future orders
- View all orders in "My Orders" page

### For Guest Users

- Can complete checkout without account
- Can track order using order number
- Encouraged to create account after purchase

## Shipping

Currently configured with:

- **Flat rate**: ₦2,000 for all orders
- **Delivery time**: Calculated at fulfillment

Future enhancements could include:

- Multiple shipping methods
- Address-based shipping calculation
- International shipping

## Order Status Flow

1. **pending**: Order created, awaiting payment
2. **processing**: Payment confirmed, order being prepared
3. **shipped**: Order dispatched to customer
4. **completed**: Order delivered
5. **cancelled**: Order cancelled

## Error Handling

The system handles various error scenarios:

- Empty cart redirects to homepage
- Payment failures redirect to checkout with error message
- Session expiration shows appropriate error
- Invalid references are rejected

## Testing

### Test with Paystack

Use Paystack test cards:

**Successful payment:**

- Card: 4084 0840 8408 4081
- CVV: 408
- Expiry: Any future date
- OTP: 123456

**Failed payment:**

- Card: 0000 0000 0000 0000
- This will trigger a failed transaction

### Testing Flow

1. Add test products to cart
2. Go through checkout with test data
3. Use test card on Paystack
4. Verify order creation
5. Check order appears in "My Orders"

## Security

- HTTPS required in production
- CSRF protection via cookies
- Paystack signature verification on webhooks
- Secure session management
- Input validation on all forms

## Future Enhancements

- [ ] Multiple shipping options
- [ ] Discount codes/coupons
- [ ] Gift cards
- [ ] Multiple payment methods
- [ ] Invoice generation
- [ ] Email notifications
- [ ] SMS notifications
- [ ] Order editing (before fulfillment)
- [ ] Saved addresses management page
- [ ] Express checkout for logged-in users

## Troubleshooting

### Payment not completing

1. Check Paystack API keys are correct
2. Verify callback URL is accessible
3. Check browser console for errors
4. Verify cart has items

### Webhook not working

1. Verify webhook URL in Paystack dashboard
2. Check webhook signature validation
3. Ensure server is accessible from internet
4. Check server logs for errors

### Orders not appearing

1. Verify payment was successful on Paystack
2. Check order was created in database
3. Verify user is logged in (for "My Orders")
4. Try tracking by order number

## Support

For issues or questions:

1. Check application logs
2. Verify Paystack dashboard for payment status
3. Check database for order records
4. Review webhook logs on Paystack dashboard
