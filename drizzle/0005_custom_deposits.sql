ALTER TABLE "custom_order_requests" DROP CONSTRAINT "custom_order_requests_status_check";--> statement-breakpoint
ALTER TABLE "orders" DROP CONSTRAINT "orders_amounts_check";--> statement-breakpoint
ALTER TABLE "custom_order_quotes" ADD COLUMN "deposit_amount" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "custom_order_quotes" ADD COLUMN "shipping_amount" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "custom_order_requests" ADD COLUMN "delivery_address" jsonb;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "balance_due" numeric(10, 2) DEFAULT '0.00' NOT NULL;--> statement-breakpoint
ALTER TABLE "custom_order_requests" ADD CONSTRAINT "custom_order_requests_status_check" CHECK ("custom_order_requests"."status" in ('submitted', 'under_review', 'needs_info', 'quoted', 'awaiting_payment', 'paid', 'in_production', 'balance_due', 'ready', 'completed', 'cancelled', 'rejected'));--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_amounts_check" CHECK ("orders"."subtotal_amount" >= 0 and "orders"."tax_amount" >= 0 and "orders"."shipping_amount" >= 0 and "orders"."discount_amount" >= 0 and "orders"."total_amount" >= 0 and "orders"."balance_due" >= 0 and "orders"."balance_due" <= "orders"."total_amount");