import {
  pgTable,
  serial,
  text,
  timestamp,
  integer,
  jsonb,
  boolean,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

/**
 * Search history table - stores all searches performed
 * More persistent than Redis and allows for analytics
 */
export const searches = pgTable(
  "searches",
  {
    id: serial("id").primaryKey(),
    query: text("query").notNull(),
    engine: text("engine").notNull(), // e.g., 'general', 'code', 'academic'
    engines: text("engines").array(), // Array of specific engines used: ['brave', 'github']
    resultsCount: integer("results_count").default(0),
    cachedResultsPath: text("cached_results_path"), // Reference to cached results in Redis or storage
    metadata: jsonb("metadata").$type<{
      timeRange?: string;
      pageNumber?: number;
      responseTime?: number;
    }>(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    queryIdx: index("searches_query_idx").on(table.query),
    createdAtIdx: index("searches_created_at_idx").on(table.createdAt),
    engineIdx: index("searches_engine_idx").on(table.engine),
  }),
);

/**
 * Saved/bookmarked search results
 * Allows users to save specific results for later reference
 */
export const savedResults = pgTable(
  "saved_results",
  {
    id: serial("id").primaryKey(),
    searchId: integer("search_id").references(() => searches.id, {
      onDelete: "cascade",
    }),
    projectId: integer("project_id").references(() => researchProjects.id, {
      onDelete: "set null",
    }),
    collectionId: integer("collection_id").references(() => collections.id, {
      onDelete: "set null",
    }),
    url: text("url").notNull(),
    title: text("title").notNull(),
    content: text("content"),
    thumbnail: text("thumbnail"),
    publishedDate: text("published_date"),
    engine: text("engine"), // Which engine returned this result
    score: integer("score"), // Relevance score from search engine
    tags: text("tags").array().default([]),
    notes: text("notes"), // User notes about this result
    isRead: boolean("is_read").default(false),
    isArchived: boolean("is_archived").default(false),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    urlIdx: index("saved_results_url_idx").on(table.url),
    searchIdx: index("saved_results_search_idx").on(table.searchId),
    projectIdx: index("saved_results_project_idx").on(table.projectId),
    collectionIdx: index("saved_results_collection_idx").on(table.collectionId),
    createdAtIdx: index("saved_results_created_at_idx").on(table.createdAt),
  }),
);

/**
 * Research projects - organize searches and saved results
 */
export const researchProjects = pgTable(
  "research_projects",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    description: text("description"),
    color: text("color").default("#3b82f6"), // For UI coloring
    icon: text("icon"), // Icon identifier
    isArchived: boolean("is_archived").default(false),
    settings: jsonb("settings").$type<{
      defaultEngines?: string[];
      autoSaveResults?: boolean;
      notificationsEnabled?: boolean;
    }>(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    createdAtIdx: index("research_projects_created_at_idx").on(table.createdAt),
    isArchivedIdx: index("research_projects_is_archived_idx").on(
      table.isArchived,
    ),
  }),
);

/**
 * Junction table - links searches to projects (many-to-many)
 */
export const projectSearches = pgTable(
  "project_searches",
  {
    projectId: integer("project_id")
      .references(() => researchProjects.id, { onDelete: "cascade" })
      .notNull(),
    searchId: integer("search_id")
      .references(() => searches.id, { onDelete: "cascade" })
      .notNull(),
    addedAt: timestamp("added_at").defaultNow().notNull(),
    notes: text("notes"),
  },
  (table) => ({
    pk: index("project_searches_pk").on(table.projectId, table.searchId),
  }),
);

/**
 * Junction table - links searches to collections (many-to-many)
 */
export const collectionSearches = pgTable(
  "collection_searches",
  {
    collectionId: integer("collection_id")
      .references(() => collections.id, { onDelete: "cascade" })
      .notNull(),
    searchId: integer("search_id")
      .references(() => searches.id, { onDelete: "cascade" })
      .notNull(),
    addedAt: timestamp("added_at").defaultNow().notNull(),
  },
  (table) => ({
    pk: index("collection_searches_pk").on(table.collectionId, table.searchId),
  }),
);

