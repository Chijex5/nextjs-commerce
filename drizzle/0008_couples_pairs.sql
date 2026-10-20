ALTER TABLE "cart_lines" ADD COLUMN "pair_variant_id" uuid;--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "pair_variant_id" uuid;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "pairing" jsonb;--> statement-breakpoint
ALTER TABLE "cart_lines" ADD CONSTRAINT "cart_lines_pair_variant_id_product_variants_id_fk" FOREIGN KEY ("pair_variant_id") REFERENCES "public"."product_variants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_pair_variant_id_product_variants_id_fk" FOREIGN KEY ("pair_variant_id") REFERENCES "public"."product_variants"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "cart_lines_pair_variant_id_idx" ON "cart_lines" USING btree ("pair_variant_id");