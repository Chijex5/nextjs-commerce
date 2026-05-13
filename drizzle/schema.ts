import { pgTable, index, uuid, varchar, jsonb, boolean, timestamp, text, integer, unique, numeric, uniqueIndex, foreignKey } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const sizeGuides = pgTable("size_guides", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	productType: varchar("product_type", { length: 100 }).notNull(),
	title: varchar({ length: 255 }).notNull(),
	sizesChart: jsonb("sizes_chart").notNull(),
	measurements: jsonb().notNull(),
	isActive: boolean("is_active").default(true).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("size_guides_product_type_idx").using("btree", table.productType.asc().nullsLast().op("text_ops")),
]);

export const testimonials = pgTable("testimonials", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	customerName: varchar("customer_name", { length: 255 }).notNull(),
	role: varchar({ length: 255 }),
	content: text().notNull(),
	rating: integer().notNull(),
	image: text(),
	isActive: boolean("is_active").default(true).notNull(),
	position: integer().default(0).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("testimonials_is_active_idx").using("btree", table.isActive.asc().nullsLast().op("bool_ops")),
	index("testimonials_position_idx").using("btree", table.position.asc().nullsLast().op("int4_ops")),
]);

export const customOrders = pgTable("custom_orders", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	title: varchar({ length: 255 }).notNull(),
	customerStory: text("customer_story"),
	beforeImage: text("before_image"),
	afterImage: text("after_image"),
	details: jsonb(),
	completionTime: varchar("completion_time", { length: 100 }),
	position: integer().default(0).notNull(),
	isPublished: boolean("is_published").default(true).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("custom_orders_is_published_idx").using("btree", table.isPublished.asc().nullsLast().op("bool_ops")),
	index("custom_orders_position_idx").using("btree", table.position.asc().nullsLast().op("int4_ops")),
]);

export const magicLinkTokens = pgTable("magic_link_tokens", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	email: varchar({ length: 255 }).notNull(),
	tokenHash: text("token_hash").notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	usedAt: timestamp("used_at", { mode: 'string' }),
}, (table) => [
	index("magic_link_tokens_email_idx").using("btree", table.email.asc().nullsLast().op("text_ops")),
	index("magic_link_tokens_expires_at_idx").using("btree", table.expiresAt.asc().nullsLast().op("timestamp_ops")),
]);

export const adminUsers = pgTable("admin_users", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	email: varchar({ length: 255 }).notNull(),
	name: varchar({ length: 255 }),
	passwordHash: text("password_hash").notNull(),
	role: varchar({ length: 50 }).default('admin').notNull(),
	isActive: boolean("is_active").default(true).notNull(),
	lastLoginAt: timestamp("last_login_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("admin_users_email_idx").using("btree", table.email.asc().nullsLast().op("text_ops")),
	unique("admin_users_email_unique").on(table.email),
]);

export const newsletterSubscribers = pgTable("newsletter_subscribers", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	email: varchar({ length: 255 }).notNull(),
	name: varchar({ length: 255 }),
	status: varchar({ length: 50 }).default('active').notNull(),
	subscribedAt: timestamp("subscribed_at", { mode: 'string' }).defaultNow().notNull(),
	unsubscribedAt: timestamp("unsubscribed_at", { mode: 'string' }),
}, (table) => [
	index("newsletter_subscribers_email_idx").using("btree", table.email.asc().nullsLast().op("text_ops")),
	index("newsletter_subscribers_status_idx").using("btree", table.status.asc().nullsLast().op("text_ops")),
	unique("newsletter_subscribers_email_unique").on(table.email),
]);

export const pages = pgTable("pages", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	handle: varchar({ length: 255 }).notNull(),
	title: varchar({ length: 255 }).notNull(),
	body: text(),
	bodySummary: text("body_summary"),
	seoTitle: varchar("seo_title", { length: 255 }),
	seoDescription: text("seo_description"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("pages_handle_idx").using("btree", table.handle.asc().nullsLast().op("text_ops")),
	unique("pages_handle_unique").on(table.handle),
]);

