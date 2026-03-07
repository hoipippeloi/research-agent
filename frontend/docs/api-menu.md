# 🍽️ Research Agent API Restaurant Menu
*Fine Dining for LLM Agents - Automating Human Research Workflows*

Welcome to the Research Agent API Restaurant, where LLM agents can feast on rich data capabilities and automate everything a human researcher can do through our GUI. Each dish represents a capability that transforms manual research into intelligent automation.

---

## 🥗 Appetizers - Quick Bites
*Light operations to get started*

### Search Sampler Platter
**GET/POST `/api/search`** - *The classic starter*
```json
{
  "query": "machine learning transformers",
  "engine": "academic",
  "userEmail": "agent@example.com"
}
```
*Perfect for agents who need quick answers. Choose from three search flavors:*
- `general` - Mixed search across brave, duckduckgo, startpage
- `code` - GitHub and StackOverflow specialties  
- `academic` - arXiv and Semantic Scholar delicacies

**Agent Use Case**: Research assistant that responds to user questions by automatically searching and synthesizing results.

### History Tasting
**GET `/api/history?userEmail=agent@example.com`**
*Sample what's been searched before*

**Agent Use Case**: Before performing new searches, check if similar queries were already executed to avoid duplication.

### Collection Preview
**GET `/api/collections?userEmail=agent@example.com`**
*Browse existing research topics*

**Agent Use Case**: Research organization agent that categorizes and suggests which collection new findings should be added to.

---

## 🍖 Main Courses - Hearty Workflows
*Substantial capabilities for serious research automation*

### The Full Research Pipeline
**Multi-endpoint orchestration** - *Our signature dish*

```typescript
// Agent workflow example
async function conductResearch(topic: string, userEmail: string) {
  // 1. Search across all engines
  const academicResults = await fetch('/api/search', {
    method: 'POST',
    body: JSON.stringify({ query: topic, engine: 'academic', userEmail })
  });
  
  const codeResults = await fetch('/api/search', {
    method: 'POST', 
    body: JSON.stringify({ query: topic, engine: 'code', userEmail })
  });
  
  // 2. Create collection for organization
  const collection = await fetch('/api/collections', {
    method: 'POST',
    body: JSON.stringify({ topic, userEmail })
  });
  
  // 3. Save important results
  for (const result of importantResults) {
    await fetch('/api/saved-results', {
      method: 'POST',
      body: JSON.stringify({
        url: result.url,
        title: result.title,
        content: result.content,
        collectionId: collection.id,
        userEmail
      })
    });
  }
  
  // 4. Create summary document
  await fetch('/api/documents', {
    method: 'POST',
    body: JSON.stringify({
      title: `Research Summary: ${topic}`,
      content: synthesizedFindings,
      userEmail,
      collectionId: collection.id
    })
  });
}
```

**Agent Use Case**: Autonomous research assistant that takes a topic, searches comprehensively, organizes findings, and produces a research report.

### The Document Factory
**POST `/api/documents`** - *Create comprehensive reports*
```json
{
  "title": "AI Safety Literature Review",
  "content": "# Executive Summary\n\nBased on my analysis of 47 papers...",
  "userEmail": "agent@example.com",
  "collectionId": 123,
  "tags": ["AI safety", "literature review", "automated"]
}
```

**Agent Use Case**: Report generation agent that synthesizes multiple sources into comprehensive documents with proper citations and structure.

### Link Harvesting & Processing
**POST `/api/fetch-markdown` + `/api/saved-results`**
*Extract and process web content*

```typescript
// Agent extracts content from links
const markdown = await fetch('/api/fetch-markdown', {
  method: 'POST',
  body: JSON.stringify({ url: "https://arxiv.org/pdf/2023.12345.pdf" })
});

// Then saves processed version
await fetch('/api/saved-results', {
  method: 'POST',
  body: JSON.stringify({
    markdown: processedContent,
    title: extractedTitle,
    url: originalUrl,
    userEmail: 'agent@example.com'
  })
});
```

**Agent Use Case**: Content curation agent that finds relevant links, extracts content, summarizes key points, and saves them in organized collections.

---

## 🍟 Sides - Data Management
*Essential accompaniments for organized research*

### Collection Curator
**POST/GET/DELETE `/api/collections`**
*Organize research by topic*

```json
// Create topic-based collections
{
  "topic": "Quantum Computing Applications",
  "userEmail": "agent@example.com",
  "searchMetadata": {
    "engine": "academic",
    "resultsCount": 25
  }
}
```

**Agent Use Case**: Topic organization agent that automatically creates collections based on user interests and groups related searches.

### Bookmark Manager
**GET/POST/PUT/DELETE `/api/saved-results`**
*Manage saved research artifacts*

**Agent Use Case**: Digital librarian agent that bookmarks important findings, tags them appropriately, and maintains a searchable knowledge base.

### Research Project Orchestrator
**Database operations via Drizzle ORM**
*Long-term research project management*

**Agent Use Case**: Project management agent that tracks research progress, manages multiple concurrent investigations, and creates project timelines.

---

## 🧁 Desserts - AI Enhancement Layer
*Sweet AI integrations for the perfect finish*

### LLM Gateway Integration
**POST `/v1/chat/completions` (via LLM Gateway)**
*Local Qwen3.5-4B model for content processing*

```json
{
  "model": "qwen3.5-4b",
  "messages": [
    {
      "role": "system", 
      "content": "You are a research analyst. Summarize these papers and identify key themes."
    },
    {
      "role": "user",
      "content": "Here are 5 papers on transformer architecture..."
    }
  ],
  "temperature": 0.3,
  "stream": false
}
```

