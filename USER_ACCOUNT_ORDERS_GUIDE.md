# User Account and Orders Feature Documentation

## Overview

This implementation adds user authentication and order management features to the Next.js Commerce application. Users can optionally create accounts to track their orders, but can also use the store without logging in.

## Features Implemented

### 1. User Authentication System

#### Components Added:

- **User Account Icon** (`components/layout/navbar/user-account-icon.tsx`)
  - Located in the top navbar
  - Shows login status
  - Dropdown menu with contextual options
  - Guest users: Login, Register, Track Order
  - Logged-in users: My Account, My Orders, Logout

#### Pages Added:

- **Login Page** (`/auth/login`)
  - Email and password authentication
  - Link to registration
  - "Continue without login" option
- **Register Page** (`/auth/register`)

  - New user registration
  - Name, email, password validation
  - Password confirmation
  - Automatic redirect to login after successful registration

- **Account Page** (`/account`)
  - Protected route (requires login)
  - Displays user information
  - Quick links to orders

#### API Endpoints:

- `POST /api/user-auth/register` - Create new user account
- `GET|POST /api/user-auth/[...nextauth]` - NextAuth.js authentication endpoints

### 2. Orders Management

#### Pages Added:

- **Orders Page** (`/orders`)
  - Dual functionality:

    1. **My Orders** (for logged-in users)
       - Lists all user orders
       - Shows order status, items, and totals
       - Sorted by most recent first
    2. **Track Order by ID** (for all users)
       - Public order tracking
       - Enter order number to track any order
       - No login required

#### API Endpoints:

- `GET /api/orders` - Fetch authenticated user's orders
- `GET /api/orders/track?orderNumber=XXX` - Track order by order number

### 3. Database Schema

#### New Models Added:

**User Model:**

```prisma
model User {
  id            String    @id @default(uuid())
  email         String    @unique
  name          String?
  passwordHash  String
  phone         String?
  isActive      Boolean   @default(true)
  lastLoginAt   DateTime?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  orders        Order[]
}
```

**Order Model:**

```prisma
model Order {
  id              String   @id @default(uuid())
  userId          String?  // Optional - guests can also have orders
  orderNumber     String   @unique
  email           String
  phone           String?
  customerName    String
  shippingAddress Json
  billingAddress  Json?
  status          String   @default("pending")
  subtotalAmount  Decimal
  taxAmount       Decimal  @default(0.00)
  shippingAmount  Decimal  @default(0.00)
  totalAmount     Decimal
  currencyCode    String   @default("NGN")
  notes           String?
  trackingNumber  String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  user            User?    @relation(fields: [userId], references: [id])
  items           OrderItem[]
}
```

**OrderItem Model:**

```prisma
model OrderItem {
  id               String   @id @default(uuid())
  orderId          String
  productId        String
  productVariantId String
  productTitle     String
  variantTitle     String
  quantity         Int
  price            Decimal
  totalAmount      Decimal
  currencyCode     String   @default("NGN")
  productImage     String?
  createdAt        DateTime @default(now())
  order            Order    @relation(fields: [orderId], references: [id], onDelete: Cascade)
}
```

## Setup Instructions

### 1. Database Migration

Run the following commands to update your database:

```bash
# Push schema changes to database
npm run db:push

# Or create a migration
npm run db:migrate
```

### 2. Environment Variables

Ensure these environment variables are set in `.env`:

```env
# NextAuth Configuration
NEXTAUTH_SECRET="your-secret-key-here-generate-with-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3000"

# Database URL
DATABASE_URL="your-postgres-connection-string"
```

Generate a secure secret:

```bash
openssl rand -base64 32
```

### 3. Running the Application

```bash
# Development
npm run dev

# Production
npm run build
npm start
```

## User Flow

### Guest User Flow:

1. Browse products without login
2. Add items to cart
3. At checkout, choose to:
   - Create account
   - Login
   - Continue as guest
4. Track orders using order number

### Registered User Flow:

1. Click user icon → Login/Register
2. Create account or login
3. Browse and shop
4. View order history in "My Orders"
5. Access account information
6. Track orders directly from account

## Features Design Decisions

### Authentication is Optional

- Users can browse and shop without creating an account
- Login is encouraged but never forced
- Guest checkout is supported (to be implemented in checkout flow)

### Two Types of Order Tracking

1. **Authenticated**: Users see all their orders automatically
2. **Public**: Anyone can track orders by order number (for customer service)

### Separate Admin and User Authentication

- Admin authentication remains separate (`/admin/login`)
- User authentication uses different provider (`/api/user-auth/[...nextauth]`)
- Different user tables: `AdminUser` vs `User`

### Security Considerations

- Passwords hashed with bcryptjs
- JWT-based sessions
- Order tracking requires order number (not sequential IDs)
- User-specific data is protected by authentication

## Future Enhancements

### Potential Additions:

1. **Guest Checkout**
   - Allow orders without user account
   - Email order confirmation with tracking number
2. **Order Status Updates**
   - Email notifications on status changes
   - SMS notifications (if phone provided)
3. **Order Details Page**
   - Individual order detail view
   - Download invoice
   - Shipping tracking integration
4. **User Profile Management**
   - Edit profile information
   - Change password
   - Saved addresses
5. **Order History Filtering**
   - Filter by status
   - Search orders
   - Date range filters

## API Usage Examples

### Register a New User

```javascript
POST /api/user-auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword123"
}
```

### Get User Orders

```javascript
GET /api/orders
Authorization: Required (authenticated session)
```

### Track Order by Number

```javascript
GET /api/orders/track?orderNumber=ORD-123456
Authorization: Not required
```

## Testing Checklist

### Authentication

- [ ] User can register with valid details
- [ ] User cannot register with existing email
- [ ] User can login with correct credentials
- [ ] User cannot login with wrong credentials
- [ ] User can logout successfully
- [ ] Session persists across page refreshes
- [ ] Protected routes redirect to login

### Orders

- [ ] Logged-in user can view their orders
- [ ] Orders display correct information
- [ ] Anyone can track order by number
- [ ] Invalid order number shows error
- [ ] Order status displays with correct styling

### UI/UX

- [ ] User icon appears in navbar
- [ ] Dropdown shows correct options based on auth state
- [ ] Mobile menu includes account links
- [ ] Forms validate input correctly
- [ ] Loading states display appropriately
- [ ] Error messages are clear and helpful

## Troubleshooting

### "Unauthorized" errors

- Check NEXTAUTH_SECRET is set
- Verify session is active
- Clear browser cookies and re-login

### Orders not showing

- Verify database connection
- Check if orders exist for user
- Verify API endpoints are working

### Cannot register user

- Check database constraints
- Verify email is unique
- Check password length (min 6 characters)

## Support

For issues or questions:

1. Check this documentation
2. Review error messages in browser console
3. Check server logs
4. Verify environment variables are set correctly