export const emailOtps = pgTable("email_otps", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	email: varchar({ length: 255 }).notNull(),
	otpHash: text("otp_hash").notNull(),
	purpose: varchar({ length: 50 }).notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }).notNull(),
	usedAt: timestamp("used_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("email_otps_email_idx").using("btree", table.email.asc().nullsLast().op("text_ops")),
	index("email_otps_expires_at_idx").using("btree", table.expiresAt.asc().nullsLast().op("timestamp_ops")),
	index("email_otps_purpose_idx").using("btree", table.purpose.asc().nullsLast().op("text_ops")),
]);

export const coupons = pgTable("coupons", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	code: varchar({ length: 50 }).notNull(),
	description: text(),
	discountType: varchar("discount_type", { length: 20 }).notNull(),
	discountValue: numeric("discount_value", { precision: 10, scale:  2 }).notNull(),
	minOrderValue: numeric("min_order_value", { precision: 10, scale:  2 }),
	maxUses: integer("max_uses"),
	usedCount: integer("used_count").default(0).notNull(),
	maxUsesPerUser: integer("max_uses_per_user"),
	requiresLogin: boolean("requires_login").default(false).notNull(),
	isActive: boolean("is_active").default(true).notNull(),
	startDate: timestamp("start_date", { mode: 'string' }),
	expiryDate: timestamp("expiry_date", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	grantsFreeShipping: boolean("grants_free_shipping").default(false).notNull(),
	includeShippingInDiscount: boolean("include_shipping_in_discount").default(false).notNull(),
}, (table) => [
	index("coupons_code_idx").using("btree", table.code.asc().nullsLast().op("text_ops")),
	index("coupons_is_active_idx").using("btree", table.isActive.asc().nullsLast().op("bool_ops")),
	unique("coupons_code_unique").on(table.code),
]);

export const orders = pgTable("orders", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id"),
	orderNumber: varchar("order_number", { length: 50 }).notNull(),
	email: varchar({ length: 255 }).notNull(),
	phone: varchar({ length: 50 }),
	customerName: varchar("customer_name", { length: 255 }).notNull(),
	shippingAddress: jsonb("shipping_address").notNull(),
	billingAddress: jsonb("billing_address"),
	status: varchar({ length: 50 }).default('pending').notNull(),
	deliveryStatus: varchar("delivery_status", { length: 50 }).default('production').notNull(),
	estimatedArrival: timestamp("estimated_arrival", { mode: 'string' }),
	subtotalAmount: numeric("subtotal_amount", { precision: 10, scale:  2 }).notNull(),
	taxAmount: numeric("tax_amount", { precision: 10, scale:  2 }).default('0.00').notNull(),
	shippingAmount: numeric("shipping_amount", { precision: 10, scale:  2 }).default('0.00').notNull(),
	discountAmount: numeric("discount_amount", { precision: 10, scale:  2 }).default('0.00').notNull(),
	couponCode: varchar("coupon_code", { length: 50 }),
	totalAmount: numeric("total_amount", { precision: 10, scale:  2 }).notNull(),
	currencyCode: varchar("currency_code", { length: 3 }).default('NGN').notNull(),
	notes: text(),
	trackingNumber: varchar("tracking_number", { length: 100 }),
	acknowledgedAt: timestamp("acknowledged_at", { mode: 'string' }),
	acknowledgedBy: varchar("acknowledged_by", { length: 255 }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	orderType: varchar("order_type", { length: 20 }).default('catalog').notNull(),
	customOrderRequestId: uuid("custom_order_request_id"),
	paymentTransactionId: uuid("payment_transaction_id"),
	paymentProvider: varchar("payment_provider", { length: 50 }).default('paystack'),
	paymentReference: varchar("payment_reference", { length: 255 }),
}, (table) => [
	index("orders_custom_order_request_id_idx").using("btree", table.customOrderRequestId.asc().nullsLast().op("uuid_ops")),
	uniqueIndex("orders_custom_order_request_unique").using("btree", table.customOrderRequestId.asc().nullsLast().op("uuid_ops")),
	index("orders_delivery_status_idx").using("btree", table.deliveryStatus.asc().nullsLast().op("text_ops")),
	index("orders_email_idx").using("btree", table.email.asc().nullsLast().op("text_ops")),
	index("orders_order_number_idx").using("btree", table.orderNumber.asc().nullsLast().op("text_ops")),
	index("orders_order_type_idx").using("btree", table.orderType.asc().nullsLast().op("text_ops")),
	index("orders_payment_reference_idx").using("btree", table.paymentReference.asc().nullsLast().op("text_ops")),
	index("orders_payment_transaction_id_idx").using("btree", table.paymentTransactionId.asc().nullsLast().op("uuid_ops")),
	uniqueIndex("orders_payment_transaction_unique").using("btree", table.paymentTransactionId.asc().nullsLast().op("uuid_ops")),
	index("orders_status_idx").using("btree", table.status.asc().nullsLast().op("text_ops")),
	index("orders_user_id_idx").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.customOrderRequestId],
			foreignColumns: [customOrderRequests.id],
			name: "orders_custom_order_request_id_custom_order_requests_id_fk"
		}),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "orders_user_id_users_id_fk"
		}),
	unique("orders_order_number_unique").on(table.orderNumber),
]);

