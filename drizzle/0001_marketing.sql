CREATE TABLE "flow_email_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"flow_key" varchar(50) NOT NULL,
	"email" varchar(255) NOT NULL,
	"reference" varchar(255) NOT NULL,
	"status" varchar(50) DEFAULT 'SENT' NOT NULL,
	"resend_message_id" varchar(255),
	"sent_at" timestamp DEFAULT now() NOT NULL,
	"opened_at" timestamp,
	"clicked_at" timestamp,
	"click_count" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "marketing_flows" (
	"key" varchar(50) PRIMARY KEY NOT NULL,
	"enabled" boolean DEFAULT false NOT NULL,
	"settings" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "email_campaigns" ADD COLUMN "audience" jsonb DEFAULT '{"segment":"all"}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "email_campaigns" ADD COLUMN "frequency_cap_hours" integer DEFAULT 48 NOT NULL;--> statement-breakpoint
ALTER TABLE "email_campaigns" ADD COLUMN "completed_at" timestamp;--> statement-breakpoint
ALTER TABLE "newsletter_subscribers" ADD COLUMN "source" varchar(50) DEFAULT 'newsletter' NOT NULL;--> statement-breakpoint
CREATE INDEX "flow_email_logs_flow_key_idx" ON "flow_email_logs" USING btree ("flow_key");--> statement-breakpoint
CREATE INDEX "flow_email_logs_email_idx" ON "flow_email_logs" USING btree ("email");--> statement-breakpoint
CREATE INDEX "flow_email_logs_resend_message_id_idx" ON "flow_email_logs" USING btree ("resend_message_id");--> statement-breakpoint
CREATE UNIQUE INDEX "flow_email_logs_trigger_unique" ON "flow_email_logs" USING btree ("flow_key","email","reference");--> statement-breakpoint
CREATE UNIQUE INDEX "campaign_email_logs_campaign_recipient_unique" ON "campaign_email_logs" USING btree ("campaign_id","subscriber_email");