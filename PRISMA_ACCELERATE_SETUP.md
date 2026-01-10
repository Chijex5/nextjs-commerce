# Prisma Accelerate Setup Guide

## What is Prisma Accelerate?

Prisma Accelerate is a global database cache and connection pooler that makes your database queries faster and more scalable. When using Prisma Accelerate, you have **two different database URLs**:

1. **DATABASE_URL** - The Accelerate connection (for your app at runtime)
2. **DIRECT_DATABASE_URL** - Direct database connection (for migrations and schema changes)

## Why Two URLs?

- **DATABASE_URL** (`prisma+postgres://accelerate.prisma-data.net/...`): 
  - Used by your application at runtime
  - Routes through Accelerate for caching and connection pooling
  - Fast global edge network

- **DIRECT_DATABASE_URL** (`postgresql://host:5432/db`):
  - Used for database migrations and schema changes
  - Direct connection to your database
  - Required for `prisma migrate`, `prisma db push`, etc.

## Setup Instructions

### 1. Update Your `.env.local` File

```env
# For your application (Prisma Accelerate)
DATABASE_URL="prisma+postgres://accelerate.prisma-data.net/?api_key=YOUR_ACCELERATE_API_KEY"

# For migrations (Direct connection)
DIRECT_DATABASE_URL="postgresql://user:password@host:5432/dbname?sslmode=require"
```

### 2. Schema Configuration (Already Done)

Your `prisma/schema.prisma` now has:

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")        // Accelerate URL
  directUrl = env("DIRECT_DATABASE_URL") // Direct URL
}
```

### 3. How to Get These URLs

#### DATABASE_URL (Prisma Accelerate):
1. Go to [Prisma Data Platform](https://cloud.prisma.io)
2. Create a project and enable Accelerate
3. Copy the connection string that starts with `prisma+postgres://`

#### DIRECT_DATABASE_URL:
Use your actual PostgreSQL connection string from:
- **Neon**: `postgresql://user:pass@ep-xxx.neon.tech/dbname?sslmode=require`
- **Supabase**: `postgresql://postgres:pass@db.xxx.supabase.co:5432/postgres`
- **Railway**: `postgresql://postgres:pass@containers-us-west-xxx.railway.app:5432/railway`
- **Local**: `postgresql://localhost:5432/mydb`

### 4. Running Migrations

Now when you run database commands, Prisma will use the correct URL:

```bash
# Uses DIRECT_DATABASE_URL (direct connection)
pnpm db:push      # Creates/updates tables
pnpm db:migrate   # Runs migrations

# Uses DATABASE_URL (Accelerate connection)
pnpm dev          # Your app uses cached queries
pnpm db:seed      # Populates data
```

### 5. Troubleshooting

#### Error: "The table does not exist"

This happens when migrations haven't run. Fix:

```bash
# Make sure both URLs are set
echo $DATABASE_URL
echo $DIRECT_DATABASE_URL

# Run migration with direct connection
pnpm db:push

# Then seed
pnpm db:seed
```

#### Error: "Invalid connection string"

Make sure:
- `DATABASE_URL` starts with `prisma+postgres://`
- `DIRECT_DATABASE_URL` starts with `postgresql://`
- Both are in your `.env.local` file

#### Error: "Cannot connect to database"

For direct URL, ensure:
- Database exists
- Credentials are correct
- IP is whitelisted (for cloud databases)
- SSL mode is specified if required: `?sslmode=require`

## Architecture

```
┌─────────────────────────────────────────────────┐
│  Your Next.js App (Runtime)                     │
│  Uses: DATABASE_URL                             │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│  Prisma Accelerate                              │
│  Global cache & connection pooler               │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│  Your PostgreSQL Database                       │
└─────────────────────────────────────────────────┘
                  ▲
                  │
┌─────────────────┴───────────────────────────────┐
│  Migrations & Schema Changes                    │
│  Uses: DIRECT_DATABASE_URL                      │
└─────────────────────────────────────────────────┘
```

## Key Points

1. **Runtime queries** use `DATABASE_URL` (through Accelerate)
2. **Schema changes** use `DIRECT_DATABASE_URL` (direct connection)
3. Both URLs point to the **same database**, just different paths
4. Accelerate provides caching and connection pooling automatically
5. You don't need `@prisma/adapter-pg` - Prisma handles it internally

## Benefits of This Setup

- ✅ Fast global caching with Accelerate
- ✅ Connection pooling (no connection limit issues)
- ✅ Edge-ready (works with Vercel Edge Functions)
- ✅ Still have direct access for migrations
- ✅ Simple setup, no custom adapters needed

## Example: Complete `.env.local`

```env
# Site configuration
COMPANY_NAME="D'FOOTPRINT"
SITE_NAME="D'FOOTPRINT"

# Database - Prisma Accelerate
DATABASE_URL="prisma+postgres://accelerate.prisma-data.net/?api_key=eyJhbGci..."

# Database - Direct connection for migrations
DIRECT_DATABASE_URL="postgresql://neondb_owner:pass@ep-cold-wind-a5mg4w7k.us-east-2.aws.neon.tech/neondb?sslmode=require"

# Optional
VERCEL_OIDC_TOKEN=""
```

## References

- [Prisma Accelerate Docs](https://www.prisma.io/docs/accelerate)
- [Prisma PostgreSQL Guide](https://www.prisma.io/docs/postgres/database)
- [Connection Pooling](https://www.prisma.io/docs/guides/performance-and-optimization/connection-management)
