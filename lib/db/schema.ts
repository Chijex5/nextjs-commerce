import { relations, sql } from "drizzle-orm";
import {
  type AnyPgColumn,
  boolean,
  check,
  decimal,
  index,
  integer,
  jsonb,
  pgSequence,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import {
  ADMIN_ROLE_VALUES,
  CAMPAIGN_LOG_STATUSES,
  CAMPAIGN_STATUSES,
  CAMPAIGN_TYPES,
  CUSTOM_MESSAGE_AUTHORS,
  CUSTOM_REQUEST_KINDS,
  CUSTOM_REQUEST_STATUSES,
  DELIVERY_STATUSES,
  DISCOUNT_TYPES,
  FLOW_KEYS,
  FLOW_LOG_STATUSES,
  MERCHANT_SYNC_STATUSES,
  NEWSLETTER_SOURCES,
  NEWSLETTER_STATUSES,
  ORDER_STATUSES,
  ORDER_TYPES,
  OTP_PURPOSES,
  PAYMENT_PROVIDERS,
  PAYMENT_SOURCES,
  PAYMENT_STATUSES,
  QUOTE_STATUSES,
  REVIEW_STATUSES,
} from "./enums";

/** CHECK expression: column holds one of `values` (lists in ./enums.ts). */
const oneOf = (column: AnyPgColumn, values: readonly string[]) =>
  sql`${column} in (${sql.raw(values.map((v) => `'${v}'`).join(", "))})`;

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
    /**
     * Typical days to make a made-to-order pair (null = the shop default).
     * Most products are made to order; see product_variants.track_inventory
     * for the ones kept in stock.
     */
    productionDays: integer("production_days"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    tagsIdx: index("products_tags_idx").using("gin", table.tags),
    createdAtIdx: index("products_created_at_idx").on(table.createdAt),
    productionDaysCheck: check(
      "products_production_days_check",
      sql`${table.productionDays} is null or ${table.productionDays} >= 0`,
    ),
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
    /**
     * Off (default) = made to order, never sells out. On = sold from stock:
     * stock_quantity is decremented on purchase and the variant can't be
     * bought past zero.
     */
    trackInventory: boolean("track_inventory").default(false).notNull(),
    stockQuantity: integer("stock_quantity"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    productIdIdx: index("product_variants_product_id_idx").on(table.productId),
    priceCheck: check("product_variants_price_check", sql`${table.price} >= 0`),
    stockCheck: check(
      "product_variants_stock_check",
      sql`(not ${table.trackInventory} or ${table.stockQuantity} is not null) and (${table.stockQuantity} is null or ${table.stockQuantity} >= 0)`,
    ),
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
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
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
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    productIdIdx: index("product_images_product_id_idx").on(table.productId),
    positionIdx: index("product_images_position_idx").on(table.position),
  }),
);