export const customOrderRequests = pgTable("custom_order_requests", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	requestNumber: varchar("request_number", { length: 50 }).notNull(),
	userId: uuid("user_id"),
	email: varchar({ length: 255 }).notNull(),
	phone: varchar({ length: 50 }),
	customerName: varchar("customer_name", { length: 255 }).notNull(),
	title: varchar({ length: 255 }).notNull(),
	description: text().notNull(),
	sizeNotes: text("size_notes"),
	colorPreferences: text("color_preferences"),
	budgetMin: numeric("budget_min", { precision: 10, scale:  2 }),
	budgetMax: numeric("budget_max", { precision: 10, scale:  2 }),
	desiredDate: timestamp("desired_date", { mode: 'string' }),
	referenceImages: jsonb("reference_images").default([]).notNull(),
	status: varchar({ length: 50 }).default('submitted').notNull(),
	adminNotes: text("admin_notes"),
	customerNotes: text("customer_notes"),
	quotedAmount: numeric("quoted_amount", { precision: 10, scale:  2 }),
	currencyCode: varchar("currency_code", { length: 3 }).default('NGN').notNull(),
	quoteExpiresAt: timestamp("quote_expires_at", { mode: 'string' }),
	paidAt: timestamp("paid_at", { mode: 'string' }),
	convertedOrderId: uuid("converted_order_id"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	uniqueIndex("custom_order_requests_converted_order_unique").using("btree", table.convertedOrderId.asc().nullsLast().op("uuid_ops")),
	index("custom_order_requests_email_idx").using("btree", table.email.asc().nullsLast().op("text_ops")),
	index("custom_order_requests_request_number_idx").using("btree", table.requestNumber.asc().nullsLast().op("text_ops")),
	index("custom_order_requests_status_idx").using("btree", table.status.asc().nullsLast().op("text_ops")),
	index("custom_order_requests_updated_at_idx").using("btree", table.updatedAt.asc().nullsLast().op("timestamp_ops")),
	index("custom_order_requests_user_id_idx").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	unique("custom_order_requests_request_number_unique").on(table.requestNumber),
]);

export const users = pgTable("users", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	email: varchar({ length: 255 }).notNull(),
	name: varchar({ length: 255 }),
	passwordHash: text("password_hash").notNull(),
	phone: varchar({ length: 50 }),
	shippingAddress: jsonb("shipping_address"),
	billingAddress: jsonb("billing_address"),
	isActive: boolean("is_active").default(true).notNull(),
	lastLoginAt: timestamp("last_login_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	hasPassword: boolean("has_password").default(false).notNull(),
}, (table) => [
	index("users_email_idx").using("btree", table.email.asc().nullsLast().op("text_ops")),
	unique("users_email_unique").on(table.email),
]);

