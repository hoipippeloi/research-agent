# Documentation Writing Guide

## Principles

### Progressive Disclosure
Reveal information in layers, from most important to least important:
1. **Quick Start** - Get users productive immediately
2. **Concepts** - Mental model and overview
3. **Examples** - Practical use cases
4. **Reference** - Complete technical details
5. **Advanced** - Edge cases and optimization

### Top-Down Approach
Start from the user's perspective, drill down to implementation:
- **What** does this do? (User benefit)
- **How** do I use it? (Examples)
- **How** does it work? (Technical details)
- **Why** is it designed this way? (Rationale)

---

## Documentation Structure Template

### 1. Quick Start (2-3 paragraphs + code example)
**Purpose**: Get users productive in 30 seconds

```markdown
## Quick Start

**What does this do?**
[1-2 sentence description of the feature/system]

**Fastest way to get started:**
```bash
[Copy-pasteable example]
```

**What you'll need:**
- [Prerequisites in bullet list]
```

**Example from API docs:**
- Started with "What can I do?" 
- Provided immediate curl examples
- Listed the 4 main capabilities

### 2. Overview (1 page)
**Purpose**: Build mental model

```markdown
## Overview

### Architecture at a Glance
[Simple diagram or visual]

**Key Components:**
- **Component 1** - What it does
- **Component 2** - What it does

**How they work together:**
[2-3 sentences explaining the flow]
```

**Example from DB docs:**
- Visual diagram showing Redis → PostgreSQL flow
- Table explaining each storage layer
- Explanation of user-centric design

### 3. Common Use Cases (2-4 scenarios)
**Purpose**: Show real-world usage

```markdown
## Common Use Cases

### Use Case 1: [Scenario Name]

**Scenario**: [When this happens]

```bash
# Step 1: First action
[command]

# Step 2: Second action
[command]
```

**What happens behind the scenes:**
1. [First step]
2. [Second step]
3. [Result]
```

**Example from API docs:**
- "Basic Search Workflow" with step-by-step
- "Organize Research into Collections" 
- "Save Important Results"
- "Search Code Repositories"

### 4. Detailed Reference (Complete specs)
**Purpose**: Comprehensive technical documentation

```markdown
## API/Feature Reference

### [Endpoint/Feature Name]

**Purpose**: [One sentence]

#### [Method] /[endpoint]

**Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `param1` | string | ✅ Yes | - | Description |

**Example:**
```bash
[Complete example with request and response]
```

**Business Logic:**
- Rule 1
- Rule 2
```

**Example from API docs:**
- Each endpoint documented with:
  - Parameters table
  - Example request/response
  - Business logic explanation

### 5. Visual Data Flow (Diagram)
**Purpose**: Show system behavior

```markdown
## Data Flow

```
User Action
    ↓
Step 1
    ↓
┌───┴───┐
Path A  Path B
↓       ↓
Result  Result
```
```

**Example from both docs:**
- Search to Display flow diagram
- Save and Organize flow diagram
- Redis vs PostgreSQL storage flow

### 6. Technical Details (Performance, errors)
**Purpose**: Deep technical information

```markdown
## Technical Details

### Error Handling

**Common HTTP Status Codes:**

| Code | Meaning | When it happens |
|------|---------|-----------------|
| `400` | Bad Request | Missing parameters |

### Performance Characteristics

| Operation | Response Time | Bottleneck |
|-----------|--------------|------------|
| Action 1 | < 50ms | Cache lookup |
```

**Example from API docs:**
- Error handling table
- Performance characteristics table
- Caching strategy explanation

### 7. Advanced Topics (Edge cases)
**Purpose**: Deep dives and optimization

```markdown
## Advanced Topics

### [Topic 1]
[Detailed explanation]

### Debugging & Troubleshooting

**Common Issues:**

1. **[Problem]**
   - Check [thing 1]
   - Verify [thing 2]
```

**Example from DB docs:**
- Index strategy
- Cascade behavior
- JSONB query performance
- Troubleshooting section

---

## Writing Tips

### Do's ✅

1. **Start with user benefit**
   ```markdown
   # ✅ Good
   **What can I do with this?**
   Search multiple engines with automatic caching.
   
   # ❌ Bad  
   **Architecture**
   SvelteKit API routes with PostgreSQL...
   ```

2. **Show, then tell**
   ```markdown
   # ✅ Good
   ```bash
   curl "http://localhost:5173/api/search?query=test"
   ```
   This searches the web using SearXNG...
   
   # ❌ Bad
   The search API uses SearXNG to query the web...
   ```

3. **Use visual hierarchy**
   - Tables for structured data
   - Code blocks for examples
   - Diagrams for flows
   - Bullet lists for options

