ALTER TABLE "email_campaigns" ADD COLUMN "discount_percentage" integer;--> statement-breakpoint
ALTER TABLE "email_campaigns" ADD COLUMN "coupon_code" varchar(50);--> statement-breakpoint
ALTER TABLE "email_campaigns" ADD COLUMN "sale_deadline" timestamp;--> statement-breakpoint
ALTER TABLE "email_campaigns" ADD COLUMN "discount_note" text;
