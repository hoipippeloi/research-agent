CREATE TABLE "project_searches" (
	"project_id" integer NOT NULL,
	"search_id" integer NOT NULL,
	"added_at" timestamp DEFAULT now() NOT NULL,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "research_projects" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"color" text DEFAULT '#3b82f6',
	"icon" text,
	"is_archived" boolean DEFAULT false,
	"settings" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "saved_results" (
	"id" serial PRIMARY KEY NOT NULL,
	"search_id" integer,
	"project_id" integer,
	"url" text NOT NULL,
	"title" text NOT NULL,
	"content" text,
	"thumbnail" text,
	"published_date" text,
	"engine" text,
	"score" integer,
	"tags" text[] DEFAULT '{}',
	"notes" text,
	"is_read" boolean DEFAULT false,
	"is_archived" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "search_analytics" (
	"id" serial PRIMARY KEY NOT NULL,
	"search_id" integer,
	"result_clicked" boolean DEFAULT false,
	"clicked_url" text,
	"time_to_first_click" integer,
	"session_duration" integer,
	"user_agent" text,
	"ip_address" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "searches" (
	"id" serial PRIMARY KEY NOT NULL,
	"query" text NOT NULL,
	"engine" text NOT NULL,
	"engines" text[],
	"results_count" integer DEFAULT 0,
	"cached_results_path" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_preferences" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text,
	"default_search_engine" text DEFAULT 'general',
	"default_engines" text[] DEFAULT '{"brave","duckduckgo"}',
	"theme" text DEFAULT 'system',
	"results_per_page" integer DEFAULT 10,
	"cache_results" boolean DEFAULT true,
	"auto_save_searches" boolean DEFAULT true,
	"settings" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "project_searches" ADD CONSTRAINT "project_searches_project_id_research_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."research_projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_searches" ADD CONSTRAINT "project_searches_search_id_searches_id_fk" FOREIGN KEY ("search_id") REFERENCES "public"."searches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_results" ADD CONSTRAINT "saved_results_search_id_searches_id_fk" FOREIGN KEY ("search_id") REFERENCES "public"."searches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_results" ADD CONSTRAINT "saved_results_project_id_research_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."research_projects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "search_analytics" ADD CONSTRAINT "search_analytics_search_id_searches_id_fk" FOREIGN KEY ("search_id") REFERENCES "public"."searches"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "project_searches_pk" ON "project_searches" USING btree ("project_id","search_id");--> statement-breakpoint
CREATE INDEX "research_projects_created_at_idx" ON "research_projects" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "research_projects_is_archived_idx" ON "research_projects" USING btree ("is_archived");--> statement-breakpoint
CREATE INDEX "saved_results_url_idx" ON "saved_results" USING btree ("url");--> statement-breakpoint
CREATE INDEX "saved_results_search_idx" ON "saved_results" USING btree ("search_id");--> statement-breakpoint
CREATE INDEX "saved_results_project_idx" ON "saved_results" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "saved_results_created_at_idx" ON "saved_results" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "search_analytics_created_at_idx" ON "search_analytics" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "search_analytics_search_idx" ON "search_analytics" USING btree ("search_id");--> statement-breakpoint
CREATE INDEX "searches_query_idx" ON "searches" USING btree ("query");--> statement-breakpoint
CREATE INDEX "searches_created_at_idx" ON "searches" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "searches_engine_idx" ON "searches" USING btree ("engine");