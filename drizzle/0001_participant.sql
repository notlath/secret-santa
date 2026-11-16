CREATE TABLE "participant" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"exchange_id" uuid NOT NULL,
	"display_name" text NOT NULL,
	"normalized_display_name" text NOT NULL,
	"personal_token_hash" text NOT NULL,
	"revealed_at" timestamp with time zone,
	"recipient_changed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "participant_personal_token_hash_unique" UNIQUE("personal_token_hash"),
	CONSTRAINT "participant_exchange_name_unique" UNIQUE("exchange_id","normalized_display_name")
);
--> statement-breakpoint
ALTER TABLE "participant" ADD CONSTRAINT "participant_exchange_id_exchange_id_fk" FOREIGN KEY ("exchange_id") REFERENCES "exchange"("id") ON DELETE cascade ON UPDATE no action;