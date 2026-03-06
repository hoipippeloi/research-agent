# Database Documentation

## Quick Start

**What data does Research Agent store?**

Research Agent stores three main types of data:
1. **Search History** - Every search you perform (temporarily in Redis, permanently in PostgreSQL)
2. **Collections** - Topics you organize searches around (PostgreSQL)
3. **Saved Results** - Bookmarked search results with notes (PostgreSQL)

**Database Stack**:
- **PostgreSQL** - Persistent storage with Drizzle ORM
- **Redis** - Fast cache and recent history
- **Schema Location**: `frontend/src/lib/db/schema.ts`

**Quick Example**:
```typescript
// Get user's recent collections
import { getDb, collections } from '$lib/db';
import { desc, eq } from 'drizzle-orm';

const db = getDb();
const userCollections = await db.select()
  .from(collections)
  .where(eq(collections.userEmail, 'user@example.com'))
  .orderBy(desc(collections.updatedAt))
  .limit(10);
```

---

## Core Concepts

### User-Centric Design

All data is isolated by **`userEmail`**. Every table has this field, ensuring:
- Complete data privacy between users
- Simple query patterns (always filter by user)
- Easy data export/deletion per user

### Storage Strategy: Fast vs. Persistent

```
┌─────────────────────────────────────────────────┐
│            User Performs Search                 │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
         ┌────────────────┐
         │  Redis Cache   │ ← Fast, temporary (1 hour TTL)
         │  - Results     │
         │  - History     │
         └────────┬───────┘
                  │
                  ▼
         ┌────────────────┐
         │  PostgreSQL    │ ← Permanent storage
         │  - Searches    │
         │  - Collections │
         │  - Saved Items │
         └────────────────┘
```

**Redis**: Search results (1 hour), recent history (last 100 searches)
**PostgreSQL**: Collections, saved results, permanent search log

---

## Data Model Overview

### The Three Core Entities

**1. Searches** (`searches` table)
- Every search query performed
- Linked to collections and projects
- Stores metadata (engine, results count, timestamps)

**2. Collections** (`collections` table)
- User-created topic containers
- Examples: "Machine Learning", "TypeScript Patterns", "Climate Research"
- Many-to-many relationship with searches

**3. Saved Results** (`saved_results` table)
- Individual search results bookmarked by user
- Contains full content (markdown)
- Can belong to collections and projects

### Entity Relationships

```
User (userEmail)
  │
  ├─── Searches (many per user)
  │      ├─── saved_results (0 or more bookmarks per search)
  │      ├─── collection_searches (link to collections)
  │      └─── project_searches (link to projects)
  │
  ├─── Collections (topic containers)
  │      ├─── saved_results (results saved to this collection)
  │      └─── collection_searches (link to searches)
  │
  ├─── Research Projects (future feature)
  │      ├─── saved_results
  │      └─── project_searches
  │
  ├─── User Preferences (settings)
  └─── Search Analytics (usage tracking)
```

---

## Visual Data Flow

### How Data Moves Through the System

```
1. Search Request
   ↓
2. Check Redis Cache (cache:{engine}:{query})
   ├─ Hit → Return cached results
   └─ Miss → Call SearXNG API
      ↓
3. Store in Redis (1 hour TTL)
   ↓
4. Save to History (Redis: last 100 searches)
   ↓
5. Log in PostgreSQL searches table (optional)
   ↓
6. Return results to user

7. User Saves Result
   ↓
8. POST /api/saved-results
   ↓
9. Store in PostgreSQL saved_results table
   ↓
10. Link to collection (if provided)
```

---

## Detailed Table Reference

### Active Tables (Used by APIs)

#### `searches` - Search History

**What it stores**: Every search query performed by users

**Key fields**:
- `query` - The search text
- `engine` - Type: 'general', 'code', 'academic'
- `engines` - Specific engines: ['brave', 'duckduckgo']
- `resultsCount` - How many results returned
- `metadata` - JSONB with timeRange, pageNumber, responseTime

**Indexes**: userEmail, query, createdAt, engine

**Relationships**:
- Has many `saved_results` (bookmarks from this search)
- Many-to-many with `collections` (via `collection_searches`)
- Many-to-many with `research_projects` (via `project_searches`)

---

#### `collections` - Topic Collections

**What it stores**: User-organized topic containers