// Collections (categories)
export const collections = pgTable("collections", {
  id: uuid("id").primaryKey().defaultRandom(),
  handle: varchar("handle", { length: 255 }).notNull().unique(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  seoTitle: varchar("seo_title", { length: 255 }),
  seoDescription: text("seo_description"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

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
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
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
export const carts = pgTable(
  "carts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sessionId: varchar("session_id", { length: 255 }).notNull(),
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
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
  },
  (table) => ({
    sessionIdIdx: uniqueIndex("carts_session_id_unique").on(table.sessionId),
  }),
);
// Cart lines (items in cart)
export const cartLines = pgTable(
  "cart_lines",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    cartId: uuid("cart_id")
      .references(() => carts.id, { onDelete: "cascade" })
      .notNull(),
    productVariantId: uuid("product_variant_id")
      .references(() => productVariants.id, { onDelete: "cascade" })
      .notNull(),
    quantity: integer("quantity").default(1).notNull(),
    totalAmount: decimal("total_amount", { precision: 10, scale: 2 })
      .default("0.00")
      .notNull(),
    currencyCode: varchar("currency_code", { length: 3 })
      .default("NGN")
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    cartIdIdx: index("cart_lines_cart_id_idx").on(table.cartId),
    variantIdIdx: index("cart_lines_variant_id_idx").on(table.productVariantId),
    quantityCheck: check(
      "cart_lines_quantity_check",
      sql`${table.quantity} > 0`,
    ),
  }),
);

// Pages table for static content
export const pages = pgTable("pages", {
  id: uuid("id").primaryKey().defaultRandom(),
  handle: varchar("handle", { length: 255 }).notNull().unique(),
  title: varchar("title", { length: 255 }).notNull(),
  body: text("body"),
  bodySummary: text("body_summary"),
  seoTitle: varchar("seo_title", { length: 255 }),
  seoDescription: text("seo_description"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// Menus for navigation
export const menus = pgTable("menus", {
  id: uuid("id").primaryKey().defaultRandom(),
  handle: varchar("handle", { length: 255 }).notNull().unique(),
  title: varchar("title", { length: 255 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
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
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
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
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
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
    userId: uuid("user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    email: varchar("email", { length: 255 }).notNull(),
    phone: varchar("phone", { length: 50 }),
    customerName: varchar("customer_name", { length: 255 }).notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description").notNull(),
    sizeNotes: text("size_notes"),
    colorPreferences: text("color_preferences"),
    budgetMin: decimal("budget_min", { precision: 10, scale: 2 }),
    budgetMax: decimal("budget_max", { precision: 10, scale: 2 }),
    desiredDate: timestamp("desired_date", { withTimezone: true }),
    referenceImages: jsonb("reference_images").default([]).notNull(),
    /** modify | recreate | new — see CUSTOM_REQUEST_KINDS. */
    kind: varchar("kind", { length: 20 }).default("new").notNull(),
    /** The design being changed, for kind = modify. */
    baseProductId: uuid("base_product_id").references(() => products.id, {
      onDelete: "set null",
    }),
    /** Snapshot of the chosen edit-menu items: [{ id, name, price, detail? }]. */
    edits: jsonb("edits").default([]).notNull(),
    /** Price worked out from the base design + edit menu, when it can be. */
    estimateAmount: decimal("estimate_amount", { precision: 10, scale: 2 }),
    sizeEu: integer("size_eu"),
    pairs: integer("pairs").default(1).notNull(),
    footLengthCm: decimal("foot_length_cm", { precision: 4, scale: 1 }),
    budgetBand: varchar("budget_band", { length: 20 }),
    deadlineKind: varchar("deadline_kind", { length: 20 }),
    /** TikTok / Instagram / Pinterest links the customer pasted. */
    referenceLinks: jsonb("reference_links").default([]).notNull(),
    /** Where to deliver, given when the customer first pays. */
    deliveryAddress: jsonb("delivery_address"),
    status: varchar("status", { length: 50 }).default("submitted").notNull(),
    adminNotes: text("admin_notes"),
    customerNotes: text("customer_notes"),
    quotedAmount: decimal("quoted_amount", { precision: 10, scale: 2 }),
    currencyCode: varchar("currency_code", { length: 3 })
      .default("NGN")
      .notNull(),
    quoteExpiresAt: timestamp("quote_expires_at", { withTimezone: true }),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    convertedOrderId: uuid("converted_order_id").references(
      (): AnyPgColumn => orders.id,
      { onDelete: "set null" },
    ),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    userIdIdx: index("custom_order_requests_user_id_idx").on(table.userId),
    emailIdx: index("custom_order_requests_email_lower_idx").on(
      sql`lower(${table.email})`,
    ),
    createdAtIdx: index("custom_order_requests_created_at_idx").on(
      table.createdAt,
    ),
    budgetCheck: check(
      "custom_order_requests_budget_check",
      sql`(${table.budgetMin} is null or ${table.budgetMin} >= 0) and (${table.budgetMax} is null or ${table.budgetMax} >= 0)`,
    ),
    statusIdx: index("custom_order_requests_status_idx").on(table.status),
    statusCheck: check(
      "custom_order_requests_status_check",
      oneOf(table.status, CUSTOM_REQUEST_STATUSES),
    ),
    updatedAtIdx: index("custom_order_requests_updated_at_idx").on(
      table.updatedAt,
    ),
    convertedOrderUniqueIdx: uniqueIndex(
      "custom_order_requests_converted_order_unique",
    ).on(table.convertedOrderId),
    kindCheck: check(
      "custom_order_requests_kind_check",
      oneOf(table.kind, CUSTOM_REQUEST_KINDS),
    ),
    sizeCheck: check(
      "custom_order_requests_size_check",
      sql`(${table.sizeEu} is null or ${table.sizeEu} between 20 and 60) and ${table.pairs} between 1 and 50`,
    ),
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
    /** Paid up front to start production; null = pay in full only. */
    depositAmount: decimal("deposit_amount", { precision: 10, scale: 2 }),
    /** Delivery for the customer's address, set when they start paying. */
    shippingAmount: decimal("shipping_amount", { precision: 10, scale: 2 }),
    note: text("note"),
    status: varchar("status", { length: 50 }).default("sent").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    reminderCount: integer("reminder_count").default(0).notNull(),
    lastReminderAt: timestamp("last_reminder_at", { withTimezone: true }),
    expiredNotificationSentAt: timestamp("expired_notification_sent_at", {
      withTimezone: true,
    }),
    createdBy: varchar("created_by", { length: 255 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    requestIdIdx: index("custom_order_quotes_request_id_idx").on(
      table.requestId,
    ),
    statusIdx: index("custom_order_quotes_status_idx").on(table.status),
    statusCheck: check(
      "custom_order_quotes_status_check",
      oneOf(table.status, QUOTE_STATUSES),
    ),
    expiresAtIdx: index("custom_order_quotes_expires_at_idx").on(
      table.expiresAt,
    ),
    reminderCountIdx: index("custom_order_quotes_reminder_count_idx").on(
      table.reminderCount,
    ),
    requestVersionUniqueIdx: uniqueIndex(
      "custom_order_quotes_request_version_unique",
    ).on(table.requestId, table.version),
    amountCheck: check(
      "custom_order_quotes_amount_check",
      sql`${table.amount} >= 0 and ${table.version} >= 1`,
    ),
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
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    quoteIdIdx: index("custom_order_quote_tokens_quote_id_idx").on(
      table.quoteId,
    ),
    emailIdx: index("custom_order_quote_tokens_email_idx").on(table.email),
    tokenHashUnique: uniqueIndex(
      "custom_order_quote_tokens_token_hash_unique",
    ).on(table.tokenHash),
    expiresAtIdx: index("custom_order_quote_tokens_expires_at_idx").on(
      table.expiresAt,
    ),
  }),
);

// Customer ↔ shop conversation on a custom request
export const customRequestMessages = pgTable(
  "custom_request_messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    requestId: uuid("request_id")
      .references(() => customOrderRequests.id, { onDelete: "cascade" })
      .notNull(),
    author: varchar("author", { length: 20 }).notNull(),
    /** The admin's name on admin messages; null for the customer. */
    authorName: varchar("author_name", { length: 255 }),
    body: text("body").notNull(),
    attachments: jsonb("attachments").default([]).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    requestIdx: index("custom_request_messages_request_idx").on(
      table.requestId,
      table.createdAt,
    ),
    authorCheck: check(
      "custom_request_messages_author_check",
      oneOf(table.author, CUSTOM_MESSAGE_AUTHORS),
    ),
  }),
);

// Price list of common edits customers pick from (remove buckle, add roses…)
export const customEditOptions = pgTable(
  "custom_edit_options",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 120 }).notNull(),
    description: text("description"),
    price: decimal("price", { precision: 10, scale: 2 }).default("0").notNull(),
    image: text("image"),
    /** Asks the customer for a detail, e.g. "Which colour?" or "What name?". */
    detailPrompt: varchar("detail_prompt", { length: 120 }),
    /** Price depends on the design: shown as "from" and always quoted by hand. */
    needsReview: boolean("needs_review").default(false).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    position: integer("position").default(0).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    positionIdx: index("custom_edit_options_position_idx").on(table.position),
    priceCheck: check(
      "custom_edit_options_price_check",
      sql`${table.price} >= 0`,
    ),
  }),
);

// Small key → JSON settings store (key "custom_orders" holds deposit %, etc.)
export const storeSettings = pgTable("store_settings", {
  key: varchar("key", { length: 100 }).primaryKey(),
  value: jsonb("value").default({}).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

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
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    emailLowercase: check(
      "admin_users_email_lowercase_check",
      sql`${table.email} = lower(${table.email})`,
    ),
    roleCheck: check(
      "admin_users_role_check",
      oneOf(table.role, ADMIN_ROLE_VALUES),
    ),
  }),
);

// One-time reset tokens for admin password recovery
export const adminPasswordResets = pgTable(
  "admin_password_resets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    adminId: uuid("admin_id")
      .references(() => adminUsers.id, { onDelete: "cascade" })
      .notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    tokenHash: text("token_hash").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    adminIdIdx: index("admin_password_resets_admin_id_idx").on(table.adminId),
    emailIdx: index("admin_password_resets_email_idx").on(table.email),
    tokenHashUnique: uniqueIndex("admin_password_resets_token_hash_unique").on(
      table.tokenHash,
    ),
    expiresAtIdx: index("admin_password_resets_expires_at_idx").on(
      table.expiresAt,
    ),
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
    hasPassword: boolean("has_password").default(false).notNull(),
    phone: varchar("phone", { length: 50 }),
    shippingAddress: jsonb("shipping_address"),
    billingAddress: jsonb("billing_address"),
    isActive: boolean("is_active").default(true).notNull(),
    /**
     * Set when the user proves they own `email` (magic-link sign-in). Guest
     * orders and custom requests are only linked to verified accounts.
     */
    emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    createdAtIdx: index("users_created_at_idx").on(table.createdAt),
    emailLowercase: check(
      "users_email_lowercase_check",
      sql`${table.email} = lower(${table.email})`,
    ),
  }),
);

