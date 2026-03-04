ALTER TABLE "orders" ADD COLUMN "payment_transaction_id" uuid;
ALTER TABLE "orders" ADD COLUMN "payment_provider" varchar(50) DEFAULT 'paystack';
ALTER TABLE "orders" ADD COLUMN "payment_reference" varchar(255);

CREATE TABLE "payment_transactions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "provider" varchar(50) DEFAULT 'paystack' NOT NULL,
  "reference" varchar(255) NOT NULL,
  "source" varchar(50) NOT NULL,
  "status" varchar(50) DEFAULT 'initialized' NOT NULL,
  "amount" integer NOT NULL,
  "currency_code" varchar(3) DEFAULT 'NGN' NOT NULL,
  "metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "paystack_status" varchar(50),
  "customer" jsonb,
  "payload" jsonb,
  "order_id" uuid,
  "conflict_code" varchar(100),
  "conflict_message" text,
  "last_verified_at" timestamp,
  "resolved_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "payment_events" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "payment_transaction_id" uuid NOT NULL,
  "provider" varchar(50) DEFAULT 'paystack' NOT NULL,
  "reference" varchar(255) NOT NULL,
  "source" varchar(50) NOT NULL,
  "event_type" varchar(100) NOT NULL,
  "status" varchar(50) NOT NULL,
  "message" text,
  "payload" jsonb,
  "created_at" timestamp DEFAULT now() NOT NULL
);

ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "payment_events" ADD CONSTRAINT "payment_events_payment_transaction_id_payment_transactions_id_fk" FOREIGN KEY ("payment_transaction_id") REFERENCES "public"."payment_transactions"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "orders" ADD CONSTRAINT "orders_payment_transaction_id_payment_transactions_id_fk" FOREIGN KEY ("payment_transaction_id") REFERENCES "public"."payment_transactions"("id") ON DELETE no action ON UPDATE no action;

CREATE INDEX "orders_payment_transaction_id_idx" ON "orders" USING btree ("payment_transaction_id");
CREATE INDEX "orders_payment_reference_idx" ON "orders" USING btree ("payment_reference");
CREATE UNIQUE INDEX "orders_payment_transaction_unique" ON "orders" USING btree ("payment_transaction_id");

CREATE UNIQUE INDEX "payment_transactions_provider_reference_unique" ON "payment_transactions" USING btree ("provider","reference");
CREATE INDEX "payment_transactions_status_idx" ON "payment_transactions" USING btree ("status");
CREATE INDEX "payment_transactions_source_idx" ON "payment_transactions" USING btree ("source");
CREATE INDEX "payment_transactions_created_at_idx" ON "payment_transactions" USING btree ("created_at");
CREATE INDEX "payment_transactions_order_id_idx" ON "payment_transactions" USING btree ("order_id");
CREATE UNIQUE INDEX "payment_transactions_order_id_unique" ON "payment_transactions" USING btree ("order_id");

CREATE INDEX "payment_events_payment_transaction_id_idx" ON "payment_events" USING btree ("payment_transaction_id");
CREATE INDEX "payment_events_reference_idx" ON "payment_events" USING btree ("reference");
CREATE INDEX "payment_events_created_at_idx" ON "payment_events" USING btree ("created_at");
