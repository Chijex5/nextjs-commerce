-- Idempotent: an earlier draft of this migration (pair_variant_id columns and
-- products.pairing) may already be applied, so everything is "if missing".
ALTER TABLE "cart_lines" ADD COLUMN IF NOT EXISTS "pair_variant_id" uuid;--> statement-breakpoint
ALTER TABLE "cart_lines" ADD COLUMN IF NOT EXISTS "couple_product_id" uuid;--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN IF NOT EXISTS "pair_variant_id" uuid;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "pairing" jsonb;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "pair_first_product_id" uuid;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "pair_second_product_id" uuid;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "cart_lines" ADD CONSTRAINT "cart_lines_pair_variant_id_product_variants_id_fk" FOREIGN KEY ("pair_variant_id") REFERENCES "public"."product_variants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "cart_lines" ADD CONSTRAINT "cart_lines_couple_product_id_products_id_fk" FOREIGN KEY ("couple_product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "order_items" ADD CONSTRAINT "order_items_pair_variant_id_product_variants_id_fk" FOREIGN KEY ("pair_variant_id") REFERENCES "public"."product_variants"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "products" ADD CONSTRAINT "products_pair_first_product_id_products_id_fk" FOREIGN KEY ("pair_first_product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "products" ADD CONSTRAINT "products_pair_second_product_id_products_id_fk" FOREIGN KEY ("pair_second_product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "cart_lines_pair_variant_id_idx" ON "cart_lines" USING btree ("pair_variant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "products_pair_first_product_id_idx" ON "products" USING btree ("pair_first_product_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "products_pair_second_product_id_idx" ON "products" USING btree ("pair_second_product_id");
