# Database Setup Guide

This project uses PostgreSQL as the database with Prisma ORM for type-safe database access.

## Prerequisites

- PostgreSQL 12 or higher
- Node.js 18 or higher

## Quick Start

### 1. Install PostgreSQL

#### macOS (using Homebrew)
```bash
brew install postgresql@16
brew services start postgresql@16
```

#### Ubuntu/Debian
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

#### Windows
Download and install from [PostgreSQL official website](https://www.postgresql.org/download/windows/)

### 2. Create Database

```bash
# Connect to PostgreSQL
psql postgres

# Create database
CREATE DATABASE nextjs_commerce;

# Create user (optional)
CREATE USER commerce_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE nextjs_commerce TO commerce_user;

# Exit
\q
```

### 3. Configure Environment Variables

Create a `.env` file in the root directory:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/nextjs_commerce?schema=public"
COMPANY_NAME="Your Company"
SITE_NAME="Your Store"
```

Replace `username` and `password` with your PostgreSQL credentials.

### 4. Push Database Schema

```bash
# Install dependencies
pnpm install

# Push schema to database
pnpm db:push
```

### 5. Seed Database with Sample Data

```bash
pnpm db:seed
```

This will create:
- Sample products (T-shirts, mugs, stickers)
- Collections (Shirts, Stickers)
- Menus (Main menu, Footer)
- Pages (About, Terms, Privacy Policy, etc.)

## Database Commands

```bash
# Push schema changes to database (development)
pnpm db:push

# Create and run migrations (production)
pnpm db:migrate

# Seed database with sample data
pnpm db:seed

# Open Prisma Studio (database GUI)
pnpm db:studio
```

## Database Schema

### Main Models

- **Product** - Products with variants, options, and images
- **ProductVariant** - Different variations of products (sizes, colors)
- **Cart** - Shopping carts
- **CartItem** - Items in shopping carts
- **Collection** - Product collections/categories
- **Menu** - Navigation menus
- **Page** - Content pages

## Migrations

When you make changes to the schema:

1. Edit `prisma/schema.prisma`
2. Run `pnpm db:push` for development
3. For production, use `pnpm db:migrate` to create migrations

## Troubleshooting

### Connection Issues

If you get connection errors:
1. Verify PostgreSQL is running: `pg_isready`
2. Check your DATABASE_URL in `.env`
3. Ensure the database exists

### Permission Issues

```bash
# Grant permissions to user
psql -d nextjs_commerce
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO commerce_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO commerce_user;
```

## Using Prisma Studio

To visually browse and edit your database:

```bash
pnpm db:studio
```

This will open a web interface at `http://localhost:5555`
