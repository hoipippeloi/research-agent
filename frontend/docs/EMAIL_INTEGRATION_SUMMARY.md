# Email-Based User Data Coupling Implementation

## Overview
All user data (searches, collections, saved results, preferences) is now linked to an email address. When no email is stored in localStorage, users must enter their email before accessing the app. After entering their email, all API requests include the email to fetch/filter user-specific data.

## Changes Made

### 1. Database Schema (`src/lib/db/schema.ts`)
- Added `userEmail` field to all tables:
  - `searches`
  - `saved_results`
  - `research_projects`
  - `user_preferences`
  - `collections`
- Added indexes on `userEmail` for efficient querying
- Made `user_preferences.userEmail` unique

### 2. Database Migration
- Created migration file: `drizzle/0003_add_user_email.sql`
- Adds `userEmail` columns with NOT NULL constraint and indexes
- **IMPORTANT**: Run migration before deploying:
  ```bash
  npm run db:push
  ```

### 3. Email Store (`src/lib/stores/userEmail.ts`)
- Created Svelte store for email management
- Handles localStorage persistence
- Methods:
  - `setEmail(email)` - Store email in localStorage and state
  - `clearEmail()` - Remove email
  - `getEmail()` - Get current email from localStorage

### 4. Email Modal Component (`src/lib/components/EmailModal.svelte`)
- Beautiful modal for email collection
- Email validation
- User-friendly messaging about data privacy
- Events: `submit` (with email), `close`

### 5. Updated API Endpoints

#### `/api/search` (src/routes/api/search/+server.ts)
- **GET**: Now requires `?userEmail=xxx` parameter
- **POST**: Now requires `{ userEmail, query, engine }` in body
- Saves search with userEmail

#### `/api/history` (src/routes/api/history/+server.ts)
- **GET**: Now requires `?userEmail=xxx` parameter
- **DELETE**: Now requires `?id=xx&userEmail=xxx` parameters
- Filters history by userEmail

#### `/api/collections` (src/routes/api/collections/+server.ts)
- **GET**: Now requires `?userEmail=xxx` parameter
- **POST**: Now requires `{ userEmail, topic }` in body
- **DELETE**: Now requires `?id=xx&userEmail=xxx` parameters
- Filters collections by userEmail

#### `/api/saved-results` (src/routes/api/saved-results/+server.ts)
- **POST**: Now requires `{ userEmail, markdown, title, collectionId, url }` in body
- Filters saved results by userEmail

### 6. Redis Client Updates (`src/lib/redis-client.ts`)
- `SearchHistory` interface now includes `userEmail`
- `saveSearch()` now accepts and stores `userEmail`
- `getRecentSearches()` now requires `userEmail` parameter
- `deleteSearch()` now requires `userEmail` parameter
- Redis keys are now user-specific: `search:recent:{userEmail}`

## Integration Required

### Main Page (`src/routes/+page.svelte`)

Add email modal integration:

```svelte
<script lang="ts">
  import { userEmail } from "$lib/stores/userEmail";
  import EmailModal from "$lib/components/EmailModal.svelte";
  
  let currentUserEmail = $state<string | null>(null);
  let showEmailModal = $state(false);
  
  onMount(async () => {
    // Check for email in localStorage
    const storedEmail = userEmail.getEmail();
    
    if (!storedEmail) {
      showEmailModal = true;
      return;
    }
    
    currentUserEmail = storedEmail;
    await Promise.all([loadSearchHistory(), loadCollections()]);
  });
  
  function handleEmailSubmit(email: string) {
    userEmail.setEmail(email);
    currentUserEmail = email;
    showEmailModal = false;
    loadSearchHistory();
    loadCollections();
  }
  
  // Update all API calls to include userEmail
  async function loadSearchHistory() {
    if (!currentUserEmail) return;
    
    try {
      const response = await fetch(`/api/history?userEmail=${encodeURIComponent(currentUserEmail)}`);
      // ... rest of function
    } catch (err) {
      // ... error handling
    }
  }
  
  async function loadCollections() {
    if (!currentUserEmail) return;
    
    try {
      const response = await fetch(`/api/collections?userEmail=${encodeURIComponent(currentUserEmail)}`);
      // ... rest of function
    } catch (err) {
      // ... error handling
    }
  }
  
  async function handleCreateCollection(search: AggregatedSearchHistory) {
    if (!currentUserEmail) return;
    
    try {
      const response = await fetch("/api/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: search.query,
          userEmail: currentUserEmail
        }),
      });
      // ... rest of function
    }
  }
  
  async function fetchResults(search: AggregatedSearchHistory) {
    if (!currentUserEmail) return;
    
    try {
      const response = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: search.query,
          engine: /* ... */,
          userEmail: currentUserEmail
        }),
      });
      // ... rest of function
    }
  }
  
  async function handleSaveMarkdown(markdown: string, sourceUrl: string) {
    if (!currentUserEmail || !selectedSearchForModal) return;
    
    try {
      const response = await fetch('/api/saved-results', {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          markdown,
          title: selectedSearchForModal.query,
          collectionId: collection.id,
          url: sourceUrl,
          userEmail: currentUserEmail
        }),
      });
      // ... rest of function
    }
  }
  
  async function handleDeleteCollection(id: number, e: MouseEvent) {
    if (!currentUserEmail) return;
    
    e.stopPropagation();
    try {
      const response = await fetch(`/api/collections?id=${id}&userEmail=${encodeURIComponent(currentUserEmail)}`, {
        method: "DELETE",
      });
      // ... rest of function
    }
  }
</script>

{#if showEmailModal}
  <EmailModal 
    onsubmit={handleEmailSubmit}
    onclose={() => {
      // User must enter email to continue
      // Optionally show message
    }}
  />
{:else if currentUserEmail}
  <!-- Main app content -->
{:else}
  <div class="loading">Loading...</div>
{/if}
```