4. **Progressive complexity**
   ```markdown
   ## Quick Start          # Anyone can use
   ## Overview             # Understand the model  
   ## Examples             # See it in action
   ## Reference            # Deep dive when needed
   ## Advanced Topics      # Optimization later
   ```

### Don'ts ❌

1. **Don't start with implementation**
   ```markdown
   # ❌ Bad
   ## Database Schema
   The searches table has 8 columns...
   
   # ✅ Good
   ## Quick Start
   Research Agent stores your searches...
   ```

2. **Don't overload the Quick Start**
   ```markdown
   # ❌ Bad - Quick Start is too long
   ## Quick Start
   [5 paragraphs of explanation]
   [3 code examples]
   [Architecture diagram]
   
   # ✅ Good - Quick Start is quick
   ## Quick Start
   **What does this do?**
   [1 sentence]
   
   **Try it now:**
   [1 code example]
   ```

3. **Don't skip examples**
   ```markdown
   # ❌ Bad - Only theory
   ## Collections API
   Creates topic-based collections.
   
   # ✅ Good - Shows usage
   ## Collections API
   Creates topic-based collections.
   
   **Example:**
   ```bash
   POST /api/collections
   {"topic": "machine learning"}
   ```
   ```

---

## Template Checklist

When writing documentation, ensure you have:

### Layer 1: Quick Start (30 seconds)
- [ ] One-sentence description of what it does
- [ ] Copy-pasteable code example
- [ ] Prerequisites (if any)

### Layer 2: Overview (5 minutes)
- [ ] Simple diagram or visual
- [ ] Component breakdown
- [ ] How components work together

### Layer 3: Examples (10 minutes)
- [ ] 2-4 real-world use cases
- [ ] Step-by-step instructions
- [ ] "Behind the scenes" explanation

### Layer 4: Reference (Complete)
- [ ] All parameters/options documented
- [ ] Complete examples with responses
- [ ] Business logic explained
- [ ] Edge cases covered

### Layer 5: Advanced (As needed)
- [ ] Performance characteristics
- [ ] Troubleshooting guide
- [ ] Optimization tips
- [ ] Migration/upgrade notes

---

## Real Examples

### Before (Bottom-Up)
```markdown
## Database Schema

### searches table
| Column | Type | Description |
|--------|------|-------------|
| id | serial | Primary key |
| userEmail | text | User identifier |
[... 6 more columns]

### collections table
[... similar structure]

### API Endpoints
POST /api/search - Searches the web
GET /api/history - Returns history
```

**Problem**: 
- Starts with implementation details
- No context for why this matters
- Hard to understand the big picture

### After (Top-Down + Progressive Disclosure)
```markdown
## Quick Start
**What does Research Agent store?**
Your searches, collections, and saved results.

**Quick Example:**
```typescript
const collections = await db.select()
  .from(collections)
  .where(eq(collections.userEmail, email));
```

## Core Concepts
**User-Centric Design**
All data isolated by userEmail...

**Storage Strategy: Fast vs. Persistent**
[Diagram showing Redis → PostgreSQL flow]

## Common Use Cases
**Search and Save Workflow**
1. User searches
2. Results cached in Redis
3. User saves result
4. Stored permanently in PostgreSQL
```

**Benefits**:
- ✅ Starts with user benefit
- ✅ Shows concepts before details
- ✅ Progressive complexity
- ✅ Visual aids

---

## Formatting Guidelines

### Use Tables For:
- Parameters/options
- Status codes
- Performance metrics
- Feature comparisons

### Use Code Blocks For:
- API requests/responses
- Configuration examples
- Command-line examples
- Code snippets

### Use Diagrams For:
- Data flow
- Architecture overview
- Process flows
- Entity relationships

### Use Bullet Lists For:
- Prerequisites
- Options/features
- Steps in a process
- Business rules

---

## Maintenance

### Keep Documentation Updated

**When to update:**
- New feature added → Add to Quick Start + Reference
- Breaking change → Update examples + Migration Guide
- Performance improvement → Update Performance section
- Bug fixes → Update Troubleshooting

**Review checklist (quarterly):**
- [ ] Quick Start still works (test the examples)
- [ ] Screenshots/diagrams still accurate
- [ ] Links still work
- [ ] Performance metrics current
- [ ] Error messages still match

---

## Summary

**The Golden Rule**: 
> Start with what the user needs most, reveal details progressively.

**Structure**:
1. Quick Start (30s) - Get productive
2. Overview (5min) - Build mental model
3. Examples (10min) - See it work
4. Reference (Complete) - All the details
5. Advanced (As needed) - Deep dives

**Remember**:
- User benefit first, implementation second
- Show before tell
- Progressive disclosure: Simple → Complex
- Top-down: What → How → Why

**Examples to follow**:
- See `docs/apis/api-docs.md` for API documentation
- See `docs/db/db-docs.md` for database documentation