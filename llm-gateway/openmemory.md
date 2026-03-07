# OpenMemory Mandatory Operations

This document covers the mandatory rules and CRUD operations for working with OpenMemory, **including knowledge graph operations which are REQUIRED for every project**.

## ⚠️ CRITICAL: Knowledge Graph is MANDATORY

**For EVERY project, you MUST build and maintain a full knowledge graph.** This is not optional.

The knowledge graph MUST track:
- Technologies and frameworks used
- Dependencies between components
- Features and capabilities
- Deployment environments and infrastructure
- Architectural decisions and trade-offs
- Migrations and technology changes
- Team structure and ownership
- Configuration values and settings
- External integrations and services
- Performance characteristics
- Security policies and requirements

**Without a complete knowledge graph, the project lacks temporal context, historical analysis, and fact verification capabilities essential for long-term success.**

---

## ⚠️ CRITICAL: Session Variables MUST Be Initialized First

**Before ANY OpenMemory operations, following variables MUST be initialized:**

| Variable | Description | Example | Source |
|----------|-------------|---------|--------|
| `{{PROJECT_FOLDER_NAME}}` | **Root folder name** of current project (not full path) | `te9.dev`, `myproject`, `recipes-app` | Extracted from working directory |
| `{{OPENMEMORY_API_URL}}` | OpenMemory MCP endpoint URL | `https://openmemory-production-f483.up.railway.app/mcp` | Configuration (`opencode.json` MCP settings) |

**Documentation:**
- See `[.opencode/mappings/VARIABLES.md](.opencode/mappings/VARIABLES.md)` for complete variable setup guide
- See `[.opencode/mappings/OPENMEMORY.md](.opencode/mappings/OPENMEMORY.md)` for complete API mappings

**MCP Note:** OpenMemory is accessed via MCP server configured in `opencode.json`. Authentication is handled by MCP connection.

---

## ⚠️ CRITICAL: user_id MUST Be Project Folder Name

**For ALL OpenMemory operations, the `user_id` parameter MUST be the project folder name (not the full path).**

This ensures **context isolation** between projects/repositories. Each project has its own memory space, preventing cross-contamination.

**How to determine PROJECT_FOLDER_NAME:**
- Extract the **folder name** from the project root path
- Example: `"E:/projects/te9.dev"` → `PROJECT_FOLDER_NAME: "te9.dev"`
- Example: `"/home/user/myproject"` → `PROJECT_FOLDER_NAME: "myproject"`

---

## MANDATORY MEMORY WORKFLOW

### Rule 1: QUERY FIRST

Before responding to ANY user request, you MUST query OpenMemory:

```javascript
openmemory_openmemory_query({
  query: "[relevant keywords]",
  user_id: "{{PROJECT_FOLDER_NAME}}",  // Automatically resolves to folder name
  limit: 20
})
```

**API Mapping:**
- Function: `openmemory_openmemory_query()`
- Endpoint: `POST /memory/query`
- Parameters: `query` → body.query, `limit` → body.k, `user_id` → body.filters.user_id

### Rule 2: ANALYZE

Review memory results and identify:
- Past interactions on this topic
- User preferences and patterns
- Decisions made previously
- Technical context and code history
- Relationships between entities

### Rule 3: INCORPORATE

Your response MUST reflect memory context:
- Reference past interactions explicitly
- Adapt to user preferences found in memory
- Build upon previous decisions
- Maintain consistency with established patterns

### Rule 4: STORE LAST

After EVERY important interaction, you MUST:

```javascript
// Store memory - user_id uses PROJECT_FOLDER_NAME variable
openmemory_openmemory_store({
  content: "[key learnings/decisions]",
  sector: "episodic|semantic|procedural|emotional|reflective",
  user_id: "{{PROJECT_FOLDER_NAME}}",  // Automatically resolves to folder name
  tags: ["preference", "decision", "PRD-001", "authentication"]  // Array of descriptive tag strings
})
```

**API Mapping:**
- Function: `openmemory_openmemory_store()`
- Endpoint: `POST /memory/add`
- Parameters: `content` → body.content, `sector` → body.metadata.sector, `user_id` → body.user_id, `tags` → body.tags

### Rule 5: MAINTAIN KNOWLEDGE GRAPH (MANDATORY)

For EVERY project, you MUST maintain a complete knowledge graph that tracks all entity relationships and facts. This includes:

