# D'FOOTPRINT - Next.js Commerce with PostgreSQL

A high-performance, server-rendered Next.js App Router ecommerce application for D'FOOTPRINT handmade footwear, powered by PostgreSQL.

> **Note**: This is a PostgreSQL-powered fork of Vercel's Next.js Commerce template. The beautiful UI remains unchanged, but the backend now uses a self-hosted PostgreSQL database instead of Shopify.

## ✨ What Makes This Special

- 🎨 **Professional UI** - Kept the beautiful Vercel Next.js Commerce design
- 🗄️ **PostgreSQL Backend** - Full control over your data
- 🚀 **Modern Stack** - Next.js 15, TypeScript, Prisma ORM
- 🔒 **Type Safe** - End-to-end TypeScript
- ⚡ **Fast** - Optimized queries and caching
- 📱 **Mobile First** - Responsive design
- 🛒 **Full Cart** - Complete shopping cart functionality
- 💳 **Checkout & Payments** - Integrated Paystack payment gateway
- 👤 **User Accounts** - Authentication and order management
- 📦 **Order Tracking** - Complete order management system

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd nextjs-commerce
pnpm install
```

### 2. Set Up Database

Choose a PostgreSQL host and create `.env.local`:

```env
DATABASE_URL="postgresql://user:password@host:5432/database"
SITE_NAME="D'FOOTPRINT"
COMPANY_NAME="D'FOOTPRINT"

# For checkout functionality
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"

# Paystack (for payments)
PAYSTACK_PUBLIC_KEY="pk_test_xxxxxxxxxxxxx"
PAYSTACK_SECRET_KEY="sk_test_xxxxxxxxxxxxx"
```

**Recommended Hosts:**

- [Vercel Postgres](https://vercel.com/storage/postgres) - Easiest for Vercel deployments
- [Supabase](https://supabase.com) - Free tier available
- [Neon](https://neon.tech) - Serverless Postgres
- Local PostgreSQL

**Get Paystack Keys:**

- Sign up at [Paystack](https://paystack.com)
- Get your API keys from the dashboard
- See [CHECKOUT_SETUP.md](CHECKOUT_SETUP.md) for detailed setup

### 3. Initialize Database

```bash
pnpm db:push    # Create tables
pnpm db:seed    # Add sample data
```

### 4. Start Development

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) 🎉

## 📖 Documentation

- **[MIGRATION_SUMMARY.md](MIGRATION_SUMMARY.md)** - Overview of changes and quick guide
- **[DATABASE_SETUP.md](DATABASE_SETUP.md)** - Detailed setup instructions
- **[DATABASE_MIGRATION.md](DATABASE_MIGRATION.md)** - Design decisions and architecture
- **[PRD.md](PRD.md)** - Product requirements for D'FOOTPRINT
- **[CHECKOUT_SETUP.md](CHECKOUT_SETUP.md)** - Checkout and payment setup guide
- **[CHECKOUT_IMPLEMENTATION.md](CHECKOUT_IMPLEMENTATION.md)** - Checkout technical documentation

## 🛠️ NPM Scripts

| Command            | Description              |
| ------------------ | ------------------------ |
| `pnpm dev`         | Start development server |
| `pnpm build`       | Build for production     |
| `pnpm start`       | Start production server  |
| `pnpm db:generate` | Generate migration files |
| `pnpm db:migrate`  | Run migrations           |
| `pnpm db:push`     | Push schema to database  |
| `pnpm db:studio`   | Open database GUI        |
| `pnpm db:seed`     | Load sample data         |

## 🗄️ Database Management

### Drizzle Studio (Recommended)

```bash
pnpm db:studio
```

Opens a web interface to:

- Browse and edit products
- Manage collections
- Update pages
- Configure menus
- No SQL required!

## 📦 Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM
- **Styling**: Tailwind CSS
- **UI**: Headless UI + Heroicons
- **Hosting**: Vercel (recommended)

## 🏗️ Project Structure

```
├── app/                    # Next.js App Router pages
├── components/             # React components
├── lib/
│   ├── db/
│   │   ├── schema.ts      # Database schema
│   │   ├── queries.ts     # Database queries
│   │   └── scripts/       # Migration scripts
│   ├── database/          # Database abstraction layer
│   └── constants.ts       # App constants
├── DATABASE_SETUP.md      # Setup guide
├── DATABASE_MIGRATION.md  # Architecture docs
└── MIGRATION_SUMMARY.md   # Migration overview
```

## 🎨 Features

### Products

- Multiple images per product
- Size and color variants
- SEO optimization
- Tags and categories
- Dynamic pricing

### Shopping Cart

- Add/remove items
- Update quantities
- Persistent cart
- Checkout integration ready

### Collections

- Organize products
- Custom descriptions
- SEO for each collection

### Pages

- About
- Shipping & Returns
- Privacy Policy
- Terms & Conditions
- Custom pages support

## 🔐 Environment Variables

Required:

- `DATABASE_URL` - PostgreSQL connection string
- `SITE_NAME` - Your site name
- `COMPANY_NAME` - Your company name

Optional:

- `REVALIDATION_SECRET` - For webhook revalidation

See `.env.example` for details.

## 🚢 Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import to Vercel
3. Add `DATABASE_URL` environment variable
4. Deploy
5. Run migrations:
   ```bash
   pnpm db:push
   pnpm db:seed
   ```

## 🆚 Shopify vs PostgreSQL

| Feature       | Shopify | PostgreSQL |
| ------------- | ------- | ---------- |
| Data Control  | Limited | Full       |
| Customization | Limited | Unlimited  |
| Monthly Costs | Yes     | No         |
| UI Quality    | Great   | Same!      |
| Setup Time    | Fast    | Medium     |
| Flexibility   | Limited | High       |

## 📚 Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Drizzle ORM](https://orm.drizzle.team)
- [PostgreSQL](https://www.postgresql.org)
- [Tailwind CSS](https://tailwindcss.com)

## 🤝 Contributing

This is a private project for D'FOOTPRINT, but you can:

1. Report issues
2. Suggest features
3. Share feedback

## 📝 License

See [license.md](license.md)

## 🙏 Credits

- UI Template: [Vercel Next.js Commerce](https://github.com/vercel/commerce)
- Built for: D'FOOTPRINT Handmade Footwear
- Database Migration: Custom PostgreSQL implementation

---

**Need Help?** Check the documentation files or open an issue.
