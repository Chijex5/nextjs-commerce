CREATE TABLE IF NOT EXISTS "google_merchant_product_syncs" (
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
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "google_merchant_product_syncs_product_id_products_id_fk"
    FOREIGN KEY ("product_id") REFERENCES "public"."products"("id")
    ON DELETE cascade
    ON UPDATE no action
);

CREATE UNIQUE INDEX IF NOT EXISTS "google_merchant_product_sync_product_merchant_unique"
  ON "google_merchant_product_syncs" USING btree ("product_id", "merchant_id");
CREATE INDEX IF NOT EXISTS "google_merchant_product_sync_merchant_id_idx"
  ON "google_merchant_product_syncs" USING btree ("merchant_id");
CREATE INDEX IF NOT EXISTS "google_merchant_product_sync_sync_status_idx"
  ON "google_merchant_product_syncs" USING btree ("sync_status");
CREATE INDEX IF NOT EXISTS "google_merchant_product_sync_last_synced_at_idx"
  ON "google_merchant_product_syncs" USING btree ("last_synced_at");
