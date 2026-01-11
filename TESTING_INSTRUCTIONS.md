# Testing Instructions for UI Cleanup and Product Enhancement

## Overview
This PR adds 12 products with Unsplash images, creates homepage collections, and ensures the UI displays correctly.

## Prerequisites
Before testing, you need:
1. A PostgreSQL database (local or hosted)
2. Node.js and npm/pnpm installed
3. Git repository cloned

## Setup Steps

### 1. Configure Environment Variables
Create `.env.local` in the root directory:

```bash
# Required
DATABASE_URL="postgresql://user:password@host:5432/dbname"
DIRECT_DATABASE_URL="postgresql://user:password@host:5432/dbname"

# Company Info
COMPANY_NAME="D'FOOTPRINT"
SITE_NAME="D'FOOTPRINT"
```

**Database Options:**
- Local PostgreSQL: `postgresql://postgres:password@localhost:5432/nextjs_commerce`
- [Vercel Postgres](https://vercel.com/storage/postgres)
- [Supabase](https://supabase.com) (free tier)
- [Neon](https://neon.tech) (serverless)

### 2. Install Dependencies
```bash
npm install --legacy-peer-deps
# or
pnpm install
```

### 3. Initialize Database
```bash
# Push schema to database
npm run db:push

# Seed with 12 products
npm run db:seed
```

**Expected Output:**
```
🌱 Seeding database...
Creating collections...
✅ Created 5 collections
Creating sample products...
✅ Created 12 products
Creating product options...
✅ Created product options
Creating product variants...
✅ Created product variants
Creating product images...
✅ Created product images
Linking products to collections...
✅ Linked products to collections
Creating pages...
✅ Created pages
Creating menus...
✅ Created menus and menu items
✨ Seeding completed successfully!
👍 Done!
```

### 4. Start Development Server
```bash
npm run dev
```

Visit: http://localhost:3000

## Testing Checklist

### Homepage (http://localhost:3000)
- [ ] **Hero Section** displays 3 featured products:
  - Classic Leather Slide
  - Designer Embroidered Slipper
  - Summer Beach Slide
- [ ] Images load properly from Unsplash (no broken images)
- [ ] Product titles and prices display correctly
- [ ] Clicking products navigates to product pages

### Carousel Section
- [ ] **Carousel** displays 7 products in a scrolling view
- [ ] Products included:
  - Classic Leather Slide
  - Luxury Velvet Slipper
  - Designer Embroidered Slipper
  - Minimalist Black Slide
  - Summer Beach Slide
  - Orthopedic Comfort Slipper
  - Luxury Spa Slide
- [ ] Carousel animates smoothly
- [ ] Images load without errors
- [ ] Products are clickable

### Product Pages
Navigate to any product (e.g., `/product/classic-leather-slide`):
- [ ] Product images load from Unsplash
- [ ] Product title and description display
- [ ] Price is shown in NGN (Nigerian Naira)
- [ ] Variants (size, color) are selectable
- [ ] "Add to Cart" button works
- [ ] Image gallery functions properly

### Collections/Search
Visit: http://localhost:3000/search
- [ ] "All Products" shows all 12 products
- [ ] "Slippers" collection shows 6 slipper products
- [ ] "Slides" collection shows 6 slide products
- [ ] Filter and sort options work
- [ ] Product grid layout is clean and responsive

### Shopping Cart
- [ ] Add products to cart
- [ ] Cart updates correctly
- [ ] Quantities can be increased/decreased
- [ ] Remove items works
- [ ] Cart persists across page navigation

### Mobile Responsiveness
Test on mobile viewport (DevTools):
- [ ] Homepage hero adapts to mobile
- [ ] Carousel is swipeable
- [ ] Product cards stack properly
- [ ] Navigation menu works
- [ ] Images load and scale correctly

## Image Verification

All product images should load from Unsplash:
- No "example.com" URLs
- No placeholder images that cause crashes
- Images are properly optimized by Next.js
- Different products show different images

**Image URLs Used:**
- `https://images.unsplash.com/photo-1603808033192-082d6919d3e1`
- `https://images.unsplash.com/photo-1560769629-975ec94e6a86`
- `https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77`
- `https://images.unsplash.com/photo-1582897085656-c84d8f5cd7fc`
- `https://images.unsplash.com/photo-1631545805976-146c7bdacbe7`
- `https://images.unsplash.com/photo-1584302179602-e4c3d3fd629d`
- And more...

## Database Verification

Optional: Use Prisma Studio to inspect the database:
```bash
npm run db:studio
```

Verify:
- [ ] 12 products exist
- [ ] 5 collections exist (including 2 hidden ones)
- [ ] Products have images
- [ ] Products have variants
- [ ] Product-collection relationships are correct
- [ ] Pages (About, Shipping, etc.) exist

## Common Issues

### Issue: npm install fails
**Solution:** Use `--legacy-peer-deps` flag:
```bash
npm install --legacy-peer-deps
```

### Issue: Prisma generate fails
**Solution:** Set DATABASE_URL environment variable:
```bash
export DATABASE_URL="postgresql://..."
npm install
```

### Issue: Images don't load
**Solution:** Check that `next.config.ts` includes Unsplash:
```typescript
remotePatterns: [
  {
    protocol: "https",
    hostname: "images.unsplash.com",
  },
]
```

### Issue: Homepage shows no products
**Solution:** 
1. Verify seed completed successfully
2. Check that hidden collections exist:
   - `hidden-homepage-featured-items`
   - `hidden-homepage-carousel`
3. Re-run seed: `npm run db:seed`

### Issue: Database connection fails
**Solution:**
1. Verify DATABASE_URL is correct
2. Check database is running
3. Ensure database exists
4. Test connection: `psql <DATABASE_URL>`

## Performance Checks

- [ ] Homepage loads in < 3 seconds
- [ ] Images are optimized (WebP/AVIF)
- [ ] No console errors
- [ ] No 404s for images
- [ ] Lighthouse score > 90 for Performance

## Browser Compatibility

Test in:
- [ ] Chrome/Edge (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

## Production Deployment

When ready to deploy:

1. Set environment variables in hosting platform
2. Run migrations: `npm run db:push`
3. Seed database: `npm run db:seed`
4. Build: `npm run build`
5. Deploy

**Vercel Deployment:**
```bash
vercel --prod
```

## Support

If issues persist:
1. Check IMPLEMENTATION_SUMMARY.md for details
2. Review seed.ts for product data
3. Verify next.config.ts image configuration
4. Check browser console for errors
5. Review server logs for API errors

## Success Criteria

✅ All 12 products display on homepage and search
✅ Images load from Unsplash without errors
✅ No crashes or broken images
✅ Clean, professional UI maintained
✅ Database functions work correctly
✅ Shopping cart functions properly
✅ Mobile responsive
✅ No security vulnerabilities

## Next Steps

After successful testing:
1. Replace Unsplash images with real product photos
2. Update product descriptions with accurate details
3. Add more products as needed
4. Configure payment processing
5. Set up order management
6. Deploy to production
