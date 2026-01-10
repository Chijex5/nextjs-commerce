import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  decimal,
  integer,
  boolean,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Products table - stores the main product information
export const products = pgTable(
  "products",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    handle: varchar("handle", { length: 255 }).notNull().unique(),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    descriptionHtml: text("description_html"),
    availableForSale: boolean("available_for_sale").default(true).notNull(),
    // SEO fields
    seoTitle: varchar("seo_title", { length: 255 }),
    seoDescription: text("seo_description"),
    // Metadata
    tags: text("tags").array().default([]),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    handleIdx: index("products_handle_idx").on(table.handle),
    tagsIdx: index("products_tags_idx").on(table.tags),
  })
);

// Product variants - stores size, color, and other variant options
export const productVariants = pgTable(
  "product_variants",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    productId: uuid("product_id")
      .references(() => products.id, { onDelete: "cascade" })
      .notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    price: decimal("price", { precision: 10, scale: 2 }).notNull(),
    currencyCode: varchar("currency_code", { length: 3 })
      .default("NGN")
      .notNull(),
    availableForSale: boolean("available_for_sale").default(true).notNull(),
    // Store selected options as JSON for flexibility
    selectedOptions: jsonb("selected_options").default([]).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    productIdIdx: index("product_variants_product_id_idx").on(table.productId),
  })
);

// Product options - stores available options like "Size", "Color"
export const productOptions = pgTable("product_options", {
  id: uuid("id").primaryKey().defaultRandom(),
  productId: uuid("product_id")
    .references(() => products.id, { onDelete: "cascade" })
    .notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  values: text("values").array().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Product images
export const productImages = pgTable(
  "product_images",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    productId: uuid("product_id")
      .references(() => products.id, { onDelete: "cascade" })
      .notNull(),
    url: text("url").notNull(),
    altText: varchar("alt_text", { length: 255 }),
    width: integer("width"),
    height: integer("height"),
    position: integer("position").default(0).notNull(),
    isFeatured: boolean("is_featured").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    productIdIdx: index("product_images_product_id_idx").on(table.productId),
    positionIdx: index("product_images_position_idx").on(table.position),
  })
);

// Collections (categories)
export const collections = pgTable(
  "collections",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    handle: varchar("handle", { length: 255 }).notNull().unique(),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    // SEO fields
    seoTitle: varchar("seo_title", { length: 255 }),
    seoDescription: text("seo_description"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    handleIdx: index("collections_handle_idx").on(table.handle),
  })
);

// Many-to-many relationship between products and collections
export const productCollections = pgTable(
  "product_collections",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    productId: uuid("product_id")
      .references(() => products.id, { onDelete: "cascade" })
      .notNull(),
    collectionId: uuid("collection_id")
      .references(() => collections.id, { onDelete: "cascade" })
      .notNull(),
    position: integer("position").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    productIdIdx: index("product_collections_product_id_idx").on(
      table.productId
    ),
    collectionIdIdx: index("product_collections_collection_id_idx").on(
      table.collectionId
    ),
  })
);

// Carts table
export const carts = pgTable("carts", {
  id: uuid("id").primaryKey().defaultRandom(),
  // Store checkout URL or session info
  checkoutUrl: text("checkout_url"),
  totalQuantity: integer("total_quantity").default(0).notNull(),
  subtotalAmount: decimal("subtotal_amount", { precision: 10, scale: 2 })
    .default("0.00")
    .notNull(),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 })
    .default("0.00")
    .notNull(),
  totalTaxAmount: decimal("total_tax_amount", { precision: 10, scale: 2 })
    .default("0.00")
    .notNull(),
  currencyCode: varchar("currency_code", { length: 3 })
    .default("NGN")
    .notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Cart lines (items in cart)
export const cartLines = pgTable(
  "cart_lines",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    cartId: uuid("cart_id")
      .references(() => carts.id, { onDelete: "cascade" })
      .notNull(),
    productVariantId: uuid("product_variant_id")
      .references(() => productVariants.id)
      .notNull(),
    quantity: integer("quantity").default(1).notNull(),
    totalAmount: decimal("total_amount", { precision: 10, scale: 2 })
      .default("0.00")
      .notNull(),
    currencyCode: varchar("currency_code", { length: 3 })
      .default("NGN")
      .notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    cartIdIdx: index("cart_lines_cart_id_idx").on(table.cartId),
    variantIdIdx: index("cart_lines_variant_id_idx").on(table.productVariantId),
  })
);

// Pages table for static content
export const pages = pgTable(
  "pages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    handle: varchar("handle", { length: 255 }).notNull().unique(),
    title: varchar("title", { length: 255 }).notNull(),
    body: text("body"),
    bodySummary: text("body_summary"),
    // SEO fields
    seoTitle: varchar("seo_title", { length: 255 }),
    seoDescription: text("seo_description"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    handleIdx: index("pages_handle_idx").on(table.handle),
  })
);

// Menus for navigation
export const menus = pgTable("menus", {
  id: uuid("id").primaryKey().defaultRandom(),
  handle: varchar("handle", { length: 255 }).notNull().unique(),
  title: varchar("title", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Menu items
export const menuItems = pgTable(
  "menu_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    menuId: uuid("menu_id")
      .references(() => menus.id, { onDelete: "cascade" })
      .notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    url: text("url").notNull(),
    position: integer("position").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    menuIdIdx: index("menu_items_menu_id_idx").on(table.menuId),
    positionIdx: index("menu_items_position_idx").on(table.position),
  })
);

// Define relations for better querying with Drizzle
export const productsRelations = relations(products, ({ many }) => ({
  variants: many(productVariants),
  images: many(productImages),
  options: many(productOptions),
  productCollections: many(productCollections),
}));

export const productVariantsRelations = relations(
  productVariants,
  ({ one }) => ({
    product: one(products, {
      fields: [productVariants.productId],
      references: [products.id],
    }),
  })
);

export const productImagesRelations = relations(productImages, ({ one }) => ({
  product: one(products, {
    fields: [productImages.productId],
    references: [products.id],
  }),
}));

export const productOptionsRelations = relations(productOptions, ({ one }) => ({
  product: one(products, {
    fields: [productOptions.productId],
    references: [products.id],
  }),
}));

export const collectionsRelations = relations(collections, ({ many }) => ({
  productCollections: many(productCollections),
}));

export const productCollectionsRelations = relations(
  productCollections,
  ({ one }) => ({
    product: one(products, {
      fields: [productCollections.productId],
      references: [products.id],
    }),
    collection: one(collections, {
      fields: [productCollections.collectionId],
      references: [collections.id],
    }),
  })
);

export const cartsRelations = relations(carts, ({ many }) => ({
  lines: many(cartLines),
}));

export const cartLinesRelations = relations(cartLines, ({ one }) => ({
  cart: one(carts, {
    fields: [cartLines.cartId],
    references: [carts.id],
  }),
  variant: one(productVariants, {
    fields: [cartLines.productVariantId],
    references: [productVariants.id],
  }),
}));

export const menusRelations = relations(menus, ({ many }) => ({
  items: many(menuItems),
}));

export const menuItemsRelations = relations(menuItems, ({ one }) => ({
  menu: one(menus, {
    fields: [menuItems.menuId],
    references: [menus.id],
  }),
}));
