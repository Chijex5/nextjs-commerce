# Next.js Commerce with PostgreSQL

A high-performance, server-rendered Next.js App Router ecommerce application with PostgreSQL database.

This template uses React Server Components, Server Actions, `Suspense`, `useOptimistic`, Prisma ORM, and more.

## 🚀 Features

- **PostgreSQL Database** - Self-hosted database with full control
- **Prisma ORM** - Type-safe database access with auto-completion
- **Cart Management** - Full shopping cart functionality
- **Product Catalog** - Products, variants, collections
- **Content Management** - Pages, menus, SEO
- **Modern Stack** - Next.js 15, React 19, TypeScript

## 🏁 Getting Started

### Prerequisites

- Node.js 18 or higher
- PostgreSQL 12 or higher
- pnpm (recommended) or npm

### Installation

1. **Clone the repository**

```bash
git clone <repository-url>
cd nextjs-commerce
```

2. **Install dependencies**

```bash
pnpm install
```

3. **Set up the database**

See [DATABASE_SETUP.md](./DATABASE_SETUP.md) for detailed instructions.

Quick setup:

```bash
# Create .env file
cp .env.example .env

# Edit .env and add your DATABASE_URL
# DATABASE_URL="postgresql://username:password@localhost:5432/nextjs_commerce"

# Push schema to database
pnpm db:push

# Seed with sample data
pnpm db:seed
```

4. **Run the development server**

```bash
pnpm dev
```

Your app should now be running on [localhost:3000](http://localhost:3000/).

## 📝 Available Scripts

```bash
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm start        # Start production server
pnpm db:push      # Push schema changes to database
pnpm db:seed      # Seed database with sample data
pnpm db:migrate   # Create and run migrations
pnpm db:studio    # Open Prisma Studio (database GUI)
```

## 🗄️ Database Structure

The application uses a PostgreSQL database with the following main entities:

- **Products** - Product catalog with variants and options
- **Collections** - Product collections/categories
- **Cart** - Shopping cart with line items
- **Pages** - Content pages (About, Terms, etc.)
- **Menus** - Navigation menus

For detailed schema information, see `prisma/schema.prisma`.

## 🔧 Configuration

Environment variables are defined in `.env`:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/nextjs_commerce"
COMPANY_NAME="Your Company Name"
SITE_NAME="Your Store Name"
```

## 📚 Documentation

- [Database Setup Guide](./DATABASE_SETUP.md) - Detailed database setup instructions
- [Product Requirements](./PRD.md) - Project requirements and goals

## 🏗️ Architecture

This project follows the Next.js App Router architecture with:

- **Server Components** - Default for all components
- **Server Actions** - For mutations (cart operations)
- **Database Layer** - `lib/db/` contains all database operations
- **Type Safety** - Full TypeScript and Prisma type safety

## 🔄 Migration from Shopify

This template was adapted from the Vercel Next.js Commerce template. The Shopify integration has been replaced with a PostgreSQL database, maintaining the same UI and functionality while giving you full control over your data.

Key changes:
- Replaced Shopify GraphQL API with PostgreSQL + Prisma
- Maintained the same data models and structure
- All cart and product operations now use the database
- Added database seeding for easy setup

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

See [license.md](./license.md) for details.

## 🙏 Credits

- Original template by [Vercel](https://vercel.com)
- Database migration and PostgreSQL integration
