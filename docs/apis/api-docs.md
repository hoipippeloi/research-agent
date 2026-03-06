# API Documentation

## Quick Start

**What can I do with these APIs?**

1. **Search** - Query multiple search engines (general, code, academic) with automatic caching
2. **View History** - Access recent search history
3. **Organize** - Create topic-based collections to group related searches
4. **Save Results** - Bookmark search results with full markdown content

**Fastest way to get started:**

```bash
# Search the web
curl "http://localhost:5173/api/search?query=machine%20learning&userEmail=user@example.com"

# View recent searches
curl "http://localhost:5173/api/history?userEmail=user@example.com"

# Create a collection
curl -X POST http://localhost:5173/api/collections \
  -H "Content-Type: application/json" \
  -d '{"topic":"AI Research","userEmail":"user@example.com"}'

# Save a result
curl -X POST http://localhost:5173/api/saved-results \
  -H "Content-Type: application/json" \
  -d '{
    "userEmail":"user@example.com",
    "url":"https://example.com/article",
    "title":"Great Article",
    "markdown":"Article content here...",
    "collectionId":1
  }'
```

---

## Overview

### Architecture at a Glance

```
Your App
   ↓
SvelteKit API Routes (/api/*)
   ↓
┌─────────┬──────────────┬──────────────┐
│ Redis   │ PostgreSQL   │ SearXNG      │
│ (cache) │ (permanent)  │ (metasearch) │
└─────────┴──────────────┴──────────────┘
```

**Three-tier storage strategy:**
- **Redis** - Fast cache and recent history (temporary, 1 hour TTL)
- **PostgreSQL** - Permanent storage (collections, saved results)
- **SearXNG** - External metasearch engine (actual web searches)

### Available APIs

| API | Purpose | Storage | Use When... |
|-----|---------|---------|-------------|
| `/api/search` | Perform searches | Redis + SearXNG | User searches for information |
| `/api/history` | View recent searches | Redis | User wants to see past searches |
| `/api/collections` | Organize searches by topic | PostgreSQL | User wants to group related searches |
| `/api/saved-results` | Bookmark specific results | PostgreSQL | User wants to save a result for later |
| `/api/notify-new-user` | Send notifications | External (Notifuse) | New user signs up |

---

## Common Use Cases

### Use Case 1: Basic Search Workflow

**Scenario**: User wants to search for "machine learning tutorials"

```bash
# Step 1: Perform search
GET /api/search?query=machine%20learning%20tutorials&userEmail=user@example.com

# Response includes:
{
  "query": "machine learning tutorials",
  "number_of_results": 10,
  "results": [
    {
      "url": "https://example.com/ml-tutorial",
      "title": "Complete ML Guide",
      "content": "Learn machine learning from scratch...",
      "engine": "brave",
      "score": 1.5
    }
  ],
  "cached": false  # Results are fresh, not from cache
}

# Step 2: Search is automatically added to history (Redis)
# Step 3: Results are cached for 1 hour in Redis
```

**What happens behind the scenes:**
1. Check Redis cache for this query
2. If not cached, call SearXNG API (brave, duckduckgo, startpage)
3. Deduplicate results by URL (keep highest score)
4. Cache results in Redis (1 hour TTL)
5. Save to search history in Redis
6. Return results to user

### Use Case 2: Organize Research into Collections

**Scenario**: User is researching "quantum computing" and wants to organize related searches

```bash
# Step 1: Create a collection
POST /api/collections
{
  "topic": "quantum computing",
  "userEmail": "user@example.com"
}

# Response:
{
  "id": 5,
  "topic": "quantum computing",
  "userEmail": "user@example.com",
  "searchCount": 1,
  "createdAt": "2024-01-15T10:30:00Z"
}

# Step 2: Perform searches (automatically tracked)
GET /api/search?query=quantum%20algorithms&userEmail=user@example.com

# Step 3: View all collections
GET /api/collections?userEmail=user@example.com

# Response shows all collections with metadata:
[
  {
    "id": 5,
    "topic": "quantum computing",
    "searchCount": 3,
    "engines": ["brave", "duckduckgo"],
    "metadata": {
      "totalResults": 45,
      "lastEngine": "brave"
    }
  }
]
```

### Use Case 3: Save Important Results