/**
 * User preferences and settings
 * Can be extended for multi-tenant/user accounts later
 */
export const userPreferences = pgTable("user_preferences", {
  id: serial("id").primaryKey(),
  userId: text("user_id"), // For future multi-user support
  defaultSearchEngine: text("default_search_engine").default("general"),
  defaultEngines: text("default_engines")
    .array()
    .default(["brave", "duckduckgo"]),
  theme: text("theme").default("system"),
  resultsPerPage: integer("results_per_page").default(10),
  cacheResults: boolean("cache_results").default(true),
  autoSaveSearches: boolean("auto_save_searches").default(true),
  settings: jsonb("settings").$type<Record<string, any>>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/**
 * Collections - saved topic collections for organizing searches
 */
export const collections = pgTable(
  "collections",
  {
    id: serial("id").primaryKey(),
    topic: text("topic").notNull(), // The search query/topic
    description: text("description"), // Optional description
    searchCount: integer("search_count").default(1), // Number of times this topic was searched
    engines: text("engines").array().default([]), // Engines used for this topic
    metadata: jsonb("metadata").$type<{
      totalResults?: number;
      lastEngine?: string;
    }>(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    topicIdx: index("collections_topic_idx").on(table.topic),
    createdAtIdx: index("collections_created_at_idx").on(table.createdAt),
  }),
);

/**
 * Analytics and usage tracking (optional)
 */
export const searchAnalytics = pgTable(
  "search_analytics",
  {
    id: serial("id").primaryKey(),
    searchId: integer("search_id").references(() => searches.id, {
      onDelete: "set null",
    }),
    resultClicked: boolean("result_clicked").default(false),
    clickedUrl: text("clicked_url"),
    timeToFirstClick: integer("time_to_first_click"), // milliseconds
    sessionDuration: integer("session_duration"), // milliseconds
    userAgent: text("user_agent"),
    ipAddress: text("ip_address"), // Hashed for privacy
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    createdAtIdx: index("search_analytics_created_at_idx").on(table.createdAt),
    searchIdx: index("search_analytics_search_idx").on(table.searchId),
  }),
);

// ============================================
// Relations
// ============================================

export const searchesRelations = relations(searches, ({ one, many }) => ({
  savedResults: many(savedResults),
  analytics: one(searchAnalytics, {
    fields: [searches.id],
    references: [searchAnalytics.searchId],
  }),
}));

export const savedResultsRelations = relations(savedResults, ({ one }) => ({
  search: one(searches, {
    fields: [savedResults.searchId],
    references: [searches.id],
  }),
  project: one(researchProjects, {
    fields: [savedResults.projectId],
    references: [researchProjects.id],
  }),
}));

export const researchProjectsRelations = relations(
  researchProjects,
  ({ many }) => ({
    savedResults: many(savedResults),
    projectSearches: many(projectSearches),
  }),
);

export const collectionsRelations = relations(collections, ({ many }) => ({
  searches: many(collectionSearches),
}));

export const projectSearchesRelations = relations(
  projectSearches,
  ({ one }) => ({
    project: one(researchProjects, {
      fields: [projectSearches.projectId],
      references: [researchProjects.id],
    }),
    search: one(searches, {
      fields: [projectSearches.searchId],
      references: [searches.id],
    }),
  }),
);

// ============================================
// Type exports
// ============================================

export type Search = typeof searches.$inferSelect;
export type NewSearch = typeof searches.$inferInsert;
export type SavedResult = typeof savedResults.$inferSelect;
export type NewSavedResult = typeof savedResults.$inferInsert;
export type ResearchProject = typeof researchProjects.$inferSelect;
export type NewResearchProject = typeof researchProjects.$inferInsert;
export type ProjectSearch = typeof projectSearches.$inferSelect;
export type UserPreference = typeof userPreferences.$inferSelect;
export type NewUserPreference = typeof userPreferences.$inferInsert;
export type SearchAnalytic = typeof searchAnalytics.$inferSelect;
export type Collection = typeof collections.$inferSelect;
export type NewCollection = typeof collections.$inferInsert;
export type CollectionSearch = typeof collectionSearches.$inferSelect;
