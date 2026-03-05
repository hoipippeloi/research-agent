CREATE TABLE "collection_searches" (
	"collection_id" integer NOT NULL,
	"search_id" integer NOT NULL,
	"added_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "collections" (
	"id" serial PRIMARY KEY NOT NULL,
	"topic" text NOT NULL,
	"description" text,
	"search_count" integer DEFAULT 1,
	"engines" text[] DEFAULT '{}',
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "collection_searches" ADD CONSTRAINT "collection_searches_collection_id_collections_id_fk" FOREIGN KEY ("collection_id") REFERENCES "public"."collections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collection_searches" ADD CONSTRAINT "collection_searches_search_id_searches_id_fk" FOREIGN KEY ("search_id") REFERENCES "public"."searches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "collection_searches_pk" ON "collection_searches" USING btree ("collection_id","search_id");--> statement-breakpoint
CREATE INDEX "collections_topic_idx" ON "collections" USING btree ("topic");--> statement-breakpoint
CREATE INDEX "collections_created_at_idx" ON "collections" USING btree ("created_at");