CREATE TABLE "custom_edit_options" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(120) NOT NULL,
	"description" text,
	"price" numeric(10, 2) DEFAULT '0' NOT NULL,
	"image" text,
	"detail_prompt" varchar(120),
	"needs_review" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "custom_edit_options_price_check" CHECK ("custom_edit_options"."price" >= 0)
);
--> statement-breakpoint
CREATE TABLE "custom_request_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"request_id" uuid NOT NULL,
	"author" varchar(20) NOT NULL,
	"author_name" varchar(255),
	"body" text NOT NULL,
	"attachments" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "custom_request_messages_author_check" CHECK ("custom_request_messages"."author" in ('customer', 'admin', 'system'))
);
--> statement-breakpoint
CREATE TABLE "store_settings" (
	"key" varchar(100) PRIMARY KEY NOT NULL,
	"value" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "custom_order_requests" DROP CONSTRAINT "custom_order_requests_status_check";--> statement-breakpoint
ALTER TABLE "custom_order_requests" ADD COLUMN "kind" varchar(20) DEFAULT 'new' NOT NULL;--> statement-breakpoint
ALTER TABLE "custom_order_requests" ADD COLUMN "base_product_id" uuid;--> statement-breakpoint
ALTER TABLE "custom_order_requests" ADD COLUMN "edits" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "custom_order_requests" ADD COLUMN "estimate_amount" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "custom_order_requests" ADD COLUMN "size_eu" integer;--> statement-breakpoint
ALTER TABLE "custom_order_requests" ADD COLUMN "pairs" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "custom_order_requests" ADD COLUMN "foot_length_cm" numeric(4, 1);--> statement-breakpoint
ALTER TABLE "custom_order_requests" ADD COLUMN "budget_band" varchar(20);--> statement-breakpoint
ALTER TABLE "custom_order_requests" ADD COLUMN "deadline_kind" varchar(20);--> statement-breakpoint
ALTER TABLE "custom_order_requests" ADD COLUMN "reference_links" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "custom_request_messages" ADD CONSTRAINT "custom_request_messages_request_id_custom_order_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."custom_order_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "custom_edit_options_position_idx" ON "custom_edit_options" USING btree ("position");--> statement-breakpoint
CREATE INDEX "custom_request_messages_request_idx" ON "custom_request_messages" USING btree ("request_id","created_at");--> statement-breakpoint
ALTER TABLE "custom_order_requests" ADD CONSTRAINT "custom_order_requests_base_product_id_products_id_fk" FOREIGN KEY ("base_product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "custom_order_requests" ADD CONSTRAINT "custom_order_requests_kind_check" CHECK ("custom_order_requests"."kind" in ('modify', 'recreate', 'new'));--> statement-breakpoint
ALTER TABLE "custom_order_requests" ADD CONSTRAINT "custom_order_requests_size_check" CHECK (("custom_order_requests"."size_eu" is null or "custom_order_requests"."size_eu" between 20 and 60) and "custom_order_requests"."pairs" between 1 and 50);--> statement-breakpoint
ALTER TABLE "custom_order_requests" ADD CONSTRAINT "custom_order_requests_status_check" CHECK ("custom_order_requests"."status" in ('submitted', 'under_review', 'needs_info', 'quoted', 'awaiting_payment', 'paid', 'in_production', 'completed', 'cancelled', 'rejected'));--> statement-breakpoint
-- Placeholder edit menu (prices to be set in Admin → Custom requests → Edit menu).
INSERT INTO "custom_edit_options" ("name", "description", "price", "detail_prompt", "needs_review", "position") VALUES
	('Change the colour', 'Same design in a colour you choose.', 1500, 'Which colour?', false, 1),
	('Remove the buckle', 'A clean strap with no buckle.', 0, NULL, false, 2),
	('Add roses', 'Hand-finished rose details on the strap.', 2000, NULL, false, 3),
	('Add a name or initials', 'Up to 10 letters.', 1500, 'What should it say?', false, 4),
	('Change the strap style', 'Wider, thinner, crossed or doubled.', 2500, 'What strap would you like?', false, 5),
	('Change the sole', 'Thicker, flatter or a different finish.', 3000, 'What sole would you like?', true, 6);
