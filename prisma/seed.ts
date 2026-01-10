import prisma from "lib/prisma";
const db = prisma;

async function seed() {
  console.log("🌱 Seeding database...");

  try {
    // Create collections
    console.log("Creating collections...");
    await db.collection.createMany({
      data: [
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
        {
          handle: "hidden-homepage-featured-items",
          title: "Featured Items",
          description: "Featured products for homepage",
          seoTitle: "Featured Items - D'FOOTPRINT",
          seoDescription: "Featured products for homepage display",
        },
        {
          handle: "hidden-homepage-carousel",
          title: "Homepage Carousel",
          description: "Products for homepage carousel",
          seoTitle: "Homepage Carousel - D'FOOTPRINT",
          seoDescription: "Products for homepage carousel display",
        },
      ],
    });

    console.log(`✅ Created 5 collections`);

    // Create sample products
    console.log("Creating sample products...");
    const product1 = await db.product.create({
      data: {
        handle: "classic-leather-slide",
        title: "Classic Leather Slide",
        description: "A timeless classic slide with elegant design and premium leather finish",
        descriptionHtml:
          "<p>A timeless classic slide with elegant design. Perfect for everyday wear. Made with premium leather.</p>",
        availableForSale: true,
        seoTitle: "Classic Leather Slide - Handmade Footwear",
        seoDescription:
          "Comfortable and stylish classic slide, handmade with care using premium leather",
        tags: ["featured", "bestseller", "slides"],
      },
    });

    const product2 = await db.product.create({
      data: {
        handle: "luxury-velvet-slipper",
        title: "Luxury Velvet Slipper",
        description: "Premium handcrafted slipper with superior comfort and velvet finish",
        descriptionHtml:
          "<p>Premium handcrafted slipper with superior comfort. Made with the finest velvet materials.</p>",
        availableForSale: true,
        seoTitle: "Luxury Velvet Slipper - Premium Footwear",
        seoDescription:
          "Experience luxury with our handcrafted premium velvet slippers",
        tags: ["premium", "luxury", "slippers"],
      },
    });

    const product3 = await db.product.create({
      data: {
        handle: "comfort-home-slipper",
        title: "Comfort Home Slipper",
        description: "Soft and cozy home slippers for ultimate relaxation",
        descriptionHtml:
          "<p>Soft and cozy home slippers designed for ultimate comfort and relaxation at home.</p>",
        availableForSale: true,
        seoTitle: "Comfort Home Slipper - D'FOOTPRINT",
        seoDescription: "Soft and comfortable home slippers for everyday use",
        tags: ["comfort", "home", "slippers"],
      },
    });

    const product4 = await db.product.create({
      data: {
        handle: "sport-slide-sandal",
        title: "Sport Slide Sandal",
        description: "Athletic slide sandals perfect for active lifestyles",
        descriptionHtml:
          "<p>Athletic slide sandals designed for comfort and durability. Perfect for sports and active lifestyles.</p>",
        availableForSale: true,
        seoTitle: "Sport Slide Sandal - D'FOOTPRINT",
        seoDescription: "Durable athletic slide sandals for active lifestyles",
        tags: ["sport", "active", "slides"],
      },
    });

    const product5 = await db.product.create({
      data: {
        handle: "designer-embroidered-slipper",
        title: "Designer Embroidered Slipper",
        description: "Handcrafted slippers with beautiful embroidered patterns",
        descriptionHtml:
          "<p>Elegant slippers featuring intricate hand-embroidered patterns. A perfect blend of tradition and style.</p>",
        availableForSale: true,
        seoTitle: "Designer Embroidered Slipper - D'FOOTPRINT",
        seoDescription:
          "Beautiful handcrafted slippers with embroidered designs",
        tags: ["designer", "embroidered", "slippers", "featured"],
      },
    });

    const product6 = await db.product.create({
      data: {
        handle: "minimalist-black-slide",
        title: "Minimalist Black Slide",
        description: "Sleek and modern black slides for contemporary style",
        descriptionHtml:
          "<p>Minimalist black slides with a modern design. Perfect for any occasion, casual or formal.</p>",
        availableForSale: true,
        seoTitle: "Minimalist Black Slide - D'FOOTPRINT",
        seoDescription: "Modern minimalist black slides for contemporary style",
        tags: ["minimalist", "modern", "slides", "bestseller"],
      },
    });

    const product7 = await db.product.create({
      data: {
        handle: "traditional-palm-slipper",
        title: "Traditional Palm Slipper",
        description: "Authentic traditional slippers made from natural palm materials",
        descriptionHtml:
          "<p>Authentic traditional slippers crafted from natural palm materials. Eco-friendly and comfortable.</p>",
        availableForSale: true,
        seoTitle: "Traditional Palm Slipper - D'FOOTPRINT",
        seoDescription: "Eco-friendly traditional slippers made from palm",
        tags: ["traditional", "eco-friendly", "slippers"],
      },
    });

    const product8 = await db.product.create({
      data: {
        handle: "summer-beach-slide",
        title: "Summer Beach Slide",
        description: "Colorful and comfortable slides perfect for beach days",
        descriptionHtml:
          "<p>Bright and colorful beach slides designed for summer fun. Waterproof and quick-drying.</p>",
        availableForSale: true,
        seoTitle: "Summer Beach Slide - D'FOOTPRINT",
        seoDescription: "Colorful waterproof slides perfect for the beach",
        tags: ["summer", "beach", "slides", "featured"],
      },
    });

    const product9 = await db.product.create({
      data: {
        handle: "premium-suede-slipper",
        title: "Premium Suede Slipper",
        description: "Luxurious suede slippers with memory foam comfort",
        descriptionHtml:
          "<p>Premium suede slippers featuring memory foam insoles for ultimate comfort. Perfect for indoor luxury.</p>",
        availableForSale: true,
        seoTitle: "Premium Suede Slipper - D'FOOTPRINT",
        seoDescription: "Luxurious suede slippers with memory foam",
        tags: ["premium", "luxury", "slippers"],
      },
    });

    const product10 = await db.product.create({
      data: {
        handle: "casual-everyday-slide",
        title: "Casual Everyday Slide",
        description: "Versatile slides perfect for everyday wear",
        descriptionHtml:
          "<p>Versatile and comfortable slides designed for everyday use. Durable construction for long-lasting wear.</p>",
        availableForSale: true,
        seoTitle: "Casual Everyday Slide - D'FOOTPRINT",
        seoDescription: "Comfortable versatile slides for daily wear",
        tags: ["casual", "everyday", "slides"],
      },
    });

    const product11 = await db.product.create({
      data: {
        handle: "orthopedic-comfort-slipper",
        title: "Orthopedic Comfort Slipper",
        description: "Ergonomically designed slippers for foot health and comfort",
        descriptionHtml:
          "<p>Orthopedic slippers with ergonomic design to support foot health. Recommended by podiatrists.</p>",
        availableForSale: true,
        seoTitle: "Orthopedic Comfort Slipper - D'FOOTPRINT",
        seoDescription: "Ergonomic slippers designed for foot health",
        tags: ["orthopedic", "health", "slippers", "bestseller"],
      },
    });

    const product12 = await db.product.create({
      data: {
        handle: "luxury-spa-slide",
        title: "Luxury Spa Slide",
        description: "Premium spa slides with plush cushioning",
        descriptionHtml:
          "<p>Luxury spa slides with ultra-plush cushioning. Experience spa-level comfort at home.</p>",
        availableForSale: true,
        seoTitle: "Luxury Spa Slide - D'FOOTPRINT",
        seoDescription: "Premium spa slides with plush comfort",
        tags: ["luxury", "spa", "slides", "featured"],
      },
    });

    console.log(`✅ Created 12 products`);

    // Create product options
    console.log("Creating product options...");
    await db.productOption.createMany({
      data: [
        // Product 1 - Classic Leather Slide
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
        // Product 2 - Luxury Velvet Slipper
        {
          productId: product2.id,
          name: "Size",
          values: ["38", "39", "40", "41", "42", "43"],
        },
        {
          productId: product2.id,
          name: "Color",
          values: ["Burgundy", "Navy", "Black"],
        },
        // Product 3 - Comfort Home Slipper
        {
          productId: product3.id,
          name: "Size",
          values: ["38", "39", "40", "41", "42", "43", "44", "45"],
        },
        {
          productId: product3.id,
          name: "Color",
          values: ["Grey", "Blue", "Brown"],
        },
        // Product 4 - Sport Slide Sandal
        {
          productId: product4.id,
          name: "Size",
          values: ["39", "40", "41", "42", "43", "44"],
        },
        {
          productId: product4.id,
          name: "Color",
          values: ["Black", "White", "Red"],
        },
        // Product 5 - Designer Embroidered Slipper
        {
          productId: product5.id,
          name: "Size",
          values: ["38", "39", "40", "41", "42"],
        },
        {
          productId: product5.id,
          name: "Color",
          values: ["Gold", "Silver", "Royal Blue"],
        },
        // Product 6 - Minimalist Black Slide
        {
          productId: product6.id,
          name: "Size",
          values: ["39", "40", "41", "42", "43", "44", "45"],
        },
      ],
    });

    console.log(`✅ Created product options`);

    // Create product variants
    console.log("Creating product variants...");
    await db.productVariant.createMany({
      data: [
        // Product 1 variants
        {
          productId: product1.id,
          title: "40 / Black",
          price: 12000.0,
          currencyCode: "NGN",
          availableForSale: true,
          selectedOptions: [
            { name: "Size", value: "40" },
            { name: "Color", value: "Black" },
          ],
        },
        {
          productId: product1.id,
          title: "41 / Black",
          price: 12000.0,
          currencyCode: "NGN",
          availableForSale: true,
          selectedOptions: [
            { name: "Size", value: "41" },
            { name: "Color", value: "Black" },
          ],
        },
        {
          productId: product1.id,
          title: "42 / Brown",
          price: 12000.0,
          currencyCode: "NGN",
          availableForSale: true,
          selectedOptions: [
            { name: "Size", value: "42" },
            { name: "Color", value: "Brown" },
          ],
        },
        // Product 2 variants
        {
          productId: product2.id,
          title: "40 / Burgundy",
          price: 15000.0,
          currencyCode: "NGN",
          availableForSale: true,
          selectedOptions: [
            { name: "Size", value: "40" },
            { name: "Color", value: "Burgundy" },
          ],
        },
        {
          productId: product2.id,
          title: "41 / Navy",
          price: 15000.0,
          currencyCode: "NGN",
          availableForSale: true,
          selectedOptions: [
            { name: "Size", value: "41" },
            { name: "Color", value: "Navy" },
          ],
        },
        // Product 3 variants
        {
          productId: product3.id,
          title: "40 / Grey",
          price: 8000.0,
          currencyCode: "NGN",
          availableForSale: true,
          selectedOptions: [
            { name: "Size", value: "40" },
            { name: "Color", value: "Grey" },
          ],
        },
        {
          productId: product3.id,
          title: "42 / Blue",
          price: 8000.0,
          currencyCode: "NGN",
          availableForSale: true,
          selectedOptions: [
            { name: "Size", value: "42" },
            { name: "Color", value: "Blue" },
          ],
        },
        // Product 4 variants
        {
          productId: product4.id,
          title: "41 / Black",
          price: 10000.0,
          currencyCode: "NGN",
          availableForSale: true,
          selectedOptions: [
            { name: "Size", value: "41" },
            { name: "Color", value: "Black" },
          ],
        },
        {
          productId: product4.id,
          title: "42 / White",
          price: 10000.0,
          currencyCode: "NGN",
          availableForSale: true,
          selectedOptions: [
            { name: "Size", value: "42" },
            { name: "Color", value: "White" },
          ],
        },
        // Product 5 variants
        {
          productId: product5.id,
          title: "39 / Gold",
          price: 18000.0,
          currencyCode: "NGN",
          availableForSale: true,
          selectedOptions: [
            { name: "Size", value: "39" },
            { name: "Color", value: "Gold" },
          ],
        },
        {
          productId: product5.id,
          title: "40 / Silver",
          price: 18000.0,
          currencyCode: "NGN",
          availableForSale: true,
          selectedOptions: [
            { name: "Size", value: "40" },
            { name: "Color", value: "Silver" },
          ],
        },
        // Product 6 variants
        {
          productId: product6.id,
          title: "41 / Black",
          price: 11000.0,
          currencyCode: "NGN",
          availableForSale: true,
          selectedOptions: [{ name: "Size", value: "41" }],
        },
        {
          productId: product6.id,
          title: "42 / Black",
          price: 11000.0,
          currencyCode: "NGN",
          availableForSale: true,
          selectedOptions: [{ name: "Size", value: "42" }],
        },
        // Simple variants for remaining products
        {
          productId: product7.id,
          title: "Default",
          price: 9500.0,
          currencyCode: "NGN",
          availableForSale: true,
          selectedOptions: [],
        },
        {
          productId: product8.id,
          title: "Default",
          price: 7500.0,
          currencyCode: "NGN",
          availableForSale: true,
          selectedOptions: [],
        },
        {
          productId: product9.id,
          title: "Default",
          price: 16000.0,
          currencyCode: "NGN",
          availableForSale: true,
          selectedOptions: [],
        },
        {
          productId: product10.id,
          title: "Default",
          price: 9000.0,
          currencyCode: "NGN",
          availableForSale: true,
          selectedOptions: [],
        },
        {
          productId: product11.id,
          title: "Default",
          price: 14000.0,
          currencyCode: "NGN",
          availableForSale: true,
          selectedOptions: [],
        },
        {
          productId: product12.id,
          title: "Default",
          price: 17000.0,
          currencyCode: "NGN",
          availableForSale: true,
          selectedOptions: [],
        },
      ],
    });

    console.log(`✅ Created product variants`);

    // Create product images (using Unsplash URLs)
    console.log("Creating product images...");
    await db.productImage.createMany({
      data: [
        // Product 1 - Classic Leather Slide (leather shoes)
        {
          productId: product1.id,
          url: "https://images.unsplash.com/photo-1603808033192-082d6919d3e1?w=800&h=800&fit=crop",
          altText: "Classic Leather Slide - Front View",
          width: 800,
          height: 800,
          position: 0,
          isFeatured: true,
        },
        {
          productId: product1.id,
          url: "https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=800&h=800&fit=crop",
          altText: "Classic Leather Slide - Side View",
          width: 800,
          height: 800,
          position: 1,
          isFeatured: false,
        },
        // Product 2 - Luxury Velvet Slipper
        {
          productId: product2.id,
          url: "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=800&h=800&fit=crop",
          altText: "Luxury Velvet Slipper",
          width: 800,
          height: 800,
          position: 0,
          isFeatured: true,
        },
        {
          productId: product2.id,
          url: "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800&h=800&fit=crop",
          altText: "Luxury Velvet Slipper Detail",
          width: 800,
          height: 800,
          position: 1,
          isFeatured: false,
        },
        // Product 3 - Comfort Home Slipper
        {
          productId: product3.id,
          url: "https://images.unsplash.com/photo-1631545805976-146c7bdacbe7?w=800&h=800&fit=crop",
          altText: "Comfort Home Slipper",
          width: 800,
          height: 800,
          position: 0,
          isFeatured: true,
        },
        {
          productId: product3.id,
          url: "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800&h=800&fit=crop",
          altText: "Comfort Home Slipper Detail",
          width: 800,
          height: 800,
          position: 1,
          isFeatured: false,
        },
        // Product 4 - Sport Slide Sandal
        {
          productId: product4.id,
          url: "https://images.unsplash.com/photo-1603808033192-082d6919d3e1?w=800&h=800&fit=crop",
          altText: "Sport Slide Sandal",
          width: 800,
          height: 800,
          position: 0,
          isFeatured: true,
        },
        {
          productId: product4.id,
          url: "https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=800&h=800&fit=crop",
          altText: "Sport Slide Sandal Side",
          width: 800,
          height: 800,
          position: 1,
          isFeatured: false,
        },
        // Product 5 - Designer Embroidered Slipper
        {
          productId: product5.id,
          url: "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800&h=800&fit=crop",
          altText: "Designer Embroidered Slipper",
          width: 800,
          height: 800,
          position: 0,
          isFeatured: true,
        },
        {
          productId: product5.id,
          url: "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=800&h=800&fit=crop",
          altText: "Designer Embroidered Slipper Detail",
          width: 800,
          height: 800,
          position: 1,
          isFeatured: false,
        },
        // Product 6 - Minimalist Black Slide
        {
          productId: product6.id,
          url: "https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=800&h=800&fit=crop",
          altText: "Minimalist Black Slide",
          width: 800,
          height: 800,
          position: 0,
          isFeatured: true,
        },
        {
          productId: product6.id,
          url: "https://images.unsplash.com/photo-1603808033192-082d6919d3e1?w=800&h=800&fit=crop",
          altText: "Minimalist Black Slide Detail",
          width: 800,
          height: 800,
          position: 1,
          isFeatured: false,
        },
        // Product 7 - Traditional Palm Slipper
        {
          productId: product7.id,
          url: "https://images.unsplash.com/photo-1631545805976-146c7bdacbe7?w=800&h=800&fit=crop",
          altText: "Traditional Palm Slipper",
          width: 800,
          height: 800,
          position: 0,
          isFeatured: true,
        },
        // Product 8 - Summer Beach Slide
        {
          productId: product8.id,
          url: "https://images.unsplash.com/photo-1603808033192-082d6919d3e1?w=800&h=800&fit=crop",
          altText: "Summer Beach Slide",
          width: 800,
          height: 800,
          position: 0,
          isFeatured: true,
        },
        {
          productId: product8.id,
          url: "https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=800&h=800&fit=crop",
          altText: "Summer Beach Slide Colors",
          width: 800,
          height: 800,
          position: 1,
          isFeatured: false,
        },
        // Product 9 - Premium Suede Slipper
        {
          productId: product9.id,
          url: "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=800&h=800&fit=crop",
          altText: "Premium Suede Slipper",
          width: 800,
          height: 800,
          position: 0,
          isFeatured: true,
        },
        {
          productId: product9.id,
          url: "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800&h=800&fit=crop",
          altText: "Premium Suede Slipper Detail",
          width: 800,
          height: 800,
          position: 1,
          isFeatured: false,
        },
        // Product 10 - Casual Everyday Slide
        {
          productId: product10.id,
          url: "https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=800&h=800&fit=crop",
          altText: "Casual Everyday Slide",
          width: 800,
          height: 800,
          position: 0,
          isFeatured: true,
        },
        // Product 11 - Orthopedic Comfort Slipper
        {
          productId: product11.id,
          url: "https://images.unsplash.com/photo-1631545805976-146c7bdacbe7?w=800&h=800&fit=crop",
          altText: "Orthopedic Comfort Slipper",
          width: 800,
          height: 800,
          position: 0,
          isFeatured: true,
        },
        {
          productId: product11.id,
          url: "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800&h=800&fit=crop",
          altText: "Orthopedic Comfort Slipper Side",
          width: 800,
          height: 800,
          position: 1,
          isFeatured: false,
        },
        // Product 12 - Luxury Spa Slide
        {
          productId: product12.id,
          url: "https://images.unsplash.com/photo-1603808033192-082d6919d3e1?w=800&h=800&fit=crop",
          altText: "Luxury Spa Slide",
          width: 800,
          height: 800,
          position: 0,
          isFeatured: true,
        },
        {
          productId: product12.id,
          url: "https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=800&h=800&fit=crop",
          altText: "Luxury Spa Slide Comfort",
          width: 800,
          height: 800,
          position: 1,
          isFeatured: false,
        },
      ],
    });

    console.log(`✅ Created product images`);

    // Get collections for product-collection relationships
    console.log("Linking products to collections...");
    const allCollection = await db.collection.findUnique({
      where: { handle: "all" },
    });
    const slippersCollection = await db.collection.findUnique({
      where: { handle: "slippers" },
    });
    const slidesCollection = await db.collection.findUnique({
      where: { handle: "slides" },
    });
    const featuredCollection = await db.collection.findUnique({
      where: { handle: "hidden-homepage-featured-items" },
    });
    const carouselCollection = await db.collection.findUnique({
      where: { handle: "hidden-homepage-carousel" },
    });

    // Create product-collection relationships
    await db.productCollection.createMany({
      data: [
        // All products go to "all" collection
        { productId: product1.id, collectionId: allCollection!.id, position: 0 },
        { productId: product2.id, collectionId: allCollection!.id, position: 1 },
        { productId: product3.id, collectionId: allCollection!.id, position: 2 },
        { productId: product4.id, collectionId: allCollection!.id, position: 3 },
        { productId: product5.id, collectionId: allCollection!.id, position: 4 },
        { productId: product6.id, collectionId: allCollection!.id, position: 5 },
        { productId: product7.id, collectionId: allCollection!.id, position: 6 },
        { productId: product8.id, collectionId: allCollection!.id, position: 7 },
        { productId: product9.id, collectionId: allCollection!.id, position: 8 },
        {
          productId: product10.id,
          collectionId: allCollection!.id,
          position: 9,
        },
        {
          productId: product11.id,
          collectionId: allCollection!.id,
          position: 10,
        },
        {
          productId: product12.id,
          collectionId: allCollection!.id,
          position: 11,
        },

        // Slippers to slippers collection
        {
          productId: product2.id,
          collectionId: slippersCollection!.id,
          position: 0,
        },
        {
          productId: product3.id,
          collectionId: slippersCollection!.id,
          position: 1,
        },
        {
          productId: product5.id,
          collectionId: slippersCollection!.id,
          position: 2,
        },
        {
          productId: product7.id,
          collectionId: slippersCollection!.id,
          position: 3,
        },
        {
          productId: product9.id,
          collectionId: slippersCollection!.id,
          position: 4,
        },
        {
          productId: product11.id,
          collectionId: slippersCollection!.id,
          position: 5,
        },

        // Slides to slides collection
        {
          productId: product1.id,
          collectionId: slidesCollection!.id,
          position: 0,
        },
        {
          productId: product4.id,
          collectionId: slidesCollection!.id,
          position: 1,
        },
        {
          productId: product6.id,
          collectionId: slidesCollection!.id,
          position: 2,
        },
        {
          productId: product8.id,
          collectionId: slidesCollection!.id,
          position: 3,
        },
        {
          productId: product10.id,
          collectionId: slidesCollection!.id,
          position: 4,
        },
        {
          productId: product12.id,
          collectionId: slidesCollection!.id,
          position: 5,
        },

        // Featured items for homepage hero (3 items)
        {
          productId: product1.id,
          collectionId: featuredCollection!.id,
          position: 0,
        },
        {
          productId: product5.id,
          collectionId: featuredCollection!.id,
          position: 1,
        },
        {
          productId: product8.id,
          collectionId: featuredCollection!.id,
          position: 2,
        },

        // Carousel items (all featured and bestseller products)
        {
          productId: product1.id,
          collectionId: carouselCollection!.id,
          position: 0,
        },
        {
          productId: product2.id,
          collectionId: carouselCollection!.id,
          position: 1,
        },
        {
          productId: product5.id,
          collectionId: carouselCollection!.id,
          position: 2,
        },
        {
          productId: product6.id,
          collectionId: carouselCollection!.id,
          position: 3,
        },
        {
          productId: product8.id,
          collectionId: carouselCollection!.id,
          position: 4,
        },
        {
          productId: product11.id,
          collectionId: carouselCollection!.id,
          position: 5,
        },
        {
          productId: product12.id,
          collectionId: carouselCollection!.id,
          position: 6,
        },
      ],
    });

    console.log(`✅ Linked products to collections`);

    // Create pages
    console.log("Creating pages...");
    await db.page.createMany({
      data: [
        {
          handle: "about",
          title: "About D'FOOTPRINT",
          body: "D'FOOTPRINT is a handmade footwear brand specializing in slippers, slides, and other custom footwear. Based in Lagos, Nigeria, we deliver nationwide.",
          bodySummary: "Learn more about D'FOOTPRINT",
          seoTitle: "About Us - D'FOOTPRINT",
          seoDescription:
            "Discover the story behind D'FOOTPRINT handmade footwear",
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
      ],
    });

    console.log(`✅ Created pages`);

    // Create menus
    console.log("Creating menus...");
    const mainMenu = await db.menu.create({
      data: {
        handle: "main-menu",
        title: "Main Menu",
      },
    });

    const footerMenu = await db.menu.create({
      data: {
        handle: "footer-menu",
        title: "Footer Menu",
      },
    });

    await db.menuItem.createMany({
      data: [
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
      ],
    });

    console.log(`✅ Created menus and menu items`);

    console.log("✨ Seeding completed successfully!");
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    throw error;
  } finally {
    await db.$disconnect();
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
