# Database Migration Guide for Admin Dashboard

This guide explains how to migrate your existing database to support the new admin dashboard features.

## What's Being Added

The admin dashboard requires a new `admin_users` table to manage administrative access to your e-commerce platform.

## Migration Steps

### Step 1: Update Prisma Schema

The schema has already been updated with the `AdminUser` model:

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

### Step 2: Install Required Dependencies

```bash
pnpm install
```

This installs:
- `next-auth@^5.0.0-beta.25` - Authentication
- `bcryptjs@^2.4.3` - Password hashing
- `cloudinary@^2.5.1` - Image management
- `next-cloudinary@^6.16.0` - React components for Cloudinary
- `react-hook-form@^7.54.2` - Form management
- `zod@^3.24.1` - Schema validation

### Step 3: Configure Environment Variables

Add these to your `.env.local`:

```env
# NextAuth (Required)
NEXTAUTH_SECRET="generate-this-with-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3000"

# Cloudinary (Required)
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"
```

**Generate NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

### Step 4: Generate Prisma Client

```bash
pnpm db:generate
```

This generates the TypeScript client with the new `AdminUser` model.

### Step 5: Push Schema to Database

**Option A: Using db:push (Development)**
```bash
pnpm db:push
```

This creates the `admin_users` table immediately.

**Option B: Using Migrations (Production)**
```bash
# Create migration
pnpm db:migrate

# Name it something like: "add_admin_users_table"
```

### Step 6: Verify Table Creation

**Using Prisma Studio:**
```bash
pnpm db:studio
```

Navigate to the `AdminUser` model - you should see an empty table.

**Using SQL:**
```sql
\dt admin_users  -- In psql
-- or
SELECT * FROM admin_users;
```

### Step 7: Create Your First Admin User

**Option 1: Using the provided script**

Create `lib/db/scripts/create-admin.ts`:

```typescript
import { hash } from "bcryptjs";
import prisma from "../../prisma";

async function createAdmin() {
  const email = process.env.ADMIN_EMAIL || "admin@dfootprint.com";
  const password = process.env.ADMIN_PASSWORD || "ChangeMe123!";
  const name = process.env.ADMIN_NAME || "Admin User";

  // Check if admin already exists
  const existing = await prisma.adminUser.findUnique({
    where: { email }
  });

  if (existing) {
    console.log("❌ Admin user already exists with email:", email);
    return;
  }

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

  console.log("✅ Admin user created successfully!");
  console.log("\nLogin Credentials:");
  console.log("==================");
  console.log(`Email:    ${admin.email}`);
  console.log(`Password: ${password}`);
  console.log("\n⚠️  IMPORTANT: Change this password immediately after first login!");
}

createAdmin()
  .then(() => {
    console.log("\n✓ Script completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });
```

Run the script:
```bash
tsx lib/db/scripts/create-admin.ts
```

**Option 2: Using Prisma Studio**

1. Open Prisma Studio: `pnpm db:studio`
2. Navigate to `AdminUser` model
3. Click "Add record"
4. Fill in the fields:
   - **email**: `admin@dfootprint.com`
   - **name**: `Admin User`
   - **passwordHash**: Generate using:
     ```bash
     node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('YourPassword123', 10).then(console.log)"
     ```
   - **role**: `admin`
   - **isActive**: `true`
5. Save

**Option 3: Using SQL**

```sql
-- First, generate password hash externally using bcrypt
-- For password "ChangeMe123!", the hash would be something like:
-- $2a$10$abcdefghijklmnopqrstuvwxyz...

INSERT INTO admin_users (
  id,
  email,
  name,
  password_hash,
  role,
  is_active,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'admin@dfootprint.com',
  'Admin User',
  '$2a$10$YOUR_GENERATED_HASH_HERE',
  'admin',
  true,
  NOW(),
  NOW()
);
```

### Step 8: Test the Admin Dashboard

1. **Start the development server:**
```bash
pnpm dev
```

2. **Navigate to the admin login:**
```
http://localhost:3000/admin/login
```

3. **Login with your credentials:**
- Email: `admin@dfootprint.com`
- Password: (the one you set)

4. **You should be redirected to:**
```
http://localhost:3000/admin/dashboard
```

## Rollback Instructions

If you need to rollback the changes:

### Remove the admin_users table

```sql
DROP TABLE IF EXISTS admin_users CASCADE;
```

### Revert Prisma Schema

Remove the `AdminUser` model from `prisma/schema.prisma`

### Regenerate Client

```bash
pnpm db:generate
```

## Troubleshooting

### Error: "Table already exists"

If you get a conflict error:

```bash
# Drop the table first
psql $DIRECT_DATABASE_URL -c "DROP TABLE IF EXISTS admin_users CASCADE;"

# Then push again
pnpm db:push
```

### Error: "Cannot connect to database"

Check your `DIRECT_DATABASE_URL`:

```bash
echo $DIRECT_DATABASE_URL
# Should output your direct PostgreSQL connection string
```

### Error: "Prisma Client did not initialize yet"

Regenerate the client:

```bash
rm -rf node_modules/.prisma
pnpm db:generate
```

### Password Hash Issues

Make sure you're using bcrypt properly:

```javascript
// Correct
const bcrypt = require('bcryptjs');
const hash = await bcrypt.hash('password', 10);

// Incorrect - don't use fewer than 10 rounds
const hash = await bcrypt.hash('password', 4); // Too weak
```

## Production Deployment

### Before Deploying

1. **Run migrations on production database:**
```bash
# Set production DIRECT_DATABASE_URL
export DIRECT_DATABASE_URL="postgresql://prod-host:5432/db"

# Push schema
pnpm db:push
```

2. **Create production admin user:**
   - Use strong password
   - Use your real email
   - Document credentials securely

3. **Verify environment variables:**
   - `NEXTAUTH_SECRET` - Production secret
   - `NEXTAUTH_URL` - Production URL (https://yourdomain.com)
   - `CLOUDINARY_*` - Production Cloudinary account
   - Both `DATABASE_URL` and `DIRECT_DATABASE_URL`

### After Deployment

1. **Test admin login on production**
2. **Change default password immediately**
3. **Create additional admin users if needed**
4. **Set up backup admin account**

## Security Checklist

- [ ] Strong `NEXTAUTH_SECRET` (32+ characters, random)
- [ ] Admin password is strong (12+ characters, mixed case, numbers, symbols)
- [ ] `NEXTAUTH_URL` uses HTTPS in production
- [ ] Admin email is accessible for password resets
- [ ] Database backups are configured
- [ ] `isActive` flag is used to disable compromised accounts
- [ ] Admin access is logged (`lastLoginAt`)

## Next Steps

After successful migration:

1. ✅ Admin user table created
2. ✅ At least one admin user exists
3. ✅ Can login to `/admin/login`
4. ✅ Can access `/admin/dashboard`
5. → **Configure Cloudinary** for product images
6. → **Start adding products** via admin panel
7. → **Test product uploads** with images

## Additional Resources

- [ADMIN_DASHBOARD_GUIDE.md](./ADMIN_DASHBOARD_GUIDE.md) - Complete dashboard usage guide
- [NextAuth Documentation](https://next-auth.js.org/)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Cloudinary Documentation](https://cloudinary.com/documentation)

---

**Migration Version:** 1.0
**Date:** January 2026
**Compatible with:** Prisma 7.x, Next.js 15.x, NextAuth 5.x
