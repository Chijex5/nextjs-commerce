# Database Setup Guide

## Quick Start

### 1. Set up your PostgreSQL database

Choose one of these hosting options:

#### Option A: Vercel Postgres (Recommended for Vercel deployments)

```bash
# Install Vercel CLI if you haven't
npm i -g vercel

# Link your project
vercel link

# Create a Postgres database
vercel storage create postgres

# Pull environment variables
vercel env pull .env.local
```

#### Option B: Supabase (Free tier available)

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Copy the connection string from Settings > Database
4. Create `.env.local` with:

```
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@[YOUR-HOST]:5432/postgres"
```

#### Option C: Neon (Serverless Postgres)

1. Go to [neon.tech](https://neon.tech)
2. Create a new project
3. Copy the connection string
4. Create `.env.local` with:

```
DATABASE_URL="postgresql://[USER]:[PASSWORD]@[HOST]/[DATABASE]?sslmode=require"
```

#### Option D: Local PostgreSQL

```bash
# Install PostgreSQL locally
# Then create a database
createdb nextjs_commerce

# Create .env.local with:
DATABASE_URL="postgresql://localhost:5432/nextjs_commerce"
```

### 2. Generate and run migrations

```bash
# Generate migration files from schema
pnpm db:generate

# Push schema to database
pnpm db:push
```

### 3. Seed the database with sample data

```bash
pnpm db:seed
```

This will create:

- Sample products (Classic Slide, Luxury Slipper)
- Collections (All Products, Slippers, Slides)
- Product variants (different sizes and colors)
- Static pages (About, Shipping & Returns, etc.)
- Navigation menus

### 4. Start the development server

```bash
pnpm dev
```

Visit [http://localhost:3000](http://localhost:3000) to see your site!

## Database Management

### View and edit data with Drizzle Studio

```bash
pnpm db:studio
```

This opens a web interface at `https://local.drizzle.studio` where you can:

- Browse all tables
- Add/edit/delete records
- Run custom queries
- No SQL knowledge required!

### Database Scripts Reference

- `pnpm db:generate` - Generate SQL migration files from schema changes
- `pnpm db:migrate` - Run pending migrations
- `pnpm db:push` - Push schema directly to database (dev only)
- `pnpm db:studio` - Open Drizzle Studio web UI
- `pnpm db:seed` - Populate database with sample data

## Making Schema Changes

1. Edit `lib/db/schema.ts`
2. Run `pnpm db:generate` to create migration
3. Run `pnpm db:migrate` to apply changes
4. Update query functions in `lib/db/queries.ts` if needed

## Database Schema Overview

### Core Tables

- **products** - Main product information
- **product_variants** - Size/color variations with prices
- **product_options** - Available options (Size, Color, etc.)
- **product_images** - Product photos with ordering
- **collections** - Product categories
- **product_collections** - Links products to collections
- **carts** - Shopping cart data
- **cart_lines** - Items in carts
- **pages** - Static content pages
- **menus** & **menu_items** - Navigation menus

See `DATABASE_MIGRATION.md` for detailed schema documentation.

## Troubleshooting

### "Cannot connect to database"

- Check `DATABASE_URL` in `.env.local`
- Verify database is running
- Check firewall/network settings
- Ensure IP is whitelisted (for cloud databases)

### "Migration failed"

- Ensure database exists
- Check database user has CREATE permissions
- For first migration, database should be empty

### "Module not found: lib/database"

- Run `pnpm install` to ensure all dependencies are installed
- Restart your dev server

## Production Deployment

### On Vercel

1. Add `DATABASE_URL` to Vercel environment variables
2. Push your code to GitHub
3. Deploy will automatically run
4. After first deploy, run migrations:

```bash
vercel env pull
pnpm db:push
pnpm db:seed
```

### Environment Variables

Required:

- `DATABASE_URL` - PostgreSQL connection string
- `SITE_NAME` - Your site name (e.g., "D'FOOTPRINT")
- `COMPANY_NAME` - Your company name

Optional:

- `REVALIDATION_SECRET` - For webhook revalidation

## Next Steps

1. ✅ Database is set up
2. ✅ Sample data is loaded
3. 📸 Add your own product photos
4. ✍️ Update product descriptions
5. 🎨 Customize content in Drizzle Studio
6. 🚀 Deploy to production

## Learn More

- **Full Documentation**: See `DATABASE_MIGRATION.md`
- **Schema Details**: View `lib/db/schema.ts`
- **Query Functions**: Check `lib/db/queries.ts`
- **Drizzle ORM**: [www.prisma.io](https://www.prisma.io)

## Support

For issues or questions:

1. Check `DATABASE_MIGRATION.md` for detailed explanations
2. Review error messages in terminal
3. Use `pnpm db:studio` to inspect database state
4. Check database logs in your hosting provider

---

**Need help?** Refer to the comprehensive `DATABASE_MIGRATION.md` file for design decisions and troubleshooting.
