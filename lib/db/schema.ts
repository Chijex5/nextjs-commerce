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
  uniqueIndex,
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
    seoTitle: varchar("seo_title", { length: 255 }),
    seoDescription: text("seo_description"),
    tags: text("tags").array().default([]),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    handleIdx: index("products_handle_idx").on(table.handle),
    tagsIdx: index("products_tags_idx").on(table.tags),
  }),
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
    selectedOptions: jsonb("selected_options").default([]).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    productIdIdx: index("product_variants_product_id_idx").on(table.productId),
  }),
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
  }),
);

// Collections (categories)
export const collections = pgTable(
  "collections",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    handle: varchar("handle", { length: 255 }).notNull().unique(),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    seoTitle: varchar("seo_title", { length: 255 }),
    seoDescription: text("seo_description"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    handleIdx: index("collections_handle_idx").on(table.handle),
  }),
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
      table.productId,
    ),
    collectionIdIdx: index("product_collections_collection_id_idx").on(
      table.collectionId,
    ),
  }),
);

// Carts table
export const carts = pgTable("carts", {
  id: uuid("id").primaryKey().defaultRandom(),
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
  }),
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
    seoTitle: varchar("seo_title", { length: 255 }),
    seoDescription: text("seo_description"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    handleIdx: index("pages_handle_idx").on(table.handle),
  }),
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
  }),
);

// Custom order showcase entries
export const customOrderShowcases = pgTable(
  "custom_orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: varchar("title", { length: 255 }).notNull(),
    customerStory: text("customer_story"),
    beforeImage: text("before_image"),
    afterImage: text("after_image"),
    details: jsonb("details"),
    completionTime: varchar("completion_time", { length: 100 }),
    position: integer("position").default(0).notNull(),
    isPublished: boolean("is_published").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    isPublishedIdx: index("custom_orders_is_published_idx").on(
      table.isPublished,
    ),
    positionIdx: index("custom_orders_position_idx").on(table.position),
  }),
);

// Backward-compatible alias used across existing showcase pages/components.
export const customOrders = customOrderShowcases;

// Customer custom-order requests (quote-first workflow)
export const customOrderRequests = pgTable(
  "custom_order_requests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    requestNumber: varchar("request_number", { length: 50 }).notNull().unique(),
    userId: uuid("user_id"),
    email: varchar("email", { length: 255 }).notNull(),
    phone: varchar("phone", { length: 50 }),
    customerName: varchar("customer_name", { length: 255 }).notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description").notNull(),
    sizeNotes: text("size_notes"),
    colorPreferences: text("color_preferences"),
    budgetMin: decimal("budget_min", { precision: 10, scale: 2 }),
    budgetMax: decimal("budget_max", { precision: 10, scale: 2 }),
    desiredDate: timestamp("desired_date"),
    referenceImages: jsonb("reference_images").default([]).notNull(),
    status: varchar("status", { length: 50 }).default("submitted").notNull(),
    adminNotes: text("admin_notes"),
    customerNotes: text("customer_notes"),
    quotedAmount: decimal("quoted_amount", { precision: 10, scale: 2 }),
    currencyCode: varchar("currency_code", { length: 3 })
      .default("NGN")
      .notNull(),
    quoteExpiresAt: timestamp("quote_expires_at"),
    paidAt: timestamp("paid_at"),
    convertedOrderId: uuid("converted_order_id"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    requestNumberIdx: index("custom_order_requests_request_number_idx").on(
      table.requestNumber,
    ),
    userIdIdx: index("custom_order_requests_user_id_idx").on(table.userId),
    emailIdx: index("custom_order_requests_email_idx").on(table.email),
    statusIdx: index("custom_order_requests_status_idx").on(table.status),
    updatedAtIdx: index("custom_order_requests_updated_at_idx").on(
      table.updatedAt,
    ),
    convertedOrderUniqueIdx: uniqueIndex(
      "custom_order_requests_converted_order_unique",
    ).on(table.convertedOrderId),
  }),
);

// Quote history/versioning for custom-order requests
export const customOrderQuotes = pgTable(
  "custom_order_quotes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    requestId: uuid("request_id")
      .references(() => customOrderRequests.id, { onDelete: "cascade" })
      .notNull(),
    version: integer("version").default(1).notNull(),
    amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
    currencyCode: varchar("currency_code", { length: 3 })
      .default("NGN")
      .notNull(),
    breakdown: jsonb("breakdown").default({}).notNull(),
    note: text("note"),
    status: varchar("status", { length: 50 }).default("sent").notNull(),
    expiresAt: timestamp("expires_at"),
    reminderCount: integer("reminder_count").default(0).notNull(),
    lastReminderAt: timestamp("last_reminder_at"),
    expiredNotificationSentAt: timestamp("expired_notification_sent_at"),
    createdBy: varchar("created_by", { length: 255 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    requestIdIdx: index("custom_order_quotes_request_id_idx").on(table.requestId),
    statusIdx: index("custom_order_quotes_status_idx").on(table.status),
    expiresAtIdx: index("custom_order_quotes_expires_at_idx").on(table.expiresAt),
    reminderCountIdx: index("custom_order_quotes_reminder_count_idx").on(
      table.reminderCount,
    ),
    requestVersionUniqueIdx: uniqueIndex(
      "custom_order_quotes_request_version_unique",
    ).on(table.requestId, table.version),
  }),
);