export const paymentTransactions = pgTable("payment_transactions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	provider: varchar({ length: 50 }).default('paystack').notNull(),
	reference: varchar({ length: 255 }).notNull(),
	source: varchar({ length: 50 }).notNull(),
	status: varchar({ length: 50 }).default('initialized').notNull(),
	amount: integer().notNull(),
	currencyCode: varchar("currency_code", { length: 3 }).default('NGN').notNull(),
	metadata: jsonb().default({}).notNull(),
	paystackStatus: varchar("paystack_status", { length: 50 }),
	customer: jsonb(),
	payload: jsonb(),
	orderId: uuid("order_id"),
	conflictCode: varchar("conflict_code", { length: 100 }),
	conflictMessage: text("conflict_message"),
	lastVerifiedAt: timestamp("last_verified_at", { mode: 'string' }),
	resolvedAt: timestamp("resolved_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("payment_transactions_created_at_idx").using("btree", table.createdAt.asc().nullsLast().op("timestamp_ops")),
	index("payment_transactions_order_id_idx").using("btree", table.orderId.asc().nullsLast().op("uuid_ops")),
	uniqueIndex("payment_transactions_order_id_unique").using("btree", table.orderId.asc().nullsLast().op("uuid_ops")),
	uniqueIndex("payment_transactions_provider_reference_unique").using("btree", table.provider.asc().nullsLast().op("text_ops"), table.reference.asc().nullsLast().op("text_ops")),
	index("payment_transactions_source_idx").using("btree", table.source.asc().nullsLast().op("text_ops")),
	index("payment_transactions_status_idx").using("btree", table.status.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.orderId],
			foreignColumns: [orders.id],
			name: "payment_transactions_order_id_orders_id_fk"
		}),
]);

export const abandonedCarts = pgTable("abandoned_carts", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	cartId: uuid("cart_id").notNull(),
	email: varchar({ length: 255 }).notNull(),
	customerName: varchar("customer_name", { length: 255 }).notNull(),
	cartTotal: numeric("cart_total", { precision: 10, scale:  2 }).notNull(),
	items: jsonb().notNull(),
	emailSent: boolean("email_sent").default(false).notNull(),
	emailSentAt: timestamp("email_sent_at", { mode: 'string' }),
	recovered: boolean().default(false).notNull(),
	recoveredAt: timestamp("recovered_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }).notNull(),
}, (table) => [
	index("abandoned_carts_email_sent_idx").using("btree", table.emailSent.asc().nullsLast().op("bool_ops")),
	index("abandoned_carts_expires_at_idx").using("btree", table.expiresAt.asc().nullsLast().op("timestamp_ops")),
	index("abandoned_carts_user_id_idx").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "abandoned_carts_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const cartLines = pgTable("cart_lines", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	cartId: uuid("cart_id").notNull(),
	productVariantId: uuid("product_variant_id").notNull(),
	quantity: integer().default(1).notNull(),
	totalAmount: numeric("total_amount", { precision: 10, scale:  2 }).default('0.00').notNull(),
	currencyCode: varchar("currency_code", { length: 3 }).default('NGN').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("cart_lines_cart_id_idx").using("btree", table.cartId.asc().nullsLast().op("uuid_ops")),
	index("cart_lines_variant_id_idx").using("btree", table.productVariantId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.cartId],
			foreignColumns: [carts.id],
			name: "cart_lines_cart_id_carts_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.productVariantId],
			foreignColumns: [productVariants.id],
			name: "cart_lines_product_variant_id_product_variants_id_fk"
		}),
]);

export const productVariants = pgTable("product_variants", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	productId: uuid("product_id").notNull(),
	title: varchar({ length: 255 }).notNull(),
	price: numeric({ precision: 10, scale:  2 }).notNull(),
	currencyCode: varchar("currency_code", { length: 3 }).default('NGN').notNull(),
	availableForSale: boolean("available_for_sale").default(true).notNull(),
	selectedOptions: jsonb("selected_options").default([]).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("product_variants_product_id_idx").using("btree", table.productId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.productId],
			foreignColumns: [products.id],
			name: "product_variants_product_id_products_id_fk"
		}).onDelete("cascade"),
]);

