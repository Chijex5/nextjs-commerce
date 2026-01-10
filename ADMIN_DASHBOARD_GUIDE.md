# Admin Dashboard & Product Management System

## Overview

This guide explains how to use and maintain the admin dashboard for D'FOOTPRINT e-commerce platform, including product management with Cloudinary image uploads and NextAuth authentication.

## Table of Contents

1. [Database Schema Updates](#database-schema-updates)
2. [Environment Variables](#environment-variables)
3. [Creating Your First Admin User](#creating-your-first-admin-user)
4. [Admin Dashboard Features](#admin-dashboard-features)
5. [Product Management](#product-management)
6. [Image Upload with Cloudinary](#image-upload-with-cloudinary)
7. [Security & Authentication](#security--authentication)
8. [Deployment](#deployment)

---

## Database Schema Updates

### New `AdminUser` Table

The admin system adds a new `AdminUser` model to track admin users:

```prisma
model AdminUser {
  id            String    @id @default(uuid())
  email         String    @unique @db.VarChar(255)
  name          String?   @db.VarChar(255)
  passwordHash  String    @map("password_hash") @db.Text
  role          String    @default("admin") @db.VarChar(50)
  isActive      Boolean   @default(true) @map("is_active")
  lastLoginAt   DateTime? @map("last_login_at")
  createdAt     DateTime  @default(now()) @map("created_at")
  updatedAt     DateTime  @default(now()) @updatedAt @map("updated_at")

  @@index([email], name: "admin_users_email_idx")
  @@map("admin_users")
}
```

### Migration Steps

1. **Update the schema** (already done in `prisma/schema.prisma`)

2. **Generate Prisma Client:**
```bash
pnpm db:generate
```

3. **Push schema to database:**
```bash
pnpm db:push
```

This creates the `admin_users` table in your PostgreSQL database.

---

## Environment Variables

### Required Environment Variables

Update your `.env.local` file with these variables:

```env
# Database (already configured)
DATABASE_URL="prisma+postgres://accelerate.prisma-data.net/?api_key=..."
DIRECT_DATABASE_URL="postgresql://host:5432/db"

# NextAuth Authentication
NEXTAUTH_SECRET="generate-with: openssl rand -base64 32"
NEXTAUTH_URL="http://localhost:3000"

# Cloudinary for Image Uploads
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"

# Site Configuration
COMPANY_NAME="D'FOOTPRINT"
SITE_NAME="D'FOOTPRINT"
```

### Getting Cloudinary Credentials

1. Go to [https://cloudinary.com](https://cloudinary.com)
2. Sign up for a free account
3. From the Dashboard, copy:
   - Cloud Name
   - API Key
   - API Secret

---

## Creating Your First Admin User

Since this is a secure system, you need to manually create the first admin user in the database.

### Option 1: Using Prisma Studio (Recommended)

1. **Start Prisma Studio:**
```bash
pnpm db:studio
```

2. **Navigate to `AdminUser` model**

3. **Click "Add record"**

4. **Generate password hash:**
```bash
# In a Node.js environment or using online bcrypt generator
# Password: your-password
# Use 10 rounds
```

You can use this Node script:
```javascript
const bcrypt = require('bcryptjs');
const password = 'your-secure-password';
const hash = await bcrypt.hash(password, 10);
console.log(hash);
```

5. **Fill in the fields:**
   - `id`: Auto-generated (leave empty or generate UUID)
   - `email`: `admin@dfootprint.com`
   - `name`: `Admin User`
   - `passwordHash`: (paste the hash from step 4)
   - `role`: `admin`
   - `isActive`: `true`

6. **Save the record**

### Option 2: Using SQL

```sql
-- Generate a password hash first (password: admin123)
-- Hash: $2a$10$... (use bcrypt to generate)

INSERT INTO admin_users (id, email, name, password_hash, role, is_active, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'admin@dfootprint.com',
  'Admin User',
  '$2a$10$YOUR_PASSWORD_HASH_HERE',
  'admin',
  true,
  NOW(),
  NOW()
);
```

### Option 3: Using a Setup Script

Create `lib/db/scripts/create-admin.ts`:

```typescript
import { hash } from "bcryptjs";
import prisma from "../../prisma";

async function createAdmin() {
  const email = "admin@dfootprint.com";
  const password = "ChangeMe123!";
  const name = "Admin User";

  const passwordHash = await hash(password, 10);

  const admin = await prisma.adminUser.create({
    data: {
      email,
      name,
      passwordHash,
      role: "admin",
      isActive: true
    }
  });

  console.log("✅ Admin user created:");
  console.log(`Email: ${admin.email}`);
  console.log(`Password: ${password}`);
  console.log("\n⚠️  IMPORTANT: Change this password after first login!");
}

createAdmin()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
```

Run it:
```bash
tsx lib/db/scripts/create-admin.ts
```

---

## Admin Dashboard Features

### Accessing the Dashboard

1. **Navigate to:** `http://localhost:3000/admin/login`
2. **Enter your credentials**
3. **You'll be redirected to:** `/admin/dashboard`

### Dashboard Sections

#### 1. **Dashboard Home** (`/admin/dashboard`)
- Overview statistics
- Total products count
- Total collections count
- Quick actions

#### 2. **Products Management** (`/admin/products`)
- List all products
- Search and filter products
- Edit product details
- Delete products
- View product images

#### 3. **Add New Product** (`/admin/products/new`)
- Product information form
- Image upload via Cloudinary
- Variant management
- SEO configuration
- Collection assignment

---

## Product Management

### Creating a New Product

1. **Navigate to** `/admin/products/new`

2. **Fill in Basic Information:**
   - **Title**: Product name (e.g., "Classic Leather Sandal")
   - **Handle**: URL-friendly slug (auto-generated from title)
   - **Description**: Full product description
   - **Available for Sale**: Toggle product visibility

3. **Upload Images:**
   - Click "Upload Image" or drag and drop
   - Images are automatically uploaded to Cloudinary
   - Set featured image
   - Reorder images by dragging
   - Images are stored with optimizations:
     - Max dimensions: 1200x1200
     - Auto quality optimization
     - WebP format when supported

4. **Add Variants:**
   - Click "Add Variant"
   - Enter variant title (e.g., "Size 40 / Black")
   - Set price in NGN
   - Mark as available for sale
   - Add selected options (color, size, etc.)

5. **Configure Options:**
   - Add product options (Size, Color, Material)
   - Define option values
   - Options are used for variant selection on the frontend

6. **SEO Settings:**
   - SEO Title
   - SEO Description
   - These improve search engine visibility

7. **Collections:**
   - Select which collections this product belongs to
   - Products can be in multiple collections

8. **Save Product**

### Editing a Product

1. Navigate to `/admin/products`
2. Click on the product you want to edit
3. Make changes
4. Click "Update Product"

### Deleting a Product

1. Navigate to product edit page
2. Click "Delete Product" button
3. Confirm deletion
4. Product and all related data (images, variants) are removed

---

## Image Upload with Cloudinary

### How It Works

1. **Client-side Upload:**
   - User selects image file
   - File is converted to base64
   - Sent to API route

2. **Server-side Processing:**
   - API route `/api/admin/upload` receives image
   - Image is uploaded to Cloudinary
   - Cloudinary returns secure URL
   - URL is saved to database

3. **Optimizations Applied:**
   - Automatic format conversion (WebP when supported)
   - Quality optimization
   - Responsive image sizes
   - CDN delivery

### Image Management

**Uploading:**
```typescript
// Component handles this automatically
<ImageUpload onUpload={(url) => setImageUrl(url)} />
```

**Deleting:**
- When product image is deleted, it's also removed from Cloudinary
- Prevents orphaned images and saves storage

**Folder Structure in Cloudinary:**
```
dfootprint/
  └── products/
      ├── product-image-1.jpg
      ├── product-image-2.jpg
      └── ...
```

---

## Security & Authentication

### NextAuth Configuration

- **Provider**: Credentials (email/password)
- **Session**: JWT-based
- **Password Hashing**: bcrypt with 10 rounds
- **Protected Routes**: All `/admin/*` routes except `/admin/login`

### Middleware Protection

The `middleware.ts` file protects admin routes:

```typescript
// All /admin/* routes require authentication
// Unauthenticated users are redirected to /admin/login
```

### Best Practices

1. **Use Strong Passwords:**
   - Minimum 12 characters
   - Mix of uppercase, lowercase, numbers, symbols

2. **Change Default Password:**
   - Immediately after first login
   - Regularly update passwords

3. **Limit Admin Access:**
   - Only create accounts for trusted team members
   - Use the `isActive` flag to disable accounts

4. **Monitor Activity:**
   - Check `lastLoginAt` field
   - Review admin actions

5. **HTTPS in Production:**
   - Always use HTTPS for admin panel
   - Set `NEXTAUTH_URL` to https://yourdomain.com

---

## Deployment

### Pre-Deployment Checklist

- [ ] All environment variables set in production
- [ ] Database migrations applied
- [ ] At least one admin user created
- [ ] Cloudinary account configured
- [ ] NEXTAUTH_SECRET is strong and unique
- [ ] NEXTAUTH_URL points to production domain
- [ ] HTTPS enabled

### Vercel Deployment

1. **Push code to GitHub**

2. **Connect to Vercel**

3. **Add Environment Variables:**
   - Go to Project Settings → Environment Variables
   - Add all variables from `.env.local`
   - Make sure to use production values

4. **Deploy**

5. **Run Migrations:**
```bash
pnpm db:push
```

6. **Create Admin User:**
   - Use Prisma Studio or SQL script
   - Or deploy with a setup route that creates admin on first visit

### Database Migrations in Production

Always use `DIRECT_DATABASE_URL` for migrations:

```bash
# Generate migration
pnpm db:migrate

# Or push schema directly
pnpm db:push
```

---

## Troubleshooting

### Cannot Login

**Issue**: "Invalid credentials" error

**Solutions:**
1. Verify admin user exists in database
2. Check `isActive` is `true`
3. Verify password hash is correct
4. Check `NEXTAUTH_SECRET` is set

### Images Not Uploading

**Issue**: Upload fails or returns error

**Solutions:**
1. Verify Cloudinary credentials in `.env.local`
2. Check image file size (max 10MB)
3. Verify API route `/api/admin/upload` exists
4. Check Cloudinary dashboard for quota limits

### "Table does not exist" Error

**Issue**: Database queries fail

**Solutions:**
1. Run `pnpm db:generate`
2. Run `pnpm db:push`
3. Verify `DIRECT_DATABASE_URL` is correct
4. Check database connection

### Middleware Redirect Loop

**Issue**: Constant redirects between login and dashboard

**Solutions:**
1. Clear browser cookies
2. Verify `NEXTAUTH_SECRET` matches between requests
3. Check `NEXTAUTH_URL` is correct
4. Restart Next.js dev server

---

## API Routes Reference

### Authentication
- `POST /api/auth/[...nextauth]` - NextAuth handlers
- `GET /api/auth/session` - Get current session

### Product Management
- `POST /api/admin/products` - Create product
- `PUT /api/admin/products/[id]` - Update product
- `DELETE /api/admin/products/[id]` - Delete product

### Image Upload
- `POST /api/admin/upload` - Upload image to Cloudinary
- `DELETE /api/admin/upload` - Delete image from Cloudinary

---

## Database Schema Reference

### Products Flow

```
Product
  ├── ProductImage[] (images)
  ├── ProductVariant[] (sizes, colors, prices)
  ├── ProductOption[] (option definitions)
  └── ProductCollection[] (category assignments)
```

### Admin Users

```
AdminUser
  ├── id (UUID)
  ├── email (unique)
  ├── passwordHash (bcrypt)
  ├── role (admin, superadmin, etc.)
  ├── isActive (boolean)
  └── lastLoginAt (tracking)
```

---

## Next Steps

1. **Create Your First Admin User** (see section above)
2. **Login to Dashboard** at `/admin/login`
3. **Add Your First Product** at `/admin/products/new`
4. **Upload Product Images** using Cloudinary integration
5. **Test Frontend** to see products appear on the store

---

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review environment variables
3. Check database connections
4. Verify Cloudinary setup

---

## Security Notes

⚠️ **Important Security Reminders:**

1. Never commit `.env.local` to version control
2. Use strong, unique passwords for all admin accounts
3. Rotate `NEXTAUTH_SECRET` periodically
4. Monitor admin access logs
5. Keep dependencies updated
6. Use HTTPS in production
7. Implement rate limiting on login endpoint (future enhancement)

---

**Last Updated:** January 2026
**Version:** 1.0.0