// Orders for tracking purchases
/** Order numbers: DFP-10001, DFP-10002, … (see nextOrderNumber). */
export const orderNumberSeq = pgSequence("order_number_seq", {
  startWith: 10001,
});

export const orders = pgTable(
  "orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").references(() => users.id, {
      onDelete: "set null",
    }),
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
    estimatedArrival: timestamp("estimated_arrival", { withTimezone: true }),
    subtotalAmount: decimal("subtotal_amount", {
      precision: 10,
      scale: 2,
    }).notNull(),
    taxAmount: decimal("tax_amount", { precision: 10, scale: 2 })
      .default("0.00")
      .notNull(),
    shippingAmount: decimal("shipping_amount", { precision: 10, scale: 2 })
      .default("0.00")
      .notNull(),
    discountAmount: decimal("discount_amount", { precision: 10, scale: 2 })
      .default("0.00")
      .notNull(),
    // Code as entered (kept for history); coupon_id links the coupon itself.
    couponCode: varchar("coupon_code", { length: 50 }),
    couponId: uuid("coupon_id").references(() => coupons.id, {
      onDelete: "set null",
    }),
    totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
    /** Still owed (custom orders paid by deposit). Can't be sent until 0. */
    balanceDue: decimal("balance_due", { precision: 10, scale: 2 })
      .default("0.00")
      .notNull(),
    currencyCode: varchar("currency_code", { length: 3 })
      .default("NGN")
      .notNull(),
    notes: text("notes"),
    trackingNumber: varchar("tracking_number", { length: 100 }),
    acknowledgedAt: timestamp("acknowledged_at", { withTimezone: true }),
    acknowledgedBy: varchar("acknowledged_by", { length: 255 }),
    orderType: varchar("order_type", { length: 20 })
      .default("catalog")
      .notNull(),
    customOrderRequestId: uuid("custom_order_request_id").references(
      (): AnyPgColumn => customOrderRequests.id,
      { onDelete: "set null" },
    ),
    paymentTransactionId: uuid("payment_transaction_id").references(
      (): AnyPgColumn => paymentTransactions.id,
      { onDelete: "set null" },
    ),
    paymentProvider: varchar("payment_provider", { length: 50 }).default(
      "paystack",
    ),
    paymentReference: varchar("payment_reference", { length: 255 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    userIdIdx: index("orders_user_id_idx").on(table.userId),
    emailIdx: index("orders_email_lower_idx").on(sql`lower(${table.email})`),
    createdAtIdx: index("orders_created_at_idx").on(table.createdAt),
    couponIdIdx: index("orders_coupon_id_idx").on(table.couponId),
    statusIdx: index("orders_status_idx").on(table.status),
    statusCheck: check(
      "orders_status_check",
      oneOf(table.status, ORDER_STATUSES),
    ),
    deliveryStatusCheck: check(
      "orders_delivery_status_check",
      oneOf(table.deliveryStatus, DELIVERY_STATUSES),
    ),
    orderTypeCheck: check(
      "orders_order_type_check",
      oneOf(table.orderType, ORDER_TYPES),
    ),
    paymentProviderCheck: check(
      "orders_payment_provider_check",
      sql`${table.paymentProvider} is null or ${oneOf(table.paymentProvider, PAYMENT_PROVIDERS)}`,
    ),
    deliveryStatusIdx: index("orders_delivery_status_idx").on(
      table.deliveryStatus,
    ),
    orderTypeIdx: index("orders_order_type_idx").on(table.orderType),
    customOrderRequestIdIdx: index("orders_custom_order_request_id_idx").on(
      table.customOrderRequestId,
    ),
    paymentTransactionIdIdx: index("orders_payment_transaction_id_idx").on(
      table.paymentTransactionId,
    ),
    paymentReferenceUnique: uniqueIndex("orders_payment_reference_unique").on(
      table.paymentReference,
    ),
    amountsCheck: check(
      "orders_amounts_check",
      sql`${table.subtotalAmount} >= 0 and ${table.taxAmount} >= 0 and ${table.shippingAmount} >= 0 and ${table.discountAmount} >= 0 and ${table.totalAmount} >= 0 and ${table.balanceDue} >= 0 and ${table.balanceDue} <= ${table.totalAmount}`,
    ),
    customOrderRequestUniqueIdx: uniqueIndex(
      "orders_custom_order_request_unique",
    ).on(table.customOrderRequestId),
    paymentTransactionUniqueIdx: uniqueIndex(
      "orders_payment_transaction_unique",
    ).on(table.paymentTransactionId),
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
    // Null once the product/variant is deleted; the title/price snapshot stays.
    productId: uuid("product_id").references(() => products.id, {
      onDelete: "set null",
    }),
    productVariantId: uuid("product_variant_id").references(
      () => productVariants.id,
      { onDelete: "set null" },
    ),
    productTitle: varchar("product_title", { length: 255 }).notNull(),
    variantTitle: varchar("variant_title", { length: 255 }).notNull(),
    quantity: integer("quantity").notNull(),
    price: decimal("price", { precision: 10, scale: 2 }).notNull(),
    totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
    currencyCode: varchar("currency_code", { length: 3 })
      .default("NGN")
      .notNull(),
    productImage: text("product_image"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    orderIdIdx: index("order_items_order_id_idx").on(table.orderId),
    productIdIdx: index("order_items_product_id_idx").on(table.productId),
    variantIdIdx: index("order_items_variant_id_idx").on(
      table.productVariantId,
    ),
    quantityCheck: check(
      "order_items_quantity_check",
      sql`${table.quantity} > 0 and ${table.price} >= 0 and ${table.totalAmount} >= 0`,
    ),
  }),
);

