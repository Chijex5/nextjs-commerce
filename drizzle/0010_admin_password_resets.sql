CREATE TABLE IF NOT EXISTS "admin_password_resets" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "admin_id" uuid NOT NULL,
  "email" varchar(255) NOT NULL,
  "token_hash" text NOT NULL,
  "expires_at" timestamp NOT NULL,
  "used_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL
);

DO $$ BEGIN
  ALTER TABLE "admin_password_resets"
  ADD CONSTRAINT "admin_password_resets_admin_id_admin_users_id_fk"
  FOREIGN KEY ("admin_id")
  REFERENCES "public"."admin_users"("id")
  ON DELETE cascade
  ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS "admin_password_resets_admin_id_idx" ON "admin_password_resets" ("admin_id");
CREATE INDEX IF NOT EXISTS "admin_password_resets_email_idx" ON "admin_password_resets" ("email");
CREATE INDEX IF NOT EXISTS "admin_password_resets_token_hash_idx" ON "admin_password_resets" ("token_hash");
CREATE INDEX IF NOT EXISTS "admin_password_resets_expires_at_idx" ON "admin_password_resets" ("expires_at");