**Scenario**: User found a valuable article and wants to save it with notes

```bash
# Save the result with markdown content and notes
POST /api/saved-results
{
  "userEmail": "user@example.com",
  "url": "https://arxiv.org/paper/12345",
  "title": "Quantum Computing Breakthrough",
  "markdown": "# Abstract\n\nThis paper presents...",
  "collectionId": 5,
  "notes": "Important for my research on quantum algorithms"
}

# Response:
{
  "id": 42,
  "url": "https://arxiv.org/paper/12345",
  "title": "Quantum Computing Breakthrough",
  "content": "# Abstract\n\nThis paper presents...",
  "collectionId": 5,
  "notes": "Important for my research on quantum algorithms",
  "isRead": false,
  "isArchived": false,
  "createdAt": "2024-01-15T11:00:00Z"
}
```

**Smart upsert behavior:**
- If URL already exists for this user → updates content, title, and collectionId
- If URL is new → creates new saved result
- Prevents duplicate bookmarks

### Use Case 4: Search Code Repositories

**Scenario**: Developer searching for React hooks examples

```bash
# Use the "code" engine for programming-related searches
GET /api/search?query=react%20hooks%20examples&userEmail=dev@example.com&engine=code

# Searches GitHub and StackOverflow specifically
{
  "results": [
    {
      "url": "https://github.com/user/react-hooks-demo",
      "title": "React Hooks Examples Repository",
      "engine": "github",
      "score": 2.1
    },
    {
      "url": "https://stackoverflow.com/questions/...",
      "title": "How to use useEffect",
      "engine": "stackoverflow",
      "score": 1.8
    }
  ]
}
```

**Available engines:**
- `general` (default) → brave, duckduckgo, startpage
- `code` → github, stackoverflow
- `academic` → arxiv, semantic scholar

---

## API Reference

### Search API

**Endpoint**: `/api/search`

**Purpose**: Search across multiple engines with automatic caching and history tracking

#### GET /api/search

**Query Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `query` | string | ✅ Yes | - | Search query text |
| `userEmail` | string | ✅ Yes | - | User identifier |
| `engine` | string | No | `general` | Engine type: `general`, `code`, `academic` |
| `cacheOnly` | boolean | No | `false` | Return cached results only (skip live search) |

**Example Request:**
```bash
GET /api/search?query=climate%20change&userEmail=user@example.com&engine=general
```

**Success Response (200):**
```json
{
  "query": "climate change",
  "number_of_results": 10,
  "results": [
    {
      "url": "https://example.com/climate-article",
      "title": "Understanding Climate Change",
      "content": "Climate change refers to...",
      "thumbnail": "https://example.com/image.jpg",
      "publishedDate": "2024-01-10",
      "engine": "brave",
      "score": 1.5
    }
  ],
  "cached": false,
  "cachedAt": 1705312800
}
```

**How Caching Works:**
1. First search → calls SearXNG, caches results (1 hour TTL)
2. Repeat search within 1 hour → returns cached results
3. Set `cacheOnly=true` → returns cached results only (or empty if not cached)

#### POST /api/search

**Request Body:**
```json
{
  "query": "string",
  "userEmail": "string",
  "engine": "general" | "code" | "academic"
}
```

**Example:**
```bash
POST /api/search
Content-Type: application/json

{
  "query": "machine learning",
  "userEmail": "user@example.com",
  "engine": "academic"
}
```

**Response:** Same as GET request

---

### History API

**Endpoint**: `/api/history`

**Purpose**: View and manage recent search history

#### GET /api/history

**Query Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `userEmail` | string | ✅ Yes | - | User identifier |
| `limit` | number | No | `6` | Maximum number of results |

**Example:**
```bash
GET /api/history?userEmail=user@example.com&limit=10
```

**Success Response (200):**
```json
[
  {
    "id": "search:user@example.com:1705312800:abc123",
    "userEmail": "user@example.com",
    "query": "machine learning",
    "timestamp": 1705312800,
    "engine": "brave,duckduckgo,startpage",
    "resultsCount": 10
  },
  {
    "id": "search:user@example.com:1705312600:def456",
    "userEmail": "user@example.com",
    "query": "quantum computing",
    "timestamp": 1705312600,
    "engine": "arxiv,semantic scholar",
    "resultsCount": 8
  }
]
```

