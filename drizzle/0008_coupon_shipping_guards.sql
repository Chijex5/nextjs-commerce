ALTER TABLE "coupons"
ADD COLUMN IF NOT EXISTS "grants_free_shipping" boolean DEFAULT false NOT NULL,
ADD COLUMN IF NOT EXISTS "include_shipping_in_discount" boolean DEFAULT false NOT NULL;
