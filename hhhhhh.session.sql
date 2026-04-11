ALTER TABLE "carts"
ADD COLUMN IF NOT EXISTS "session_id" varchar(255);

UPDATE "carts"
SET "session_id" = COALESCE("session_id", "id"::text)
WHERE "session_id" IS NULL;

ALTER TABLE "carts"
ALTER COLUMN "session_id" SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "carts_session_id_unique" ON "carts" ("session_id");