**Storage Details:**
- Stores last 100 searches per user in Redis
- Automatically sorted by timestamp (most recent first)
- Persists until Redis cache is cleared

#### DELETE /api/history

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | ✅ Yes | Search ID to delete |
| `userEmail` | string | ✅ Yes | User identifier |

**Example:**
```bash
DELETE /api/history?id=search:user@example.com:1705312800:abc123&userEmail=user@example.com
```

**Success Response (200):**
```json
{
  "success": true
}
```

---

### Collections API

**Endpoint**: `/api/collections`

**Purpose**: Organize searches by topic/theme

#### GET /api/collections

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `userEmail` | string | ✅ Yes | User identifier |

**Example:**
```bash
GET /api/collections?userEmail=user@example.com
```

**Success Response (200):**
```json
[
  {
    "id": 1,
    "userEmail": "user@example.com",
    "topic": "machine learning",
    "description": "ML research and tutorials",
    "searchCount": 5,
    "engines": ["brave", "duckduckgo"],
    "metadata": {
      "totalResults": 150,
      "lastEngine": "brave"
    },
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
]
```

#### POST /api/collections

**Request Body:**
```json
{
  "topic": "string",
  "userEmail": "string"
}
```

**Example:**
```bash
POST /api/collections
Content-Type: application/json

{
  "topic": "quantum computing",
  "userEmail": "user@example.com"
}
```

**Success Response (201):**
```json
{
  "id": 5,
  "userEmail": "user@example.com",
  "topic": "quantum computing",
  "searchCount": 1,
  "engines": [],
  "createdAt": "2024-01-15T11:00:00Z",
  "updatedAt": "2024-01-15T11:00:00Z"
}
```

**Business Logic:**
- Checks if collection with same topic already exists for user
- If exists → returns existing collection (no duplicate)
- If not → creates new collection
- Ensures unique topic names per user

#### DELETE /api/collections

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | number | ✅ Yes | Collection ID |
| `userEmail` | string | ✅ Yes | User identifier |

**Example:**
```bash
DELETE /api/collections?id=5&userEmail=user@example.com
```

**Success Response (200):**
```json
{
  "success": true,
  "deleted": {
    "id": 5,
    "topic": "quantum computing",
    "userEmail": "user@example.com"
  }
}
```

**Cascade Behavior:**
- Deletes all entries in `collection_searches` junction table
- Does NOT delete saved results linked to this collection
- Sets `collectionId` to `null` in saved results

---

### Saved Results API

**Endpoint**: `/api/saved-results`

**Purpose**: Bookmark search results with full content

#### POST /api/saved-results

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `userEmail` | string | ✅ Yes | User identifier |
| `url` | string | ✅ Yes | Source URL of result |
| `markdown` | string | ✅ Yes | Full content in markdown format |
| `title` | string | No | Result title (defaults to URL hostname) |
| `collectionId` | number | No | Link to collection (optional) |

**Example:**
```bash
POST /api/saved-results
Content-Type: application/json

{
  "userEmail": "user@example.com",
  "url": "https://arxiv.org/paper/12345",
  "title": "Quantum Computing Paper",
  "markdown": "# Abstract\n\nThis paper presents a new approach...",
  "collectionId": 5
}
```

**Success Response (200):**
```json
{
  "success": true,
  "result": {
    "id": 42,
    "userEmail": "user@example.com",
    "url": "https://arxiv.org/paper/12345",
    "title": "Quantum Computing Paper",
    "content": "# Abstract\n\nThis paper presents a new approach...",
    "collectionId": 5,
    "isRead": false,
    "isArchived": false,
    "createdAt": "2024-01-15T11:00:00Z",
    "updatedAt": "2024-01-15T11:00:00Z"
  }
}
```

**Upsert Behavior:**
- Checks if URL already exists for this user
- If exists → updates `content`, `title`, `collectionId`, `updatedAt`
- If not → creates new saved result
- Prevents duplicate bookmarks for same URL

---

### Notify New User API

**Endpoint**: `/api/notify-new-user`

**Purpose**: Send notification when new user signs up

#### POST /api/notify-new-user

**Request Body:**
```json
{
  "newUserEmail": "newuser@example.com"
}
```

