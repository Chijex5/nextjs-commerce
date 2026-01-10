# Admin Dashboard Requirements

This document outlines the requirements for building an admin dashboard to manage the e-commerce store.

## Overview

The admin dashboard will provide a web interface for managing products, collections, orders, and content without requiring direct database access.

## Core Features

### 1. Authentication & Authorization

**Requirements:**
- Admin login/logout functionality
- Session management
- Protected routes (middleware)
- Role-based access control (future)

**Implementation:**
- NextAuth.js or similar
- Admin user table in database
- Password hashing (bcrypt)

### 2. Product Management

**Features:**
- List all products with search and filtering
- Create new products
- Edit existing products
- Delete products
- Manage product variants (sizes, colors, etc.)
- Upload and manage product images
- Set product availability
- Manage product tags

**UI Components:**
- Product list table with pagination
- Product form (create/edit)
- Image uploader
- Variant manager
- Rich text editor for descriptions

### 3. Collection Management

**Features:**
- List all collections
- Create new collections
- Edit existing collections
- Delete collections
- Add/remove products from collections
- Reorder products within collections
- Set collection visibility

**UI Components:**
- Collection list
- Collection form
- Product selector/drag-and-drop interface

### 4. Order Management (Future Phase)

**Features:**
- View all orders
- Order details
- Update order status
- Customer information
- Print invoices
- Export orders

### 5. Content Management

**Features:**
- Manage pages (About, Terms, etc.)
- Edit page content
- SEO settings per page
- Menu management
- Add/remove menu items

**UI Components:**
- Page list
- Rich text editor
- Menu editor

### 6. Settings

**Features:**
- Store settings (name, company info)
- Shipping settings
- Tax settings
- Email notifications
- General configuration

## Suggested Tech Stack

### Frontend
- Next.js App Router (already in use)
- Tailwind CSS (already in use)
- React Hook Form - Form handling
- Zod - Form validation
- TanStack Table - Data tables
- Radix UI or shadcn/ui - UI components

### Backend
- Next.js Server Actions (already in use)
- Prisma ORM (already in use)
- Image upload: Uploadthing, Cloudinary, or AWS S3

### Authentication
- NextAuth.js v5 (Auth.js)
- Or Clerk for easier setup

## Recommended File Structure

```
app/
├── admin/
│   ├── layout.tsx              # Admin layout with sidebar
│   ├── page.tsx                # Dashboard home
│   ├── products/
│   │   ├── page.tsx            # Products list
│   │   ├── new/
│   │   │   └── page.tsx        # Create product
│   │   └── [id]/
│   │       ├── page.tsx        # Edit product
│   │       └── variants/
│   │           └── page.tsx    # Manage variants
│   ├── collections/
│   │   ├── page.tsx            # Collections list
│   │   ├── new/
│   │   │   └── page.tsx        # Create collection
│   │   └── [id]/
│   │       └── page.tsx        # Edit collection
│   ├── orders/
│   │   ├── page.tsx            # Orders list
│   │   └── [id]/
│   │       └── page.tsx        # Order details
│   ├── pages/
│   │   ├── page.tsx            # Content pages list
│   │   └── [id]/
│   │       └── page.tsx        # Edit page
│   └── settings/
│       └── page.tsx            # Store settings
├── api/
│   └── admin/
│       ├── products/
│       │   └── route.ts        # Product API endpoints
│       ├── collections/
│       │   └── route.ts        # Collection API endpoints
│       └── upload/
│           └── route.ts        # Image upload
└── (auth)/
    ├── login/
    │   └── page.tsx            # Login page
    └── register/
        └── page.tsx            # Register admin (first time)
```

## Database Schema Extensions

New tables needed:

```prisma
model Admin {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String
  password  String   // hashed
  role      String   @default("admin")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Order {
  id              String      @id @default(cuid())
  orderNumber     String      @unique
  email           String
  status          OrderStatus @default(PENDING)
  subtotal        String
  tax             String
  shipping        String
  total           String
  currency        String      @default("USD")
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt
  
  items           OrderItem[]
  shippingAddress Address?
}

model OrderItem {
  id              String  @id @default(cuid())
  quantity        Int
  priceAmount     String
  priceCurrency   String  @default("USD")
  
  orderId         String
  order           Order   @relation(fields: [orderId], references: [id], onDelete: Cascade)
  
  productId       String
  product         Product @relation(fields: [productId], references: [id])
  
  variantId       String
  variant         ProductVariant @relation(fields: [variantId], references: [id])
}

model Address {
  id          String  @id @default(cuid())
  firstName   String
  lastName    String
  address1    String
  address2    String?
  city        String
  province    String
  country     String
  zip         String
  phone       String?
  
  orderId     String  @unique
  order       Order   @relation(fields: [orderId], references: [id], onDelete: Cascade)
}

enum OrderStatus {
  PENDING
  PROCESSING
  SHIPPED
  DELIVERED
  CANCELLED
}
```

## Implementation Phases

### Phase 1: Authentication (Week 1)
- Set up NextAuth.js
- Create admin user model
- Build login page
- Protect admin routes

### Phase 2: Product Management (Week 2-3)
- Product CRUD operations
- Image upload functionality
- Variant management
- Product list with search/filter

### Phase 3: Collection Management (Week 3-4)
- Collection CRUD operations
- Product assignment to collections
- Collection ordering

### Phase 4: Content Management (Week 4-5)
- Page editor
- Menu management
- SEO settings

### Phase 5: Order Management (Week 5-6)
- Order model implementation
- Checkout process
- Order list and details
- Status updates

### Phase 6: Settings & Polish (Week 6-7)
- Store settings
- Email notifications
- UI polish
- Testing

## Security Considerations

1. **Authentication**
   - Use secure session management
   - Implement CSRF protection
   - Rate limiting on auth endpoints

2. **Authorization**
   - Check admin permissions on all admin routes
   - Validate user input
   - Sanitize data before database operations

3. **File Upload**
   - Validate file types
   - Limit file sizes
   - Scan for malware
   - Use signed URLs for images

4. **Database**
   - Use parameterized queries (Prisma handles this)
   - Implement row-level security
   - Regular backups

## Next Steps

1. Choose authentication solution
2. Set up admin layout and sidebar
3. Implement authentication
4. Build product management interface
5. Add image upload functionality

## Resources

- [NextAuth.js Documentation](https://authjs.dev/)
- [Prisma Best Practices](https://www.prisma.io/docs/guides/performance-and-optimization/prisma-client-best-practices)
- [shadcn/ui Components](https://ui.shadcn.com/)
- [TanStack Table](https://tanstack.com/table)
- [React Hook Form](https://react-hook-form.com/)