export const paymentTransactions = pgTable(
  "payment_transactions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    provider: varchar("provider", { length: 50 }).default("paystack").notNull(),
    reference: varchar("reference", { length: 255 }).notNull(),
    source: varchar("source", { length: 50 }).notNull(),
    status: varchar("status", { length: 50 }).default("initialized").notNull(),
    amount: integer("amount").notNull(),
    currencyCode: varchar("currency_code", { length: 3 })
      .default("NGN")
      .notNull(),
    metadata: jsonb("metadata").default({}).notNull(),
    paystackStatus: varchar("paystack_status", { length: 50 }),
    customer: jsonb("customer"),
    payload: jsonb("payload"),
    orderId: uuid("order_id").references(() => orders.id, {
      onDelete: "set null",
    }),
    conflictCode: varchar("conflict_code", { length: 100 }),
    conflictMessage: text("conflict_message"),
    lastVerifiedAt: timestamp("last_verified_at", { withTimezone: true }),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    providerReferenceUniqueIdx: uniqueIndex(
      "payment_transactions_provider_reference_unique",
    ).on(table.provider, table.reference),
    statusIdx: index("payment_transactions_status_idx").on(table.status),
    statusCheck: check(
      "payment_transactions_status_check",
      oneOf(table.status, PAYMENT_STATUSES),
    ),
    sourceCheck: check(
      "payment_transactions_source_check",
      oneOf(table.source, PAYMENT_SOURCES),
    ),
    providerCheck: check(
      "payment_transactions_provider_check",
      oneOf(table.provider, PAYMENT_PROVIDERS),
    ),
    sourceIdx: index("payment_transactions_source_idx").on(table.source),
    createdAtIdx: index("payment_transactions_created_at_idx").on(
      table.createdAt,
    ),
    orderIdIdx: index("payment_transactions_order_id_idx").on(table.orderId),
    amountCheck: check(
      "payment_transactions_amount_check",
      sql`${table.amount} >= 0`,
    ),
  }),
);

