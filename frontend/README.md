# Search Archive Frontend

A beautiful SvelteKit frontend for the SearXNG search API, featuring search history stored in Redis.

## Features

- 🔍 **Privacy-first search** powered by SearXNG
- 📝 **Search history** stored in Redis
- 🎨 **Beautiful design** with animated backgrounds and scattered card effects
- 🚀 **Fast and responsive** with SvelteKit
- 💾 **Persistent history** across sessions

## Tech Stack

- **Framework**: SvelteKit
- **Styling**: Tailwind CSS
- **Icons**: Iconify
- **Database**: Redis (for search history)
- **Search API**: SearXNG

## Prerequisites

- Node.js 18+
- Redis server running locally or Railway Redis service

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env` file:

```bash
cp .env.example .env
```

3. Update `.env` with your Redis URL:

```
REDIS_URL=redis://localhost:6379
```

4. Start the development server:

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## Project Structure

```
frontend/
├── src/
│   ├── lib/
│   │   ├── searxng-client.ts    # SearXNG API client
│   │   └── redis-client.ts      # Redis client for history
│   ├── routes/
│   │   ├── api/
│   │   │   ├── search/          # Search API endpoint
│   │   │   └── history/         # Search history API endpoint
│   │   ├── +layout.svelte       # Main layout
│   │   └── +page.svelte         # Main search page
│   └── app.css                  # Global styles
├── .env                         # Environment variables
├── tailwind.config.js          # Tailwind configuration
└── svelte.config.js            # SvelteKit configuration
```

## API Endpoints

### POST /api/search

Perform a search query.

**Request body:**
```json
{
  "query": "search term",
  "engine": "general" | "code" | "academic"
}
```

**Response:**
```json
{
  "query": "search term",
  "number_of_results": 10,
  "results": [...]
}
```

### GET /api/history

Get recent search history.

**Query params:**
- `limit` (optional): Number of results (default: 6)

**Response:**
```json
[
  {
    "id": "search:1234567890:abc",
    "query": "search term",
    "timestamp": 1234567890000,
    "engine": "brave,duckduckgo",
    "resultsCount": 10
  }
]
```

## Search Engines

### General Search
- Brave
- DuckDuckGo
- Startpage

### Code Search
- GitHub
- StackOverflow

### Academic Search
- arXiv
- Semantic Scholar

## Deployment

### Railway

1. Push your code to GitHub
2. Create a new Railway project
3. Add Redis service
4. Link your GitHub repo
5. Set environment variables:
   - `REDIS_URL` (automatically set by Railway)
6. Deploy!

### Environment Variables

- `REDIS_URL`: Redis connection string (required)

## Development

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Design Features

- 🎨 **Animated background** with floating blobs
- 📄 **Paper texture overlay** for depth
- 🃏 **Scattered card layout** with rotation effects
- ✨ **Smooth animations** and hover effects
- 🌊 **Gradient backgrounds** that shift over time

## License

MIT

## Credits

- [SearXNG](https://github.com/searxng/searxng) - Privacy-respecting metasearch engine
- [SvelteKit](https://kit.svelte.dev/) - Web framework
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