// Secure one-time quote-access tokens for guest/custom flows
export const customOrderQuoteTokens = pgTable(
  "custom_order_quote_tokens",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    quoteId: uuid("quote_id")
      .references(() => customOrderQuotes.id, { onDelete: "cascade" })
      .notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    tokenHash: text("token_hash").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    usedAt: timestamp("used_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    quoteIdIdx: index("custom_order_quote_tokens_quote_id_idx").on(table.quoteId),
    emailIdx: index("custom_order_quote_tokens_email_idx").on(table.email),
    expiresAtIdx: index("custom_order_quote_tokens_expires_at_idx").on(
      table.expiresAt,
    ),
  }),
);

// Admin users for dashboard access
export const adminUsers = pgTable(
  "admin_users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    name: varchar("name", { length: 255 }),
    passwordHash: text("password_hash").notNull(),
    role: varchar("role", { length: 50 }).default("admin").notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    lastLoginAt: timestamp("last_login_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    emailIdx: index("admin_users_email_idx").on(table.email),
  }),
);

// Customer users for shopping
export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    name: varchar("name", { length: 255 }),
    passwordHash: text("password_hash").notNull(),
    phone: varchar("phone", { length: 50 }),
    shippingAddress: jsonb("shipping_address"),
    billingAddress: jsonb("billing_address"),
    isActive: boolean("is_active").default(true).notNull(),
    lastLoginAt: timestamp("last_login_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    emailIdx: index("users_email_idx").on(table.email),
  }),
);

// Orders for tracking purchases
export const orders = pgTable(
  "orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").references(() => users.id),
    orderNumber: varchar("order_number", { length: 50 }).notNull().unique(),
    email: varchar("email", { length: 255 }).notNull(),
    phone: varchar("phone", { length: 50 }),
    customerName: varchar("customer_name", { length: 255 }).notNull(),
    shippingAddress: jsonb("shipping_address").notNull(),
    billingAddress: jsonb("billing_address"),
    status: varchar("status", { length: 50 }).default("pending").notNull(),
    deliveryStatus: varchar("delivery_status", { length: 50 })
      .default("production")
      .notNull(),
    estimatedArrival: timestamp("estimated_arrival"),
    subtotalAmount: decimal("subtotal_amount", { precision: 10, scale: 2 })
      .notNull(),
    taxAmount: decimal("tax_amount", { precision: 10, scale: 2 })
      .default("0.00")
      .notNull(),
    shippingAmount: decimal("shipping_amount", { precision: 10, scale: 2 })
      .default("0.00")
      .notNull(),
    discountAmount: decimal("discount_amount", { precision: 10, scale: 2 })
      .default("0.00")
      .notNull(),
    couponCode: varchar("coupon_code", { length: 50 }),
    totalAmount: decimal("total_amount", { precision: 10, scale: 2 })
      .notNull(),
    currencyCode: varchar("currency_code", { length: 3 })
      .default("NGN")
      .notNull(),
    notes: text("notes"),
    trackingNumber: varchar("tracking_number", { length: 100 }),
    acknowledgedAt: timestamp("acknowledged_at"),
    acknowledgedBy: varchar("acknowledged_by", { length: 255 }),
    orderType: varchar("order_type", { length: 20 })
      .default("catalog")
      .notNull(),
    customOrderRequestId: uuid("custom_order_request_id").references(
      () => customOrderRequests.id,
    ),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    orderNumberIdx: index("orders_order_number_idx").on(table.orderNumber),
    userIdIdx: index("orders_user_id_idx").on(table.userId),
    emailIdx: index("orders_email_idx").on(table.email),
    statusIdx: index("orders_status_idx").on(table.status),
    deliveryStatusIdx: index("orders_delivery_status_idx").on(
      table.deliveryStatus,
    ),
    orderTypeIdx: index("orders_order_type_idx").on(table.orderType),
    customOrderRequestIdIdx: index("orders_custom_order_request_id_idx").on(
      table.customOrderRequestId,
    ),
    customOrderRequestUniqueIdx: uniqueIndex(
      "orders_custom_order_request_unique",
    ).on(table.customOrderRequestId),
  }),
);

