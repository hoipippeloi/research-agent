# Research Agent: Routes and Interface Dependencies

This document maps all routes in the Research Agent application and traces their dependencies down to the data and file layers.

## Complete Dependency Tree Structure

```
Research Agent Application
├── Frontend Routes
│   ├── / (Main Search Interface)
│   │   ├── Components/
│   │   │   ├── BirdsFlocking.svelte
│   │   │   ├── Modal.svelte
│   │   │   ├── MarkdownPreviewModal.svelte
│   │   │   └── EmailModal.svelte
│   │   ├── Stores/
│   │   │   ├── uiScale.ts
│   │   │   └── userEmail.ts
│   │   ├── Libraries/
│   │   │   └── modal-url.ts
│   │   └── API Dependencies/
│   │       ├── /api/search
│   │       ├── /api/history
│   │       ├── /api/collections
│   │       └── /api/bookmarks
│   │
│   ├── /agent (AI Chat Interface)
│   │   └── Dependencies/
│   │       └── LLM Gateway Client
│   │
│   ├── /collection/[id] (Collection Detail)
│   │   ├── Components/
│   │   │   ├── Header.svelte
│   │   │   └── MarkdownEditor.svelte
│   │   └── API Dependencies/
│   │       ├── /api/collections/[id]
│   │       ├── /api/collections/[id]/items
│   │       └── /api/saved-results
│   │
│   ├── /doc (Document Management)
│   │   └── API Dependencies/
│   │       └── /api/documents
│   │
│   ├── /chat-test (Chat Testing)
│   │   └── Dependencies/
│   │       └── LLM Gateway Client
│   │
│   └── /test-llm (LLM Testing)
│       └── Dependencies/
│           └── LLM Gateway Client
│
├── API Routes
│   ├── /api/search
│   │   ├── Libraries/
│   │   │   ├── searxng-client.ts
│   │   │   │   ├── SearXNGClient class
│   │   │   │   └── axios (HTTP client)
│   │   │   └── redis-client.ts
│   │   │       ├── getRedis() function
│   │   │       ├── Search caching functions
│   │   │       └── Search history functions
│   │   ├── External Services/
│   │   │   └── SearXNG API (searxng-production-b099.up.railway.app)
│   │   └── Data Layer/
│   │       ├── Redis (caching, history)
│   │       └── PostgreSQL (searches table)
│   │
│   ├── /api/bookmarks
│   │   ├── Libraries/
│   │   │   ├── db/index.ts (getDb function)
│   │   │   └── db/schema.ts (savedResults table)
│   │   └── Data Layer/
│   │       └── PostgreSQL/
│   │           └── saved_results table
│   │               ├── user_email index
│   │               ├── url index
│   │               └── created_at index
│   │
│   ├── /api/collections
│   │   ├── Libraries/
│   │   │   ├── db/index.ts
│   │   │   └── db/schema.ts
│   │   │       ├── collections table
│   │   │       ├── searches table
│   │   │       └── collectionSearches junction
│   │   └── Data Layer/
│   │       └── PostgreSQL/
│   │           ├── collections table
│   │           ├── searches table
│   │           └── collection_searches table
│   │
│   ├── /api/collections/[id]
│   │   ├── Same as /api/collections
│   │   └── Parameter validation
│   │
│   ├── /api/collections/[id]/items
│   │   ├── Libraries/
│   │   │   └── db/ (collections + savedResults relations)
│   │   └── Data Layer/
│   │       └── PostgreSQL (junction relationships)
│   │
│   ├── /api/documents
│   │   ├── Libraries/
│   │   │   └── db/ (documents table)
│   │   └── Data Layer/
│   │       ├── PostgreSQL (documents table)
│   │       └── File System (document storage)
│   │
│   ├── /api/fetch-markdown
│   │   ├── Dependencies/
│   │   │   ├── HTTP client
│   │   │   └── Markdown parsing libraries
│   │   └── Data Layer/
│   │       ├── External web resources
│   │       └── Redis (optional caching)
│   │
│   ├── /api/history
│   │   ├── Libraries/
│   │   │   └── redis-client.ts
│   │   │       ├── getRecentSearches()
│   │   │       └── deleteSearch()
│   │   └── Data Layer/
│   │       └── Redis/
│   │           ├── search:recent:{userEmail} lists
│   │           ├── search:history:{userEmail} sorted sets
│   │           └── Individual search hash objects
│   │
│   ├── /api/notify-new-user
│   │   ├── Dependencies/
│   │   │   ├── Email service integration
│   │   │   └── User preference checking
│   │   └── Data Layer/
│   │       ├── PostgreSQL (user_preferences table)
│   │       └── External email service
│   │
│   ├── /api/saved-results
│   │   ├── Libraries/
│   │   │   └── db/ (savedResults + relations)
│   │   └── Data Layer/
│   │       └── PostgreSQL/
│   │           ├── saved_results table
│   │           └── Foreign key relationships
│   │
│   └── /api/chat/config
│       ├── Dependencies/
│       │   ├── LLM Gateway client configuration
│       │   └── User preferences
│       └── Data Layer/
│           ├── PostgreSQL (user_preferences table)
│           └── LLM Gateway service
│
├── Core Libraries
│   ├── $lib/db/
│   │   ├── index.ts
│   │   │   ├── drizzle-orm/postgres-js
│   │   │   ├── postgres (client)
│   │   │   └── $env/dynamic/private
│   │   │       ├── DATABASE_URL
│   │   │       └── POSTGRES_URL
│   │   └── schema.ts
│   │       ├── Table definitions
│   │       ├── Relations
│   │       └── Type exports
│   │
│   ├── $lib/searxng-client.ts
│   │   ├── axios (HTTP client)
│   │   ├── SearXNG API endpoint
│   │   └── Search methods/
│   │       ├── search()
│   │       ├── searchGeneral()
│   │       ├── searchCode()
│   │       ├── searchAcademic()
│   │       └── getSuggestions()
│   │
│   ├── $lib/redis-client.ts
│   │   ├── ioredis (Redis client)
│   │   ├── $env/dynamic/private (REDIS_URL)
│   │   └── Functions/
│   │       ├── Search history management
│   │       ├── Results caching
│   │       └── Session data storage
│   │
│   └── $lib/llm/
│       ├── LLM Gateway client
│       └── Qwen3.5-4B inference server
│
├── External Services
│   ├── SearXNG Search Engine
│   │   ├── URL: searxng-production-b099.up.railway.app
│   │   └── Engines/
│   │       ├── General: Brave, DuckDuckGo, Startpage
│   │       ├── Code: GitHub, Stack Overflow
│   │       └── Academic: arXiv, Semantic Scholar
│   │
│   ├── PostgreSQL Database
│   │   ├── Tables/
│   │   │   ├── searches
│   │   │   ├── saved_results
│   │   │   ├── research_projects
│   │   │   ├── collections
│   │   │   ├── user_preferences
│   │   │   ├── search_analytics
│   │   │   └── Junction tables
│   │   └── Indexes (user-optimized)
│   │
│   ├── Redis Cache
│   │   ├── Usage/
│   │   │   ├── Search result caching (1h TTL)
│   │   │   ├── Recent search history
│   │   │   └── Session data storage
│   │   └── Key Patterns/
│   │       ├── cache:{engine}:{query}
│   │       ├── search:recent:{userEmail}
│   │       └── search:history:{userEmail}
│   │
│   └── LLM Gateway
│       ├── Purpose: Qwen3.5-4B model inference
│       ├── API: OpenAI-compatible interface
│       └── Features/
│           ├── Chat completions
│           ├── Streaming responses
│           ├── JSON mode
│           └── Code generation helpers
│
├── File System
│   ├── Frontend Assets/
│   │   ├── /static/ (static files)
│   │   └── .svelte-kit/ (build output)
│   │
│   ├── Configuration Files/
│   │   ├── .env files
│   │   ├── /drizzle/ (migrations)
│   │   ├── svelte.config.js
│   │   ├── vite.config.ts
│   │   └── drizzle.config.ts
│   │
│   └── Source Code/
│       ├── /src/routes/ (SvelteKit routes)
│       ├── /src/lib/ (shared libraries)
│       └── /src/app.html (HTML template)
│
└── Build & Runtime Environment
    ├── Build Tools/
    │   ├── SvelteKit (framework + routing)
    │   ├── Vite (build tool + dev server)
    │   ├── TypeScript (type checking)
    │   ├── Tailwind CSS (styling)
    │   └── Drizzle Kit (DB migrations)
    │
    ├── Runtime/
    │   ├── Node.js
    │   └── Railway (deployment platform)
    │
    └── Environment Variables/
        ├── DATABASE_URL (PostgreSQL)
        ├── REDIS_URL (Redis)
        ├── SEARXNG_API_URL (Search engine)
        └── LLM_GATEWAY_URL (AI service)
```

