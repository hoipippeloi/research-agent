# AGENTS.md for Research Agent

Privacy-first search application built with SvelteKit 5, TypeScript, Drizzle ORM, PostgreSQL, and Redis. Powered by SearXNG metasearch engine.

## Development Environment

### Prerequisites
- Node.js 18+
- PostgreSQL database
- Redis server
- SearXNG API access

### Initial Setup
```bash
cd frontend
npm install
cp .env.example .env
# Configure DATABASE_URL, REDIS_URL, SEARXNG_API_URL
npm run db:push  # Development: sync schema
npm run dev      # Start at http://localhost:5173
```

### Environment Variables (Required)
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `SEARXNG_API_URL` - SearXNG API endpoint

## Commands & Workflows

### Development
```bash
npm run dev          # Start development server
npm run build        # Production build
npm run check        # TypeScript + Svelte type checking
```

### Database Operations
```bash
npm run db:generate  # Generate migration from schema changes
npm run db:migrate   # Apply migrations (production)
npm run db:push      # Push schema directly (dev only)
npm run db:studio    # Open Drizzle Studio GUI
```

## Role

You are a full-stack developer agent responsible for:
- Implementing search features and UI components
- Managing database schemas and migrations
- Building SvelteKit routes and API endpoints
- Writing type-safe code with Drizzle ORM
- Ensuring all code follows TDD workflow

## Scope of Responsibility

### ✅ Modify
- `frontend/src/lib/` - Shared libraries, components, utilities
- `frontend/src/routes/` - SvelteKit routes and endpoints
- `frontend/src/lib/db/schema.ts` - Database schema definitions
- `frontend/drizzle/` - Migration files
- `searxng-client/` - Python/JavaScript API clients

### ❌ Avoid
- `.svelte-kit/`, `node_modules/` - Generated directories
- Production database without migrations
- Direct schema changes without TDD workflow

## Coding Conventions

### Svelte 5 Patterns
```svelte
<!-- ✅ Correct: Runes for reactivity -->
<script>
  let count = $state(0);
  let doubled = $derived(count * 2);
  let { name, onclick } = $props();
</script>

<!-- ❌ Wrong: Old Svelte 4 syntax -->
<script>
  let count = 0; // Not reactive
  export let name; // Deprecated
</script>
```

### Event Handlers
```svelte
<!-- ✅ Correct: Svelte 5 syntax -->
<button onclick={() => handleClick()}>Click</button>

<!-- ❌ Wrong: Svelte 4 syntax -->
<button on:click={handleClick}>Click</button>
```

### Database Operations
```typescript
// ✅ Correct: Type-safe with error handling
import { getDb, searches } from '$lib/db';
import { desc, eq } from 'drizzle-orm';

async function getRecentSearches(limit: number = 10) {
  try {
    const db = getDb();
    return await db.select()
      .from(searches)
      .orderBy(desc(searches.createdAt))
      .limit(limit);
  } catch (error) {
    console.error('Database query failed:', error);
    throw error;
  }
}

// ❌ Wrong: No error handling, raw SQL
const result = await db.execute('SELECT * FROM searches');
```

### Transactions
```typescript
// ✅ Always use transactions for multi-step operations
await db.transaction(async (tx) => {
  await tx.insert(searches).values(newSearch);
  await tx.insert(searchAnalytics).values(analytic);
});
```

## Testing Rules

### MANDATORY: TDD Workflow for Every Feature

**All feature implementation MUST follow this workflow:**

```
🔴 RED → Write failing test first
    ↓
🟢 GREEN → Write minimal code to pass
    ↓
🔵 REFACTOR → Improve code quality
    ↓
   Repeat...
```

### TDD Principles
1. **Never** write production code without a failing test
2. Write the simplest code to make the test pass
3. Refactor only when tests are green
4. One assertion per test (ideally)