// Order items
export const orderItems = pgTable(
  "order_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .references(() => orders.id, { onDelete: "cascade" })
      .notNull(),
    productId: uuid("product_id").notNull(),
    productVariantId: uuid("product_variant_id").notNull(),
    productTitle: varchar("product_title", { length: 255 }).notNull(),
    variantTitle: varchar("variant_title", { length: 255 }).notNull(),
    quantity: integer("quantity").notNull(),
    price: decimal("price", { precision: 10, scale: 2 }).notNull(),
    totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
    currencyCode: varchar("currency_code", { length: 3 })
      .default("NGN")
      .notNull(),
    productImage: text("product_image"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    orderIdIdx: index("order_items_order_id_idx").on(table.orderId),
  }),
);

// Newsletter subscribers
export const newsletterSubscribers = pgTable(
  "newsletter_subscribers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    name: varchar("name", { length: 255 }),
    status: varchar("status", { length: 50 }).default("active").notNull(),
    subscribedAt: timestamp("subscribed_at").defaultNow().notNull(),
    unsubscribedAt: timestamp("unsubscribed_at"),
  },
  (table) => ({
    emailIdx: index("newsletter_subscribers_email_idx").on(table.email),
    statusIdx: index("newsletter_subscribers_status_idx").on(table.status),
  }),
);

// Magic link login tokens
export const magicLinkTokens = pgTable(
  "magic_link_tokens",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: varchar("email", { length: 255 }).notNull(),
    tokenHash: text("token_hash").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    usedAt: timestamp("used_at"),
  },
  (table) => ({
    emailIdx: index("magic_link_tokens_email_idx").on(table.email),
    expiresAtIdx: index("magic_link_tokens_expires_at_idx").on(table.expiresAt),
  }),
);

// Abandoned cart tracking for logged-in users
export const abandonedCarts = pgTable(
  "abandoned_carts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    cartId: uuid("cart_id").notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    customerName: varchar("customer_name", { length: 255 }).notNull(),
    cartTotal: decimal("cart_total", { precision: 10, scale: 2 }).notNull(),
    items: jsonb("items").notNull(),
    emailSent: boolean("email_sent").default(false).notNull(),
    emailSentAt: timestamp("email_sent_at"),
    recovered: boolean("recovered").default(false).notNull(),
    recoveredAt: timestamp("recovered_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    expiresAt: timestamp("expires_at").notNull(),
  },
  (table) => ({
    userIdIdx: index("abandoned_carts_user_id_idx").on(table.userId),
    emailSentIdx: index("abandoned_carts_email_sent_idx").on(table.emailSent),
    expiresAtIdx: index("abandoned_carts_expires_at_idx").on(table.expiresAt),
  }),
);

// Product reviews
export const reviews = pgTable(
  "reviews",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    productId: uuid("product_id")
      .references(() => products.id, { onDelete: "cascade" })
      .notNull(),
    userId: uuid("user_id").references(() => users.id),
    orderId: uuid("order_id"),
    rating: integer("rating").notNull(),
    title: varchar("title", { length: 255 }),
    comment: text("comment"),
    images: text("images").array().default([]),
    isVerified: boolean("is_verified").default(false).notNull(),
    helpfulCount: integer("helpful_count").default(0).notNull(),
    status: varchar("status", { length: 50 }).default("pending").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    productIdIdx: index("reviews_product_id_idx").on(table.productId),
    userIdIdx: index("reviews_user_id_idx").on(table.userId),
    statusIdx: index("reviews_status_idx").on(table.status),
    ratingIdx: index("reviews_rating_idx").on(table.rating),
  }),
);

// Review helpful votes
export const reviewVotes = pgTable(
  "review_votes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    reviewId: uuid("review_id")
      .references(() => reviews.id, { onDelete: "cascade" })
      .notNull(),
    userId: uuid("user_id")
      .references(() => users.id)
      .notNull(),
    isHelpful: boolean("is_helpful").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    reviewIdIdx: index("review_votes_review_id_idx").on(table.reviewId),
    uniqueReviewUser: uniqueIndex("review_vote_unique").on(
      table.reviewId,
      table.userId,
    ),
  }),
);

// Customer testimonials for homepage
export const testimonials = pgTable(
  "testimonials",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    customerName: varchar("customer_name", { length: 255 }).notNull(),
    role: varchar("role", { length: 255 }),
    content: text("content").notNull(),
    rating: integer("rating").notNull(),
    image: text("image"),
    isActive: boolean("is_active").default(true).notNull(),
    position: integer("position").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    isActiveIdx: index("testimonials_is_active_idx").on(table.isActive),
    positionIdx: index("testimonials_position_idx").on(table.position),
  }),
);