**Key fields**:
- `topic` - Collection name (e.g., "Machine Learning")
- `description` - Optional details
- `searchCount` - Times this topic searched
- `engines` - Array of engines used
- `metadata` - JSONB: {totalResults, lastEngine}

**Business Logic**:
- Unique per user (can't have duplicate topics)
- `updatedAt` auto-updates on changes
- Cascade deletes junction tables when removed

**APIs**: 
- `GET /api/collections` - List all
- `POST /api/collections` - Create (or return existing)
- `DELETE /api/collections` - Remove by ID

---

#### `saved_results` - Bookmarked Results

**What it stores**: Individual search results saved by user

**Key fields**:
- `url` - Source URL
- `title` - Result title
- `content` - Full markdown content
- `collectionId` - Which collection it belongs to
- `searchId` - Which search it came from
- `tags` - User-defined tags
- `notes` - User annotations
- `isRead`, `isArchived` - Status flags

**Upsert Logic**:
- If URL exists for user → UPDATE content, title, collectionId
- If new URL → INSERT new record
- Default title: URL hostname if not provided

**APIs**:
- `POST /api/saved-results` - Save or update

---

#### `collection_searches` - Junction Table

**What it stores**: Links collections to searches (many-to-many)

**Key fields**:
- `collectionId` - FK to collections (cascade delete)
- `searchId` - FK to searches (cascade delete)
- `addedAt` - When linked

**Why it exists**: A search can belong to multiple collections, and a collection can contain multiple searches.

---

### Future Features (Schema Ready)

These tables exist in the schema but aren't used by APIs yet:

#### `research_projects` - Project Organization
Group searches and results into larger research projects with settings, colors, and icons.

#### `project_searches` - Junction Table
Links projects to searches (many-to-many) with optional notes.

#### `user_preferences` - User Settings
Default engines, theme, results per page, auto-save preferences.

#### `search_analytics` - Usage Tracking
Click tracking, time to first click, session duration (privacy-conscious with hashed IPs).

---

## Advanced Topics

### Database Schema Evolution

**Development Workflow**:
```bash
# 1. Edit schema
vim frontend/src/lib/db/schema.ts

# 2. Generate migration
npm run db:generate

# 3. Review SQL
cat frontend/drizzle/0001_migration_name.sql

# 4. Push to dev database
npm run db:push
```

**Production Workflow**:
```bash
# Apply migrations
npm run db:migrate

# Verify with GUI
npm run db:studio
```

### Index Strategy

**Why these indexes exist**:
- **userEmail** - All queries filter by user
- **Timestamps** - Ordering by recency
- **Foreign keys** - Fast JOIN operations
- **query/url** - Deduplication and autocomplete

**Composite indexes**:
- Junction tables: (collectionId, searchId) for fast many-to-many lookups

### Data Types Deep Dive

**JSONB for Metadata**:
```typescript
// Flexible, queryable JSON
metadata: {
  timeRange: 'month',
  pageNumber: 1,
  responseTime: 234 // ms
}

// PostgreSQL can query inside JSONB
SELECT * FROM searches 
WHERE metadata->>'timeRange' = 'month';
```

**Text Arrays**:
```typescript
// Multiple values in one field
engines: ['brave', 'duckduckgo', 'startpage']
tags: ['typescript', 'performance', 'web']

// PostgreSQL array operations
SELECT * FROM saved_results 
WHERE 'typescript' = ANY(tags);
```

### Cascade Behavior

**CASCADE** (junction tables):
- When collection deleted → `collection_searches` entries auto-deleted
- Prevents orphaned relationships

**SET NULL** (optional references):
- When search deleted → `saved_results.searchId` becomes NULL
- Saved result survives, just unlinked from search

**NO ACTION** (default):
- Prevents deletion if referenced

### Redis Integration

**Current Redis Usage**:
```
Cache:
  Key: cache:{engine}:{query}
  Value: JSON {results, timestamp, count}
  TTL: 3600 seconds (1 hour)

History:
  Hash: search:{userEmail}:{timestamp}:{random}
  List: search:recent:{userEmail} (max 100)
  Sorted Set: search:history:{userEmail}
```

**Why Redis + PostgreSQL?**:
- **Redis**: Ultra-fast for temporary, frequently-accessed data
- **PostgreSQL**: Reliable permanent storage with complex relationships

### Type Safety

All tables export TypeScript types:

```typescript
import type { 
  Search,           // Full record from database
  NewSearch,        // Insert type (required fields only)
  Collection,
  NewCollection,
  SavedResult,
  NewSavedResult
} from '$lib/db/schema';

// Usage
const newSearch: NewSearch = {
  userEmail: 'user@example.com',
  query: 'typescript patterns',
  engine: 'general'
};

const inserted: Search = await db.insert(searches)
  .values(newSearch)
  .returning();
```

### Performance Considerations

**Efficient Queries**:
```typescript
// ✅ Good: Filter by user + index
await db.select()
  .from(collections)
  .where(eq(collections.userEmail, email))
  .orderBy(desc(collections.updatedAt))
  .limit(10);

// ❌ Bad: No user filter (scans entire table)
await db.select()
  .from(collections)
  .orderBy(desc(collections.updatedAt));
```

**JSONB Query Performance**:
- Index specific JSON paths for frequent queries
- Use `->>` for text comparison, `->` for JSON operations

**Array Performance**:
- GIN indexes for array contains queries
- `ANY()` operator is optimized in PostgreSQL

---

## Common Patterns

### User Data Isolation

```typescript
// ALWAYS filter by userEmail
const userResults = await db.select()
  .from(savedResults)
  .where(eq(savedResults.userEmail, userEmail));
```

### Upsert Pattern

```typescript
// Check if exists
const existing = await db.select()
  .from(savedResults)
  .where(and(
    eq(savedResults.url, url),
    eq(savedResults.userEmail, userEmail)
  ))
  .limit(1);

if (existing.length > 0) {
  // Update
  await db.update(savedResults)
    .set({ content, title, updatedAt: new Date() })
    .where(eq(savedResults.id, existing[0].id));
} else {
  // Insert
  await db.insert(savedResults)
    .values({ userEmail, url, title, content });
}
```

### Many-to-Many with Junction

```typescript
// Link search to collection
await db.insert(collectionSearches)
  .values({
    collectionId: 1,
    searchId: 42
  });

// Get all searches in a collection
const searchesInCollection = await db.select()
  .from(searches)
  .innerJoin(collectionSearches, eq(searches.id, collectionSearches.searchId))
  .where(eq(collectionSearches.collectionId, 1));
```

---

## Migration Examples

### Adding a New Column

```typescript
// 1. Edit schema.ts
export const collections = pgTable('collections', {
  // ... existing columns
  isPublic: boolean('isPublic').default(false), // NEW
});

// 2. Generate migration
// npm run db:generate

// 3. Review SQL
ALTER TABLE "collections" ADD COLUMN "isPublic" boolean DEFAULT false;
```

### Adding a New Table

```typescript
// 1. Define in schema.ts
export const tags = pgTable('tags', {
  id: serial('id').primaryKey(),
  userEmail: text('userEmail').notNull(),
  name: text('name').notNull(),
  createdAt: timestamp('createdAt').defaultNow().notNull()
});

// 2. Add relations
export const collectionsRelations = relations(collections, ({ many }) => ({
  tags: many(tags),
}));

// 3. Generate and apply migration
```

---

## Troubleshooting

### Common Issues

**Migration Fails**:
- Check for constraint violations
- Ensure foreign keys reference existing tables
- Review generated SQL in `drizzle/` directory

**Query Too Slow**:
- Add index on filtered columns
- Check query plan with `EXPLAIN ANALYZE`
- Consider composite indexes for multi-column filters

**Type Errors**:
- Ensure Drizzle types are imported from `$lib/db`
- Check nullable vs. required fields
- Use `NewTable` type for inserts

### Debugging Tools

```bash
# Open visual database browser
npm run db:studio

# Check migration status
ls frontend/drizzle/

# Test queries in Drizzle Studio
# → http://localhost:4983
```

---

## Summary

**Key Takeaways**:
1. **User-centric**: All data isolated by `userEmail`
2. **Dual storage**: Redis for speed, PostgreSQL for persistence
3. **Three core entities**: Searches, Collections, Saved Results
4. **Type-safe**: Full TypeScript support with Drizzle ORM
5. **Migration-driven**: Schema changes through version-controlled migrations

**Next Steps**:
- Explore the schema: `frontend/src/lib/db/schema.ts`
- View migrations: `frontend/drizzle/`
- Test queries: `npm run db:studio`
- API integration: See `docs/apis/api-docs.md`
