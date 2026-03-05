# Database Setup & Documentation

This document provides comprehensive documentation for the PostgreSQL database setup using Drizzle ORM in the Research Agent application.

## Table of Contents

1. [Overview](#overview)
2. [Installation](#installation)
3. [Configuration](#configuration)
4. [Database Schema](#database-schema)
5. [Migrations](#migrations)
6. [Usage Examples](#usage-examples)
7. [API Reference](#api-reference)
8. [Best Practices](#best-practices)
9. [Troubleshooting](#troubleshooting)

---

## Overview

The Research Agent uses **PostgreSQL** as its primary database for persistent storage, with **Drizzle ORM** for type-safe database operations and schema management. Redis is still used for caching and temporary data.

### Architecture

```
┌─────────────────────────────────────────┐
│         SvelteKit Application           │
├─────────────────────────────────────────┤
│  ┌─────────────────────────────────┐   │
│  │    Drizzle ORM (Type-safe)      │   │
│  └─────────────────────────────────┘   │
├─────────────────────────────────────────┤
│  ┌──────────────┐   ┌──────────────┐   │
│  │  PostgreSQL  │   │    Redis     │   │
│  │  (Persistent)│   │   (Cache)    │   │
│  └──────────────┘   └──────────────┘   │
└─────────────────────────────────────────┘
```

### Why PostgreSQL + Redis?

- **PostgreSQL**: Long-term storage, relationships, complex queries, analytics
- **Redis**: Caching, sessions, temporary data, real-time features

---

## Installation

### 1. Install Dependencies

```bash
cd frontend
npm install
```

This will install:
- `drizzle-orm` - TypeScript ORM
- `drizzle-kit` - CLI for migrations
- `postgres` - PostgreSQL client
- `dotenv` - Environment variable loader

### 2. Set Up Environment Variables

Create a `.env` file in the `frontend` directory (or add to your Railway environment):

```env
# PostgreSQL Database
DATABASE_URL=postgresql://postgres:ULpZRDYbNpSmbVQCDYPlmrUZSTZoHKbd@caboose.proxy.rlwy.net:46742/railway

# Alternative name (either works)
POSTGRES_URL=postgresql://postgres:ULpZRDYbNpSmbVQCDYPlmrUZSTZoHKbd@caboose.proxy.rlwy.net:46742/railway

# Redis (existing)
REDIS_URL=redis://your-redis-url

# SearXNG API (existing)
SEARXNG_API_URL=https://searxng-production-b099.up.railway.app
```

### 3. Generate and Run Migrations

```bash
# Generate migration files from schema
npm run db:generate

# Push schema changes directly to database (development)
npm run db:push

# Or run migrations (production)
npm run db:migrate
```

---

## Configuration

### Database Client

The database client is located at `src/lib/db/index.ts` and provides:

```typescript
import { getDb, isDatabaseConfigured } from '$lib/db';

// Check if database is available
if (isDatabaseConfigured()) {
  const db = getDb();
  // Use the database
}
```

### Drizzle Configuration

The Drizzle Kit configuration is in `drizzle.config.ts`:

```typescript
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/lib/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
```

---

## Database Schema

### Tables Overview

| Table | Description | Use Case |
|-------|-------------|----------|
| `searches` | Search history | Track all searches performed |
| `saved_results` | Bookmarked results | Save important findings |
| `research_projects` | Project organization | Group related searches |
| `project_searches` | Project-search links | Many-to-many relationship |
| `user_preferences` | User settings | Customization options |
| `search_analytics` | Usage tracking | Analytics and insights |

### Entity Relationship Diagram

```
┌──────────────────┐
│ searches         │
├──────────────────┤
│ id (PK)          │
│ query            │
│ engine           │
│ results_count    │
│ created_at       │
└────────┬─────────┘
         │
         │ 1:N
         │
         ▼
┌──────────────────┐         ┌──────────────────┐
│ saved_results    │         │ research_projects│
├──────────────────┤         ├──────────────────┤
│ id (PK)          │         │ id (PK)          │
│ search_id (FK)   │◄────────┤ name             │
│ project_id (FK)  │────────►│ description      │
│ url              │    N:1  │ created_at       │
│ title            │         └────────┬─────────┘
│ notes            │                  │
└──────────────────┘                  │ M:N
                                      │
                              ┌───────▼──────────┐
                              │ project_searches │
                              ├──────────────────┤
                              │ project_id (FK)  │
                              │ search_id (FK)   │
                              └──────────────────┘
```

### Schema Files

- **Location**: `src/lib/db/schema.ts`
- **Type Exports**: All tables have corresponding TypeScript types
- **Relations**: Defined using Drizzle's relations API

---

## Migrations

### Available Scripts

```bash
# Generate migration files from schema changes
npm run db:generate

# Run migrations (applies migration files)
npm run db:migrate

# Push schema directly (bypasses migrations - dev only)
npm run db:push

# Open Drizzle Studio (GUI database viewer)
npm run db:studio
```

### Workflow

1. **Modify Schema** (`src/lib/db/schema.ts`)
   ```typescript
   export const newTable = pgTable('new_table', {
     id: serial('id').primaryKey(),
     name: text('name').notNull(),
   });
   ```

2. **Generate Migration**
   ```bash
   npm run db:generate
   ```
   This creates a new file in `./drizzle/` directory

3. **Review Migration**
   Check the generated SQL in `./drizzle/000X_*.sql`

4. **Apply Migration**
   ```bash
   npm run db:migrate
   ```

### Development vs Production

- **Development**: Use `db:push` for quick iteration
- **Production**: Always use `db:migrate` for controlled deployments

---

## Usage Examples

### Basic CRUD Operations

#### 1. Create a Search Record

```typescript
import { getDb, searches, type NewSearch } from '$lib/db';

async function saveSearch(query: string, engine: string) {
  const db = getDb();
  
  const newSearch: NewSearch = {
    query,
    engine,
    engines: ['brave', 'duckduckgo'],
    resultsCount: 10,
  };
  
  const result = await db.insert(searches)
    .values(newSearch)
    .returning();
  
  return result[0];
}
```

#### 2. Query Searches

```typescript
import { getDb, searches } from '$lib/db';
import { desc, eq, and, gte } from 'drizzle-orm';

async function getRecentSearches(limit: number = 10) {
  const db = getDb();
  
  return await db.select()
    .from(searches)
    .orderBy(desc(searches.createdAt))
    .limit(limit);
}

async function searchByQuery(searchQuery: string) {
  const db = getDb();
  
  return await db.select()
    .from(searches)
    .where(eq(searches.query, searchQuery));
}

async function getSearchesByDateRange(startDate: Date, endDate: Date) {
  const db = getDb();
  
  return await db.select()
    .from(searches)
    .where(
      and(
        gte(searches.createdAt, startDate),
        lte(searches.createdAt, endDate)
      )
    );
}
```

#### 3. Update Records

```typescript
import { getDb, searches, eq } from '$lib/db';

async function updateSearchResultsCount(searchId: number, count: number) {
  const db = getDb();
  
  await db.update(searches)
    .set({ resultsCount: count })
    .where(eq(searches.id, searchId));
}
```

#### 4. Delete Records

```typescript
import { getDb, searches, eq } from '$lib/db';

async function deleteSearch(searchId: number) {
  const db = getDb();
  
  await db.delete(searches)
    .where(eq(searches.id, searchId));
}
```

### Working with Relations

#### Save a Result with Project

```typescript
import { getDb, savedResults, researchProjects, type NewSavedResult } from '$lib/db';

async function saveResultToProject(
  searchId: number,
  projectId: number,
  result: { url: string; title: string; content?: string }
) {
  const db = getDb();
  
  const savedResult: NewSavedResult = {
    searchId,
    projectId,
    url: result.url,
    title: result.title,
    content: result.content,
  };
  
  return await db.insert(savedResults)
    .values(savedResult)
    .returning();
}
```

#### Query with Joins

```typescript
import { getDb, searches, savedResults, researchProjects } from '$lib/db';

async function getProjectWithResults(projectId: number) {
  const db = getDb();
  
  const project = await db.query.researchProjects.findFirst({
    where: (projects, { eq }) => eq(projects.id, projectId),
    with: {
      savedResults: true,
    },
  });
  
  return project;
}
```

### Using in SvelteKit Endpoints

```typescript
// src/routes/api/searches/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDb, searches } from '$lib/db';
import { desc } from 'drizzle-orm';

export const GET: RequestHandler = async ({ url }) => {
  const limit = parseInt(url.searchParams.get('limit') || '10');
  const db = getDb();
  
  const recentSearches = await db.select()
    .from(searches)
    .orderBy(desc(searches.createdAt))
    .limit(limit);
  
  return json(recentSearches);
};

export const POST: RequestHandler = async ({ request }) => {
  const body = await request.json();
  const db = getDb();
  
  const result = await db.insert(searches)
    .values({
      query: body.query,
      engine: body.engine,
      resultsCount: body.resultsCount,
    })
    .returning();
  
  return json(result[0], { status: 201 });
};
```

---

## API Reference

### Database Client Functions

#### `getDb()`
Returns the Drizzle ORM client instance.

```typescript
const db = getDb();
```

#### `getRawClient()`
Returns the raw postgres client for direct SQL queries.

```typescript
const client = getRawClient();
const result = await client.unsafe('SELECT * FROM searches WHERE id = $1', [1]);
```

#### `closeDb()`
Closes the database connection. Call during application shutdown.

```typescript
await closeDb();
```

#### `isDatabaseConfigured()`
Checks if database URL is configured.

```typescript
if (isDatabaseConfigured()) {
  // Database is ready to use
}
```

### Type Exports

```typescript
import type {
  Search,
  NewSearch,
  SavedResult,
  NewSavedResult,
  ResearchProject,
  NewResearchProject,
  ProjectSearch,
  UserPreference,
  NewUserPreference,
  SearchAnalytic,
} from '$lib/db';
```

---

## Best Practices

### 1. Error Handling

Always wrap database operations in try-catch blocks:

```typescript
try {
  const db = getDb();
  const results = await db.select().from(searches);
  return results;
} catch (error) {
  console.error('Database query failed:', error);
  throw error;
}
```

### 2. Connection Management

- The client uses connection pooling automatically
- Don't create new connections per query
- Use the singleton pattern (already implemented)

### 3. Transactions

Use transactions for operations that must succeed together:

```typescript
const db = getDb();

await db.transaction(async (tx) => {
  await tx.insert(searches).values(newSearch);
  await tx.insert(searchAnalytics).values(analytic);
});
```

### 4. Indexing

Indexes are already defined in the schema for commonly queried fields:
- `searches.query`
- `searches.createdAt`
- `saved_results.url`
- `saved_results.projectId`

Add more indexes as needed:

```typescript
export const searches = pgTable('searches', {
  // ... columns
}, (table) => ({
  customIdx: index('custom_idx').on(table.someColumn),
}));
```

### 5. Pagination

Implement pagination for large result sets:

```typescript
async function getSearchesPaginated(page: number, pageSize: number = 20) {
  const db = getDb();
  const offset = (page - 1) * pageSize;
  
  return await db.select()
    .from(searches)
    .limit(pageSize)
    .offset(offset)
    .orderBy(desc(searches.createdAt));
}
```

### 6. Environment Variables

Never commit `.env` files. Use `.env.example` as a template:

```env
DATABASE_URL=postgresql://user:password@host:port/database
```

---

## Troubleshooting

### Connection Issues

**Error**: `DATABASE_URL not found`
- **Solution**: Ensure `.env` file exists and contains `DATABASE_URL`
- **Solution**: Restart the development server after adding environment variables

**Error**: `Connection refused`
- **Solution**: Verify PostgreSQL is running
- **Solution**: Check firewall settings
- **Solution**: Verify the connection URL format

### Migration Issues

**Error**: `Migration failed`
- **Solution**: Check the generated SQL in `./drizzle/` directory
- **Solution**: Ensure database user has CREATE TABLE permissions
- **Solution**: Run `npm run db:push` to force sync (dev only)

**Error**: `Table already exists`
- **Solution**: Check if migration was already applied
- **Solution**: Use `db:push` to skip migration history

### Query Issues

**Error**: `Column does not exist`
- **Solution**: Run migrations to create missing columns
- **Solution**: Check schema definition matches database

**Error**: `Type mismatch`
- **Solution**: Ensure TypeScript types match schema types
- **Solution**: Run `npm run db:generate` to sync types

### Performance Issues

**Slow Queries**
- Add indexes for frequently queried columns
- Use pagination instead of loading all results
- Consider caching with Redis for frequently accessed data

**High Memory Usage**
- Reduce connection pool size in `db/index.ts`
- Implement query result limits
- Use streaming for large datasets

---

## Additional Resources

- [Drizzle ORM Documentation](https://orm.drizzle.team/docs/overview)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [SvelteKit Environment Variables](https://kit.svelte.dev/docs/modules#$env-dynamic-private)
- [Drizzle Kit CLI](https://orm.drizzle.team/kit-docs/overview)

---

## Support

For issues or questions:
1. Check this documentation
2. Review Drizzle ORM docs
3. Check PostgreSQL logs
4. Open an issue in the project repository