## Frontend Page Routes

### `/` - Main Search Interface
- **Components:**
  - `BirdsFlocking.svelte`
  - `Modal.svelte`
  - `MarkdownPreviewModal.svelte`
  - `EmailModal.svelte`
- **Stores:**
  - `$lib/stores/uiScale.ts`
  - `$lib/stores/userEmail.ts`
- **Libraries:**
  - `$lib/modal-url.ts`
- **API Dependencies:**
  - `/api/search` (search execution)
  - `/api/history` (search history)
  - `/api/collections` (collections management)
  - `/api/bookmarks` (bookmarks management)
- **Data Layer:**
  - Redis (search history, caching)
  - PostgreSQL (collections, saved results)
  - SearXNG API (search results)

### `/agent` - AI Chat Interface
- **Dependencies:** (to be determined based on implementation)

### `/collection/[id]` - Collection Detail View
- **Components:**
  - `Header.svelte`
  - `MarkdownEditor.svelte`
  - Various UI components
- **API Dependencies:**
  - `/api/collections/[id]` (collection data)
  - `/api/collections/[id]/items` (collection items)
  - `/api/saved-results` (linked results)
- **Data Layer:**
  - PostgreSQL (collections, collectionSearches, savedResults tables)

### `/doc` - Document Management
- **API Dependencies:**
  - `/api/documents` (document operations)
