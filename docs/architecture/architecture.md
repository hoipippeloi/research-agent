# Research Agent: Complete System Architecture

This document provides a comprehensive tree-structured view of the Research Agent application architecture, showing all components, services, dependencies, and data flows.

## Complete Architecture Tree

```
Research Agent System
├── Frontend Application (SvelteKit 5)
│   ├── Package Dependencies/
│   │   ├── Core Framework/
│   │   │   ├── @sveltejs/kit@^2.50.2 (Framework)
│   │   │   ├── svelte@^5.51.0 (Reactive UI library)
│   │   │   ├── @sveltejs/adapter-node@^5.5.4 (Node.js deployment)
│   │   │   └── vite@^7.3.1 (Build tool)
│   │   ├── UI & Styling/
│   │   │   ├── @iconify/svelte@^5.2.1 (Icon components)
│   │   │   ├── tailwindcss@^4.2.1 (CSS framework)
│   │   │   ├── @tailwindcss/forms@^0.5.11 (Form styling)
│   │   │   └── svelte-sonner@^1.0.8 (Toast notifications)
│   │   ├── Database & API/
│   │   │   ├── drizzle-orm@^0.38.3 (Type-safe ORM)
│   │   │   ├── postgres@^3.4.5 (PostgreSQL client)
│   │   │   ├── ioredis@^5.10.0 (Redis client)
│   │   │   └── axios@^1.13.6 (HTTP client)
│   │   ├── Content & Editor/
│   │   │   ├── carta-md@^4.11.1 (Markdown editor)
│   │   │   ├── isomorphic-dompurify@^3.0.0 (HTML sanitization)
│   │   │   └── @page-agent/llms@^1.5.1 (LLM integration)
│   │   └── Visualization/
│   │       ├── three@^0.183.2 (3D graphics)
│   │       ├── d3@^7.9.0 (Data visualization)
│   │       └── @types/three@^0.183.1 (TypeScript types)
│   │
│   ├── User Interface/
│   │   ├── Routes/
│   │   │   ├── / (Main Search Interface)
│   │   │   │   ├── Direct Dependencies/
│   │   │   │   │   ├── @iconify/svelte (UI icons)
│   │   │   │   │   ├── $lib/redux-client (SearchHistory type)
│   │   │   │   │   ├── $lib/db/schema (Collection, SavedResult types)
│   │   │   │   │   ├── $lib/stores/uiScale (UI scaling)
│   │   │   │   │   ├── $lib/modal-url (Modal state management)
│   │   │   │   │   └── svelte-sonner (Toast notifications)
│   │   │   │   ├── Components Used/
│   │   │   │   │   ├── BirdsFlocking.svelte (Background animation)
│   │   │   │   │   ├── Modal.svelte (Dialog management)
│   │   │   │   │   ├── MarkdownPreviewModal.svelte (Content preview)
│   │   │   │   │   └── EmailModal.svelte (User registration)
│   │   │   │   ├── State Management/
│   │   │   │   │   ├── 50+ $state reactive variables
│   │   │   │   │   ├── $derived computations for filtering
│   │   │   │   │   ├── SvelteKit stores ($page, navigation)
│   │   │   │   │   └── LocalStorage integration for persistence
│   │   │   │   ├── API Endpoints Called/
│   │   │   │   │   ├── POST /api/notify-new-user (email notifications)
│   │   │   │   │   ├── POST /api/saved-results (save markdown content)
│   │   │   │   │   ├── GET|POST /api/search (search operations)
│   │   │   │   │   ├── GET /api/collections (load collections)
│   │   │   │   │   ├── POST /api/collections (create collections)
│   │   │   │   │   ├── DELETE /api/collections (remove collections)
│   │   │   │   │   ├── GET /api/bookmarks (load bookmarks)
│   │   │   │   │   ├── POST /api/bookmarks (save bookmarks)
│   │   │   │   │   ├── DELETE /api/bookmarks (remove bookmarks)
│   │   │   │   │   ├── GET /api/documents (load documents)
│   │   │   │   │   ├── POST /api/notes (create notes)
│   │   │   │   │   ├── PUT /api/notes (update notes)
│   │   │   │   │   ├── DELETE /api/documents/[id] (delete documents)
│   │   │   │   │   ├── GET /api/history (load search history)
│   │   │   │   │   └── DELETE /api/history (delete search entries)
│   │   │   │   └── Data Flow/
│   │   │   │       ├── User email stored in localStorage
│   │   │   │       ├── Tab-based navigation via URL params
│   │   │   │       ├── Real-time search result aggregation
│   │   │   │       └── Cross-component state synchronization
│   │   │   │
│   │   │   ├── /agent (AI Chat Interface)
│   │   │   │   ├── Direct Dependencies/
│   │   │   │   │   ├── carta-md (Markdown editor with toolbar)
│   │   │   │   │   ├── @iconify/svelte (UI icons)
│   │   │   │   │   ├── $lib/db/schema (SavedResult type)
│   │   │   │   │   ├── $lib/components/MarkdownEditor.svelte
│   │   │   │   │   ├── $lib/components/BirdsFlocking.svelte
│   │   │   │   │   └── svelte-sonner (Toast notifications)
│   │   │   │   ├── LLM Integration/
│   │   │   │   │   ├── Direct LLM Gateway API calls to hoi-llm-gateway.up.railway.app
│   │   │   │   │   ├── OpenAI-compatible chat completions
│   │   │   │   │   ├── Streaming response handling via ReadableStream
│   │   │   │   │   └── Server-Sent Events parsing
│   │   │   │   ├── API Endpoints Called/
│   │   │   │   │   ├── POST /v1/chat/completions (LLM Gateway)
│   │   │   │   │   ├── GET /api/fetch-markdown (URL to markdown conversion)
│   │   │   │   │   ├── GET /api/documents/[id] (load existing documents)
│   │   │   │   │   ├── GET /api/collections (load user collections)
│   │   │   │   │   ├── POST|PUT /api/documents (save documents)
│   │   │   │   │   └── Navigation with query parameters
│   │   │   │   ├── Chat Features/
│   │   │   │   │   ├── Message history with role-based display
│   │   │   │   │   ├── Real-time streaming with chunked responses
│   │   │   │   │   ├── Abort controller for canceling requests
│   │   │   │   │   ├── Context window management (system prompts)
│   │   │   │   │   ├── Format/tone/style selection (blog, article, etc.)
│   │   │   │   │   └── Content insertion into markdown editor
│   │   │   │   └── Document Management/
│   │   │   │       ├── Auto-save to collections
│   │   │   │       ├── Word count and character tracking
│   │   │   │       ├── Document versioning with timestamps
│   │   │   │       └── URL parameter-based document loading
│   │   │   │
│   │   │   ├── /collection/[id] (Collection Detail View)
│   │   │   │   ├── Direct Dependencies/
│   │   │   │   │   ├── @iconify/svelte (UI icons)
│   │   │   │   │   ├── $lib/stores/uiScale (UI scaling)
│   │   │   │   │   ├── $lib/db/schema (Collection, SavedResult types)
│   │   │   │   │   └── svelte-sonner (Toast notifications)
│   │   │   │   ├── State Management/
│   │   │   │   │   ├── Collection metadata (topic, description)
│   │   │   │   │   ├── Items categorized by type (bookmarks, documents, etc.)
│   │   │   │   │   ├── Linked searches with metadata
│   │   │   │   │   ├── Tab-based filtering (all, bookmarks, documents, searches)
│   │   │   │   │   ├── Real-time search filtering
│   │   │   │   │   └── Edit mode for collection details
│   │   │   │   ├── API Endpoints Called/
│   │   │   │   │   ├── GET /api/collections/[id]/items (load collection data)
│   │   │   │   │   ├── PUT /api/collections/[id] (update collection metadata)
│   │   │   │   │   └── DELETE endpoints for item removal
│   │   │   │   ├── Collection Management/
│   │   │   │   │   ├── Real-time item type categorization
│   │   │   │   │   ├── Search filter across titles, URLs, excerpts
│   │   │   │   │   ├── Inline editing of topic and description
│   │   │   │   │   ├── Statistics display (counts by type)
│   │   │   │   │   └── Item deletion with confirmation
│   │   │   │   └── Data Types Handled/
│   │   │   │       ├── Collection metadata and settings
│   │   │   │       ├── SavedResult items (multiple types)
│   │   │   │       ├── LinkedSearch objects with timestamps
│   │   │   │       └── Aggregated statistics
│   │   │   │
│   │   │   ├── /doc (Document Management)
│   │   │   │   ├── Features/
│   │   │   │   │   ├── Markdown document creation and editing
│   │   │   │   │   ├── Collection-based organization
│   │   │   │   │   ├── Auto-save functionality
│   │   │   │   │   └── Document sharing and export
│   │   │   │   └── API Integration/
│   │   │   │       ├── GET /api/documents (list documents)
│   │   │   │       ├── POST /api/documents (create documents)
│   │   │   │       ├── PUT /api/documents/[id] (update documents)
│   │   │   │       └── DELETE /api/documents/[id] (delete documents)
│   │   │   │
│   │   │   ├── /chat-test (Development Testing)
│   │   │   │   └── LLM Gateway Testing/
│   │   │   │       ├── Connection validation
│   │   │   │       ├── Response testing
│   │   │   │       └── Performance monitoring
│   │   │   │
│   │   │   └── /test-llm (LLM Validation)
│   │   │       └── Model Testing/
│   │   │           ├── Inference validation
│   │   │           ├── Response quality checks
│   │   │           └── Performance benchmarks
│   │   │
│   │   ├── Global State Management/
│   │   │   ├── Stores/
│   │   │   │   ├── $lib/stores/uiScale.ts
│   │   │   │   │   ├── Writable store with localStorage persistence
│   │   │   │   │   ├── Zoom controls (in/out/reset: 0.75-1.25 range)
│   │   │   │   │   ├── Browser environment detection
│   │   │   │   │   └── Real-time CSS transform updates
│   │   │   │   └── $lib/stores/userEmail.ts
│   │   │   │       ├── User session management with localStorage
│   │   │   │       ├── Email validation and persistence
│   │   │   │       ├── Cross-tab synchronization
│   │   │   │       └── Privacy-focused storage
│   │   │   ├── URL State Management/
│   │   │   │   └── $lib/modal-url.ts
│   │   │   │       ├── Modal routing ('search', 'options', null)
│   │   │   │       ├── Query parameter persistence
│   │   │   │       ├── Markdown preview URL handling
│   │   │   │       ├── Browser history integration
│   │   │   │       └── State restoration on page load
│   │   │   └── Reactive Systems/
│   │   │       ├── Svelte 5 runes ($state, $derived, $effect)
│   │   │       ├── 50+ reactive variables in main page
│   │   │       ├── Cross-component state synchronization
│   │   │       ├── Real-time filtering and aggregation
│   │   │       └── LocalStorage integration for persistence
│   │   │
│   │   └── Build System/
│   │       ├── Core Configuration/
│   │       │   ├── svelte.config.js
│   │       │   │   ├── @sveltejs/adapter-node for deployment
│   │       │   │   ├── vitePreprocess for development
│   │       │   │   └── SvelteKit configuration
│   │       │   ├── vite.config.ts
│   │       │   │   ├── SvelteKit Vite plugin
│   │       │   │   ├── SSR configuration (noExternal: svelte-sonner)
│   │       │   │   └── Development server settings
│   │       │   └── tsconfig.json
│   │       │       ├── Strict TypeScript configuration
│   │       │       ├── Path aliases ($lib, $app)
│   │       │       └── DOM and ES2022 libraries
│   │       ├── Styling Configuration/
│   │       │   ├── tailwind.config.js (Tailwind CSS v4.2.1)
│   │       │   ├── postcss.config.js (PostCSS processing)
│   │       │   ├── @tailwindcss/forms (Form styling plugin)
│   │       │   └── Custom font integration (Inter, PT Mono, Fira Code)
│   │       ├── Database Configuration/
│   │       │   ├── drizzle.config.ts
│   │       │   │   ├── PostgreSQL dialect configuration
│   │       │   │   ├── Schema path: ./src/lib/db/schema.ts
│   │       │   │   ├── Migration output: ./drizzle/
│   │       │   │   ├── Environment variable loading (dotenv)
│   │       │   │   └── Verbose logging and strict mode
│   │       │   └── drizzle/ (Generated migration files)
│   │       └── Static Assets/
│   │           ├── /static/ (Public files)
│   │           ├── .svelte-kit/ (Generated build output)
│   │           └── Google Fonts integration (preconnect links)
│   │
│   └── API Layer (SvelteKit Server Routes)
│       ├── Search Operations/
│       │   ├── /api/search
│       │   │   ├── HTTP Methods: GET, POST
│       │   │   ├── Request Processing/
│       │   │   │   ├── Query validation
│       │   │   │   ├── User authentication
│       │   │   │   ├── Cache checking
│       │   │   │   └── Rate limiting
│       │   │   ├── Service Dependencies/
│       │   │   │   ├── SearXNG Client ($lib/searxng-client.ts)
│       │   │   │   │   ├── HTTP client (axios)
│       │   │   │   │   ├── Engine routing (general/code/academic)
│       │   │   │   │   └── Error handling
│       │   │   │   └── Redis Client ($lib/redis-client.ts)
│       │   │   │       ├── Result caching (1 hour TTL)
│       │   │   │       ├── Search history storage
│       │   │   │       └── Deduplication logic
│       │   │   └── External Integration/
│       │   │       └── SearXNG API (searxng-production-b099.up.railway.app)
│       │   │           ├── General engines: Brave, DuckDuckGo, Startpage
│       │   │           ├── Code engines: GitHub, StackOverflow
│       │   │           └── Academic engines: arXiv, Semantic Scholar
│       │   │
│       │   └── /api/history
│       │       ├── HTTP Methods: GET, DELETE
│       │       ├── History Management/
│       │       │   ├── Recent searches retrieval
│       │       │   ├── Search aggregation
│       │       │   └── History cleanup
│       │       └── Redis Integration/
│       │           ├── search:recent:{userEmail} (lists)
│       │           ├── search:history:{userEmail} (sorted sets)
│       │           └── Individual search objects (hashes)
│       │
│       ├── Data Management/
│       │   ├── /api/collections
│       │   │   ├── HTTP Methods: GET, POST, DELETE
│       │   │   ├── Collection Operations/
│       │   │   │   ├── Topic organization
│       │   │   │   ├── Search linking
│       │   │   │   ├── Metadata management
│       │   │   │   └── Duplicate prevention
│       │   │   ├── Database Integration/
│       │   │   │   ├── PostgreSQL (Drizzle ORM)
│       │   │   │   ├── collections table
│       │   │   │   ├── searches table
│       │   │   │   └── collection_searches junction
│       │   │   └── Business Logic/
│       │   │       ├── User isolation (by email)
│       │   │       ├── Automatic timestamping
│       │   │       └── Cascade deletes
│       │   │
│       │   ├── /api/collections/[id]
│       │   │   ├── HTTP Methods: GET, PUT, DELETE
│       │   │   ├── Individual Collection Management/
│       │   │   │   ├── Detailed collection operations
│       │   │   │   ├── Metadata updates
│       │   │   │   └── Access control
│       │   │   └── Parameter Validation/
│       │   │       ├── ID validation
│       │   │       ├── User ownership verification
│       │   │       └── Input sanitization
│       │   │
│       │   ├── /api/collections/[id]/items
│       │   │   ├── HTTP Methods: GET, POST, DELETE
│       │   │   ├── Collection Items Management/
│       │   │   │   ├── Item addition/removal
│       │   │   │   ├── Relationship management
│       │   │   │   └── Bulk operations
│       │   │   └── Relational Database Operations/
│       │   │       ├── Junction table management
│       │   │       ├── Foreign key integrity
│       │   │       └── Transaction handling
│       │   │
│       │   ├── /api/bookmarks
│       │   │   ├── HTTP Methods: GET, POST, DELETE
│       │   │   ├── Bookmark Management/
│       │   │   │   ├── URL-based bookmarking
│       │   │   │   ├── Content extraction
│       │   │   │   ├── Metadata enrichment
│       │   │   │   └── Collection assignment
│       │   │   ├── Database Operations/
│       │   │   │   ├── saved_results table
│       │   │   │   ├── Upsert logic (URL-based deduplication)
│       │   │   │   ├── User isolation
│       │   │   │   └── Indexed queries
│       │   │   └── Data Processing/
│       │   │       ├── Content parsing
│       │   │       ├── Thumbnail generation
│       │   │       └── Excerpt creation
│       │   │
│       │   └── /api/saved-results
│       │       ├── HTTP Methods: GET, POST, PUT, DELETE
│       │       ├── Result Management/
│       │       │   ├── Search result persistence
│       │       │   ├── User annotations
│       │       │   ├── Status tracking (read/archived)
│       │       │   └── Tag management
│       │       └── Relationship Management/
│       │           ├── Search linkage
│       │           ├── Collection assignment
│       │           ├── Project organization
│       │           └── Cross-references
│       │
│       ├── Document Operations/
│       │   ├── /api/documents
│       │   │   ├── HTTP Methods: GET, POST, PUT, DELETE
│       │   │   ├── Document Management/
│       │   │   │   ├── File upload/download
│       │   │   │   ├── Version control
│       │   │   │   ├── Metadata tracking
│       │   │   │   └── Access permissions
│       │   │   ├── File System Integration/
│       │   │   │   ├── Document storage
│       │   │   │   ├── Path management
│       │   │   │   └── Backup strategies
│       │   │   └── Database Integration/
│       │   │       ├── Document metadata table
│       │   │       ├── File references
│       │   │       └── User associations
│       │   │
│       │   └── /api/fetch-markdown
│       │       ├── HTTP Methods: GET, POST
│       │       ├── Content Fetching/
│       │       │   ├── External URL processing
│       │       │   ├── Markdown parsing
│       │       │   ├── Content sanitization
│       │       │   └── Format conversion
│       │       ├── External Dependencies/
│       │       │   ├── HTTP client libraries
│       │       │   ├── Markdown processors
│       │       │   └── Content validators
│       │       └── Caching Strategy/
│       │           ├── Redis content cache
│       │           ├── TTL management
│       │           └── Cache invalidation
│       │
│       ├── User Management/
│       │   └── /api/notify-new-user
│       │       ├── HTTP Methods: POST
│       │       ├── Notification Pipeline/
│       │       │   ├── User registration events
│       │       │   ├── Email composition
│       │       │   ├── Template processing
│       │       │   └── Delivery tracking
│       │       ├── External Services/
│       │       │   ├── Email service integration (MJML/Notifuse)
│       │       │   ├── Template engines
│       │       │   └── Delivery providers
│       │       └── Database Updates/
│       │           ├── User preferences
│       │           ├── Notification logs
│       │           └── Status tracking
│       │
│       └── AI Integration/
│           └── /api/chat/config
│               ├── HTTP Methods: GET, POST
│               ├── LLM Configuration/
│               │   ├── Model selection
│               │   ├── Parameter tuning
│               │   ├── Context management
│               │   └── Response formatting
│               ├── User Preferences/
│               │   ├── Default model settings
│               │   ├── Response preferences
│               │   └── Usage limits
│               └── Integration Layer/
│                   ├── LLM Gateway client
│                   ├── Model validation
│                   └── Error handling
│
├── Core Library Layer
│   ├── Database Abstraction/
│   │   ├── $lib/db/index.ts
│   │   │   ├── Connection Management/
│   │   │   │   ├── Drizzle ORM integration
│   │   │   │   ├── PostgreSQL client (postgres.js)
│   │   │   │   ├── Connection pooling (max 10)
│   │   │   │   └── Environment configuration
│   │   │   ├── Database Operations/
│   │   │   │   ├── Lazy initialization
│   │   │   │   ├── Connection validation
│   │   │   │   ├── Error handling
│   │   │   │   └── Resource cleanup
│   │   │   └── Environment Dependencies/
│   │   │       ├── DATABASE_URL (primary)
│   │   │       ├── POSTGRES_URL (fallback)
│   │   │       └── Connection parameters
│   │   │
│   │   └── $lib/db/schema.ts
│   │       ├── Table Definitions/
│   │       │   ├── searches (search history)
│   │       │   ├── saved_results (bookmarks)
│   │       │   ├── collections (topic organization)
│   │       │   ├── research_projects (future feature)
│   │       │   ├── user_preferences (settings)
│   │       │   ├── search_analytics (usage tracking)
│   │       │   └── Junction tables (many-to-many relationships)
│   │       ├── Relationship Mapping/
│   │       │   ├── Foreign key constraints
│   │       │   ├── Cascade behaviors
│   │       │   ├── Index strategies
│   │       │   └── Drizzle relations
│   │       ├── Data Types/
│   │       │   ├── JSONB metadata fields
│   │       │   ├── Text arrays (tags, engines)
│   │       │   ├── Timestamps (created/updated)
│   │       │   └── User isolation fields
│   │       └── Type Exports/
│   │           ├── Select types (database records)
│   │           ├── Insert types (new records)
│   │           └── TypeScript interfaces
│   │
│   ├── External Service Clients/
│   │   ├── $lib/searxng-client.ts
│   │   │   ├── HTTP Client Layer/
│   │   │   │   ├── Axios configuration
│   │   │   │   ├── Base URL management
│   │   │   │   ├── Timeout handling (30s)
│   │   │   │   └── Request/response interceptors
│   │   │   ├── Search Engine Integration/
│   │   │   │   ├── SearXNG API endpoint
│   │   │   │   ├── Engine routing logic
│   │   │   │   ├── Parameter formatting
│   │   │   │   └── Result standardization
│   │   │   ├── Search Methods/
│   │   │   │   ├── search() - Generic search with options
│   │   │   │   ├── searchGeneral() - Web search (Brave, DDG, Startpage)
│   │   │   │   ├── searchCode() - Code search (GitHub, SO)
│   │   │   │   ├── searchAcademic() - Academic (arXiv, Semantic Scholar)
│   │   │   │   └── getSuggestions() - Autocomplete
│   │   │   ├── Response Processing/
│   │   │   │   ├── Result normalization
│   │   │   │   ├── Score calculation
│   │   │   │   ├── Metadata extraction
│   │   │   │   └── Error handling
│   │   │   └── Advanced Features/
│   │   │       ├── Pagination support
│   │   │       ├── Time range filtering
│   │   │       ├── Engine selection
│   │   │       └── Category filtering
│   │   │
│   │   └── $lib/redis-client.ts
│   │       ├── Connection Management/
│   │       │   ├── IORedis client
│   │       │   ├── Connection string parsing
│   │       │   ├── Reconnection logic
│   │       │   └── Environment configuration (REDIS_URL)
│   │       ├── Caching Operations/
│   │       │   ├── Search result caching
│   │       │   │   ├── Key pattern: cache:{engine}:{query}
│   │       │   │   ├── TTL management (3600s)
│   │       │   │   ├── JSON serialization
│   │       │   │   └── Cache invalidation
│   │       │   ├── Search History Management/
│   │       │   │   ├── Recent searches (per-user lists)
│   │       │   │   ├── Historical data (sorted sets)
│   │       │   │   ├── Pagination support
│   │       │   │   └── Cleanup operations
│   │       │   └── Deduplication Logic/
│   │       │       ├── URL-based deduplication
│   │       │       ├── Score-based prioritization
│   │       │       ├── Engine metadata preservation
│   │       │       └── Result merging
│   │       ├── Data Structures/
│   │       │   ├── Hash objects (search metadata)
│   │       │   ├── Lists (recent searches, FIFO)
│   │       │   ├── Sorted sets (historical data with scores)
│   │       │   └── String values (cached JSON)
│   │       └── Performance Optimizations/
│   │           ├── Pipeline operations
│   │           ├── Batch processing
│   │           ├── Memory-efficient operations
│   │           └── Connection pooling
│   │
│   ├── Utilities & Helpers/
│   │   ├── $lib/modal-url.ts
│   │   │   ├── URL State Management/
│   │   │   │   ├── Modal routing
│   │   │   │   ├── Query parameter handling
│   │   │   │   ├── State persistence
│   │   │   │   └── Navigation integration
│   │   │   ├── Modal Types/
│   │   │   │   ├── Email modal
│   │   │   │   ├── Markdown preview
│   │   │   │   ├── Confirmation dialogs
│   │   │   │   └── Settings panels
│   │   │   └── State Synchronization/
│   │   │       ├── URL parameter mapping
│   │   │       ├── Browser history integration
│   │   │       ├── Cross-tab synchronization
│   │   │       └── Back button handling
│   │   │
│   │   └── $lib/index.ts
│   │       ├── Library Exports/
│   │       │   ├── Common utilities
│   │       │   ├── Type definitions
│   │       │   ├── Helper functions
│   │       │   └── Re-exports
│   │       └── Module Organization/
│   │           ├── Public API surface
│   │           ├── Internal utilities
│   │           └── Version compatibility
│   │
│   │   ├── UI Component Library/
│   │   │   ├── $lib/components/BirdsFlocking.svelte
│   │   │   │   ├── Dependencies/
│   │   │   │   │   ├── three.js (3D graphics library)
│   │   │   │   │   ├── @types/three (TypeScript definitions)
│   │   │   │   │   └── Advanced particle system algorithms
│   │   │   │   ├── Animation System/
│   │   │   │   │   ├── WebGL-based rendering with three.js
│   │   │   │   │   ├── Particle lifecycle management
│   │   │   │   │   ├── Flocking algorithms (separation, alignment, cohesion)
│   │   │   │   │   └── Performance optimization with RAF
│   │   │   │   ├── Visual Effects/
│   │   │   │   │   ├── Dynamic particle behaviors
│   │   │   │   │   ├── Real-time physics simulation
│   │   │   │   │   ├── Responsive canvas management
│   │   │   │   │   └── Color and movement patterns
│   │   │   │   └── Integration Points/
│   │   │   │       ├── Used in main page background
│   │   │   │       ├── Agent page loading indicator
│   │   │   │       ├── Performance monitoring
│   │   │   │       └── Mobile optimization
│   │   │
│   │   ├── $lib/components/Modal.svelte
│   │   │   ├── Dialog Management/
│   │   │   │   ├── Modal state control
│   │   │   │   ├── Z-index management
│   │   │   │   ├── Focus management
│   │   │   │   └── Keyboard navigation
│   │   │   ├── Accessibility Features/
│   │   │   │   ├── ARIA attributes
│   │   │   │   ├── Screen reader support
│   │   │   │   ├── Keyboard shortcuts
│   │   │   │   └── Color contrast
│   │   │   └── Animation System/
│   │   │       ├── Enter/exit transitions
│   │   │       ├── Backdrop effects
│   │   │       ├── Scale animations
│   │   │       └── Performance optimization
│   │   │
│   │   │   ├── $lib/components/MarkdownEditor.svelte
│   │   │   │   ├── Dependencies/
│   │   │   │   │   ├── carta-md (Core markdown editor framework)
│   │   │   │   │   ├── isomorphic-dompurify (HTML sanitization)
│   │   │   │   │   └── Custom CSS variables for font families
│   │   │   │   ├── Editor Features/
│   │   │   │   │   ├── Split-pane interface (tabs mode)
│   │   │   │   │   ├── GitHub-themed interface
│   │   │   │   │   ├── Live markdown preview
│   │   │   │   │   ├── Syntax highlighting for code blocks
│   │   │   │   │   ├── Font integration (Inter, Fira Code, Aspekta)
│   │   │   │   │   └── Bindable value with two-way data flow
│   │   │   │   ├── Document Processing/
│   │   │   │   │   ├── Real-time markdown parsing
│   │   │   │   │   ├── DOMPurify sanitization
│   │   │   │   │   ├── Custom CSS styling for rendered content
│   │   │   │   │   └── Responsive layout management
│   │   │   │   └── Integration Points/
│   │   │   │       ├── Used in /agent page for document editing
│   │   │   │       ├── Word count and character tracking
│   │   │   │       ├── Auto-save integration
│   │   │   │       └── Collection assignment workflow
│   │   │
│   │   │   ├── $lib/components/Header.svelte
│   │   │   │   ├── Dependencies/
│   │   │   │   │   ├── @iconify/svelte (Icon system)
│   │   │   │   │   └── $lib/stores/uiScale (UI scaling store)
│   │   │   │   ├── Navigation System/
│   │   │   │   │   ├── Fixed positioning with backdrop blur
│   │   │   │   │   ├── Responsive layout with max-width container
│   │   │   │   │   ├── Brand identity with animated icon
│   │   │   │   │   └── Home navigation (/)
│   │   │   │   ├── UI Scale Controls/
│   │   │   │   │   ├── Zoom out button (scale down)
│   │   │   │   │   ├── Current scale percentage display
│   │   │   │   │   ├── Zoom in button (scale up)
│   │   │   │   │   ├── Real-time scale feedback
│   │   │   │   │   └── ARIA labels for accessibility
│   │   │   │   ├── Visual Design/
│   │   │   │   │   ├── Glass morphism effect (backdrop blur)
│   │   │   │   │   ├── Smooth transform animations
│   │   │   │   │   ├── Hover state transitions
│   │   │   │   │   └── Consistent spacing and typography
│   │   │   │   └── Integration Points/
│   │   │   │       ├── Used across all main pages
│   │   │   │       ├── Optional navigation controls (showNav prop)
│   │   │   │       ├── Real-time uiScale store reactivity
│   │   │   │       └── Consistent branding and UX
│   │   │
│   │   └── $lib/components/EmailModal.svelte
│   │       ├── Form Management/
│   │       │   ├── Email validation
│   │       │   ├── Submission handling
│   │       │   ├── Error display
│   │       │   └── Success feedback
│   │       ├── User Experience/
│   │       │   ├── Progressive enhancement
│   │       │   ├── Loading states
│   │       │   ├── Accessibility
│   │       │   └── Mobile optimization
│   │       └── Integration Points/
│   │           ├── User registration API
│   │           ├── Email notification system
│   │           ├── State persistence
│   │           └── Analytics tracking
│   │
│   └── State Management/
│       ├── $lib/stores/uiScale.ts
│       │   ├── UI Scaling Control/
│       │   │   ├── Scale factor management
│       │   │   ├── Responsive breakpoints
│       │   │   ├── User preferences
│       │   │   └── Dynamic CSS updates
│       │   ├── Persistence Layer/
│       │   │   ├── Local storage integration
│       │   │   ├── Cross-session persistence
│       │   │   ├── Default value handling
│       │   │   └── Migration support
│       │   └── Reactive Updates/
│       │       ├── Svelte stores integration
│       │       ├── Component reactivity
│       │       ├── CSS variable updates
│       │       └── Performance optimization
│       │
│       └── $lib/stores/userEmail.ts
│           ├── User Session Management/
│           │   ├── Email storage
│           │   ├── Session persistence
│           │   ├── Validation logic
│           │   └── Privacy protection
│           ├── Authentication State/
│           │   ├── Login status tracking
│           │   ├── Session timeout handling
│           │   ├── Auto-logout functionality
│           │   └── Multi-tab synchronization
│           └── Integration Points/
│               ├── API request headers
│               ├── User-specific data queries
│               ├── Personalization features
│               └── Analytics correlation
│
├── LLM Gateway Service
│   ├── Core Infrastructure/
│   │   ├── llama.cpp Server
│   │   │   ├── Model Inference Engine/
│   │   │   │   ├── Qwen3.5-4B-Instruct (Q4_K_M quantization)
│   │   │   │   ├── 262K context window
│   │   │   │   ├── Multimodal capabilities (text/image/video)
│   │   │   │   └── Code & reasoning optimization
│   │   │   ├── API Compatibility/
│   │   │   │   ├── OpenAI-compatible interface
│   │   │   │   ├── Chat completions endpoint
│   │   │   │   ├── Streaming support
│   │   │   │   └── JSON mode
│   │   │   ├── Performance Features/
│   │   │   │   ├── GPU acceleration (local)
│   │   │   │   ├── CPU optimization (Railway)
│   │   │   │   ├── Memory management
│   │   │   │   └── Request batching
│   │   │   └── Model Management/
│   │   │       ├── GGUF file handling (~3GB)
│   │   │       ├── Quantization support
│   │   │       ├── Model loading/unloading
│   │   │       └── Version management
│   │   │
│   │   └── TypeScript Client Library
│   │       ├── Client Interface/
│   │       │   ├── LLMGatewayClient class
│   │       │   ├── Configuration management
│   │       │   ├── Connection handling
│   │       │   └── Error management
│   │       ├── API Methods/
│   │       │   ├── createChatCompletion() (non-streaming)
│   │       │   ├── streamChatCompletion() (streaming)
│   │       │   ├── complete() (simple helper)
│   │       │   ├── generateCode() (code generation)
│   │       │   └── completeJSON() (structured output)
│   │       ├── Streaming Support/
│   │       │   ├── AsyncGenerator implementation
│   │       │   ├── Server-Sent Events handling
│   │       │   ├── Chunk processing
│   │       │   └── Error recovery
│   │       └── Environment Integration/
│   │           ├── Auto-detection (browser/Node.js)
│   │           ├── Environment variables
│   │           ├── Configuration validation
│   │           └── Service discovery
│   │
│   ├── API Endpoints/
│   │   ├── /v1/chat/completions
│   │   │   ├── Request Processing/
│   │   │   │   ├── OpenAI format compatibility
│   │   │   │   ├── Parameter validation
│   │   │   │   ├── Context management
│   │   │   │   └── Rate limiting
│   │   │   ├── Model Interaction/
│   │   │   │   ├── Prompt template application
│   │   │   │   ├── Inference execution
│   │   │   │   ├── Response formatting
│   │   │   │   └── Token counting
│   │   │   ├── Response Types/
│   │   │   │   ├── Non-streaming (complete response)
│   │   │   │   ├── Streaming (SSE chunks)
│   │   │   │   ├── JSON mode (structured data)
│   │   │   │   └── Error responses
│   │   │   └── Performance Monitoring/
│   │   │       ├── Request timing
│   │   │       ├── Token throughput
│   │   │       ├── Memory usage
│   │   │       └── Error rates
│   │   │
│   │   ├── /health
│   │   │   ├── Health Checks/
│   │   │   │   ├── Service status
│   │   │   │   ├── Model availability
│   │   │   │   ├── Memory status
│   │   │   │   └── Uptime tracking
│   │   │   ├── Diagnostics/
│   │   │   │   ├── Performance metrics
│   │   │   │   ├── Error statistics
│   │   │   │   ├── Resource utilization
│   │   │   │   └── Connection status
│   │   │   └── Monitoring Integration/
│   │   │       ├── Railway health checks
│   │   │       ├── External monitoring
│   │   │       ├── Alert triggers
│   │   │       └── Automated recovery
│   │   │
│   │   └── /v1/models
│   │       ├── Model Information/
│   │       │   ├── Available models list
│   │       │   ├── Model specifications
│   │       │   ├── Capability descriptions
│   │       │   └── Version information
│   │       ├── OpenAI Compatibility/
│   │       │   ├── Standard response format
│   │       │   ├── Model metadata
│   │       │   ├── Feature flags
│   │       │   └── Backward compatibility
│   │       └── Dynamic Discovery/
│   │           ├── Runtime model detection
│   │           ├── Capability enumeration
│   │           ├── Performance characteristics
│   │           └── Resource requirements
│   │
│   ├── Deployment Configurations/
│   │   ├── Local Development/
│   │   │   ├── GPU Acceleration/
│   │   │   │   ├── CUDA support
│   │   │   │   ├── Metal support (macOS)
│   │   │   │   ├── DirectML support (Windows)
│   │   │   │   └── OpenCL fallback
│   │   │   ├── Development Tools/
│   │   │   │   ├── Hot reload
│   │   │   │   ├── Debug logging
│   │   │   │   ├── Performance profiling
│   │   │   │   └── Model switching
│   │   │   └── Environment Setup/
│   │   │       ├── Docker compose
│   │   │       ├── Native compilation
│   │   │       ├── Dependency management
│   │   │       └── Configuration validation
│   │   │
│   │   └── Railway Production/
│   │       ├── CPU Optimization/
│   │       │   ├── Multi-threading
│   │       │   ├── SIMD instructions
│   │       │   ├── Memory optimization
│   │       │   └── Request queuing
│   │       ├── Containerization/
│   │       │   ├── Docker image optimization
│   │       │   ├── Layer caching
│   │       │   ├── Build optimization
│   │       │   └── Security hardening
│   │       ├── Scaling Configuration/
│   │       │   ├── Horizontal scaling
│   │       │   ├── Load balancing
│   │       │   ├── Connection pooling
│   │       │   └── Resource limits
│   │       └── Monitoring Setup/
│   │           ├── Railway metrics
│   │           ├── Application logs
│   │           ├── Performance tracking
│   │           └── Alert configuration
│   │
│   └── Testing & Validation/
│       ├── Manual Testing Tools/
│       │   ├── test-endpoint.sh (Linux/macOS)
│       │   ├── test-endpoint.ps1 (Windows)
│       │   ├── Direct API testing
│       │   └── Performance benchmarking
│       ├── Integration Testing/
│       │   ├── Client library tests
│       │   ├── API compatibility tests
│       │   ├── Error handling validation
│       │   └── Performance regression tests
│       └── Quality Assurance/
│           ├── Response quality checks
│           ├── Model behavior validation
│           ├── Security testing
│           └── Load testing
│
├── External Services & Infrastructure
│   ├── SearXNG Metasearch Engine
│   │   ├── Railway Deployment/
│   │   │   ├── Project ID: cd9a0bf3-1ada-4187-968f-ccd9f971ff8e
│   │   │   ├── Production environment
│   │   │   ├── Base URL: searxng-production-b099.up.railway.app
│   │   │   └── Auto-scaling configuration
│   │   ├── Search Engine Integrations/
│   │   │   ├── General Web Search/
│   │   │   │   ├── Brave Search (privacy-focused)
│   │   │   │   ├── DuckDuckGo (privacy-focused)
│   │   │   │   └── Startpage (Google with privacy)
│   │   │   ├── Code & Development/
│   │   │   │   ├── GitHub (repositories, issues, discussions)
│   │   │   │   └── Stack Overflow (Q&A, documentation)
│   │   │   └── Academic Research/
│   │   │       ├── arXiv (preprint papers)
│   │   │       └── Semantic Scholar (academic publications)
│   │   ├── API Features/
│   │   │   ├── JSON API optimized for LLM integration
│   │   │   ├── Rate limiting disabled for private use
│   │   │   ├── Multiple output formats
│   │   │   ├── Search suggestions/autocomplete
│   │   │   └── Advanced filtering options
│   │   ├── Privacy & Security/
│   │   │   ├── No user tracking or profiling
│   │   │   ├── No query logging
│   │   │   ├── Result aggregation from multiple sources
│   │   │   └── HTTPS encryption
│   │   ├── Performance Features/
│   │   │   ├── Redis caching layer
│   │   │   ├── Result deduplication
│   │   │   ├── Parallel engine queries
│   │   │   └── Response time optimization
│   │   └── Configuration/
│   │       ├── SEARXNG_SECRET_KEY (instance security)
│   │       ├── SEARXNG_REDIS_URL (caching)
│   │       ├── Engine selection per category
│   │       └── Rate limiting configuration
│   │
│   ├── Database Services/
│   │   ├── PostgreSQL Database/
│   │   │   ├── Schema Structure/
│   │   │   │   ├── User Data Isolation/
│   │   │   │   │   ├── All tables include userEmail field
│   │   │   │   │   ├── Row-level security by user
│   │   │   │   │   ├── User-specific indexes
│   │   │   │   │   └── Privacy-focused design
│   │   │   │   ├── Core Tables/
│   │   │   │   │   ├── searches (search history & metadata)
│   │   │   │   │   │   ├── Columns: id, userEmail, query, engine, engines[], resultsCount, cachedResultsPath, metadata (JSONB), createdAt
│   │   │   │   │   │   ├── Indexes: userEmail, query, createdAt, engine
│   │   │   │   │   │   └── Relations: → saved_results, ← collection_searches, ← project_searches
│   │   │   │   │   ├── saved_results (bookmarked search results)
│   │   │   │   │   │   ├── Columns: id, userEmail, searchId (FK), projectId (FK), collectionId (FK), url, title, content, excerpt, thumbnail, publishedDate, engine, type, score, tags[], notes, isRead, isArchived, createdAt, updatedAt
│   │   │   │   │   │   ├── Indexes: userEmail, url, searchId, projectId, collectionId, createdAt
│   │   │   │   │   │   └── Relations: → searches, → research_projects, → collections
│   │   │   │   │   ├── collections (topic-based organization)
│   │   │   │   │   │   ├── Columns: id, userEmail, topic, description, searchCount, engines[], metadata (JSONB), createdAt, updatedAt
│   │   │   │   │   │   ├── Indexes: userEmail, topic, createdAt, isArchived
│   │   │   │   │   │   └── Relations: ← saved_results, ← collection_searches
│   │   │   │   │   ├── research_projects (project organization)
│   │   │   │   │   │   ├── Columns: id, userEmail, name, description, color, icon, isArchived, settings (JSONB), createdAt, updatedAt
│   │   │   │   │   │   ├── Indexes: userEmail, createdAt, isArchived
│   │   │   │   │   │   └── Relations: ← saved_results, ← project_searches
│   │   │   │   │   └── user_preferences (user settings)
│   │   │   │   │       ├── Columns: id, userEmail (unique), defaultSearchEngine, defaultEngines[], theme, resultsPerPage, cacheResults, autoSaveSearches, settings (JSONB), createdAt, updatedAt
│   │   │   │   │       ├── Indexes: userEmail
│   │   │   │   │       └── Purpose: User customization and defaults
│   │   │   │   ├── Junction Tables/
│   │   │   │   │   ├── collection_searches (many-to-many: collections ↔ searches)
│   │   │   │   │   │   ├── Columns: collectionId (FK), searchId (FK), addedAt
│   │   │   │   │   │   ├── Constraints: Composite primary key, CASCADE delete
│   │   │   │   │   │   └── Purpose: Links searches to topic collections
│   │   │   │   │   └── project_searches (many-to-many: projects ↔ searches)
│   │   │   │   │       ├── Columns: projectId (FK), searchId (FK), addedAt, notes
│   │   │   │   │       ├── Constraints: Composite primary key, CASCADE delete
│   │   │   │   │       └── Purpose: Links searches to research projects
│   │   │   │   └── Analytics Tables/
│   │   │   │       └── search_analytics (usage tracking)
│   │   │   │           ├── Columns: id, searchId (FK), resultClicked, clickedUrl, timeToFirstClick, sessionDuration, userAgent, ipAddress (hashed), createdAt
│   │   │   │           ├── Indexes: createdAt, searchId
│   │   │   │           └── Purpose: Privacy-conscious usage analytics
│   │   │   ├── Performance Optimization/
│   │   │   │   ├── Index Strategy/
│   │   │   │   │   ├── User-specific indexes (all queries filter by userEmail)
│   │   │   │   │   ├── Timestamp indexes (ordering by recency)
│   │   │   │   │   ├── Foreign key indexes (fast JOINs)
│   │   │   │   │   └── Composite indexes (junction table lookups)
│   │   │   │   ├── Data Types/
│   │   │   │   │   ├── JSONB for flexible metadata (queryable)
│   │   │   │   │   ├── Text arrays for multi-value fields
│   │   │   │   │   ├── Timestamps with time zones
│   │   │   │   │   └── Serial primary keys
│   │   │   │   ├── Relationship Management/
│   │   │   │   │   ├── CASCADE deletes (junction tables)
│   │   │   │   │   ├── SET NULL (optional references)
│   │   │   │   │   ├── Foreign key constraints
│   │   │   │   │   └── Referential integrity
│   │   │   │   └── Query Optimization/
│   │   │   │       ├── User-scoped queries (always filter by userEmail)
│   │   │   │       ├── Efficient pagination
│   │   │   │       ├── JSONB indexing for metadata queries
│   │   │   │       └── Array operations for tags/engines
│   │   │   ├── Migration System/
│   │   │   │   ├── Drizzle Kit integration
│   │   │   │   ├── Version-controlled migrations
│   │   │   │   ├── Schema change tracking
│   │   │   │   ├── Rollback capabilities
│   │   │   │   └── Development vs production workflows
│   │   │   └── Connection Management/
│   │   │       ├── Connection pooling (max 10 connections)
│   │   │       ├── Idle timeout (20s)
│   │   │       ├── Connect timeout (10s)
│   │   │       ├── SSL/TLS encryption
│   │   │       └── Environment-based configuration
│   │   │
│   │   └── Redis Cache/
│   │       ├── Cache Strategy/
│   │       │   ├── Search Result Caching/
│   │       │   │   ├── Key pattern: cache:{engine}:{query}
│   │       │   │   ├── Value: JSON {results, timestamp, count}
│   │       │   │   ├── TTL: 3600 seconds (1 hour)
│   │       │   │   └── Purpose: Reduce API calls, improve response time
│   │       │   ├── Search History Storage/
│   │       │   │   ├── Recent searches: search:recent:{userEmail} (list, max 100)
│   │       │   │   ├── Historical data: search:history:{userEmail} (sorted set by timestamp)
│   │       │   │   ├── Individual searches: search:{userEmail}:{timestamp}:{random} (hash)
│   │       │   │   └── Purpose: Fast access to user's recent activity
│   │       │   └── Session Management/
│   │       │       ├── User session data
│   │       │       ├── Temporary state storage
│   │       │       ├── Cross-request data sharing
│   │       │       └── Ephemeral configuration
│   │       ├── Data Structures/
│   │       │   ├── Strings (JSON-serialized objects)
│   │       │   ├── Lists (FIFO queues, recent items)
│   │       │   ├── Sorted Sets (time-ordered data)
│   │       │   ├── Hashes (structured objects)
│   │       │   └── Sets (unique collections)
│   │       ├── Performance Features/
│   │       │   ├── Pipeline operations (batch commands)
│   │       │   ├── Transaction support (MULTI/EXEC)
│   │       │   ├── Lua scripting (atomic operations)
│   │       │   ├── Memory optimization (compression)
│   │       │   └── Connection pooling
│   │       ├── Data Lifecycle/
│   │       │   ├── Automatic expiration (TTL)
│   │       │   ├── LRU eviction policies
│   │       │   ├── Memory consumption monitoring
│   │       │   ├── Data archival strategies
│   │       │   └── Cleanup operations
│   │       └── Reliability Features/
│   │           ├── Persistence options (RDB, AOF)
│   │           ├── Replication support
│   │           ├── Failover mechanisms
│   │           ├── Backup strategies
│   │           └── Recovery procedures
│   │
│   ├── Email & Notification Services/
│   │   ├── MJML Email Templates/
│   │   │   ├── Template System/
│   │   │   │   ├── Responsive email design
│   │   │   │   ├── Cross-client compatibility
│   │   │   │   ├── Component-based architecture
│   │   │   │   └── Dynamic content insertion
│   │   │   ├── Template Types/
│   │   │   │   ├── Welcome emails
│   │   │   │   ├── Notification emails
│   │   │   │   ├── Report summaries
│   │   │   │   └── System announcements
│   │   │   ├── Content Management/
│   │   │   │   ├── Variable substitution
│   │   │   │   ├── Conditional content
│   │   │   │   ├── Localization support
│   │   │   │   └── A/B testing framework
│   │   │   └── Rendering Pipeline/
│   │   │       ├── MJML to HTML compilation
│   │   │       ├── CSS inlining
│   │   │       ├── Image optimization
│   │   │       └── Quality assurance
│   │   │
│   │   └── Notifuse API Integration/
│   │       ├── Email Delivery Service/
│   │       │   ├── SMTP provider abstraction
│   │       │   ├── Delivery rate optimization
│   │       │   ├── Bounce handling
│   │       │   └── Reputation management
│   │       ├── Notification Features/
│   │       │   ├── Real-time notifications
│   │       │   ├── Scheduled delivery
│   │       │   ├── Batch processing
│   │       │   └── Delivery confirmation
│   │       ├── Analytics & Tracking/
│   │       │   ├── Open rate tracking
│   │       │   ├── Click tracking
│   │       │   ├── Delivery statistics
│   │       │   └── Performance metrics
│   │       └── API Integration/
│   │           ├── RESTful API client
│   │           ├── Authentication handling
│   │           ├── Error handling & retries
│   │           └── Rate limiting compliance
│   │
│   └── Deployment & DevOps/
│       ├── Railway Platform/
│       │   ├── Project Configuration/
│       │   │   ├── Multi-service deployment
│       │   │   ├── Environment management
│       │   │   ├── Resource allocation
│   │       │   ├── Auto-scaling policies
│       │   │   └── Network configuration
│       │   ├── Services/
│       │   │   ├── Frontend (SvelteKit app)
│       │   │   │   ├── Static asset serving
│       │   │   │   ├── SSR capabilities
│       │   │   │   ├── Environment variable injection
│       │   │   │   └── Build optimization
│       │   │   ├── LLM Gateway (AI inference)
│       │   │   │   ├── Docker containerization
│       │   │   │   ├── CPU-optimized deployment
│       │   │   │   ├── Health check configuration
│       │   │   │   └── Performance monitoring
│       │   │   ├── SearXNG (Search engine)
│       │   │   │   ├── Meta-search configuration
│       │   │   │   ├── Engine provider setup
│       │   │   │   ├── Redis caching integration
│       │   │   │   └── Privacy configuration
│       │   │   ├── PostgreSQL (Database)
│       │   │   │   ├── Managed database instance
│       │   │   │   ├── Backup configuration
│       │   │   │   ├── Connection pooling
│       │   │   │   └── Performance tuning
│       │   │   └── Redis (Cache)
│       │   │       ├── In-memory data store
│       │   │       ├── Persistence configuration
│       │   │       ├── Memory optimization
│       │   │       └── Network security
│       │   ├── Environment Management/
│       │   │   ├── Production environment
│       │   │   ├── Staging environment (optional)
│       │   │   ├── Environment variable management
│       │   │   ├── Secret management
│       │   │   └── Configuration validation
│       │   ├── Monitoring & Observability/
│       │   │   ├── Application metrics
│       │   │   ├── Infrastructure monitoring
│       │   │   ├── Log aggregation
│       │   │   ├── Performance tracking
│       │   │   ├── Error tracking
│       │   │   ├── Uptime monitoring
│       │   │   └── Alert configuration
│       │   ├── Deployment Pipeline/
│       │   │   ├── Git integration (GitHub)
│       │   │   ├── Automated deployments
│       │   │   ├── Build optimization
│       │   │   ├── Zero-downtime deployments
│       │   │   ├── Rollback capabilities
│       │   │   └── Deployment notifications
│       │   └── Security & Compliance/
│       │       ├── HTTPS enforcement
│       │       ├── Environment isolation
│       │       ├── Secret rotation
│       │       ├── Access control
│       │       └── Audit logging
│       │
│       └── Development Infrastructure/
│           ├── Version Control/
│           │   ├── Git repository structure
│           │   ├── Branch protection rules
│           │   ├── Code review process
│           │   ├── Commit conventions
│           │   └── Release tagging
│           ├── Continuous Integration/
│           │   ├── Automated testing
│           │   ├── Code quality checks
│           │   ├── Security scanning
│           │   ├── Build validation
│           │   └── Deployment automation
│           ├── Documentation/
│           │   ├── API documentation
│           │   ├── Architecture diagrams
│           │   ├── Deployment guides
│           │   ├── Troubleshooting guides
│           │   └── Developer onboarding
│           └── Local Development/
│               ├── Development environment setup
│               ├── Database seeding scripts
│               ├── Mock service configurations
│               ├── Testing utilities
│               └── Debug tooling
│
├── Configuration & Environment Management
│   ├── Environment Variables/
│   │   ├── Database Configuration/
│   │   │   ├── DATABASE_URL (PostgreSQL connection string)
│   │   │   ├── POSTGRES_URL (fallback connection)
│   │   │   ├── DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD (alternative format)
│   │   │   └── Connection pool settings
│   │   ├── Cache Configuration/
│   │   │   ├── REDIS_URL (Redis connection string)
│   │   │   ├── REDIS_HOST, REDIS_PORT, REDIS_PASSWORD (alternative format)
│   │   │   ├── Cache TTL settings
│   │   │   └── Memory limits
│   │   ├── External Service URLs/
│   │   │   ├── SEARXNG_API_URL (search engine endpoint)
│   │   │   ├── LLM_GATEWAY_URL (AI service endpoint)
│   │   │   ├── NOTIFUSE_API_URL (notification service)
│   │   │   └── Service authentication tokens
│   │   ├── Application Settings/
│   │   │   ├── NODE_ENV (development/production)
│   │   │   ├── PORT (application port)
│   │   │   ├── HOST (bind address)
│   │   │   ├── SECRET_KEY (session encryption)
│   │   │   └── CORS_ORIGIN (allowed origins)
│   │   └── Feature Flags/
│   │       ├── ENABLE_ANALYTICS (usage tracking)
│   │       ├── ENABLE_CACHING (result caching)
│   │       ├── ENABLE_NOTIFICATIONS (email alerts)
│   │       └── DEBUG_MODE (verbose logging)
│   │
│   ├── Configuration Files/
│   │   ├── Application Configuration/
│   │   │   ├── svelte.config.js
│   │   │   │   ├── SvelteKit configuration
│   │   │   │   ├── Adapter settings (Railway)
│   │   │   │   ├── Preprocessor setup
│   │   │   │   └── Build optimization
│   │   │   ├── vite.config.ts
│   │   │   │   ├── Build tool configuration
│   │   │   │   ├── Plugin setup
│   │   │   │   ├── Development server settings
│   │   │   │   └── Asset optimization
│   │   │   ├── tsconfig.json
│   │   │   │   ├── TypeScript compiler options
│   │   │   │   ├── Path mapping
│   │   │   │   ├── Strict mode settings
│   │   │   │   └── Library inclusions
│   │   │   ├── tailwind.config.js
│   │   │   │   ├── Design system configuration
│   │   │   │   ├── Custom utilities
│   │   │   │   ├── Component variants
│   │   │   │   └── Responsive breakpoints
│   │   │   └── postcss.config.js
│   │   │       ├── CSS processing pipeline
│   │   │       ├── Plugin configuration
│   │   │       ├── Optimization settings
│   │   │       └── Autoprefixer setup
│   │   ├── Database Configuration/
│   │   │   ├── drizzle.config.ts
│   │   │   │   ├── Database connection setup
│   │   │   │   ├── Migration path configuration
│   │   │   │   ├── Schema location
│   │   │   │   └── Development settings
│   │   │   └── /drizzle/ (migration directory)
│   │   │       ├── Migration SQL files
│   │   │       ├── Migration metadata
│   │   │       ├── Schema snapshots
│   │   │       └── Version tracking
│   │   ├── Deployment Configuration/
│   │   │   ├── railway.toml (Railway deployment)
│   │   │   ├── Dockerfile (container configuration)
│   │   │   ├── docker-compose.yml (local development)
│   │   │   └── .railwayignore (deployment exclusions)
│   │   └── Development Configuration/
│   │       ├── .env.example (template)
│   │       ├── .gitignore (version control exclusions)
│   │       ├── .npmrc (npm configuration)
│   │       └── .vscode/ (editor settings)
│   │
│   └── Security & Secrets Management/
│       ├── Environment-based Secrets/
│       │   ├── Database credentials
│       │   ├── API keys and tokens
│       │   ├── Encryption keys
│       │   └── Service passwords
│       ├── Secret Rotation/
│       │   ├── Automated rotation schedules
│       │   ├── Rotation procedures
│       │   ├── Backup key management
│       │   └── Emergency access procedures
│       └── Access Control/
│           ├── Role-based access
│           ├── Environment isolation
│           ├── Audit logging
│           └── Compliance measures
│
└── Data Flow & Integration Patterns
    ├── User Journey Flows/
    │   ├── Search Flow/
    │   │   ├── 1. User Input/
    │   │   │   ├── Search query entry
    │   │   │   ├── Engine selection
    │   │   │   ├── Filter application
    │   │   │   └── Request submission
    │   │   ├── 2. Request Processing/
    │   │   │   ├── Frontend validation
    │   │   │   ├── API route handling
    │   │   │   ├── User authentication
    │   │   │   └── Parameter normalization
    │   │   ├── 3. Cache Layer/
    │   │   │   ├── Redis cache check (cache:{engine}:{query})
    │   │   │   ├── Cache hit → Return cached results
    │   │   │   └── Cache miss → Continue to search
    │   │   ├── 4. External Search/
    │   │   │   ├── SearXNG API call
    │   │   │   ├── Engine routing (brave, github, arxiv, etc.)
    │   │   │   ├── Result aggregation
    │   │   │   └── Response formatting
    │   │   ├── 5. Result Processing/
    │   │   │   ├── Deduplication logic
    │   │   │   ├── Score normalization
    │   │   │   ├── Content extraction
    │   │   │   └── Metadata enrichment
    │   │   ├── 6. Data Storage/
    │   │   │   ├── Redis caching (search results)
    │   │   │   ├── PostgreSQL logging (search history)
    │   │   │   ├── User history updates
    │   │   │   └── Analytics tracking
    │   │   └── 7. Response Delivery/
    │   │       ├── Result formatting
    │   │       ├── UI state updates
    │   │       ├── Real-time display
    │   │       └── User interaction enablement
    │   │
    │   ├── Collection Management Flow/
    │   │   ├── 1. Topic Creation/
    │   │   │   ├── User topic definition
    │   │   │   ├── Duplicate checking
    │   │   │   ├── Collection initialization
    │   │   │   └── Database persistence
    │   │   ├── 2. Search Integration/
    │   │   │   ├── Search-to-collection linking
    │   │   │   ├── Junction table updates
    │   │   │   ├── Metadata synchronization
    │   │   │   └── Relationship tracking
    │   │   ├── 3. Content Organization/
    │   │   │   ├── Item addition/removal
    │   │   │   ├── Metadata updates
    │   │   │   ├── Tag management
    │   │   │   └── Access control
    │   │   └── 4. Data Retrieval/
    │   │       ├── Collection listing
    │   │       ├── Item enumeration
    │   │       ├── Related content discovery
    │   │       └── Export capabilities
    │   │
    │   ├── Bookmark Management Flow/
    │   │   ├── 1. Result Selection/
    │   │   │   ├── User result selection
    │   │   │   ├── Content preview
    │   │   │   ├── Quality assessment
    │   │   │   └── Save decision
    │   │   ├── 2. Content Processing/
    │   │   │   ├── URL validation
    │   │   │   ├── Content extraction
    │   │   │   ├── Metadata enrichment
    │   │   │   └── Format standardization
    │   │   ├── 3. Database Operations/
    │   │   │   ├── Duplicate checking (URL-based)
    │   │   │   ├── Upsert logic implementation
    │   │   │   ├── Collection assignment
    │   │   │   └── Relationship maintenance
    │   │   └── 4. User Experience/
    │   │       ├── Save confirmation
    │   │       ├── Quick access provision
    │   │       ├── Organization options
    │   │       └── Sharing capabilities
    │   │
    │   └── AI Chat Flow/
    │       ├── 1. Conversation Initiation/
    │       │   ├── User message input
    │       │   ├── Context preparation
    │       │   ├── Model selection
    │       │   └── Request formatting
    │       ├── 2. LLM Processing/
    │       │   ├── Gateway communication
    │       │   ├── Model inference
    │       │   ├── Response generation
    │       │   └── Stream handling
    │       ├── 3. Response Management/
    │       │   ├── Content validation
    │       │   ├── Format processing
    │       │   ├── Error handling
    │       │   └── State updates
    │       └── 4. User Interaction/
    │           ├── Real-time display
    │           ├── Conversation history
    │           ├── Follow-up options
    │           └── Context preservation
    │
    ├── Data Synchronization Patterns/
    │   ├── Cache Coherency/
    │   │   ├── Write-through caching (immediate cache updates)
    │   │   ├── Cache invalidation strategies
    │   │   ├── TTL-based expiration (3600 seconds)
    │   │   └── Background refresh mechanisms
    │   ├── Database Synchronization/
    │   │   ├── Eventual consistency models
    │   │   ├── Transaction boundaries
    │   │   ├── Conflict resolution strategies
    │   │   └── Data integrity validation
    │   ├── Cross-Service Communication/
    │   │   ├── API versioning strategies
    │   │   ├── Backward compatibility maintenance
    │   │   ├── Error propagation handling
    │   │   └── Circuit breaker patterns
    │   └── Real-time Updates/
    │       ├── WebSocket connections (future)
    │       ├── Server-Sent Events (LLM streaming)
    │       ├── Polling mechanisms (fallback)
    │       └── Push notification integration
    │
    ├── Error Handling & Recovery/
    │   ├── Client-Side Error Handling/
    │   │   ├── Network error recovery
    │   │   ├── Timeout management
    │   │   ├── Retry mechanisms
    │   │   └── User error feedback
    │   ├── Server-Side Error Handling/
    │   │   ├── Database connection failures
    │   │   ├── External service timeouts
    │   │   ├── Invalid input validation
    │   │   └── Resource exhaustion handling
    │   ├── Service Degradation/
    │   │   ├── Graceful degradation strategies
    │   │   ├── Fallback mechanisms
    │   │   ├── Circuit breaker implementation
    │   │   └── Service health monitoring
    │   └── Recovery Procedures/
    │       ├── Automated recovery scripts
    │       ├── Data backup and restore
    │       ├── Service restart procedures
    │       └── Manual intervention protocols
    │
    └── Performance Optimization/
        ├── Frontend Performance/
        │   ├── Component Loading/
        │   │   ├── Lazy loading strategies
        │   │   ├── Code splitting implementation
        │   │   ├── Bundle optimization
        │   │   └── Tree shaking
        │   ├── State Management/
        │   │   ├── Efficient reactive updates
        │   │   ├── Minimal re-renders
        │   │   ├── State normalization
        │   │   └── Memory leak prevention
        │   ├── Asset Optimization/
        │   │   ├── Image compression and lazy loading
        │   │   ├── CSS minification
        │   │   ├── JavaScript bundling
        │   │   └── CDN utilization
        │   └── User Experience/
        │       ├── Progressive loading
        │       ├── Skeleton screens
        │       ├── Error boundaries
        │       └── Accessibility optimization
        ├── Backend Performance/
        │   ├── Database Optimization/
        │   │   ├── Query optimization
        │   │   ├── Index strategy
        │   │   ├── Connection pooling
        │   │   └── Query result caching
        │   ├── API Performance/
        │   │   ├── Response compression
        │   │   ├── Request batching
        │   │   ├── Rate limiting
        │   │   └── Parallel processing
        │   ├── Cache Strategy/
        │   │   ├── Multi-layer caching
        │   │   ├── Cache warming
        │   │   ├── Intelligent invalidation
        │   │   └── Memory optimization
        │   └── Resource Management/
        │       ├── Memory usage optimization
        │       ├── CPU utilization monitoring
        │       ├── I/O optimization
        │       └── Garbage collection tuning
        └── Monitoring & Analytics/
            ├── Performance Metrics/
            │   ├── Response time tracking
            │   ├── Throughput measurement
            │   ├── Error rate monitoring
            │   └── Resource utilization
            ├── User Analytics/
            │   ├── Search pattern analysis
            │   ├── Feature usage tracking
            │   ├── User journey mapping
            │   └── Conversion metrics
            ├── System Health/
            │   ├── Service availability monitoring
            │   ├── Dependency health checks
            │   ├── Alert configuration
            │   └── Automated remediation
            └── Business Intelligence/
                ├── Usage trend analysis
                ├── Performance benchmarking
                ├── Capacity planning
                └── ROI measurement
```