export const couponUsage = pgTable("coupon_usage", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	couponId: uuid("coupon_id").notNull(),
	userId: uuid("user_id"),
	sessionId: varchar("session_id", { length: 255 }),
	usedAt: timestamp("used_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("coupon_usage_coupon_id_idx").using("btree", table.couponId.asc().nullsLast().op("uuid_ops")),
	index("coupon_usage_session_id_idx").using("btree", table.sessionId.asc().nullsLast().op("text_ops")),
	index("coupon_usage_user_id_idx").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.couponId],
			foreignColumns: [coupons.id],
			name: "coupon_usage_coupon_id_coupons_id_fk"
		}).onDelete("cascade"),
]);

export const customOrderQuotes = pgTable("custom_order_quotes", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	requestId: uuid("request_id").notNull(),
	version: integer().default(1).notNull(),
	amount: numeric({ precision: 10, scale:  2 }).notNull(),
	currencyCode: varchar("currency_code", { length: 3 }).default('NGN').notNull(),
	breakdown: jsonb().default({}).notNull(),
	note: text(),
	status: varchar({ length: 50 }).default('sent').notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }),
	createdBy: varchar("created_by", { length: 255 }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	reminderCount: integer("reminder_count").default(0).notNull(),
	lastReminderAt: timestamp("last_reminder_at", { mode: 'string' }),
	expiredNotificationSentAt: timestamp("expired_notification_sent_at", { mode: 'string' }),
}, (table) => [
	index("custom_order_quotes_expires_at_idx").using("btree", table.expiresAt.asc().nullsLast().op("timestamp_ops")),
	index("custom_order_quotes_reminder_count_idx").using("btree", table.reminderCount.asc().nullsLast().op("int4_ops")),
	index("custom_order_quotes_request_id_idx").using("btree", table.requestId.asc().nullsLast().op("uuid_ops")),
	uniqueIndex("custom_order_quotes_request_version_unique").using("btree", table.requestId.asc().nullsLast().op("int4_ops"), table.version.asc().nullsLast().op("int4_ops")),
	index("custom_order_quotes_status_idx").using("btree", table.status.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.requestId],
			foreignColumns: [customOrderRequests.id],
			name: "custom_order_quotes_request_id_custom_order_requests_id_fk"
		}).onDelete("cascade"),
]);

export const customOrderQuoteTokens = pgTable("custom_order_quote_tokens", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	quoteId: uuid("quote_id").notNull(),
	email: varchar({ length: 255 }).notNull(),
	tokenHash: text("token_hash").notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }).notNull(),
	usedAt: timestamp("used_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("custom_order_quote_tokens_email_idx").using("btree", table.email.asc().nullsLast().op("text_ops")),
	index("custom_order_quote_tokens_expires_at_idx").using("btree", table.expiresAt.asc().nullsLast().op("timestamp_ops")),
	index("custom_order_quote_tokens_quote_id_idx").using("btree", table.quoteId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.quoteId],
			foreignColumns: [customOrderQuotes.id],
			name: "custom_order_quote_tokens_quote_id_custom_order_quotes_id_fk"
		}).onDelete("cascade"),
]);

export const products = pgTable("products", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	handle: varchar({ length: 255 }).notNull(),
	title: varchar({ length: 255 }).notNull(),
	description: text(),
	descriptionHtml: text("description_html"),
	availableForSale: boolean("available_for_sale").default(true).notNull(),
	seoTitle: varchar("seo_title", { length: 255 }),
	seoDescription: text("seo_description"),
	tags: text().array().default([""]),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("products_handle_idx").using("btree", table.handle.asc().nullsLast().op("text_ops")),
	index("products_tags_idx").using("btree", table.tags.asc().nullsLast().op("array_ops")),
	unique("products_handle_unique").on(table.handle),
]);