export const paymentEvents = pgTable(
  "payment_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    paymentTransactionId: uuid("payment_transaction_id")
      .references(() => paymentTransactions.id, { onDelete: "cascade" })
      .notNull(),
    provider: varchar("provider", { length: 50 }).default("paystack").notNull(),
    reference: varchar("reference", { length: 255 }).notNull(),
    source: varchar("source", { length: 50 }).notNull(),
    eventType: varchar("event_type", { length: 100 }).notNull(),
    status: varchar("status", { length: 50 }).notNull(),
    message: text("message"),
    payload: jsonb("payload"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    paymentTransactionIdIdx: index(
      "payment_events_payment_transaction_id_idx",
    ).on(table.paymentTransactionId),
    referenceIdx: index("payment_events_reference_idx").on(table.reference),
    createdAtIdx: index("payment_events_created_at_idx").on(table.createdAt),
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
    // Where consent came from: newsletter, popup, checkout, account, import.
    source: varchar("source", { length: 50 }).default("newsletter").notNull(),
    subscribedAt: timestamp("subscribed_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    unsubscribedAt: timestamp("unsubscribed_at", { withTimezone: true }),
  },
  (table) => ({
    statusIdx: index("newsletter_subscribers_status_idx").on(table.status),
    statusCheck: check(
      "newsletter_subscribers_status_check",
      oneOf(table.status, NEWSLETTER_STATUSES),
    ),
    sourceCheck: check(
      "newsletter_subscribers_source_check",
      oneOf(table.source, NEWSLETTER_SOURCES),
    ),
    emailLowercase: check(
      "newsletter_subscribers_email_lowercase_check",
      sql`${table.email} = lower(${table.email})`,
    ),
  }),
);

// Magic link login tokens
export const magicLinkTokens = pgTable(
  "magic_link_tokens",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: varchar("email", { length: 255 }).notNull(),
    tokenHash: text("token_hash").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
  },
  (table) => ({
    emailIdx: index("magic_link_tokens_email_idx").on(table.email),
    expiresAtIdx: index("magic_link_tokens_expires_at_idx").on(table.expiresAt),
    tokenHashUnique: uniqueIndex("magic_link_tokens_token_hash_unique").on(
      table.tokenHash,
    ),
  }),
);

