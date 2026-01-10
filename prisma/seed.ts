import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Starting database seed...');

  // Create menus
  console.log('Creating menus...');
  const mainMenu = await prisma.menu.create({
    data: {
      handle: 'main-menu',
      items: {
        create: [
          { title: 'All', url: '/search' },
          { title: 'Shirts', url: '/search/shirts' },
          { title: 'Stickers', url: '/search/stickers' },
        ],
      },
    },
  });

  const footerMenu = await prisma.menu.create({
    data: {
      handle: 'footer',
      items: {
        create: [
          { title: 'Home', url: '/' },
          { title: 'About', url: '/about' },
          { title: 'Terms & Conditions', url: '/terms-conditions' },
          { title: 'Shipping & Return Policy', url: '/shipping-return-policy' },
          { title: 'Privacy Policy', url: '/privacy-policy' },
          { title: 'FAQ', url: '/frequently-asked-questions' },
        ],
      },
    },
  });

  // Create pages
  console.log('Creating pages...');
  await prisma.page.create({
    data: {
      handle: 'about',
      title: 'About',
      body: 'This is the about page content.',
      bodySummary: 'Learn more about us',
      seo: {
        create: {
          title: 'About Us',
          description: 'Learn more about our company and values',
        },
      },
    },
  });

  await prisma.page.create({
    data: {
      handle: 'terms-conditions',
      title: 'Terms & Conditions',
      body: 'These are the terms and conditions...',
      bodySummary: 'Our terms and conditions',
      seo: {
        create: {
          title: 'Terms & Conditions',
          description: 'Read our terms and conditions',
        },
      },
    },
  });

  await prisma.page.create({
    data: {
      handle: 'privacy-policy',
      title: 'Privacy Policy',
      body: 'Our privacy policy...',
      bodySummary: 'How we handle your data',
      seo: {
        create: {
          title: 'Privacy Policy',
          description: 'Our privacy policy and data handling practices',
        },
      },
    },
  });

  await prisma.page.create({
    data: {
      handle: 'shipping-return-policy',
      title: 'Shipping & Return Policy',
      body: 'Our shipping and return policy...',
      bodySummary: 'Shipping and returns information',
      seo: {
        create: {
          title: 'Shipping & Return Policy',
          description: 'Information about shipping and returns',
        },
      },
    },
  });

  await prisma.page.create({
    data: {
      handle: 'frequently-asked-questions',
      title: 'Frequently Asked Questions',
      body: 'Common questions and answers...',
      bodySummary: 'FAQ',
      seo: {
        create: {
          title: 'FAQ',
          description: 'Frequently asked questions',
        },
      },
    },
  });

  // Create collections
  console.log('Creating collections...');
  const shirtsCollection = await prisma.collection.create({
    data: {
      handle: 'shirts',
      title: 'Shirts',
      description: 'High-quality t-shirts',
      seo: {
        create: {
          title: 'T-Shirts Collection',
          description: 'Browse our collection of high-quality t-shirts',
        },
      },
    },
  });

  const stickersCollection = await prisma.collection.create({
    data: {
      handle: 'stickers',
      title: 'Stickers',
      description: 'Cool stickers',
      seo: {
        create: {
          title: 'Stickers Collection',
          description: 'Check out our collection of stickers',
        },
      },
    },
  });

  // Create products
  console.log('Creating products...');

  // T-Shirt Product
  const tshirt = await prisma.product.create({
    data: {
      handle: 'acme-circles-t-shirt',
      title: 'Acme Circles T-Shirt',
      description: 'A comfortable t-shirt with a cool circles design.',
      descriptionHtml: '<p>A comfortable t-shirt with a cool circles design.</p>',
      availableForSale: true,
      tags: ['shirt', 'clothing'],
      seo: {
        create: {
          title: 'Acme Circles T-Shirt',
          description: 'Comfortable t-shirt with circles design',
        },
      },
    },
  });

  // Add featured image
  const tshirtImage = await prisma.image.create({
    data: {
      url: 'https://via.placeholder.com/800x800/4A90E2/ffffff?text=Circles+T-Shirt',
      altText: 'Acme Circles T-Shirt',
      width: 800,
      height: 800,
      productId: tshirt.id,
    },
  });

  await prisma.product.update({
    where: { id: tshirt.id },
    data: { featuredImageId: tshirtImage.id },
  });

  // Add variants
  const sizes = ['S', 'M', 'L', 'XL'];
  for (const size of sizes) {
    const variant = await prisma.productVariant.create({
      data: {
        title: size,
        availableForSale: true,
        priceAmount: '25.00',
        priceCurrency: 'USD',
        productId: tshirt.id,
      },
    });

    await prisma.variantOption.create({
      data: {
        name: 'Size',
        value: size,
        variantId: variant.id,
      },
    });
  }

  // Add product option
  await prisma.productOption.create({
    data: {
      name: 'Size',
      values: sizes,
      productId: tshirt.id,
    },
  });

  // Add price range
  await prisma.productPriceRange.create({
    data: {
      minVariantPriceAmount: '25.00',
      minVariantPriceCurrency: 'USD',
      maxVariantPriceAmount: '25.00',
      maxVariantPriceCurrency: 'USD',
      productId: tshirt.id,
    },
  });

  // Mug Product
  const mug = await prisma.product.create({
    data: {
      handle: 'acme-mug',
      title: 'Acme Mug',
      description: 'A high-quality ceramic mug with the Acme logo.',
      descriptionHtml: '<p>A high-quality ceramic mug with the Acme logo.</p>',
      availableForSale: true,
      tags: ['mug', 'drinkware'],
      seo: {
        create: {
          title: 'Acme Mug',
          description: 'High-quality ceramic mug',
        },
      },
    },
  });

  const mugImage = await prisma.image.create({
    data: {
      url: 'https://via.placeholder.com/800x800/E94E77/ffffff?text=Acme+Mug',
      altText: 'Acme Mug',
      width: 800,
      height: 800,
      productId: mug.id,
    },
  });

  await prisma.product.update({
    where: { id: mug.id },
    data: { featuredImageId: mugImage.id },
  });

  const mugVariant = await prisma.productVariant.create({
    data: {
      title: 'Default',
      availableForSale: true,
      priceAmount: '15.00',
      priceCurrency: 'USD',
      productId: mug.id,
    },
  });

  await prisma.variantOption.create({
    data: {
      name: 'Title',
      value: 'Default',
      variantId: mugVariant.id,
    },
  });

  await prisma.productOption.create({
    data: {
      name: 'Title',
      values: ['Default'],
      productId: mug.id,
    },
  });

  await prisma.productPriceRange.create({
    data: {
      minVariantPriceAmount: '15.00',
      minVariantPriceCurrency: 'USD',
      maxVariantPriceAmount: '15.00',
      maxVariantPriceCurrency: 'USD',
      productId: mug.id,
    },
  });

  // Sticker Product
  const sticker = await prisma.product.create({
    data: {
      handle: 'acme-sticker',
      title: 'Acme Sticker',
      description: 'A cool vinyl sticker with the Acme logo.',
      descriptionHtml: '<p>A cool vinyl sticker with the Acme logo.</p>',
      availableForSale: true,
      tags: ['sticker'],
      seo: {
        create: {
          title: 'Acme Sticker',
          description: 'Cool vinyl sticker',
        },
      },
    },
  });

  const stickerImage = await prisma.image.create({
    data: {
      url: 'https://via.placeholder.com/800x800/50C878/ffffff?text=Acme+Sticker',
      altText: 'Acme Sticker',
      width: 800,
      height: 800,
      productId: sticker.id,
    },
  });

  await prisma.product.update({
    where: { id: sticker.id },
    data: { featuredImageId: stickerImage.id },
  });

  const stickerVariant = await prisma.productVariant.create({
    data: {
      title: 'Default',
      availableForSale: true,
      priceAmount: '5.00',
      priceCurrency: 'USD',
      productId: sticker.id,
    },
  });

  await prisma.variantOption.create({
    data: {
      name: 'Title',
      value: 'Default',
      variantId: stickerVariant.id,
    },
  });

  await prisma.productOption.create({
    data: {
      name: 'Title',
      values: ['Default'],
      productId: sticker.id,
    },
  });

  await prisma.productPriceRange.create({
    data: {
      minVariantPriceAmount: '5.00',
      minVariantPriceCurrency: 'USD',
      maxVariantPriceAmount: '5.00',
      maxVariantPriceCurrency: 'USD',
      productId: sticker.id,
    },
  });

  // Link products to collections
  console.log('Linking products to collections...');
  await prisma.collectionProduct.create({
    data: {
      collectionId: shirtsCollection.id,
      productId: tshirt.id,
      position: 0,
    },
  });

  await prisma.collectionProduct.create({
    data: {
      collectionId: stickersCollection.id,
      productId: sticker.id,
      position: 0,
    },
  });

  console.log('✅ Database seeded successfully!');
  console.log('📦 Created:');
  console.log('  - 2 menus (main-menu, footer)');
  console.log('  - 5 pages');
  console.log('  - 2 collections (shirts, stickers)');
  console.log('  - 3 products (t-shirt, mug, sticker)');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
