-- Rename user_id to user_email in user_preferences and make it not null with unique constraint
ALTER TABLE "user_preferences" RENAME COLUMN "user_id" TO "user_email";--> statement-breakpoint
ALTER TABLE "user_preferences" ALTER COLUMN "user_email" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_user_email_unique" UNIQUE ("user_email");--> statement-breakpoint
CREATE INDEX "user_preferences_user_email_idx" ON "user_preferences" USING btree ("user_email");--> statement-breakpoint

-- Add user_email to searches table
ALTER TABLE "searches" ADD COLUMN "user_email" text NOT NULL DEFAULT 'placeholder@example.com';--> statement-breakpoint
CREATE INDEX "searches_user_email_idx" ON "searches" USING btree ("user_email");--> statement-breakpoint

-- Add user_email to saved_results table
ALTER TABLE "saved_results" ADD COLUMN "user_email" text NOT NULL DEFAULT 'placeholder@example.com';--> statement-breakpoint
CREATE INDEX "saved_results_user_email_idx" ON "saved_results" USING btree ("user_email");--> statement-breakpoint

-- Add user_email to research_projects table
ALTER TABLE "research_projects" ADD COLUMN "user_email" text NOT NULL DEFAULT 'placeholder@example.com';--> statement-breakpoint
CREATE INDEX "research_projects_user_email_idx" ON "research_projects" USING btree ("user_email");--> statement-breakpoint

-- Add user_email to collections table
ALTER TABLE "collections" ADD COLUMN "user_email" text NOT NULL DEFAULT 'placeholder@example.com';--> statement-breakpoint
CREATE INDEX "collections_user_email_idx" ON "collections" USING btree ("user_email");
