ALTER TABLE "custom_order_quotes" ADD COLUMN "reminder_count" integer DEFAULT 0 NOT NULL;
ALTER TABLE "custom_order_quotes" ADD COLUMN "last_reminder_at" timestamp;
ALTER TABLE "custom_order_quotes" ADD COLUMN "expired_notification_sent_at" timestamp;
CREATE INDEX "custom_order_requests_updated_at_idx" ON "custom_order_requests" USING btree ("updated_at");
CREATE INDEX "custom_order_quotes_expires_at_idx" ON "custom_order_quotes" USING btree ("expires_at");
CREATE INDEX "custom_order_quotes_reminder_count_idx" ON "custom_order_quotes" USING btree ("reminder_count");
CREATE UNIQUE INDEX "orders_custom_order_request_unique" ON "orders" USING btree ("custom_order_request_id");
