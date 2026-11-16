CREATE TABLE "wishlist_item" (
	"participant_id" uuid NOT NULL,
	"position" integer NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"product_link" text,
	CONSTRAINT "wishlist_item_participant_position_unique" UNIQUE("participant_id","position"),
	CONSTRAINT "wishlist_item_position_check" CHECK ("wishlist_item"."position" between 1 and 3)
);
--> statement-breakpoint
ALTER TABLE "wishlist_item" ADD CONSTRAINT "wishlist_item_participant_id_participant_id_fk" FOREIGN KEY ("participant_id") REFERENCES "participant"("id") ON DELETE cascade ON UPDATE no action;