export const googleMerchantProductSyncs = pgTable("google_merchant_product_syncs", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	productId: uuid("product_id").notNull(),
	merchantId: varchar("merchant_id", { length: 64 }).notNull(),
	offerId: varchar("offer_id", { length: 255 }).notNull(),
	googleProductId: varchar("google_product_id", { length: 255 }),
	syncStatus: varchar("sync_status", { length: 20 }).default('pending').notNull(),
	lastError: text("last_error"),
	payload: jsonb(),
	lastSyncedAt: timestamp("last_synced_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("google_merchant_product_sync_last_synced_at_idx").using("btree", table.lastSyncedAt.asc().nullsLast().op("timestamp_ops")),
	index("google_merchant_product_sync_merchant_id_idx").using("btree", table.merchantId.asc().nullsLast().op("text_ops")),
	uniqueIndex("google_merchant_product_sync_product_merchant_unique").using("btree", table.productId.asc().nullsLast().op("text_ops"), table.merchantId.asc().nullsLast().op("uuid_ops")),
	index("google_merchant_product_sync_sync_status_idx").using("btree", table.syncStatus.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.productId],
			foreignColumns: [products.id],
			name: "google_merchant_product_syncs_product_id_products_id_fk"
		}).onDelete("cascade"),
]);

export const menus = pgTable("menus", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	handle: varchar({ length: 255 }).notNull(),
	title: varchar({ length: 255 }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("menus_handle_unique").on(table.handle),
]);

export const menuItems = pgTable("menu_items", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	menuId: uuid("menu_id").notNull(),
	title: varchar({ length: 255 }).notNull(),
	url: text().notNull(),
	position: integer().default(0).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("menu_items_menu_id_idx").using("btree", table.menuId.asc().nullsLast().op("uuid_ops")),
	index("menu_items_position_idx").using("btree", table.position.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.menuId],
			foreignColumns: [menus.id],
			name: "menu_items_menu_id_menus_id_fk"
		}).onDelete("cascade"),
]);

export const orderItems = pgTable("order_items", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	orderId: uuid("order_id").notNull(),
	productId: uuid("product_id").notNull(),
	productVariantId: uuid("product_variant_id").notNull(),
	productTitle: varchar("product_title", { length: 255 }).notNull(),
	variantTitle: varchar("variant_title", { length: 255 }).notNull(),
	quantity: integer().notNull(),
	price: numeric({ precision: 10, scale:  2 }).notNull(),
	totalAmount: numeric("total_amount", { precision: 10, scale:  2 }).notNull(),
	currencyCode: varchar("currency_code", { length: 3 }).default('NGN').notNull(),
	productImage: text("product_image"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("order_items_order_id_idx").using("btree", table.orderId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.orderId],
			foreignColumns: [orders.id],
			name: "order_items_order_id_orders_id_fk"
		}).onDelete("cascade"),
]);

export const paymentEvents = pgTable("payment_events", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	paymentTransactionId: uuid("payment_transaction_id").notNull(),
	provider: varchar({ length: 50 }).default('paystack').notNull(),
	reference: varchar({ length: 255 }).notNull(),
	source: varchar({ length: 50 }).notNull(),
	eventType: varchar("event_type", { length: 100 }).notNull(),
	status: varchar({ length: 50 }).notNull(),
	message: text(),
	payload: jsonb(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("payment_events_created_at_idx").using("btree", table.createdAt.asc().nullsLast().op("timestamp_ops")),
	index("payment_events_payment_transaction_id_idx").using("btree", table.paymentTransactionId.asc().nullsLast().op("uuid_ops")),
	index("payment_events_reference_idx").using("btree", table.reference.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.paymentTransactionId],
			foreignColumns: [paymentTransactions.id],
			name: "payment_events_payment_transaction_id_payment_transactions_id_f"
		}).onDelete("cascade"),
]);

export const collections = pgTable("collections", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	handle: varchar({ length: 255 }).notNull(),
	title: varchar({ length: 255 }).notNull(),
	description: text(),
	seoTitle: varchar("seo_title", { length: 255 }),
	seoDescription: text("seo_description"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("collections_handle_idx").using("btree", table.handle.asc().nullsLast().op("text_ops")),
	unique("collections_handle_unique").on(table.handle),
]);

export const productCollections = pgTable("product_collections", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	productId: uuid("product_id").notNull(),
	collectionId: uuid("collection_id").notNull(),
	position: integer().default(0).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("product_collections_collection_id_idx").using("btree", table.collectionId.asc().nullsLast().op("uuid_ops")),
	index("product_collections_product_id_idx").using("btree", table.productId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.collectionId],
			foreignColumns: [collections.id],
			name: "product_collections_collection_id_collections_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.productId],
			foreignColumns: [products.id],
			name: "product_collections_product_id_products_id_fk"
		}).onDelete("cascade"),
]);