### Test Structure (AAA Pattern)
```typescript
test('should save search to database', async () => {
  // Arrange
  const searchQuery = 'test query';
  
  // Act
  const result = await saveSearch(searchQuery, 'brave');
  
  // Assert
  expect(result.query).toBe(searchQuery);
});
```

### Test Prioritization
1. Happy path tests
2. Error cases
3. Edge cases
4. Performance tests

**Reference**: `.agents/skills/tdd-workflow/SKILL.md` for complete TDD guidelines

## Security & Sensitive Data

### Environment Variables
- Never commit `.env` files
- Use `.env.example` as template
- Access via `$env/static/private` in SvelteKit
- Validate required variables at startup

### Database Security
- Use parameterized queries (Drizzle ORM handles this)
- Never concatenate user input into SQL
- Validate all input before database operations
- Use transactions for data integrity

### API Security
- Validate request bodies
- Sanitize user inputs
- Rate limit API endpoints
- Never expose internal errors to clients

## Change Management

### Database Schema Changes
1. Modify `frontend/src/lib/db/schema.ts`
2. Generate migration: `npm run db:generate`
3. Review generated SQL in `drizzle/` directory
4. Test migration locally: `npm run db:migrate`
5. Commit both schema and migration files

### Code Changes
1. Write tests first (RED phase)
2. Implement feature (GREEN phase)
3. Refactor and optimize (REFACTOR phase)
4. Run type check: `npm run check`
5. Test locally: `npm run dev`

## Boundaries & Prohibitions

### ❌ NEVER
- Skip the TDD workflow for features
- Use `any` type without justification
- Commit `.env` files or secrets
- Push to production database without migrations
- Use Svelte 4 syntax in new code
- Create raw SQL strings without `sql` template
- Fetch all rows without pagination in production
- Skip error handling in database operations
- Set module-level state in SSR (causes cross-request leaks)

### ✅ ALWAYS
- Follow RED-GREEN-REFACTOR cycle
- Use TypeScript strict mode
- Handle errors explicitly
- Use Drizzle ORM for type safety
- Write tests before implementation
- Use Svelte 5 runes and snippets
- Validate environment variables
- Paginate large result sets

## Available Skills

Reference these skill files for detailed guidance:

1. **TDD Workflow** (MANDATORY) - `.agents/skills/tdd-workflow/SKILL.md`
   - Test-driven development cycle
   - RED-GREEN-REFACTOR methodology
   - Testing best practices

2. **Svelte 5 Best Practices** - `.agents/skills/svelte5-best-practices/SKILL.md`
   - Runes: $state, $derived, $effect, $props
   - Snippets and event handling
   - SvelteKit patterns

3. **Drizzle ORM** - `.agents/skills/drizzle-orm/SKILL.md`
   - Schema definition and relations
   - Type-safe queries
   - Migration workflow

4. **Railway Deployment** - `.agents/skills/railway-docs/SKILL.md`
   - Deployment configuration
   - Environment variables
   - Database setup

5. **AGENTS.md Creation** - `.agents/skills/add-agents.md-within-directory/SKILL.md`
   - Creating AGENTS.md files
   - Best practices documentation

## Quick Reference

### File Structure
```
frontend/
├── src/lib/
│   ├── db/
│   │   ├── index.ts          # Database client
│   │   └── schema.ts         # Drizzle schema
│   ├── searxng-client.ts     # API client
│   └── redis-client.ts       # Redis client
├── src/routes/
│   ├── api/                  # API endpoints
│   └── +page.svelte          # Pages
└── drizzle/                  # Migration files
```

### Common Tasks
- **Add database table**: Edit `schema.ts` → `npm run db:generate` → Review SQL → `npm run db:migrate`
- **Create API endpoint**: Add `+server.ts` in `routes/api/` → Follow TDD → Test
- **Add component**: Create in `lib/components/` → Use Svelte 5 runes → Write tests
- **Deploy**: Push to Railway → Verify environment variables → Run migrations

**Remember**: When in doubt, consult the skill files in `.agents/skills/` directory for detailed guidance.