-- Add expires_at to carts for ghost-cart cleanup
ALTER TABLE "carts" ADD COLUMN "expires_at" timestamp;

-- Back-fill existing rows: treat them as expiring 30 days from now
UPDATE "carts" SET "expires_at" = now() + INTERVAL '30 days' WHERE "expires_at" IS NULL;