export const productImages = pgTable("product_images", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	productId: uuid("product_id").notNull(),
	url: text().notNull(),
	altText: varchar("alt_text", { length: 255 }),
	width: integer(),
	height: integer(),
	position: integer().default(0).notNull(),
	isFeatured: boolean("is_featured").default(false).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("product_images_position_idx").using("btree", table.position.asc().nullsLast().op("int4_ops")),
	index("product_images_product_id_idx").using("btree", table.productId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.productId],
			foreignColumns: [products.id],
			name: "product_images_product_id_products_id_fk"
		}).onDelete("cascade"),
]);

export const productOptions = pgTable("product_options", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	productId: uuid("product_id").notNull(),
	name: varchar({ length: 100 }).notNull(),
	values: text().array().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.productId],
			foreignColumns: [products.id],
			name: "product_options_product_id_products_id_fk"
		}).onDelete("cascade"),
]);

export const reviews = pgTable("reviews", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	productId: uuid("product_id").notNull(),
	userId: uuid("user_id"),
	orderId: uuid("order_id"),
	rating: integer().notNull(),
	title: varchar({ length: 255 }),
	comment: text(),
	images: text().array().default([""]),
	isVerified: boolean("is_verified").default(false).notNull(),
	helpfulCount: integer("helpful_count").default(0).notNull(),
	status: varchar({ length: 50 }).default('pending').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("reviews_product_id_idx").using("btree", table.productId.asc().nullsLast().op("uuid_ops")),
	index("reviews_rating_idx").using("btree", table.rating.asc().nullsLast().op("int4_ops")),
	index("reviews_status_idx").using("btree", table.status.asc().nullsLast().op("text_ops")),
	index("reviews_user_id_idx").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.productId],
			foreignColumns: [products.id],
			name: "reviews_product_id_products_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "reviews_user_id_users_id_fk"
		}),
]);

export const reviewVotes = pgTable("review_votes", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	reviewId: uuid("review_id").notNull(),
	userId: uuid("user_id").notNull(),
	isHelpful: boolean("is_helpful").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	uniqueIndex("review_vote_unique").using("btree", table.reviewId.asc().nullsLast().op("uuid_ops"), table.userId.asc().nullsLast().op("uuid_ops")),
	index("review_votes_review_id_idx").using("btree", table.reviewId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.reviewId],
			foreignColumns: [reviews.id],
			name: "review_votes_review_id_reviews_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "review_votes_user_id_users_id_fk"
		}),
]);

export const carts = pgTable("carts", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	checkoutUrl: text("checkout_url"),
	totalQuantity: integer("total_quantity").default(0).notNull(),
	subtotalAmount: numeric("subtotal_amount", { precision: 10, scale:  2 }).default('0.00').notNull(),
	totalAmount: numeric("total_amount", { precision: 10, scale:  2 }).default('0.00').notNull(),
	totalTaxAmount: numeric("total_tax_amount", { precision: 10, scale:  2 }).default('0.00').notNull(),
	currencyCode: varchar("currency_code", { length: 3 }).default('NGN').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }),
	sessionId: varchar("session_id", { length: 255 }).notNull(),
}, (table) => [
	uniqueIndex("carts_session_id_unique").using("btree", table.sessionId.asc().nullsLast().op("text_ops")),
]);

export const adminPasswordResets = pgTable("admin_password_resets", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	adminId: uuid("admin_id").notNull(),
	email: varchar({ length: 255 }).notNull(),
	tokenHash: text("token_hash").notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }).notNull(),
	usedAt: timestamp("used_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("admin_password_resets_admin_id_idx").using("btree", table.adminId.asc().nullsLast().op("uuid_ops")),
	index("admin_password_resets_email_idx").using("btree", table.email.asc().nullsLast().op("text_ops")),
	index("admin_password_resets_expires_at_idx").using("btree", table.expiresAt.asc().nullsLast().op("timestamp_ops")),
	index("admin_password_resets_token_hash_idx").using("btree", table.tokenHash.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.adminId],
			foreignColumns: [adminUsers.id],
			name: "admin_password_resets_admin_id_admin_users_id_fk"
		}).onDelete("cascade"),
]);