// Email OTPs for account actions (e.g. adding a password for magic-link users)
export const emailOtps = pgTable(
  "email_otps",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: varchar("email", { length: 255 }).notNull(),
    otpHash: text("otp_hash").notNull(),
    purpose: varchar("purpose", { length: 50 }).notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    emailPurposeIdx: index("email_otps_email_purpose_idx").on(
      table.email,
      table.purpose,
    ),
    purposeCheck: check(
      "email_otps_purpose_check",
      oneOf(table.purpose, OTP_PURPOSES),
    ),
    expiresAtIdx: index("email_otps_expires_at_idx").on(table.expiresAt),
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
    cartId: uuid("cart_id")
      .references(() => carts.id, { onDelete: "cascade" })
      .notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    customerName: varchar("customer_name", { length: 255 }).notNull(),
    cartTotal: decimal("cart_total", { precision: 10, scale: 2 }).notNull(),
    items: jsonb("items").notNull(),
    emailSent: boolean("email_sent").default(false).notNull(),
    emailSentAt: timestamp("email_sent_at", { withTimezone: true }),
    recovered: boolean("recovered").default(false).notNull(),
    recoveredAt: timestamp("recovered_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
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
    userId: uuid("user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    orderId: uuid("order_id").references(() => orders.id, {
      onDelete: "set null",
    }),
    rating: integer("rating").notNull(),
    title: varchar("title", { length: 255 }),
    comment: text("comment"),
    images: text("images").array().default([]),
    isVerified: boolean("is_verified").default(false).notNull(),
    helpfulCount: integer("helpful_count").default(0).notNull(),
    status: varchar("status", { length: 50 }).default("pending").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    productIdIdx: index("reviews_product_id_idx").on(table.productId),
    userIdIdx: index("reviews_user_id_idx").on(table.userId),
    statusIdx: index("reviews_status_idx").on(table.status),
    statusCheck: check(
      "reviews_status_check",
      oneOf(table.status, REVIEW_STATUSES),
    ),
    ratingIdx: index("reviews_rating_idx").on(table.rating),
    createdAtIdx: index("reviews_created_at_idx").on(table.createdAt),
    ratingCheck: check(
      "reviews_rating_check",
      sql`${table.rating} between 1 and 5`,
    ),
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
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    isHelpful: boolean("is_helpful").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
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
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    isActiveIdx: index("testimonials_is_active_idx").on(table.isActive),
    positionIdx: index("testimonials_position_idx").on(table.position),
    ratingCheck: check(
      "testimonials_rating_check",
      sql`${table.rating} between 1 and 5`,
    ),
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
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
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
    discountValue: decimal("discount_value", {
      precision: 10,
      scale: 2,
    }).notNull(),
    minOrderValue: decimal("min_order_value", { precision: 10, scale: 2 }),
    maxUses: integer("max_uses"),
    usedCount: integer("used_count").default(0).notNull(),
    maxUsesPerUser: integer("max_uses_per_user"),
    requiresLogin: boolean("requires_login").default(false).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    startDate: timestamp("start_date", { withTimezone: true }),
    expiryDate: timestamp("expiry_date", { withTimezone: true }),
    grantsFreeShipping: boolean("grants_free_shipping")
      .default(false)
      .notNull(),
    includeShippingInDiscount: boolean("include_shipping_in_discount")
      .default(false)
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    isActiveIdx: index("coupons_is_active_idx").on(table.isActive),
    codeUppercase: check(
      "coupons_code_uppercase_check",
      sql`${table.code} = upper(${table.code})`,
    ),
    discountTypeCheck: check(
      "coupons_discount_type_check",
      sql`${oneOf(table.discountType, DISCOUNT_TYPES)} and (${table.discountType} <> 'percentage' or ${table.discountValue} <= 100)`,
    ),
    valuesCheck: check(
      "coupons_values_check",
      sql`${table.discountValue} >= 0 and (${table.minOrderValue} is null or ${table.minOrderValue} >= 0) and ${table.usedCount} >= 0 and (${table.maxUses} is null or ${table.maxUses} >= 0) and (${table.maxUsesPerUser} is null or ${table.maxUsesPerUser} >= 0)`,
    ),
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
    userId: uuid("user_id").references(() => users.id, {
      onDelete: "cascade",
    }),
    orderId: uuid("order_id").references(() => orders.id, {
      onDelete: "cascade",
    }),
    sessionId: varchar("session_id", { length: 255 }),
    usedAt: timestamp("used_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    couponIdIdx: index("coupon_usage_coupon_id_idx").on(table.couponId),
    userIdIdx: index("coupon_usage_user_id_idx").on(table.userId),
    sessionIdIdx: index("coupon_usage_session_id_idx").on(table.sessionId),
    // One redemption per order, even if payment confirmation runs twice.
    couponOrderUnique: uniqueIndex("coupon_usage_coupon_order_unique").on(
      table.couponId,
      table.orderId,
    ),
  }),
);

// Google Merchant product sync tracking
export const googleMerchantProductSyncs = pgTable(
  "google_merchant_product_syncs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    productId: uuid("product_id")
      .references(() => products.id, { onDelete: "cascade" })
      .notNull(),
    merchantId: varchar("merchant_id", { length: 64 }).notNull(),
    offerId: varchar("offer_id", { length: 255 }).notNull(),
    googleProductId: varchar("google_product_id", { length: 255 }),
    syncStatus: varchar("sync_status", { length: 20 })
      .default("pending")
      .notNull(),
    lastError: text("last_error"),
    payload: jsonb("payload"),
    lastSyncedAt: timestamp("last_synced_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    productMerchantUniqueIdx: uniqueIndex(
      "google_merchant_product_sync_product_merchant_unique",
    ).on(table.productId, table.merchantId),
    merchantIdIdx: index("google_merchant_product_sync_merchant_id_idx").on(
      table.merchantId,
    ),
    syncStatusIdx: index("google_merchant_product_sync_sync_status_idx").on(
      table.syncStatus,
    ),
    syncStatusCheck: check(
      "google_merchant_product_sync_status_check",
      oneOf(table.syncStatus, MERCHANT_SYNC_STATUSES),
    ),
    lastSyncedAtIdx: index(
      "google_merchant_product_sync_last_synced_at_idx",
    ).on(table.lastSyncedAt),
  }),
);