**Example:**
```bash
POST /api/notify-new-user
Content-Type: application/json

{
  "newUserEmail": "newuser@example.com"
}
```

**Success Response (200):**
```json
{
  "success": true
}
```

**What it does:**
1. Validates `newUserEmail` is provided
2. Calls Notifuse API to send email notification
3. Sends email to `patrick@hoipippeloi.nl` with new user data

---

## Data Flow

### Search to Display Flow

```
User enters search query
         ↓
    POST /api/search
         ↓
   Check Redis cache
         ↓
    ┌────┴────┐
   Hit        Miss
    ↓          ↓
Return      Call SearXNG
cached         ↓
         Deduplicate results
                ↓
         Cache in Redis (1h)
                ↓
         Save to history
                ↓
         Return to user
```

### Save and Organize Flow

```
User saves a result
         ↓
  POST /api/saved-results
         ↓
   Check PostgreSQL
         ↓
    ┌────┴────┐
  Exists      New
    ↓          ↓
  Update    Insert
    ↓          ↓
Link to collection (optional)
         ↓
   Return saved result
```

---

## Technical Details

### Error Handling

All APIs return consistent error format:

```json
{
  "error": "Error message describing what went wrong"
}
```

**Common HTTP Status Codes:**

| Code | Meaning | When it happens |
|------|---------|-----------------|
| `200` | Success | Request completed successfully |
| `201` | Created | Resource created (POST to /collections) |
| `400` | Bad Request | Missing required parameters |
| `404` | Not Found | Resource doesn't exist (DELETE non-existent collection) |
| `500` | Server Error | Internal server error |
| `503` | Service Unavailable | Database not ready |

### Caching Strategy

**Redis Cache Layers:**

1. **Search Results Cache**
   - Key: `cache:{engine}:{query}`
   - TTL: 3600 seconds (1 hour)
   - Content: Full JSON response with results
   - Purpose: Avoid repeated SearXNG calls

2. **Search History**
   - Hash: `search:{userEmail}:{timestamp}:{random}`
   - List: `search:recent:{userEmail}` (max 100 items)
   - Sorted Set: `search:history:{userEmail}`
   - Purpose: Fast recent search retrieval

**Cache Invalidation:**
- Search results: Automatically expire after 1 hour
- History: Keeps last 100 searches per user
- Manual invalidation: DELETE /api/history

### Performance Characteristics

| Operation | Typical Response Time | Bottleneck |
|-----------|----------------------|------------|
| Cached search | < 50ms | Redis lookup |
| Live search | 500ms - 3s | SearXNG API call |
| History retrieval | < 50ms | Redis read |
| Collections CRUD | < 100ms | PostgreSQL query |
| Save result | < 100ms | PostgreSQL write |

**Optimization Tips:**
- Use `cacheOnly=true` for instant cached results
- Default `limit=6` for history optimizes payload size
- Deduplication by URL prevents redundant results
- Indexed PostgreSQL queries ensure fast collection operations

### Rate Limiting & Quotas

**Current Limits:**
- No explicit rate limiting on API endpoints
- Redis cache reduces SearXNG API calls
- History limited to last 100 searches per user

**Best Practices:**
- Leverage caching (1-hour TTL)
- Use `cacheOnly=true` when appropriate
- Batch operations when possible

---

## Advanced Topics

### External Services

#### SearXNG Client

**Base URL**: `https://search.hoipippeloi.com`

**Available Methods:**
```typescript
// General search (brave, duckduckgo, startpage)
searchGeneral(query: string): Promise<SearchResult[]>

// Code search (github, stackoverflow)
searchCode(query: string): Promise<SearchResult[]>

// Academic search (arxiv, semantic scholar)
searchAcademic(query: string): Promise<SearchResult[]>

// Custom search with specific engines
search(query: string, options: { engines: string[] }): Promise<SearchResult[]>

// Autocomplete suggestions
getSuggestions(query: string): Promise<string[]>
```

**Timeout**: 30 seconds

**Result Format:**
```typescript
interface SearchResult {
  url: string;
  title: string;
  content: string;
  thumbnail?: string;
  publishedDate?: string;
  engine: string;
  score: number;
}
```

#### Notifuse API

**Base URL**: `https://hoi-email.up.railway.app`

**Endpoint**: `/api/transactional.send`