## Testing Checklist

### Manual Testing
- [ ] Clear browser data (localStorage, cache)
- [ ] Open app - email modal should appear
- [ ] Enter invalid email - should show error
- [ ] Enter valid email - modal should close
- [ ] Refresh page - email should persist
- [ ] Perform search - should be linked to email
- [ ] Check history - should show only your searches
- [ ] Create collection - should be linked to email
- [ ] Save result - should be linked to email
- [ ] Clear localStorage again
- [ ] Enter same email - should see previous data
- [ ] Enter different email - should see no data

### Database Verification
```sql
-- Check searches are linked to emails
SELECT id, user_email, query FROM searches LIMIT 10;

-- Check collections are linked to emails
SELECT id, user_email, topic FROM collections LIMIT 10;

-- Check saved results are linked to emails
SELECT id, user_email, title FROM saved_results LIMIT 10;
```

### API Testing
```bash
# Test history endpoint
curl "http://localhost:5173/api/history?userEmail=test@example.com&limit=10"

# Test collections endpoint
curl "http://localhost:5173/api/collections?userEmail=test@example.com"

# Test search endpoint
curl -X POST http://localhost:5173/api/search \
  -H "Content-Type: application/json" \
  -d '{"query":"test","engine":"general","userEmail":"test@example.com"}'

# Test create collection
curl -X POST http://localhost:5173/api/collections \
  -H "Content-Type: application/json" \
  -d '{"topic":"test topic","userEmail":"test@example.com"}'
```

## Deployment Steps

1. **Review migration SQL** (`drizzle/0003_add_user_email.sql`)
2. **Backup database** before migration
3. **Run migration**: `npm run db:push`
4. **Deploy code** to Railway
5. **Verify** email modal appears on fresh browser
6. **Test** data coupling with different emails

## Security Considerations

- Email is stored in localStorage (client-side only)
- Email is validated on both client and server
- All API endpoints require email parameter
- Database queries filter by email (prevents cross-user data access)
- Consider adding rate limiting per email address
- Consider adding email verification in the future
- Consider encrypting email in database for privacy

## Future Enhancements

1. **Email Verification**: Send verification email before allowing access
2. **Account System**: Allow users to create full accounts with passwords
3. **Data Export**: Allow users to export all their data
4. **Data Deletion**: GDPR-compliant data deletion
5. **Email Change**: Allow users to change their email while preserving data
6. **Session Management**: Better session handling with JWT tokens
7. **Multi-device Sync**: Sync data across devices with same email

## Troubleshooting

### Email Modal Not Appearing
- Check browser console for errors
- Verify localStorage is not blocked
- Check `userEmail.getEmail()` returns null

### Data Not Loading
- Verify userEmail is being sent in API requests
- Check network tab for API request parameters
- Verify database has data for that email

### Migration Errors
- Check PostgreSQL logs
- Verify migration file syntax
- Ensure no conflicting data exists

### TypeScript Errors
- Run `npm run check` to see all errors
- Ensure all API calls include userEmail
- Check type definitions are updated
