-- Add hasPassword column to users table
-- Magic-link-only users will have has_password = false
-- Users who registered with a password (or later set one) will have has_password = true
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "has_password" boolean DEFAULT false NOT NULL;

-- Backfill: assume all existing users who have a non-trivial password hash set their password
-- (magic-link users created before this migration will remain false until they add a password)
-- You may optionally set existing users to true if you know they all have real passwords:
-- UPDATE "users" SET "has_password" = true;

-- OTP table for email-verified account actions (e.g. adding a password for magic-link users)
CREATE TABLE IF NOT EXISTS "email_otps" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "email" varchar(255) NOT NULL,
  "otp_hash" text NOT NULL,
  "purpose" varchar(50) NOT NULL,
  "expires_at" timestamp NOT NULL,
  "used_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "email_otps_email_idx" ON "email_otps" USING btree ("email");
CREATE INDEX IF NOT EXISTS "email_otps_purpose_idx" ON "email_otps" USING btree ("purpose");
CREATE INDEX IF NOT EXISTS "email_otps_expires_at_idx" ON "email_otps" USING btree ("expires_at");
