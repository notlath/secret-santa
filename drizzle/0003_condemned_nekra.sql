CREATE TABLE "assignment" (
	"exchange_id" uuid NOT NULL,
	"giver_id" uuid NOT NULL,
	"recipient_id" uuid NOT NULL,
	CONSTRAINT "assignment_exchange_giver_unique" UNIQUE("exchange_id","giver_id"),
	CONSTRAINT "assignment_exchange_recipient_unique" UNIQUE("exchange_id","recipient_id"),
	CONSTRAINT "assignment_not_self_check" CHECK ("assignment"."giver_id" <> "assignment"."recipient_id")
);
--> statement-breakpoint
ALTER TABLE "assignment" ADD CONSTRAINT "assignment_exchange_id_exchange_id_fk" FOREIGN KEY ("exchange_id") REFERENCES "exchange"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assignment" ADD CONSTRAINT "assignment_giver_id_participant_id_fk" FOREIGN KEY ("giver_id") REFERENCES "participant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assignment" ADD CONSTRAINT "assignment_recipient_id_participant_id_fk" FOREIGN KEY ("recipient_id") REFERENCES "participant"("id") ON DELETE cascade ON UPDATE no action;