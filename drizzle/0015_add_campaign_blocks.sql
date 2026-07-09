-- Adds ordered content blocks for CUSTOM email campaigns.
-- CUSTOM campaigns store their body as a JSON array of blocks; fixed templates
-- (JUST_ARRIVED / SALE / COLLECTION) ignore this column.
ALTER TABLE "email_campaigns"
  ADD COLUMN IF NOT EXISTS "blocks" jsonb DEFAULT '[]'::jsonb NOT NULL;