- **Data Layer:**
  - PostgreSQL (documents table)
  - File system (document storage)

### `/chat-test` - Chat Testing Interface
- **Dependencies:**
  - LLM Gateway client
- **Data Layer:**
  - LLM Gateway API

### `/test-llm` - LLM Testing Interface
- **Dependencies:**
  - LLM Gateway client
- **Data Layer:**
  - LLM Gateway API

## API Routes

### `/api/search` - Search Operations
- **Methods:** GET, POST
- **Dependencies:**
  - `$lib/searxng-client.ts`
    - `SearXNGClient` class
    - HTTP client (axios)
  - `$lib/redis-client.ts`
    - `getRedis()` function
    - Search caching functions
    - Search history functions
- **External Services:**
  - SearXNG API (https://searxng-production-b099.up.railway.app)
- **Data Layer:**
  - Redis (search caching, history)
  - PostgreSQL (searches table via future enhancement)

### `/api/bookmarks` - Bookmark Management
- **Methods:** GET, POST, DELETE
- **Dependencies:**
  - `$lib/db/index.ts`
    - `getDb()` function
    - Database connection management
  - `$lib/db/schema.ts`
    - `savedResults` table schema
    - Drizzle ORM queries
- **Data Layer:**
  - PostgreSQL
    - `saved_results` table
    - Indexes: user_email, url, created_at

### `/api/collections` - Collection Management
- **Methods:** GET, POST, DELETE
- **Dependencies:**
  - `$lib/db/index.ts`
  - `$lib/db/schema.ts`
    - `collections` table
    - `searches` table
    - `collectionSearches` junction table
- **Data Layer:**
  - PostgreSQL
    - `collections` table
    - `searches` table
    - `collection_searches` table
    - Relations and foreign keys

### `/api/collections/[id]` - Individual Collection Operations
- **Methods:** GET, PUT, DELETE
- **Dependencies:**
  - Same as `/api/collections`
  - Additional parameter validation
- **Data Layer:**
  - PostgreSQL (same tables as above)

### `/api/collections/[id]/items` - Collection Items Management
- **Methods:** GET, POST, DELETE
- **Dependencies:**
  - `$lib/db/index.ts`
  - `$lib/db/schema.ts`
    - Collection relations
    - SavedResults relations
- **Data Layer:**
  - PostgreSQL
    - `saved_results` table
    - `collections` table
    - Junction table relationships

### `/api/documents` - Document Operations
- **Methods:** GET, POST, PUT, DELETE
- **Dependencies:**
  - `$lib/db/index.ts`
  - `$lib/db/schema.ts` (if documents table exists)
- **Data Layer:**
  - PostgreSQL (documents table)
  - File system (document storage)

### `/api/documents/[id]` - Individual Document Operations
- **Methods:** GET, PUT, DELETE
- **Dependencies:**
  - Same as `/api/documents`
- **Data Layer:**
  - PostgreSQL
  - File system

### `/api/fetch-markdown` - Markdown Content Fetching
- **Methods:** GET, POST
- **Dependencies:**
  - HTTP client for external requests
  - Markdown parsing libraries
- **Data Layer:**
  - External web resources
  - Optional caching in Redis

### `/api/history` - Search History Management
- **Methods:** GET, DELETE
- **Dependencies:**
  - `$lib/redis-client.ts`
    - `getRecentSearches()`
    - `deleteSearch()`
- **Data Layer:**
  - Redis
    - `search:recent:{userEmail}` lists
    - `search:history:{userEmail}` sorted sets
    - Individual search hash objects

### `/api/notify-new-user` - User Notification System
- **Methods:** POST
- **Dependencies:**
  - Email service integration
  - User preference checking
- **Data Layer:**
  - PostgreSQL (user_preferences table)
  - External email service

### `/api/saved-results` - Saved Results Management
- **Methods:** GET, POST, PUT, DELETE
- **Dependencies:**
  - `$lib/db/index.ts`
  - `$lib/db/schema.ts`
    - `savedResults` table
    - Relations to searches, projects, collections
- **Data Layer:**
  - PostgreSQL
    - `saved_results` table
    - Foreign key relationships

### `/api/saved-results/[id]` - Individual Saved Result Operations
- **Methods:** GET, PUT, DELETE
- **Dependencies:**
  - Same as `/api/saved-results`
- **Data Layer:**
  - PostgreSQL (same tables)

### `/api/chat/config` - Chat Configuration
- **Methods:** GET, POST
- **Dependencies:**
  - LLM Gateway client configuration
  - User preferences
- **Data Layer:**
  - PostgreSQL (user_preferences table)
  - LLM Gateway service

## Core Library Dependencies

### `$lib/db/` - Database Layer
- **Files:**
  - `index.ts` - Database connection management
  - `schema.ts` - Table definitions and relations
- **Dependencies:**
  - `drizzle-orm/postgres-js` - ORM
  - `postgres` - PostgreSQL client
  - `$env/dynamic/private` - Environment variables
- **Data Layer:**
  - PostgreSQL database
  - Environment variables (DATABASE_URL, POSTGRES_URL)

### `$lib/searxng-client.ts` - Search API Client
- **Dependencies:**
  - `axios` - HTTP client
- **External Services:**
  - SearXNG API endpoint
- **Methods:**
  - `search()` - General search
  - `searchGeneral()` - Web search
  - `searchCode()` - Code-specific search
  - `searchAcademic()` - Academic search
  - `getSuggestions()` - Search suggestions

### `$lib/redis-client.ts` - Cache and Session Management
- **Dependencies:**
  - `ioredis` - Redis client
  - `$env/dynamic/private` - Environment variables
- **Data Layer:**
  - Redis server (REDIS_URL)
- **Functions:**
  - Search history management
  - Results caching
  - Session data storage

### `$lib/llm/` - LLM Gateway Integration
- **Dependencies:**
  - `/llm-gateway` module
  - LLM Gateway client
- **External Services:**
  - Qwen3.5-4B inference server
- **Data Layer:**
  - LLM Gateway API

## External Service Dependencies

### SearXNG Search Engine
- **URL:** https://searxng-production-b099.up.railway.app
- **Purpose:** Meta-search aggregation
- **Engines Supported:**
  - General: Brave, DuckDuckGo, Startpage
  - Code: GitHub, Stack Overflow
  - Academic: arXiv, Semantic Scholar

### PostgreSQL Database
- **Tables:**
  - `searches` - Search history and metadata
  - `saved_results` - Bookmarked/saved search results
  - `research_projects` - Project organization
  - `collections` - Topic-based collections
  - `user_preferences` - User settings
  - `search_analytics` - Usage analytics
  - Junction tables for many-to-many relationships
- **Indexes:** Optimized for user-specific queries

### Redis Cache
- **Usage:**
  - Search result caching (1 hour TTL)
  - Recent search history (per-user lists)
  - Session data storage
- **Key Patterns:**
  - `cache:{engine}:{query}` - Cached search results
  - `search:recent:{userEmail}` - Recent searches
  - `search:history:{userEmail}` - Historical search data

### LLM Gateway
- **Purpose:** Qwen3.5-4B model inference
- **API:** OpenAI-compatible interface
- **Features:**
  - Chat completions
  - Streaming responses
  - JSON mode
  - Code generation helpers

## File System Dependencies

### Frontend Assets
- **Static files:** `/static/` directory
- **Generated assets:** `.svelte-kit/` build output
- **Dependencies:** Vite build system

### Configuration Files
- **Environment:** `.env` files
- **Database migrations:** `/drizzle/` directory
- **Build configuration:** 
  - `svelte.config.js`
  - `vite.config.ts`
  - `drizzle.config.ts`

## Development and Deployment Dependencies

### Build Tools
- **SvelteKit** - Framework and routing
- **Vite** - Build tool and dev server
- **TypeScript** - Type checking
- **Tailwind CSS** - Styling
- **Drizzle Kit** - Database migrations

### Runtime Environment
- **Node.js** - Runtime environment
- **Railway** - Deployment platform
- **Environment Variables:**
  - `DATABASE_URL` - PostgreSQL connection
  - `REDIS_URL` - Redis connection
  - `SEARXNG_API_URL` - Search engine endpoint
  - `LLM_GATEWAY_URL` - AI service endpoint