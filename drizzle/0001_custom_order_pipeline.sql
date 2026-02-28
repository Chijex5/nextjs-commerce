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
	"updated_at" timestamp DEFAULT now() NOT NULL
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
ALTER TABLE "orders" ADD COLUMN "order_type" varchar(20) DEFAULT 'catalog' NOT NULL;
--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "custom_order_request_id" uuid;
--> statement-breakpoint
ALTER TABLE "custom_order_requests" ADD CONSTRAINT "custom_order_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "custom_order_requests" ADD CONSTRAINT "custom_order_requests_converted_order_id_orders_id_fk" FOREIGN KEY ("converted_order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "custom_order_quotes" ADD CONSTRAINT "custom_order_quotes_request_id_custom_order_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."custom_order_requests"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "custom_order_quote_tokens" ADD CONSTRAINT "custom_order_quote_tokens_quote_id_custom_order_quotes_id_fk" FOREIGN KEY ("quote_id") REFERENCES "public"."custom_order_quotes"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_custom_order_request_id_custom_order_requests_id_fk" FOREIGN KEY ("custom_order_request_id") REFERENCES "public"."custom_order_requests"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "custom_order_requests_request_number_idx" ON "custom_order_requests" USING btree ("request_number");
--> statement-breakpoint
CREATE INDEX "custom_order_requests_user_id_idx" ON "custom_order_requests" USING btree ("user_id");
--> statement-breakpoint
CREATE INDEX "custom_order_requests_email_idx" ON "custom_order_requests" USING btree ("email");
--> statement-breakpoint
CREATE INDEX "custom_order_requests_status_idx" ON "custom_order_requests" USING btree ("status");
--> statement-breakpoint
CREATE UNIQUE INDEX "custom_order_requests_converted_order_unique" ON "custom_order_requests" USING btree ("converted_order_id");
--> statement-breakpoint
CREATE INDEX "custom_order_quotes_request_id_idx" ON "custom_order_quotes" USING btree ("request_id");
--> statement-breakpoint
CREATE INDEX "custom_order_quotes_status_idx" ON "custom_order_quotes" USING btree ("status");
--> statement-breakpoint
CREATE UNIQUE INDEX "custom_order_quotes_request_version_unique" ON "custom_order_quotes" USING btree ("request_id","version");
--> statement-breakpoint
CREATE INDEX "custom_order_quote_tokens_quote_id_idx" ON "custom_order_quote_tokens" USING btree ("quote_id");
--> statement-breakpoint
CREATE INDEX "custom_order_quote_tokens_email_idx" ON "custom_order_quote_tokens" USING btree ("email");
--> statement-breakpoint
CREATE INDEX "custom_order_quote_tokens_expires_at_idx" ON "custom_order_quote_tokens" USING btree ("expires_at");
--> statement-breakpoint
CREATE INDEX "orders_order_type_idx" ON "orders" USING btree ("order_type");
--> statement-breakpoint
CREATE INDEX "orders_custom_order_request_id_idx" ON "orders" USING btree ("custom_order_request_id");