export const campaignEmailLogs = pgTable("campaign_email_logs", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	campaignId: uuid("campaign_id").notNull(),
	subscriberEmail: varchar("subscriber_email", { length: 255 }).notNull(),
	status: varchar({ length: 50 }).default('sent').notNull(),
	sentAt: timestamp("sent_at", { mode: 'string' }).defaultNow().notNull(),
	openedAt: timestamp("opened_at", { mode: 'string' }),
	clickedAt: timestamp("clicked_at", { mode: 'string' }),
	bounceReason: varchar("bounce_reason", { length: 255 }),
	clickCount: integer("click_count").default(0).notNull(),
	resendMessageId: varchar("resend_message_id", { length: 255 }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("campaign_email_logs_campaign_id_idx").using("btree", table.campaignId.asc().nullsLast().op("uuid_ops")),
	index("campaign_email_logs_resend_message_id_idx").using("btree", table.resendMessageId.asc().nullsLast().op("text_ops")),
	index("campaign_email_logs_status_idx").using("btree", table.status.asc().nullsLast().op("text_ops")),
	index("campaign_email_logs_subscriber_email_idx").using("btree", table.subscriberEmail.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.campaignId],
			foreignColumns: [emailCampaigns.id],
			name: "campaign_email_logs_campaign_id_email_campaigns_id_fk"
		}).onDelete("cascade"),
]);

export const campaignProducts = pgTable("campaign_products", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	campaignId: uuid("campaign_id").notNull(),
	productId: uuid("product_id").notNull(),
	position: integer().default(0).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("campaign_products_campaign_id_idx").using("btree", table.campaignId.asc().nullsLast().op("uuid_ops")),
	index("campaign_products_product_id_idx").using("btree", table.productId.asc().nullsLast().op("uuid_ops")),
	uniqueIndex("campaign_products_unique").using("btree", table.campaignId.asc().nullsLast().op("uuid_ops"), table.productId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.campaignId],
			foreignColumns: [emailCampaigns.id],
			name: "campaign_products_campaign_id_email_campaigns_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.productId],
			foreignColumns: [products.id],
			name: "campaign_products_product_id_products_id_fk"
		}).onDelete("cascade"),
]);

export const emailCampaigns = pgTable("email_campaigns", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	type: varchar({ length: 50 }).notNull(),
	subject: varchar({ length: 255 }).notNull(),
	preheader: varchar({ length: 150 }),
	headerTitle: varchar("header_title", { length: 255 }),
	headerSubtitle: varchar("header_subtitle", { length: 255 }),
	footerText: text("footer_text"),
	ctaButtonText: varchar("cta_button_text", { length: 100 }),
	ctaButtonUrl: text("cta_button_url"),
	status: varchar({ length: 50 }).default('draft').notNull(),
	scheduledAt: timestamp("scheduled_at", { mode: 'string' }),
	sentAt: timestamp("sent_at", { mode: 'string' }),
	createdBy: uuid("created_by").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	heroImageUrl: text("hero_image_url"),
	discountPercentage: integer("discount_percentage"),
	couponCode: varchar("coupon_code", { length: 50 }),
	saleDeadline: timestamp("sale_deadline", { mode: 'string' }),
	discountNote: text("discount_note"),
}, (table) => [
	index("email_campaigns_created_by_idx").using("btree", table.createdBy.asc().nullsLast().op("uuid_ops")),
	index("email_campaigns_scheduled_at_idx").using("btree", table.scheduledAt.asc().nullsLast().op("timestamp_ops")),
	index("email_campaigns_status_idx").using("btree", table.status.asc().nullsLast().op("text_ops")),
	index("email_campaigns_type_idx").using("btree", table.type.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [adminUsers.id],
			name: "email_campaigns_created_by_admin_users_id_fk"
		}).onDelete("set null"),
]);