// Email marketing campaigns
export const emailCampaigns = pgTable(
  "email_campaigns",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 255 }).notNull(),
    type: varchar("type", { length: 50 }).notNull(), // JUST_ARRIVED, SALE, COLLECTION
    subject: text("subject").notNull(),
    preheader: text("preheader"),
    headerTitle: text("header_title"),
    headerSubtitle: text("header_subtitle"),
    footerText: text("footer_text"),
    ctaButtonText: varchar("cta_button_text", { length: 100 }),
    ctaButtonUrl: text("cta_button_url"),
    heroImageUrl: text("hero_image_url"),
    discountPercentage: integer("discount_percentage"),
    couponCode: varchar("coupon_code", { length: 50 }),
    saleDeadline: timestamp("sale_deadline", { withTimezone: true }),
    discountNote: text("discount_note"),
    // Block-based design (lib/email/blocks.ts). Null = legacy field-based template.
    content: jsonb("content"),
    status: varchar("status", { length: 50 }).default("DRAFT").notNull(), // see CAMPAIGN_STATUSES
    // Who receives it: { segment, collectionId?, state? }. See lib/marketing/segments.ts.
    audience: jsonb("audience").default({ segment: "all" }).notNull(),
    // Skip anyone who received another campaign within this many hours (0 = off).
    frequencyCapHours: integer("frequency_cap_hours").default(48).notNull(),
    scheduledAt: timestamp("scheduled_at", { withTimezone: true }),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    // Null once the admin who created it is removed.
    createdBy: uuid("created_by").references(() => adminUsers.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    createdByIdx: index("email_campaigns_created_by_idx").on(table.createdBy),
    statusIdx: index("email_campaigns_status_idx").on(table.status),
    scheduledAtIdx: index("email_campaigns_scheduled_at_idx").on(
      table.scheduledAt,
    ),
    typeIdx: index("email_campaigns_type_idx").on(table.type),
    statusCheck: check(
      "email_campaigns_status_check",
      oneOf(table.status, CAMPAIGN_STATUSES),
    ),
    typeCheck: check(
      "email_campaigns_type_check",
      oneOf(table.type, CAMPAIGN_TYPES),
    ),
  }),
);

// Campaign products junction table
export const campaignProducts = pgTable(
  "campaign_products",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    campaignId: uuid("campaign_id")
      .references(() => emailCampaigns.id, { onDelete: "cascade" })
      .notNull(),
    productId: uuid("product_id")
      .references(() => products.id, { onDelete: "cascade" })
      .notNull(),
    position: integer("position").default(0).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    campaignIdIdx: index("campaign_products_campaign_id_idx").on(
      table.campaignId,
    ),
    productIdIdx: index("campaign_products_product_id_idx").on(table.productId),
    uniqueIdx: uniqueIndex("campaign_products_unique").on(
      table.campaignId,
      table.productId,
    ),
  }),
);

// Campaign email logs for tracking delivery and engagement
export const campaignEmailLogs = pgTable(
  "campaign_email_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    campaignId: uuid("campaign_id")
      .references(() => emailCampaigns.id, { onDelete: "cascade" })
      .notNull(),
    subscriberEmail: varchar("subscriber_email", { length: 255 }).notNull(),
    status: varchar("status", { length: 50 }).default("SENT").notNull(), // see CAMPAIGN_LOG_STATUSES
    sentAt: timestamp("sent_at", { withTimezone: true }).defaultNow().notNull(),
    openedAt: timestamp("opened_at", { withTimezone: true }),
    clickedAt: timestamp("clicked_at", { withTimezone: true }),
    bounceReason: varchar("bounce_reason", { length: 255 }),
    clickCount: integer("click_count").default(0).notNull(),
    resendMessageId: varchar("resend_message_id", { length: 255 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    campaignIdIdx: index("campaign_email_logs_campaign_id_idx").on(
      table.campaignId,
    ),
    subscriberEmailIdx: index("campaign_email_logs_subscriber_email_idx").on(
      table.subscriberEmail,
    ),
    statusIdx: index("campaign_email_logs_status_idx").on(table.status),
    statusCheck: check(
      "campaign_email_logs_status_check",
      oneOf(table.status, CAMPAIGN_LOG_STATUSES),
    ),
    resendMessageIdIdx: index("campaign_email_logs_resend_message_id_idx").on(
      table.resendMessageId,
    ),
    // One email per person per campaign, even if a send is retried.
    campaignRecipientUnique: uniqueIndex(
      "campaign_email_logs_campaign_recipient_unique",
    ).on(table.campaignId, table.subscriberEmail),
  }),
);

