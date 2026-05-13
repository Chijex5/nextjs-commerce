-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE TABLE "size_guides" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_type" varchar(100) NOT NULL,
	"title" varchar(255) NOT NULL,
	"sizes_chart" jsonb NOT NULL,
	"measurements" jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "testimonials" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_name" varchar(255) NOT NULL,
	"role" varchar(255),
	"content" text NOT NULL,
	"rating" integer NOT NULL,
	"image" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "custom_orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(255) NOT NULL,
	"customer_story" text,
	"before_image" text,
	"after_image" text,
	"details" jsonb,
	"completion_time" varchar(100),
	"position" integer DEFAULT 0 NOT NULL,
	"is_published" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "magic_link_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"used_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "admin_users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"name" varchar(255),
	"password_hash" text NOT NULL,
	"role" varchar(50) DEFAULT 'admin' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_login_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "admin_users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "newsletter_subscribers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"name" varchar(255),
	"status" varchar(50) DEFAULT 'active' NOT NULL,
	"subscribed_at" timestamp DEFAULT now() NOT NULL,
	"unsubscribed_at" timestamp,
	CONSTRAINT "newsletter_subscribers_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "pages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"handle" varchar(255) NOT NULL,
	"title" varchar(255) NOT NULL,
	"body" text,
	"body_summary" text,
	"seo_title" varchar(255),
	"seo_description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "pages_handle_unique" UNIQUE("handle")
);
--> statement-breakpoint
CREATE TABLE "email_otps" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"otp_hash" text NOT NULL,
	"purpose" varchar(50) NOT NULL,
	"expires_at" timestamp NOT NULL,
	"used_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "coupons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(50) NOT NULL,
	"description" text,
	"discount_type" varchar(20) NOT NULL,
	"discount_value" numeric(10, 2) NOT NULL,
	"min_order_value" numeric(10, 2),
	"max_uses" integer,
	"used_count" integer DEFAULT 0 NOT NULL,
	"max_uses_per_user" integer,
	"requires_login" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"start_date" timestamp,
	"expiry_date" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"grants_free_shipping" boolean DEFAULT false NOT NULL,
	"include_shipping_in_discount" boolean DEFAULT false NOT NULL,
	CONSTRAINT "coupons_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"order_number" varchar(50) NOT NULL,
	"email" varchar(255) NOT NULL,
	"phone" varchar(50),
	"customer_name" varchar(255) NOT NULL,
	"shipping_address" jsonb NOT NULL,
	"billing_address" jsonb,
	"status" varchar(50) DEFAULT 'pending' NOT NULL,
	"delivery_status" varchar(50) DEFAULT 'production' NOT NULL,
	"estimated_arrival" timestamp,
	"subtotal_amount" numeric(10, 2) NOT NULL,
	"tax_amount" numeric(10, 2) DEFAULT '0.00' NOT NULL,
	"shipping_amount" numeric(10, 2) DEFAULT '0.00' NOT NULL,
	"discount_amount" numeric(10, 2) DEFAULT '0.00' NOT NULL,
	"coupon_code" varchar(50),
	"total_amount" numeric(10, 2) NOT NULL,
	"currency_code" varchar(3) DEFAULT 'NGN' NOT NULL,
	"notes" text,
	"tracking_number" varchar(100),
	"acknowledged_at" timestamp,
	"acknowledged_by" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"order_type" varchar(20) DEFAULT 'catalog' NOT NULL,
	"custom_order_request_id" uuid,
	"payment_transaction_id" uuid,
	"payment_provider" varchar(50) DEFAULT 'paystack',
	"payment_reference" varchar(255),
	CONSTRAINT "orders_order_number_unique" UNIQUE("order_number")
);
--> statement-breakpoint
CREATE TABLE "custom_order_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"request_number" varchar(50) NOT NULL,
	"user_id" uuid,
	"email" varchar(255) NOT NULL,
	"phone" varchar(50),
	"customer_name" varchar(255) NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"size_notes" text,
	"color_preferences" text,
	"budget_min" numeric(10, 2),
	"budget_max" numeric(10, 2),
	"desired_date" timestamp,
	"reference_images" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"status" varchar(50) DEFAULT 'submitted' NOT NULL,
	"admin_notes" text,
	"customer_notes" text,
	"quoted_amount" numeric(10, 2),
	"currency_code" varchar(3) DEFAULT 'NGN' NOT NULL,
	"quote_expires_at" timestamp,
	"paid_at" timestamp,
	"converted_order_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "custom_order_requests_request_number_unique" UNIQUE("request_number")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"name" varchar(255),
	"password_hash" text NOT NULL,
	"phone" varchar(50),
	"shipping_address" jsonb,
	"billing_address" jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_login_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"has_password" boolean DEFAULT false NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "payment_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider" varchar(50) DEFAULT 'paystack' NOT NULL,
	"reference" varchar(255) NOT NULL,
	"source" varchar(50) NOT NULL,
	"status" varchar(50) DEFAULT 'initialized' NOT NULL,
	"amount" integer NOT NULL,
	"currency_code" varchar(3) DEFAULT 'NGN' NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"paystack_status" varchar(50),
	"customer" jsonb,
	"payload" jsonb,
	"order_id" uuid,
	"conflict_code" varchar(100),
	"conflict_message" text,
	"last_verified_at" timestamp,
	"resolved_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "abandoned_carts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"cart_id" uuid NOT NULL,
	"email" varchar(255) NOT NULL,
	"customer_name" varchar(255) NOT NULL,
	"cart_total" numeric(10, 2) NOT NULL,
	"items" jsonb NOT NULL,
	"email_sent" boolean DEFAULT false NOT NULL,
	"email_sent_at" timestamp,
	"recovered" boolean DEFAULT false NOT NULL,
	"recovered_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cart_lines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cart_id" uuid NOT NULL,
	"product_variant_id" uuid NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"total_amount" numeric(10, 2) DEFAULT '0.00' NOT NULL,
	"currency_code" varchar(3) DEFAULT 'NGN' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_variants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	"currency_code" varchar(3) DEFAULT 'NGN' NOT NULL,
	"available_for_sale" boolean DEFAULT true NOT NULL,
	"selected_options" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "coupon_usage" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"coupon_id" uuid NOT NULL,
	"user_id" uuid,
	"session_id" varchar(255),
	"used_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "custom_order_quotes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"request_id" uuid NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"currency_code" varchar(3) DEFAULT 'NGN' NOT NULL,
	"breakdown" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"note" text,
	"status" varchar(50) DEFAULT 'sent' NOT NULL,
	"expires_at" timestamp,
	"created_by" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"reminder_count" integer DEFAULT 0 NOT NULL,
	"last_reminder_at" timestamp,
	"expired_notification_sent_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "custom_order_quote_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"quote_id" uuid NOT NULL,
	"email" varchar(255) NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"used_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"handle" varchar(255) NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"description_html" text,
	"available_for_sale" boolean DEFAULT true NOT NULL,
	"seo_title" varchar(255),
	"seo_description" text,
	"tags" text[] DEFAULT '{""}',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "products_handle_unique" UNIQUE("handle")
);
--> statement-breakpoint
CREATE TABLE "google_merchant_product_syncs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"merchant_id" varchar(64) NOT NULL,
	"offer_id" varchar(255) NOT NULL,
	"google_product_id" varchar(255),
	"sync_status" varchar(20) DEFAULT 'pending' NOT NULL,
	"last_error" text,
	"payload" jsonb,
	"last_synced_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "menus" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"handle" varchar(255) NOT NULL,
	"title" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "menus_handle_unique" UNIQUE("handle")
);
--> statement-breakpoint
CREATE TABLE "menu_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"menu_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"url" text NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"product_variant_id" uuid NOT NULL,
	"product_title" varchar(255) NOT NULL,
	"variant_title" varchar(255) NOT NULL,
	"quantity" integer NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	"total_amount" numeric(10, 2) NOT NULL,
	"currency_code" varchar(3) DEFAULT 'NGN' NOT NULL,
	"product_image" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"payment_transaction_id" uuid NOT NULL,
	"provider" varchar(50) DEFAULT 'paystack' NOT NULL,
	"reference" varchar(255) NOT NULL,
	"source" varchar(50) NOT NULL,
	"event_type" varchar(100) NOT NULL,
	"status" varchar(50) NOT NULL,
	"message" text,
	"payload" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "collections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"handle" varchar(255) NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"seo_title" varchar(255),
	"seo_description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "collections_handle_unique" UNIQUE("handle")
);
--> statement-breakpoint
CREATE TABLE "product_collections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"collection_id" uuid NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"url" text NOT NULL,
	"alt_text" varchar(255),
	"width" integer,
	"height" integer,
	"position" integer DEFAULT 0 NOT NULL,
	"is_featured" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_options" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"values" text[] NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"user_id" uuid,
	"order_id" uuid,
	"rating" integer NOT NULL,
	"title" varchar(255),
	"comment" text,
	"images" text[] DEFAULT '{""}',
	"is_verified" boolean DEFAULT false NOT NULL,
	"helpful_count" integer DEFAULT 0 NOT NULL,
	"status" varchar(50) DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "review_votes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"review_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"is_helpful" boolean NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "carts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"checkout_url" text,
	"total_quantity" integer DEFAULT 0 NOT NULL,
	"subtotal_amount" numeric(10, 2) DEFAULT '0.00' NOT NULL,
	"total_amount" numeric(10, 2) DEFAULT '0.00' NOT NULL,
	"total_tax_amount" numeric(10, 2) DEFAULT '0.00' NOT NULL,
	"currency_code" varchar(3) DEFAULT 'NGN' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp,
	"session_id" varchar(255) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "admin_password_resets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"admin_id" uuid NOT NULL,
	"email" varchar(255) NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"used_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "campaign_email_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campaign_id" uuid NOT NULL,
	"subscriber_email" varchar(255) NOT NULL,
	"status" varchar(50) DEFAULT 'sent' NOT NULL,
	"sent_at" timestamp DEFAULT now() NOT NULL,
	"opened_at" timestamp,
	"clicked_at" timestamp,
	"bounce_reason" varchar(255),
	"click_count" integer DEFAULT 0 NOT NULL,
	"resend_message_id" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "campaign_products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campaign_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_campaigns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"type" varchar(50) NOT NULL,
	"subject" varchar(255) NOT NULL,
	"preheader" varchar(150),
	"header_title" varchar(255),
	"header_subtitle" varchar(255),
	"footer_text" text,
	"cta_button_text" varchar(100),
	"cta_button_url" text,
	"status" varchar(50) DEFAULT 'draft' NOT NULL,
	"scheduled_at" timestamp,
	"sent_at" timestamp,
	"created_by" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"hero_image_url" text,
	"discount_percentage" integer,
	"coupon_code" varchar(50),
	"sale_deadline" timestamp,
	"discount_note" text
);
--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_custom_order_request_id_custom_order_requests_id_fk" FOREIGN KEY ("custom_order_request_id") REFERENCES "public"."custom_order_requests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "abandoned_carts" ADD CONSTRAINT "abandoned_carts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cart_lines" ADD CONSTRAINT "cart_lines_cart_id_carts_id_fk" FOREIGN KEY ("cart_id") REFERENCES "public"."carts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cart_lines" ADD CONSTRAINT "cart_lines_product_variant_id_product_variants_id_fk" FOREIGN KEY ("product_variant_id") REFERENCES "public"."product_variants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupon_usage" ADD CONSTRAINT "coupon_usage_coupon_id_coupons_id_fk" FOREIGN KEY ("coupon_id") REFERENCES "public"."coupons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "custom_order_quotes" ADD CONSTRAINT "custom_order_quotes_request_id_custom_order_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."custom_order_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "custom_order_quote_tokens" ADD CONSTRAINT "custom_order_quote_tokens_quote_id_custom_order_quotes_id_fk" FOREIGN KEY ("quote_id") REFERENCES "public"."custom_order_quotes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "google_merchant_product_syncs" ADD CONSTRAINT "google_merchant_product_syncs_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "menu_items" ADD CONSTRAINT "menu_items_menu_id_menus_id_fk" FOREIGN KEY ("menu_id") REFERENCES "public"."menus"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_events" ADD CONSTRAINT "payment_events_payment_transaction_id_payment_transactions_id_f" FOREIGN KEY ("payment_transaction_id") REFERENCES "public"."payment_transactions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_collections" ADD CONSTRAINT "product_collections_collection_id_collections_id_fk" FOREIGN KEY ("collection_id") REFERENCES "public"."collections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_collections" ADD CONSTRAINT "product_collections_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_images" ADD CONSTRAINT "product_images_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_options" ADD CONSTRAINT "product_options_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_votes" ADD CONSTRAINT "review_votes_review_id_reviews_id_fk" FOREIGN KEY ("review_id") REFERENCES "public"."reviews"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_votes" ADD CONSTRAINT "review_votes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_password_resets" ADD CONSTRAINT "admin_password_resets_admin_id_admin_users_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."admin_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_email_logs" ADD CONSTRAINT "campaign_email_logs_campaign_id_email_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."email_campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_products" ADD CONSTRAINT "campaign_products_campaign_id_email_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."email_campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_products" ADD CONSTRAINT "campaign_products_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_campaigns" ADD CONSTRAINT "email_campaigns_created_by_admin_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."admin_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "size_guides_product_type_idx" ON "size_guides" USING btree ("product_type" text_ops);--> statement-breakpoint
CREATE INDEX "testimonials_is_active_idx" ON "testimonials" USING btree ("is_active" bool_ops);--> statement-breakpoint
CREATE INDEX "testimonials_position_idx" ON "testimonials" USING btree ("position" int4_ops);--> statement-breakpoint
CREATE INDEX "custom_orders_is_published_idx" ON "custom_orders" USING btree ("is_published" bool_ops);--> statement-breakpoint
CREATE INDEX "custom_orders_position_idx" ON "custom_orders" USING btree ("position" int4_ops);--> statement-breakpoint
CREATE INDEX "magic_link_tokens_email_idx" ON "magic_link_tokens" USING btree ("email" text_ops);--> statement-breakpoint
CREATE INDEX "magic_link_tokens_expires_at_idx" ON "magic_link_tokens" USING btree ("expires_at" timestamp_ops);--> statement-breakpoint
CREATE INDEX "admin_users_email_idx" ON "admin_users" USING btree ("email" text_ops);--> statement-breakpoint
CREATE INDEX "newsletter_subscribers_email_idx" ON "newsletter_subscribers" USING btree ("email" text_ops);--> statement-breakpoint
CREATE INDEX "newsletter_subscribers_status_idx" ON "newsletter_subscribers" USING btree ("status" text_ops);--> statement-breakpoint
CREATE INDEX "pages_handle_idx" ON "pages" USING btree ("handle" text_ops);--> statement-breakpoint
CREATE INDEX "email_otps_email_idx" ON "email_otps" USING btree ("email" text_ops);--> statement-breakpoint
CREATE INDEX "email_otps_expires_at_idx" ON "email_otps" USING btree ("expires_at" timestamp_ops);--> statement-breakpoint
CREATE INDEX "email_otps_purpose_idx" ON "email_otps" USING btree ("purpose" text_ops);--> statement-breakpoint
CREATE INDEX "coupons_code_idx" ON "coupons" USING btree ("code" text_ops);--> statement-breakpoint
CREATE INDEX "coupons_is_active_idx" ON "coupons" USING btree ("is_active" bool_ops);--> statement-breakpoint
CREATE INDEX "orders_custom_order_request_id_idx" ON "orders" USING btree ("custom_order_request_id" uuid_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "orders_custom_order_request_unique" ON "orders" USING btree ("custom_order_request_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "orders_delivery_status_idx" ON "orders" USING btree ("delivery_status" text_ops);--> statement-breakpoint
CREATE INDEX "orders_email_idx" ON "orders" USING btree ("email" text_ops);--> statement-breakpoint
CREATE INDEX "orders_order_number_idx" ON "orders" USING btree ("order_number" text_ops);--> statement-breakpoint
CREATE INDEX "orders_order_type_idx" ON "orders" USING btree ("order_type" text_ops);--> statement-breakpoint
CREATE INDEX "orders_payment_reference_idx" ON "orders" USING btree ("payment_reference" text_ops);--> statement-breakpoint
CREATE INDEX "orders_payment_transaction_id_idx" ON "orders" USING btree ("payment_transaction_id" uuid_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "orders_payment_transaction_unique" ON "orders" USING btree ("payment_transaction_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "orders_status_idx" ON "orders" USING btree ("status" text_ops);--> statement-breakpoint
CREATE INDEX "orders_user_id_idx" ON "orders" USING btree ("user_id" uuid_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "custom_order_requests_converted_order_unique" ON "custom_order_requests" USING btree ("converted_order_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "custom_order_requests_email_idx" ON "custom_order_requests" USING btree ("email" text_ops);--> statement-breakpoint
CREATE INDEX "custom_order_requests_request_number_idx" ON "custom_order_requests" USING btree ("request_number" text_ops);--> statement-breakpoint
CREATE INDEX "custom_order_requests_status_idx" ON "custom_order_requests" USING btree ("status" text_ops);--> statement-breakpoint
CREATE INDEX "custom_order_requests_updated_at_idx" ON "custom_order_requests" USING btree ("updated_at" timestamp_ops);--> statement-breakpoint
CREATE INDEX "custom_order_requests_user_id_idx" ON "custom_order_requests" USING btree ("user_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "users_email_idx" ON "users" USING btree ("email" text_ops);--> statement-breakpoint
CREATE INDEX "payment_transactions_created_at_idx" ON "payment_transactions" USING btree ("created_at" timestamp_ops);--> statement-breakpoint
CREATE INDEX "payment_transactions_order_id_idx" ON "payment_transactions" USING btree ("order_id" uuid_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "payment_transactions_order_id_unique" ON "payment_transactions" USING btree ("order_id" uuid_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "payment_transactions_provider_reference_unique" ON "payment_transactions" USING btree ("provider" text_ops,"reference" text_ops);--> statement-breakpoint
CREATE INDEX "payment_transactions_source_idx" ON "payment_transactions" USING btree ("source" text_ops);--> statement-breakpoint
CREATE INDEX "payment_transactions_status_idx" ON "payment_transactions" USING btree ("status" text_ops);--> statement-breakpoint
CREATE INDEX "abandoned_carts_email_sent_idx" ON "abandoned_carts" USING btree ("email_sent" bool_ops);--> statement-breakpoint
CREATE INDEX "abandoned_carts_expires_at_idx" ON "abandoned_carts" USING btree ("expires_at" timestamp_ops);--> statement-breakpoint
CREATE INDEX "abandoned_carts_user_id_idx" ON "abandoned_carts" USING btree ("user_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "cart_lines_cart_id_idx" ON "cart_lines" USING btree ("cart_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "cart_lines_variant_id_idx" ON "cart_lines" USING btree ("product_variant_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "product_variants_product_id_idx" ON "product_variants" USING btree ("product_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "coupon_usage_coupon_id_idx" ON "coupon_usage" USING btree ("coupon_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "coupon_usage_session_id_idx" ON "coupon_usage" USING btree ("session_id" text_ops);--> statement-breakpoint
CREATE INDEX "coupon_usage_user_id_idx" ON "coupon_usage" USING btree ("user_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "custom_order_quotes_expires_at_idx" ON "custom_order_quotes" USING btree ("expires_at" timestamp_ops);--> statement-breakpoint
CREATE INDEX "custom_order_quotes_reminder_count_idx" ON "custom_order_quotes" USING btree ("reminder_count" int4_ops);--> statement-breakpoint
CREATE INDEX "custom_order_quotes_request_id_idx" ON "custom_order_quotes" USING btree ("request_id" uuid_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "custom_order_quotes_request_version_unique" ON "custom_order_quotes" USING btree ("request_id" int4_ops,"version" int4_ops);--> statement-breakpoint
CREATE INDEX "custom_order_quotes_status_idx" ON "custom_order_quotes" USING btree ("status" text_ops);--> statement-breakpoint
CREATE INDEX "custom_order_quote_tokens_email_idx" ON "custom_order_quote_tokens" USING btree ("email" text_ops);--> statement-breakpoint
CREATE INDEX "custom_order_quote_tokens_expires_at_idx" ON "custom_order_quote_tokens" USING btree ("expires_at" timestamp_ops);--> statement-breakpoint
CREATE INDEX "custom_order_quote_tokens_quote_id_idx" ON "custom_order_quote_tokens" USING btree ("quote_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "products_handle_idx" ON "products" USING btree ("handle" text_ops);--> statement-breakpoint
CREATE INDEX "products_tags_idx" ON "products" USING btree ("tags" array_ops);--> statement-breakpoint
CREATE INDEX "google_merchant_product_sync_last_synced_at_idx" ON "google_merchant_product_syncs" USING btree ("last_synced_at" timestamp_ops);--> statement-breakpoint
CREATE INDEX "google_merchant_product_sync_merchant_id_idx" ON "google_merchant_product_syncs" USING btree ("merchant_id" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "google_merchant_product_sync_product_merchant_unique" ON "google_merchant_product_syncs" USING btree ("product_id" text_ops,"merchant_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "google_merchant_product_sync_sync_status_idx" ON "google_merchant_product_syncs" USING btree ("sync_status" text_ops);--> statement-breakpoint
CREATE INDEX "menu_items_menu_id_idx" ON "menu_items" USING btree ("menu_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "menu_items_position_idx" ON "menu_items" USING btree ("position" int4_ops);--> statement-breakpoint
CREATE INDEX "order_items_order_id_idx" ON "order_items" USING btree ("order_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "payment_events_created_at_idx" ON "payment_events" USING btree ("created_at" timestamp_ops);--> statement-breakpoint
CREATE INDEX "payment_events_payment_transaction_id_idx" ON "payment_events" USING btree ("payment_transaction_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "payment_events_reference_idx" ON "payment_events" USING btree ("reference" text_ops);--> statement-breakpoint
CREATE INDEX "collections_handle_idx" ON "collections" USING btree ("handle" text_ops);--> statement-breakpoint
CREATE INDEX "product_collections_collection_id_idx" ON "product_collections" USING btree ("collection_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "product_collections_product_id_idx" ON "product_collections" USING btree ("product_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "product_images_position_idx" ON "product_images" USING btree ("position" int4_ops);--> statement-breakpoint
CREATE INDEX "product_images_product_id_idx" ON "product_images" USING btree ("product_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "reviews_product_id_idx" ON "reviews" USING btree ("product_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "reviews_rating_idx" ON "reviews" USING btree ("rating" int4_ops);--> statement-breakpoint
CREATE INDEX "reviews_status_idx" ON "reviews" USING btree ("status" text_ops);--> statement-breakpoint
CREATE INDEX "reviews_user_id_idx" ON "reviews" USING btree ("user_id" uuid_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "review_vote_unique" ON "review_votes" USING btree ("review_id" uuid_ops,"user_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "review_votes_review_id_idx" ON "review_votes" USING btree ("review_id" uuid_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "carts_session_id_unique" ON "carts" USING btree ("session_id" text_ops);--> statement-breakpoint
CREATE INDEX "admin_password_resets_admin_id_idx" ON "admin_password_resets" USING btree ("admin_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "admin_password_resets_email_idx" ON "admin_password_resets" USING btree ("email" text_ops);--> statement-breakpoint
CREATE INDEX "admin_password_resets_expires_at_idx" ON "admin_password_resets" USING btree ("expires_at" timestamp_ops);--> statement-breakpoint
CREATE INDEX "admin_password_resets_token_hash_idx" ON "admin_password_resets" USING btree ("token_hash" text_ops);--> statement-breakpoint
CREATE INDEX "campaign_email_logs_campaign_id_idx" ON "campaign_email_logs" USING btree ("campaign_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "campaign_email_logs_resend_message_id_idx" ON "campaign_email_logs" USING btree ("resend_message_id" text_ops);--> statement-breakpoint
CREATE INDEX "campaign_email_logs_status_idx" ON "campaign_email_logs" USING btree ("status" text_ops);--> statement-breakpoint
CREATE INDEX "campaign_email_logs_subscriber_email_idx" ON "campaign_email_logs" USING btree ("subscriber_email" text_ops);--> statement-breakpoint
CREATE INDEX "campaign_products_campaign_id_idx" ON "campaign_products" USING btree ("campaign_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "campaign_products_product_id_idx" ON "campaign_products" USING btree ("product_id" uuid_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "campaign_products_unique" ON "campaign_products" USING btree ("campaign_id" uuid_ops,"product_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "email_campaigns_created_by_idx" ON "email_campaigns" USING btree ("created_by" uuid_ops);--> statement-breakpoint
CREATE INDEX "email_campaigns_scheduled_at_idx" ON "email_campaigns" USING btree ("scheduled_at" timestamp_ops);--> statement-breakpoint
CREATE INDEX "email_campaigns_status_idx" ON "email_campaigns" USING btree ("status" text_ops);--> statement-breakpoint
CREATE INDEX "email_campaigns_type_idx" ON "email_campaigns" USING btree ("type" text_ops);
*/