1. **Initial Setup**: Create facts for the project's starting state
2. **Ongoing Updates**: Add facts as new entities/relationships are discovered
3. **Change Tracking**: Invalidate old facts when changes occur (don't delete!)
4. **Verification**: Regularly verify facts in the codebase
5. **Metadata**: Always include source information (PRD IDs, commit hashes)

**This is MANDATORY - not optional.**

```javascript
openmemory_openmemory_store({
  content: "[key learnings/decisions]",
  sector: "episodic|semantic|procedural|emotional|reflective",
  user_id: "{{PROJECT_FOLDER_NAME}}",  // Automatically resolves to folder name
  tags: ["preference", "decision", "PRD-001", "authentication"]  // Array of descriptive tag strings
})
```

**API Mapping:**
- Function: `openmemory_openmemory_store()`
- Endpoint: `POST /memory/add`
- Parameters: `content` → body.content, `sector` → body.metadata.sector, `user_id` → body.user_id, `tags` → body.tags

---

## MEMORY CRUD OPERATIONS

### CREATE - Store Memory

```javascript
openmemory_openmemory_store({
  content: string,         // Memory content (1-2000 characters)
  user_id: string,         // MUST be {{PROJECT_FOLDER_NAME}}
  sector?: string,         // Stored in metadata
  tags?: string[],         // Array of descriptive tags
  metadata?: object,       // Additional structured data
  reinforce?: boolean,     // Boost memory salience
  importance?: string,     // low|medium|high|critical
  ttl?: number            // Time-to-live in days
})
```

**Examples:**

```javascript
// Store user preference
openmemory_openmemory_store({
  content: "User prefers JWT over session-based authentication",
  user_id: "{{PROJECT_FOLDER_NAME}}",
  sector: "emotional",
  tags: ["preference", "authentication", "JWT"],
  metadata: {
    source: "chat",
    confidence: "high"
  }
})

// Store critical decision with reinforcement
openmemory_openmemory_store({
  content: "Production endpoints require 256-bit encryption",
  user_id: "{{PROJECT_FOLDER_NAME}}",
  sector: "semantic",
  reinforce: true,
  importance: "critical"
})
```

---

### READ - Query Memory

```javascript
openmemory_openmemory_query({
  query: string,           // Search query or keywords
  limit: number = 20,      // Maps to: k in API
  user_id: string,         // MUST be {{PROJECT_FOLDER_NAME}}
  sector?: string,         // Filter by sector
  min_score?: number,      // Minimum relevance score
  timeframe?: {            // Time-based filtering
    start: string,         // ISO 8601 date
    end: string           // ISO 8601 date
  }
})
```

**Examples:**

```javascript
// Basic query
openmemory_openmemory_query({
  query: "authentication patterns",
  limit: 20,
  user_id: "{{PROJECT_FOLDER_NAME}}"
})

// Query with filters
openmemory_openmemory_query({
  query: "database technology decisions",
  limit: 15,
  user_id: "{{PROJECT_FOLDER_NAME}}",
  sector: "semantic",
  min_score: 0.6
})
```

**Alternative: Get All Memories**

```javascript
GET /memory/all?l=100&u=0&sector=semantic&user_id={{PROJECT_FOLDER_NAME}}
```

Query Parameters:
- `l` - Limit (default: 100)
- `u` - Offset (default: 0)
- `sector` - Filter by sector
- `user_id` - Filter by user

---

### UPDATE - Reinforce Memory

```javascript
// Reinforce via API
POST /memory/reinforce
{
  "id": "memory-uuid-here",
  "boost": 0.1
}
```

**Via store function:**
```javascript
openmemory_openmemory_store({
  content: "Important decision",
  user_id: "{{PROJECT_FOLDER_NAME}}",
  reinforce: true,
  importance: "high"  // Maps to boost: 0.2
})
```

**Importance → Boost Mapping:**
- `low` → `0.05`
- `medium` → `0.1`
- `high` → `0.2`
- `critical` → `0.5`

---

### DELETE - Remove Memory

```javascript
DELETE /memory/:id
```

**Query/Body:** `user_id` (optional, for ownership check)

---

## MEMORY SECTORS

| Sector | Purpose | Examples |
|--------|---------|----------|
| **episodic** | Events/conversations | "User mentioned they like dark mode in yesterday's meeting" |
| **semantic** | Facts/knowledge | "Project uses PostgreSQL 14 for production" |
| **procedural** | Workflows/approaches | "To deploy: run build, test, then push to staging" |
| **emotional** | Preferences/feelings | "User prefers blue color scheme for UI components" |
| **reflective** | Insights/patterns | "Pattern: User prioritizes security over performance" |

---

## KNOWLEDGE GRAPH OPERATIONS

### ⚠️ CRITICAL: Knowledge Graph is MANDATORY for Every Project

**Building and maintaining a full knowledge graph is NOT optional - it is REQUIRED for ALL projects.**

The knowledge graph provides:
- **Entity Tracking**: Know exactly what relationships exist at any point in time
- **Temporal Context**: Understand how relationships change over time (migrations, refactors, upgrades)
- **Fact Verification**: Track confidence levels and validity periods for critical information
- **Historical Analysis**: Compare state across time periods to understand evolution
- **Complete Project Understanding**: No ambiguity about what the project uses, depends on, or provides

### Why Knowledge Graph Matters

The Knowledge Graph stores **entity relationships** and **facts** that evolve over time, separate from contextual memories. This is critical for:

- **Entity Tracking**: Know what relationships exist at any point in time
- **Temporal Context**: Understand how relationships change over time
- **Fact Verification**: Track confidence levels and validity periods
- **Historical Analysis**: Compare state across time periods

**Example Use Cases:**
- "Who was the CEO of the company in 2023?"
- "What database was used before the migration?"
- "What technologies are currently in production?"
- "When did we switch from framework A to B?"

---

### CREATE - Create Fact

```javascript
POST /api/temporal/fact
{
  "subject": "Company",
  "predicate": "has_CEO",
  "object": "Alice",
  "valid_from": "2024-01-01",
  "confidence": 1.0,
  "metadata": {}
}
```

**Parameters:**
- `subject`: Entity being described (e.g., project name, component)
- `predicate`: Relationship type (e.g., uses, depends_on, has_feature)
- `object`: Related entity or value
- `valid_from`: ISO 8601 date when fact becomes valid
- `confidence`: 0.0-1.0 (how certain we are)
- `metadata`: Additional context

**Examples:**

```javascript
// Store technology stack
POST /api/temporal/fact
{
  "subject": "te9.dev",
  "predicate": "uses",
  "object": "PostgreSQL",
  "valid_from": "2024-01-15",
  "confidence": 1.0
}

// Store dependency
POST /api/temporal/fact
{
  "subject": "AuthService",
  "predicate": "depends_on",
  "object": "PostgreSQL",
  "valid_from": "2024-02-01",
  "confidence": 0.9
}

// Store feature
POST /api/temporal/fact
{
  "subject": "te9.dev",
  "predicate": "has_feature",
  "object": "JWT Authentication",
  "valid_from": "2024-03-01",
  "confidence": 1.0,
  "metadata": {
    "prdId": "PRD-20250115-143022"
  }
}
```

**Note:** Facts do NOT require `user_id` - they are shared across the knowledge graph.

---

### READ - Query Facts

#### Get Current Fact

```javascript
GET /api/temporal/fact/current?subject=te9.dev&predicate=uses
```

**Response:**
```json
{
  "object": "PostgreSQL",
  "valid_from": "2024-01-15",
  "confidence": 1.0
}
```

#### Search Facts

```javascript
GET /api/temporal/search?subject=te9.dev
```

**Response:**
```json
[
  {
    "subject": "te9.dev",
    "predicate": "uses",
    "object": "PostgreSQL",
    "valid_from": "2024-01-15",
    "confidence": 1.0
  },
  {
    "subject": "te9.dev",
    "predicate": "depends_on",
    "object": "Node.js",
    "valid_from": "2024-01-15",
    "confidence": 1.0
  }
]
```

#### Get Timeline

```javascript
GET /api/temporal/timeline?subject=te9.dev
```

Shows all facts for a subject, including historical changes.

#### Compare States

```javascript
GET /api/temporal/compare?subject=te9.dev&date1=2024-01-01&date2=2024-12-31
```

Shows how facts changed between two dates.

#### Get Statistics

```javascript
GET /api/temporal/stats
```

Returns aggregate information about the knowledge graph.

#### Get Volatile Facts

```javascript
GET /api/temporal/volatile
```

Returns facts with low confidence or short validity periods.

---

### UPDATE - Update Fact

```javascript
PATCH /api/temporal/fact/:id
{
  "confidence": 0.8,
  "metadata": {
    "verified": true,
    "source": "code-review"
  }
}
```

**Parameters:**
- `confidence`: Update confidence level
- `metadata`: Add or update metadata fields

---

### DELETE - Invalidate Fact

```javascript
DELETE /api/temporal/fact/:id
{
  "valid_to": "2024-12-31"
}
```

**Best Practice:** When a fact is no longer true, don't delete it - **invalidate it** by setting `valid_to`. This preserves historical context.

**Example:**

```javascript
// Old fact: te9.dev uses MySQL
// Instead of deleting, invalidate and create new fact

DELETE /api/temporal/fact/:old-fact-id
{
  "valid_to": "2024-12-31"
}

// Create new fact
POST /api/temporal/fact
{
  "subject": "te9.dev",
  "predicate": "uses",
  "object": "PostgreSQL",
  "valid_from": "2025-01-01",
  "confidence": 1.0
}
```

---

## USER OPERATIONS

### Get User Summary

```javascript
GET /users/{{PROJECT_FOLDER_NAME}}/summary
```

**Response:** Summary of user's memories, patterns, and insights.

### Get User Memories

```javascript
GET /users/{{PROJECT_FOLDER_NAME}}/memories
```

**Response:** All memories for the specified user_id.

### Delete User Memories

```javascript
DELETE /users/{{PROJECT_FOLDER_NAME}}/memories
```

**⚠️ WARNING:** This is a destructive operation - deletes all memories for the user.

---

## BEST PRACTICES

### Memory Storage

1. **Always use `{{PROJECT_FOLDER_NAME}}` for `user_id`**
   - ✅ `user_id: "{{PROJECT_FOLDER_NAME}}"` → `"te9.dev"`
   - ❌ `user_id: "user123"` → Breaks context isolation

2. **Tag consistently**
   - `preference` for user preferences
   - `decision` for technical decisions
   - `pattern` for recurring themes
   - `lesson` for insights
   - Include domain tags: `authentication`, `database`, `UI`

3. **Use appropriate limit values**
   - Quick queries: `10-15`
   - Comprehensive context: `20-30`
   - Full history: Use `GET /memory/all`

4. **Leverage metadata for filtering**
   ```javascript
   metadata: {
     source: "prd-interview",
     prdId: "PRD-20250115-143022",
     category: "technical",
     impact: "high"
   }
   ```

5. **Reinforce important memories**
   ```javascript
   openmemory_openmemory_store({
     content: criticalContent,
     user_id: "{{PROJECT_FOLDER_NAME}}",
     reinforce: true,
     importance: "critical"
   })
   ```

### Knowledge Graph

1. **Invalidate, don't delete** facts to preserve history
2. **Use confidence levels** for uncertain information
3. **Store metadata** to track sources (PRD IDs, commit hashes, etc.)
4. **Query timeline** for historical analysis
5. **Use compare** to see changes over time

### When to Use Memory vs Knowledge Graph

| Use Case | Memory | Knowledge Graph |
|----------|--------|-----------------|
| User preferences | ✅ | ❌ |
| Past conversations | ✅ | ❌ |
| Insights/patterns | ✅ | ❌ |
| Entity relationships | ❌ | ✅ (MANDATORY) |
| Technology stack facts | ❌ | ✅ (MANDATORY) |
| Historical entity state | ❌ | ✅ (MANDATORY) |
| Dependencies | ❌ | ✅ (MANDATORY) |
| Features/Capabilities | ❌ | ✅ (MANDATORY) |

**Key Rule**: If it's an entity relationship or project fact, it MUST go in the Knowledge Graph.

---

## CRITICAL RULES SUMMARY

1. **QUERY FIRST** - Before responding to ANY request
2. **STORE LAST** - After EVERY important interaction
3. **user_id = PROJECT_FOLDER_NAME** - Always, no exceptions
4. **MAINTAIN KNOWLEDGE GRAPH** - MANDATORY for every project - track all entities, relationships, and facts
5. **REINFORCE IMPORTANT** - Use `reinforce: true` for critical info
6. **INVALIDATE, DON'T DELETE** - Preserve knowledge graph history
7. **TAG CONSISTENTLY** - Use standard tag patterns
8. **USE APPROPRIATE SECTORS** - episodic, semantic, procedural, emotional, reflective

---

## REFERENCE

### Complete API Documentation

- **Memory Operations**: `[.opencode/mappings/OPENMEMORY.md](.opencode/mappings/OPENMEMORY.md)`
- **Variable Setup**: `[.opencode/mappings/VARIABLES.md](.opencode/mappings/VARIABLES.md)`

### Tool Function Summary

| Tool Function | API Endpoint | Required |
|--------------|--------------|----------|
| `openmemory_openmemory_query()` | `POST /memory/query` | `user_id` = `{{PROJECT_FOLDER_NAME}}` |
| `openmemory_openmemory_store()` | `POST /memory/add` | `user_id` = `{{PROJECT_FOLDER_NAME}}` |
| `GET /memory/all` | `GET /memory/all` | `user_id` = `{{PROJECT_FOLDER_NAME}}` |
| `POST /memory/reinforce` | `POST /memory/reinforce` | Memory ID |
| `DELETE /memory/:id` | `DELETE /memory/:id` | Memory ID |
| `POST /api/temporal/fact` | `POST /api/temporal/fact` | subject, predicate, object (**MANDATORY**) |
| `GET /api/temporal/fact/current` | `GET /api/temporal/fact/current` | subject, predicate |
| `PATCH /api/temporal/fact/:id` | `PATCH /api/temporal/fact/:id` | Fact ID |
| `DELETE /api/temporal/fact/:id` | `DELETE /api/temporal/fact/:id` | Fact ID |

**Remember: All memory operations MUST use `{{PROJECT_FOLDER_NAME}}` as the `user_id` parameter to ensure proper project context isolation.**

**AND: Building a full knowledge graph is MANDATORY for every project - use temporal facts to track all entities and relationships.**

**Remember: All memory operations MUST use `{{PROJECT_FOLDER_NAME}}` as the `user_id` parameter to ensure proper project context isolation.**