## Summary

This comprehensive architecture tree provides a complete view of the Research Agent system, showing:

### **Key Architectural Patterns:**
- **Three-tier Architecture**: Presentation (SvelteKit) → Service (API) → Data (PostgreSQL/Redis)
- **Microservices Design**: Separate services for frontend, LLM gateway, search engine, and data storage
- **Privacy-First Design**: User data isolation, no tracking, privacy-respecting search
- **Performance Optimization**: Multi-layer caching, efficient queries, responsive design

### **Technology Stack:**
- **Frontend**: SvelteKit 5, TypeScript, Tailwind CSS, Vite
- **Backend**: SvelteKit server routes, Drizzle ORM, Node.js
- **Databases**: PostgreSQL (persistent), Redis (cache)
- **External Services**: SearXNG (search), LLM Gateway (AI), Notifuse (notifications)
- **Infrastructure**: Railway (deployment), Docker (containerization)

### **Data Flow Characteristics:**
- **User-Centric**: All data isolated by userEmail
- **Cache-First**: Redis for speed, PostgreSQL for persistence  
- **Real-Time**: Streaming responses, live updates, reactive UI
- **Resilient**: Error handling, fallbacks, circuit breakers

This architecture enables a scalable, privacy-focused research platform with AI integration, comprehensive search capabilities, and robust data management.