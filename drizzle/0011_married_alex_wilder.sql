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
	"reminder_count" integer DEFAULT 0 NOT NULL,
	"last_reminder_at" timestamp,
	"expired_notification_sent_at" timestamp,
	"created_by" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
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
	"updated_at" timestamp DEFAULT now() NOT NULL
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
ALTER TABLE "carts" ADD COLUMN "session_id" varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE "carts" ADD COLUMN "expires_at" timestamp;--> statement-breakpoint
ALTER TABLE "coupons" ADD COLUMN "grants_free_shipping" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "coupons" ADD COLUMN "include_shipping_in_discount" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "order_type" varchar(20) DEFAULT 'catalog' NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "custom_order_request_id" uuid;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "payment_transaction_id" uuid;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "payment_provider" varchar(50) DEFAULT 'paystack';--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "payment_reference" varchar(255);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "has_password" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "admin_password_resets" ADD CONSTRAINT "admin_password_resets_admin_id_admin_users_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."admin_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_email_logs" ADD CONSTRAINT "campaign_email_logs_campaign_id_email_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."email_campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_products" ADD CONSTRAINT "campaign_products_campaign_id_email_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."email_campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_products" ADD CONSTRAINT "campaign_products_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "custom_order_quote_tokens" ADD CONSTRAINT "custom_order_quote_tokens_quote_id_custom_order_quotes_id_fk" FOREIGN KEY ("quote_id") REFERENCES "public"."custom_order_quotes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "custom_order_quotes" ADD CONSTRAINT "custom_order_quotes_request_id_custom_order_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."custom_order_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_campaigns" ADD CONSTRAINT "email_campaigns_created_by_admin_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."admin_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "google_merchant_product_syncs" ADD CONSTRAINT "google_merchant_product_syncs_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_events" ADD CONSTRAINT "payment_events_payment_transaction_id_payment_transactions_id_fk" FOREIGN KEY ("payment_transaction_id") REFERENCES "public"."payment_transactions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "admin_password_resets_admin_id_idx" ON "admin_password_resets" USING btree ("admin_id");--> statement-breakpoint
CREATE INDEX "admin_password_resets_email_idx" ON "admin_password_resets" USING btree ("email");--> statement-breakpoint
CREATE INDEX "admin_password_resets_token_hash_idx" ON "admin_password_resets" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "admin_password_resets_expires_at_idx" ON "admin_password_resets" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "campaign_email_logs_campaign_id_idx" ON "campaign_email_logs" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX "campaign_email_logs_subscriber_email_idx" ON "campaign_email_logs" USING btree ("subscriber_email");--> statement-breakpoint
CREATE INDEX "campaign_email_logs_status_idx" ON "campaign_email_logs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "campaign_email_logs_resend_message_id_idx" ON "campaign_email_logs" USING btree ("resend_message_id");--> statement-breakpoint
CREATE INDEX "campaign_products_campaign_id_idx" ON "campaign_products" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX "campaign_products_product_id_idx" ON "campaign_products" USING btree ("product_id");--> statement-breakpoint
CREATE UNIQUE INDEX "campaign_products_unique" ON "campaign_products" USING btree ("campaign_id","product_id");--> statement-breakpoint
CREATE INDEX "custom_order_quote_tokens_quote_id_idx" ON "custom_order_quote_tokens" USING btree ("quote_id");--> statement-breakpoint
CREATE INDEX "custom_order_quote_tokens_email_idx" ON "custom_order_quote_tokens" USING btree ("email");--> statement-breakpoint
CREATE INDEX "custom_order_quote_tokens_expires_at_idx" ON "custom_order_quote_tokens" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "custom_order_quotes_request_id_idx" ON "custom_order_quotes" USING btree ("request_id");--> statement-breakpoint
CREATE INDEX "custom_order_quotes_status_idx" ON "custom_order_quotes" USING btree ("status");--> statement-breakpoint
CREATE INDEX "custom_order_quotes_expires_at_idx" ON "custom_order_quotes" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "custom_order_quotes_reminder_count_idx" ON "custom_order_quotes" USING btree ("reminder_count");--> statement-breakpoint
CREATE UNIQUE INDEX "custom_order_quotes_request_version_unique" ON "custom_order_quotes" USING btree ("request_id","version");--> statement-breakpoint
CREATE INDEX "custom_order_requests_request_number_idx" ON "custom_order_requests" USING btree ("request_number");--> statement-breakpoint
CREATE INDEX "custom_order_requests_user_id_idx" ON "custom_order_requests" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "custom_order_requests_email_idx" ON "custom_order_requests" USING btree ("email");--> statement-breakpoint
CREATE INDEX "custom_order_requests_status_idx" ON "custom_order_requests" USING btree ("status");--> statement-breakpoint
CREATE INDEX "custom_order_requests_updated_at_idx" ON "custom_order_requests" USING btree ("updated_at");--> statement-breakpoint
CREATE UNIQUE INDEX "custom_order_requests_converted_order_unique" ON "custom_order_requests" USING btree ("converted_order_id");--> statement-breakpoint
CREATE INDEX "email_campaigns_created_by_idx" ON "email_campaigns" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "email_campaigns_status_idx" ON "email_campaigns" USING btree ("status");--> statement-breakpoint
CREATE INDEX "email_campaigns_scheduled_at_idx" ON "email_campaigns" USING btree ("scheduled_at");--> statement-breakpoint
CREATE INDEX "email_campaigns_type_idx" ON "email_campaigns" USING btree ("type");--> statement-breakpoint
CREATE INDEX "email_otps_email_idx" ON "email_otps" USING btree ("email");--> statement-breakpoint
CREATE INDEX "email_otps_purpose_idx" ON "email_otps" USING btree ("purpose");--> statement-breakpoint
CREATE INDEX "email_otps_expires_at_idx" ON "email_otps" USING btree ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "google_merchant_product_sync_product_merchant_unique" ON "google_merchant_product_syncs" USING btree ("product_id","merchant_id");--> statement-breakpoint
CREATE INDEX "google_merchant_product_sync_merchant_id_idx" ON "google_merchant_product_syncs" USING btree ("merchant_id");--> statement-breakpoint
CREATE INDEX "google_merchant_product_sync_sync_status_idx" ON "google_merchant_product_syncs" USING btree ("sync_status");--> statement-breakpoint
CREATE INDEX "google_merchant_product_sync_last_synced_at_idx" ON "google_merchant_product_syncs" USING btree ("last_synced_at");--> statement-breakpoint
CREATE INDEX "payment_events_payment_transaction_id_idx" ON "payment_events" USING btree ("payment_transaction_id");--> statement-breakpoint
CREATE INDEX "payment_events_reference_idx" ON "payment_events" USING btree ("reference");--> statement-breakpoint
CREATE INDEX "payment_events_created_at_idx" ON "payment_events" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "payment_transactions_provider_reference_unique" ON "payment_transactions" USING btree ("provider","reference");--> statement-breakpoint
CREATE INDEX "payment_transactions_status_idx" ON "payment_transactions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "payment_transactions_source_idx" ON "payment_transactions" USING btree ("source");--> statement-breakpoint
CREATE INDEX "payment_transactions_created_at_idx" ON "payment_transactions" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "payment_transactions_order_id_idx" ON "payment_transactions" USING btree ("order_id");--> statement-breakpoint
CREATE UNIQUE INDEX "payment_transactions_order_id_unique" ON "payment_transactions" USING btree ("order_id");--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_custom_order_request_id_custom_order_requests_id_fk" FOREIGN KEY ("custom_order_request_id") REFERENCES "public"."custom_order_requests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "carts_session_id_unique" ON "carts" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "orders_order_type_idx" ON "orders" USING btree ("order_type");--> statement-breakpoint
CREATE INDEX "orders_custom_order_request_id_idx" ON "orders" USING btree ("custom_order_request_id");--> statement-breakpoint
CREATE INDEX "orders_payment_transaction_id_idx" ON "orders" USING btree ("payment_transaction_id");--> statement-breakpoint
CREATE INDEX "orders_payment_reference_idx" ON "orders" USING btree ("payment_reference");--> statement-breakpoint
CREATE UNIQUE INDEX "orders_custom_order_request_unique" ON "orders" USING btree ("custom_order_request_id");--> statement-breakpoint
CREATE UNIQUE INDEX "orders_payment_transaction_unique" ON "orders" USING btree ("payment_transaction_id");