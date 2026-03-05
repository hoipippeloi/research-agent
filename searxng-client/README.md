# SearXNG API Client

A client library for interacting with the SearXNG search API deployed on Railway.

## API Endpoint

**Base URL**: `https://searxng-production-b099.up.railway.app`

## Features

- Privacy-respecting metasearch engine
- Aggregates results from multiple sources
- JSON API optimized for LLM and backend integration
- Supports multiple search engines
- Rate limiting disabled for private use

## Available Search Engines

### General
- **Brave** - Privacy-focused search
- **DuckDuckGo** - Privacy-focused search
- **Startpage** - Google results with privacy

### Code & Development
- **GitHub** - Code repositories
- **StackOverflow** - Q&A for developers

### Academic
- **arXiv** - Scientific papers
- **Semantic Scholar** - Academic research

## Installation

### Python

```bash
pip install requests
```

### JavaScript/TypeScript

```bash
npm install axios
# or
yarn add axios
```

## Usage Examples

### Python

```python
from searxng_client import SearXNGClient

# Initialize client
client = SearXNGClient()

# General search
results = client.search_general("machine learning frameworks")
print(f"Found {len(results['results'])} results")
for result in results['results'][:3]:
    print(f"- {result['title']}: {result['url']}")

# Code search
results = client.search_code("python async await")
for result in results['results']:
    print(f"- {result['title']}")

# Academic search
results = client.search_academic("neural networks attention mechanism")
for result in results['results']:
    print(f"- {result['title']}")

# Custom search with specific engines
results = client.search("openai gpt", engines=["brave", "github"])
print(results)

# Get search suggestions
suggestions = client.get_suggestions("python")
print(suggestions)
```

### JavaScript/TypeScript

```javascript
const { SearXNGClient } = require('./searxng-client');

// Initialize client
const client = new SearXNGClient();

// General search
const results = await client.searchGeneral('machine learning frameworks');
console.log(`Found ${results.results.length} results`);
results.results.slice(0, 3).forEach(result => {
    console.log(`- ${result.title}: ${result.url}`);
});

// Code search
const codeResults = await client.searchCode('python async await');
codeResults.results.forEach(result => {
    console.log(`- ${result.title}`);
});

// Academic search
const academicResults = await client.searchAcademic('neural networks attention mechanism');
academicResults.results.forEach(result => {
    console.log(`- ${result.title}`);
});

// Custom search with specific engines
const customResults = await client.search('openai gpt', {
    engines: ['brave', 'github']
});
console.log(customResults);

// Get search suggestions
const suggestions = await client.getSuggestions('python');
console.log(suggestions);
```

### TypeScript

```typescript
import { SearXNGClient, SearchResponse } from './searxng-client';

const client = new SearXNGClient();

// Type-safe search
const results: SearchResponse = await client.searchGeneral('typescript best practices');

results.results.forEach((result) => {
    console.log(`${result.title} - ${result.url}`);
});
```

## API Reference

### Constructor

#### Python
```python
SearXNGClient(base_url="https://searxng-production-b099.up.railway.app")
```

#### JavaScript/TypeScript
```javascript
new SearXNGClient(baseUrl = 'https://searxng-production-b099.up.railway.app')
```

### Methods

#### `search(query, options)`

Perform a search query with custom options.

**Parameters:**
- `query` (string): The search query
- `options` (object, optional):
  - `engines` (string[]): List of search engines to use
  - `categories` (string[]): List of categories
  - `pageno` (number): Page number for pagination (default: 1)
  - `timeRange` (string): Time range filter ("day", "week", "month", "year")
  - `format` (string): Response format (default: "json")

**Returns:** Promise<Object> - Search results

#### `searchGeneral(query)`

Search using general search engines (Brave, DuckDuckGo, Startpage).

#### `searchCode(query)`

Search for code-related results using GitHub and StackOverflow.

#### `searchAcademic(query)`

Search for academic papers using arXiv and Semantic Scholar.

#### `getSuggestions(query)`

Get search suggestions for a partial query.

## Direct API Usage

You can also make direct HTTP requests to the API:

### Basic Search

```bash
curl "https://searxng-production-b099.up.railway.app/search?q=python+async&format=json"
```

### Search with Specific Engines

```bash
curl "https://searxng-production-b099.up.railway.app/search?q=machine+learning&format=json&engines=arxiv,github"
```

### Search with Time Range

```bash
curl "https://searxng-production-b099.up.railway.app/search?q=latest+news&format=json&time_range=day"
```

### Get Suggestions

```bash
curl "https://searxng-production-b099.up.railway.app/autocompleter?q=python"
```

## Response Format

### Search Response

```json
{
  "query": "python async",
  "number_of_results": 10,
  "results": [
    {
      "template": "default.html",
      "url": "https://example.com",
      "title": "Example Result",
      "content": "Result description...",
      "publishedDate": null,
      "thumbnail": "",
      "engine": "brave",
      "parsed_url": ["https", "example.com", "/", "", "", ""],
      "img_src": "",
      "priority": "",
      "engines": ["brave", "startpage"],
      "positions": [1, 1],
      "score": 8.4
    }
  ]
}
```

### Suggestions Response

```json
{
  "suggestions": ["python tutorial", "python async", "python requests"]
}
```

## Railway Configuration

### Environment Variables

The following environment variables are configured in Railway:

- `SEARXNG_SECRET_KEY`: Secret key for the instance
- `SEARXNG_REDIS_URL`: Redis connection string for caching

### Services

- **SearXNG**: Main search service
- **Redis**: Caching layer for improved performance

### Project Details

- **Project ID**: `cd9a0bf3-1ada-4187-968f-ccd9f971ff8e`
- **Environment**: `production`
- **Deploy URL**: https://railway.com/deploy/searxng-api

## Testing

### Python

```bash
python searxng-client/searxng_client.py
```

### JavaScript

```bash
node searxng-client/searxng-client.js
```

## Rate Limits

Rate limiting is disabled on this private instance. However, please be respectful of the underlying search engines and avoid excessive requests.

## Privacy

SearXNG is designed with privacy in mind:
- No tracking or profiling
- No user data collection
- Results aggregated from multiple sources
- Your queries are not stored

## Support

For issues or questions:
- Railway Project: https://railway.com/project/cd9a0bf3-1ada-4187-968f-ccd9f971ff8e
- SearXNG Documentation: https://docs.searxng.org/
- SearXNG GitHub: https://github.com/searxng/searxng

## License

This client library is provided as-is for use with your SearXNG deployment on Railway.
