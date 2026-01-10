import { db } from "../index";
import {
  products,
  productVariants,
  productImages,
  productOptions,
  collections,
  productCollections,
  pages,
  menus,
  menuItems,
} from "../schema";

async function seed() {
  console.log("🌱 Seeding database...");

  try {
    // Create collections
    console.log("Creating collections...");
    const [allCollection] = await db
      .insert(collections)
      .values([
        {
          handle: "all",
          title: "All Products",
          description: "Browse all our handmade footwear",
          seoTitle: "All Products - D'FOOTPRINT",
          seoDescription: "Browse all our handmade footwear collection",
        },
        {
          handle: "slippers",
          title: "Slippers",
          description: "Comfortable handmade slippers",
          seoTitle: "Handmade Slippers - D'FOOTPRINT",
          seoDescription: "Explore our collection of handmade slippers",
        },
        {
          handle: "slides",
          title: "Slides",
          description: "Stylish handmade slides",
          seoTitle: "Handmade Slides - D'FOOTPRINT",
          seoDescription: "Discover our range of handmade slides",
        },
      ])
      .returning();

    console.log(`✅ Created ${3} collections`);

    // Create sample products
    console.log("Creating sample products...");
    const [product1] = await db
      .insert(products)
      .values([
        {
          handle: "classic-slide",
          title: "Classic Slide",
          description: "A timeless classic slide with elegant design",
          descriptionHtml:
            "<p>A timeless classic slide with elegant design. Perfect for everyday wear.</p>",
          availableForSale: true,
          seoTitle: "Classic Slide - Handmade Footwear",
          seoDescription:
            "Comfortable and stylish classic slide, handmade with care",
          tags: ["featured", "bestseller"],
        },
        {
          handle: "luxury-slipper",
          title: "Luxury Slipper",
          description: "Premium handcrafted slipper with superior comfort",
          descriptionHtml:
            "<p>Premium handcrafted slipper with superior comfort. Made with the finest materials.</p>",
          availableForSale: true,
          seoTitle: "Luxury Slipper - Premium Footwear",
          seoDescription:
            "Experience luxury with our handcrafted premium slippers",
          tags: ["premium", "luxury"],
        },
      ])
      .returning();

    console.log(`✅ Created ${2} products`);

    // Create product options
    console.log("Creating product options...");
    if (product1) {
      await db.insert(productOptions).values([
        {
          productId: product1.id,
          name: "Size",
          values: ["38", "39", "40", "41", "42", "43", "44"],
        },
        {
          productId: product1.id,
          name: "Color",
          values: ["Black", "Brown", "Navy"],
        },
      ]);
    }

    console.log(`✅ Created product options`);

    // Create product variants
    console.log("Creating product variants...");
    if (product1) {
      await db.insert(productVariants).values([
        {
          productId: product1.id,
          title: "38 / Black",
          price: "12000.00",
          currencyCode: "NGN",
          availableForSale: true,
          selectedOptions: [
            { name: "Size", value: "38" },
            { name: "Color", value: "Black" },
          ],
        },
        {
          productId: product1.id,
          title: "39 / Black",
          price: "12000.00",
          currencyCode: "NGN",
          availableForSale: true,
          selectedOptions: [
            { name: "Size", value: "39" },
            { name: "Color", value: "Black" },
          ],
        },
        {
          productId: product1.id,
          title: "40 / Brown",
          price: "12000.00",
          currencyCode: "NGN",
          availableForSale: true,
          selectedOptions: [
            { name: "Size", value: "40" },
            { name: "Color", value: "Brown" },
          ],
        },
      ]);
    }

    console.log(`✅ Created product variants`);

    // Create product images (using placeholder URLs)
    console.log("Creating product images...");
    if (product1) {
      await db.insert(productImages).values([
        {
          productId: product1.id,
          url: "https://via.placeholder.com/800x800/000000/FFFFFF?text=Classic+Slide",
          altText: "Classic Slide - Front View",
          width: 800,
          height: 800,
          position: 0,
          isFeatured: true,
        },
        {
          productId: product1.id,
          url: "https://via.placeholder.com/800x800/333333/FFFFFF?text=Classic+Slide+Side",
          altText: "Classic Slide - Side View",
          width: 800,
          height: 800,
          position: 1,
          isFeatured: false,
        },
      ]);
    }

    console.log(`✅ Created product images`);

    // Create pages
    console.log("Creating pages...");
    await db.insert(pages).values([
      {
        handle: "about",
        title: "About D'FOOTPRINT",
        body: "D'FOOTPRINT is a handmade footwear brand specializing in slippers, slides, and other custom footwear. Based in Lagos, Nigeria, we deliver nationwide.",
        bodySummary: "Learn more about D'FOOTPRINT",
        seoTitle: "About Us - D'FOOTPRINT",
        seoDescription: "Discover the story behind D'FOOTPRINT handmade footwear",
      },
      {
        handle: "shipping-returns",
        title: "Shipping & Returns",
        body: "We offer nationwide delivery across Nigeria. Delivery fees are paid by the buyer. Returns and exchanges are handled on a case-by-case basis.",
        bodySummary: "Shipping and returns policy",
        seoTitle: "Shipping & Returns - D'FOOTPRINT",
        seoDescription: "Learn about our shipping and returns policy",
      },
      {
        handle: "privacy-policy",
        title: "Privacy Policy",
        body: "Your privacy is important to us. This policy outlines how we collect, use, and protect your personal information.",
        bodySummary: "Our privacy policy",
        seoTitle: "Privacy Policy - D'FOOTPRINT",
        seoDescription: "Read our privacy policy",
      },
      {
        handle: "terms-conditions",
        title: "Terms & Conditions",
        body: "By using our website and purchasing our products, you agree to these terms and conditions.",
        bodySummary: "Terms and conditions",
        seoTitle: "Terms & Conditions - D'FOOTPRINT",
        seoDescription: "Read our terms and conditions",
      },
    ]);

    console.log(`✅ Created pages`);

    // Create menus
    console.log("Creating menus...");
    const [mainMenu] = await db
      .insert(menus)
      .values([
        {
          handle: "main-menu",
          title: "Main Menu",
        },
        {
          handle: "footer-menu",
          title: "Footer Menu",
        },
      ])
      .returning();

    if (mainMenu) {
      await db.insert(menuItems).values([
        {
          menuId: mainMenu.id,
          title: "Shop",
          url: "/search",
          position: 0,
        },
        {
          menuId: mainMenu.id,
          title: "About",
          url: "/about",
          position: 1,
        },
        {
          menuId: mainMenu.id,
          title: "Contact",
          url: "/contact",
          position: 2,
        },
      ]);
    }

    console.log(`✅ Created menus and menu items`);

    console.log("✨ Seeding completed successfully!");
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    throw error;
  }
}

// Run the seed function
seed()
  .then(() => {
    console.log("👍 Done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Seed failed:", error);
    process.exit(1);
  });