// Size guides for different product types
export const sizeGuides = pgTable(
  "size_guides",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    productType: varchar("product_type", { length: 100 }).notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    sizesChart: jsonb("sizes_chart").notNull(),
    measurements: jsonb("measurements").notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    productTypeIdx: index("size_guides_product_type_idx").on(table.productType),
  }),
);

// Discount coupons for marketing campaigns
export const coupons = pgTable(
  "coupons",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    code: varchar("code", { length: 50 }).notNull().unique(),
    description: text("description"),
    discountType: varchar("discount_type", { length: 20 }).notNull(),
    discountValue: decimal("discount_value", { precision: 10, scale: 2 })
      .notNull(),
    minOrderValue: decimal("min_order_value", { precision: 10, scale: 2 }),
    maxUses: integer("max_uses"),
    usedCount: integer("used_count").default(0).notNull(),
    maxUsesPerUser: integer("max_uses_per_user"),
    requiresLogin: boolean("requires_login").default(false).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    startDate: timestamp("start_date"),
    expiryDate: timestamp("expiry_date"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    codeIdx: index("coupons_code_idx").on(table.code),
    isActiveIdx: index("coupons_is_active_idx").on(table.isActive),
  }),
);

// Track coupon usage per user for per-customer limits
export const couponUsages = pgTable(
  "coupon_usage",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    couponId: uuid("coupon_id")
      .references(() => coupons.id, { onDelete: "cascade" })
      .notNull(),
    userId: uuid("user_id"),
    sessionId: varchar("session_id", { length: 255 }),
    usedAt: timestamp("used_at").defaultNow().notNull(),
  },
  (table) => ({
    couponIdIdx: index("coupon_usage_coupon_id_idx").on(table.couponId),
    userIdIdx: index("coupon_usage_user_id_idx").on(table.userId),
    sessionIdIdx: index("coupon_usage_session_id_idx").on(table.sessionId),
  }),
);

// Relations
export const productsRelations = relations(products, ({ many }) => ({
  variants: many(productVariants),
  images: many(productImages),
  options: many(productOptions),
  productCollections: many(productCollections),
  reviews: many(reviews),
}));

export const productVariantsRelations = relations(
  productVariants,
  ({ one, many }) => ({
    product: one(products, {
      fields: [productVariants.productId],
      references: [products.id],
    }),
    cartLines: many(cartLines),
  }),
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
  }),
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

export const usersRelations = relations(users, ({ many }) => ({
  orders: many(orders),
  customOrderRequests: many(customOrderRequests),
  abandonedCarts: many(abandonedCarts),
  reviews: many(reviews),
  reviewVotes: many(reviewVotes),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, {
    fields: [orders.userId],
    references: [users.id],
  }),
  customOrderRequest: one(customOrderRequests, {
    fields: [orders.customOrderRequestId],
    references: [customOrderRequests.id],
  }),
  items: many(orderItems),
}));

export const customOrderRequestsRelations = relations(
  customOrderRequests,
  ({ one, many }) => ({
    user: one(users, {
      fields: [customOrderRequests.userId],
      references: [users.id],
    }),
    quotes: many(customOrderQuotes),
    orders: many(orders),
  }),
);

export const customOrderQuotesRelations = relations(
  customOrderQuotes,
  ({ one, many }) => ({
    request: one(customOrderRequests, {
      fields: [customOrderQuotes.requestId],
      references: [customOrderRequests.id],
    }),
    tokens: many(customOrderQuoteTokens),
  }),
);

export const customOrderQuoteTokensRelations = relations(
  customOrderQuoteTokens,
  ({ one }) => ({
    quote: one(customOrderQuotes, {
      fields: [customOrderQuoteTokens.quoteId],
      references: [customOrderQuotes.id],
    }),
  }),
);

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
}));

export const reviewsRelations = relations(reviews, ({ one, many }) => ({
  product: one(products, {
    fields: [reviews.productId],
    references: [products.id],
  }),
  user: one(users, {
    fields: [reviews.userId],
    references: [users.id],
  }),
  votes: many(reviewVotes),
}));

export const reviewVotesRelations = relations(reviewVotes, ({ one }) => ({
  review: one(reviews, {
    fields: [reviewVotes.reviewId],
    references: [reviews.id],
  }),
  user: one(users, {
    fields: [reviewVotes.userId],
    references: [users.id],
  }),
}));

export const abandonedCartsRelations = relations(abandonedCarts, ({ one }) => ({
  user: one(users, {
    fields: [abandonedCarts.userId],
    references: [users.id],
  }),
}));

export const couponUsagesRelations = relations(couponUsages, ({ one }) => ({
  coupon: one(coupons, {
    fields: [couponUsages.couponId],
    references: [coupons.id],
  }),
}));