**Agent Use Case**: Research synthesis agent that uses the local LLM to analyze collected documents, extract insights, and generate summaries without external API dependencies.

### Intelligent Search Enhancement
*Combine search + LLM for smarter queries*

```typescript
async function intelligentSearch(userQuery: string, userEmail: string) {
  // 1. Use LLM to expand and improve query
  const enhancedQuery = await llmGateway.enhanceQuery(userQuery);
  
  // 2. Execute enhanced searches
  const results = await Promise.all([
    search(enhancedQuery.academic, 'academic', userEmail),
    search(enhancedQuery.code, 'code', userEmail),
    search(enhancedQuery.general, 'general', userEmail)
  ]);
  
  // 3. Use LLM to rank and filter results
  const rankedResults = await llmGateway.rankResults(results, userQuery);
  
  // 4. Auto-save the best results
  await autoSaveTopResults(rankedResults, userEmail);
}
```

**Agent Use Case**: Intelligent search agent that understands user intent, formulates better queries, and automatically curates the most relevant results.

---

## 🥤 Beverages - Utility Functions
*Essential helpers to wash down the main experience*

### Cache Refresher
**GET `/api/search?cacheOnly=true`**
*Check cached results before new searches*

**Agent Use Case**: Efficiency agent that avoids redundant API calls by checking local cache first.

### User Preference Configurator
**User preferences management via database**
*Customize search behavior per user*

**Agent Use Case**: Personalization agent that learns user research patterns and adjusts search strategies accordingly.

### Analytics Sipper
**Search analytics tracking via PostgreSQL**
*Track research productivity metrics*

**Agent Use Case**: Metrics agent that provides insights on research effectiveness and suggests optimizations.

---

## 🍾 Chef's Specials - Advanced Automations
*Premium experiences for sophisticated palates*

### The Research Oracle
*Complete autonomous research assistant*

```typescript
class ResearchOracle {
  async investigateTopic(topic: string, depth: 'shallow' | 'deep' = 'shallow') {
    const userEmail = this.agentEmail;
    
    // Phase 1: Discovery
    const initialResults = await this.comprehensiveSearch(topic, userEmail);
    
    // Phase 2: Analysis  
    const keyFindings = await this.analyzeResults(initialResults);
    
    // Phase 3: Deep Dive (if requested)
    if (depth === 'deep') {
      for (const finding of keyFindings) {
        await this.investigateTopic(finding.relatedTopic, 'shallow');
      }
    }
    
    // Phase 4: Synthesis
    const researchReport = await this.synthesizeFindings(keyFindings);
    
    // Phase 5: Knowledge Management
    await this.organizeAndSave(researchReport, topic, userEmail);
    
    return researchReport;
  }
}
```

### The Citation Machine
*Automatic academic referencing system*

**Agent Use Case**: Academic writing assistant that automatically formats citations, tracks sources, and maintains bibliographies for research documents.

### The Trend Detector
*Pattern recognition across research data*

**Agent Use Case**: Analysis agent that identifies emerging trends by analyzing and correlating research patterns across multiple searches and timeframes.

---

## 🧑‍🍳 Kitchen Instructions - Implementation Guide

### Authentication & User Context
All API calls require `userEmail` parameter for multi-tenant data isolation:
```typescript
const AGENT_EMAIL = 'research-agent@example.com';
// Use this consistently across all API calls
```

### Error Handling
```typescript
try {
  const response = await fetch('/api/search', { /* ... */ });
  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`);
  }
  return await response.json();
} catch (error) {
  // Implement retry logic, fallback strategies
  console.error('Research operation failed:', error);
}
```

### Rate Limiting & Caching
- Search results are automatically cached in Redis
- Check cache before new searches with `cacheOnly=true`
- Implement exponential backoff for external API calls

### Data Flow Architecture
```
[LLM Agent] → [Research API] → [SearXNG/Database] → [Organized Knowledge Base]
     ↓              ↓                 ↓                      ↓
[Intelligence] → [Automation] → [Raw Data] → [Structured Research]
```

---

## 📋 Sample Menu Orders
*Complete meal combinations for common use cases*

### The Academic Researcher Combo
```typescript
const academicWorkflow = async (topic: string) => {
  const collection = await createCollection(topic);
  const papers = await searchAcademic(topic);
  const summaries = await processWithLLM(papers);
  const report = await createDocument(summaries, collection.id);
  return { collection, report, paperCount: papers.length };
};
```

### The Developer Documentation Bundle
```typescript
const devWorkflow = async (technology: string) => {
  const codeResults = await searchCode(technology);
  const documentation = await extractDocumentation(codeResults);
  const examples = await findCodeExamples(technology);
  return await createTechnicalGuide(documentation, examples);
};
```

### The Market Research Feast
```typescript
const marketAnalysis = async (industry: string) => {
  const general = await searchGeneral(`${industry} market trends 2024`);
  const academic = await searchAcademic(`${industry} economic analysis`);
  const insights = await analyzeMarketData([...general, ...academic]);
  return await generateMarketReport(insights);
};
```

---

*Bon Appétit! Your LLM agents are now ready to dine on comprehensive research capabilities. Each API endpoint is a carefully prepared dish, ready to be consumed by intelligent automation workflows.*

**Reservations**: Available 24/7 via HTTP  
**Dress Code**: Valid JSON required  
**Payment**: Rate limits apply, cache generously  
**Chef's Recommendation**: Start with the Research Oracle for a complete experience