**Purpose**: Transactional email service for user notifications

### Database Storage Details

#### PostgreSQL Tables (Permanent Storage)

**Tables currently used by APIs:**

1. **`collections`** - Topic collections
2. **`saved_results`** - Bookmarked results

**Tables defined but not yet used:**

3. `searches` - Persistent search history (future feature)
4. `research_projects` - Project organization (future feature)
5. `user_preferences` - User settings (future feature)
6. `search_analytics` - Analytics tracking (future feature)

See [Database Documentation](../db/db-docs.md) for complete schema details.

#### Redis Data Structures (Temporary Storage)

**Search History:**
```
Hash: search:{userEmail}:{timestamp}:{random}
  → {query, engine, timestamp, resultsCount}

List: search:recent:{userEmail}
  → [search IDs] (max 100)

Sorted Set: search:history:{userEmail}
  → {search ID: timestamp}
```

**Search Cache:**
```
Key: cache:{engine}:{query}
  → JSON {results, timestamp, count}
  → TTL: 3600 seconds
```

### Deduplication Algorithm

**Problem**: Multiple engines may return same URL with different scores

**Solution:**
1. Group results by URL
2. For each URL, keep result with highest score
3. Discard lower-scoring duplicates

**Example:**
```javascript
// Before deduplication
[
  { url: "example.com", score: 1.2, engine: "brave" },
  { url: "example.com", score: 1.5, engine: "duckduckgo" },
  { url: "other.com", score: 1.0, engine: "brave" }
]

// After deduplication
[
  { url: "example.com", score: 1.5, engine: "duckduckgo" },
  { url: "other.com", score: 1.0, engine: "brave" }
]
```

### Debugging & Troubleshooting

**Common Issues:**

1. **Empty search results**
   - Check SearXNG service is running
   - Verify `SEARXNG_API_URL` environment variable
   - Check network connectivity

2. **Cache not working**
   - Verify `REDIS_URL` environment variable
   - Check Redis server is running
   - Verify Redis connection in logs

3. **Collections not persisting**
   - Check `DATABASE_URL` environment variable
   - Verify PostgreSQL database is accessible
   - Check Drizzle ORM connection

4. **User authentication issues**
   - All endpoints require `userEmail` parameter
   - No actual authentication implemented (placeholder)
   - User email used as identifier for data isolation

**Logging:**
- All API errors logged to console
- Database errors include stack traces
- SearXNG API failures logged with query details

**Health Check Endpoints:**
- Check Redis: GET /api/history (should return empty array or history)
- Check PostgreSQL: GET /api/collections (should return empty array or collections)
- Check SearXNG: GET /api/search?query=test (should return results)

---

## Migration Guide

### Upgrading from Previous Versions

**Version 1.0 → 2.0 Breaking Changes:**
- None currently (initial version)

**Deprecation Schedule:**
- No deprecated endpoints

### Future Roadmap

**Planned Features:**
1. **Persistent search history** - Move from Redis to PostgreSQL `searches` table
2. **Research projects** - Implement `/api/projects` endpoints
3. **User preferences** - Implement `/api/preferences` endpoints
4. **Analytics tracking** - Implement `/api/analytics` endpoints
5. **Advanced search filters** - Date range, domain filtering
6. **Bulk operations** - Batch save, bulk delete

**Backward Compatibility:**
- All current endpoints will remain stable
- New features added as new endpoints
- Database migrations handled automatically

---

## Need Help?

**Common Questions:**

**Q: Why is my search slow?**
A: First search calls external SearXNG API (500ms - 3s). Subsequent searches within 1 hour are cached and fast (< 50ms).

**Q: How long does history persist?**
A: Redis stores last 100 searches per user. No permanent history storage yet (coming soon).

**Q: Can I search specific websites?**
A: Use `engine` parameter to choose general/code/academic. Custom engine selection coming in future version.

**Q: How do I backup my saved results?**
A: Saved results are stored in PostgreSQL. Use standard database backup procedures.

**Related Documentation:**
- [Database Schema](../db/db-docs.md) - Complete database documentation
- [Development Guide](../../AGENTS.md) - Development environment setup
- [Drizzle ORM Skill](../../.agents/skills/drizzle-orm/SKILL.md) - ORM best practices