// Automated emails (flows): one row per flow with its on/off switch and settings.
export const marketingFlows = pgTable(
  "marketing_flows",
  {
    key: varchar("key", { length: 50 }).primaryKey(), // see FLOW_KEYS
    enabled: boolean("enabled").default(false).notNull(),
    settings: jsonb("settings").default({}).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    keyCheck: check("marketing_flows_key_check", oneOf(table.key, FLOW_KEYS)),
  }),
);

// Each automated email sent, for de-duplication, engagement and attribution.
export const flowEmailLogs = pgTable(
  "flow_email_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    flowKey: varchar("flow_key", { length: 50 }).notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    // What triggered it (order id, cart id…), so the same trigger never emails twice.
    reference: varchar("reference", { length: 255 }).notNull(),
    status: varchar("status", { length: 50 }).default("SENT").notNull(),
    resendMessageId: varchar("resend_message_id", { length: 255 }),
    sentAt: timestamp("sent_at", { withTimezone: true }).defaultNow().notNull(),
    openedAt: timestamp("opened_at", { withTimezone: true }),
    clickedAt: timestamp("clicked_at", { withTimezone: true }),
    clickCount: integer("click_count").default(0).notNull(),
  },
  (table) => ({
    flowKeyIdx: index("flow_email_logs_flow_key_idx").on(table.flowKey),
    emailIdx: index("flow_email_logs_email_idx").on(table.email),
    resendMessageIdIdx: index("flow_email_logs_resend_message_id_idx").on(
      table.resendMessageId,
    ),
    triggerUnique: uniqueIndex("flow_email_logs_trigger_unique").on(
      table.flowKey,
      table.email,
      table.reference,
    ),
    statusCheck: check(
      "flow_email_logs_status_check",
      oneOf(table.status, FLOW_LOG_STATUSES),
    ),
    flowKeyCheck: check(
      "flow_email_logs_flow_key_check",
      oneOf(table.flowKey, FLOW_KEYS),
    ),
  }),
);

// Relations
export const productsRelations = relations(products, ({ many }) => ({
  variants: many(productVariants),
  images: many(productImages),
  options: many(productOptions),
  productCollections: many(productCollections),
  reviews: many(reviews),
  googleMerchantSyncs: many(googleMerchantProductSyncs),
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
  paymentTransaction: one(paymentTransactions, {
    fields: [orders.paymentTransactionId],
    references: [paymentTransactions.id],
  }),
  items: many(orderItems),
}));

export const paymentTransactionsRelations = relations(
  paymentTransactions,
  ({ one, many }) => ({
    order: one(orders, {
      fields: [paymentTransactions.orderId],
      references: [orders.id],
    }),
    events: many(paymentEvents),
  }),
);

export const paymentEventsRelations = relations(paymentEvents, ({ one }) => ({
  paymentTransaction: one(paymentTransactions, {
    fields: [paymentEvents.paymentTransactionId],
    references: [paymentTransactions.id],
  }),
}));

export const customOrderRequestsRelations = relations(
  customOrderRequests,
  ({ one, many }) => ({
    user: one(users, {
      fields: [customOrderRequests.userId],
      references: [users.id],
    }),
    quotes: many(customOrderQuotes),
    messages: many(customRequestMessages),
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

export const googleMerchantProductSyncsRelations = relations(
  googleMerchantProductSyncs,
  ({ one }) => ({
    product: one(products, {
      fields: [googleMerchantProductSyncs.productId],
      references: [products.id],
    }),
  }),
);

export const emailCampaignsRelations = relations(
  emailCampaigns,
  ({ one, many }) => ({
    createdByAdmin: one(adminUsers, {
      fields: [emailCampaigns.createdBy],
      references: [adminUsers.id],
    }),
    products: many(campaignProducts),
    emailLogs: many(campaignEmailLogs),
  }),
);

export const campaignProductsRelations = relations(
  campaignProducts,
  ({ one }) => ({
    campaign: one(emailCampaigns, {
      fields: [campaignProducts.campaignId],
      references: [emailCampaigns.id],
    }),
    product: one(products, {
      fields: [campaignProducts.productId],
      references: [products.id],
    }),
  }),
);

export const campaignEmailLogsRelations = relations(
  campaignEmailLogs,
  ({ one }) => ({
    campaign: one(emailCampaigns, {
      fields: [campaignEmailLogs.campaignId],
      references: [emailCampaigns.id],
    }),
  }),
);

export const customRequestMessagesRelations = relations(
  customRequestMessages,
  ({ one }) => ({
    request: one(customOrderRequests, {
      fields: [customRequestMessages.requestId],
      references: [customOrderRequests.id],
    }),
  }),
);
