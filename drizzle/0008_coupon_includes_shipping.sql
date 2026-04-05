-- Add includes_shipping flag to coupons
-- When true on a percentage coupon, the discount applies to (subtotal + shipping)
ALTER TABLE "coupons" ADD COLUMN "includes_shipping" boolean NOT NULL DEFAULT false;
