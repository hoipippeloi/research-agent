# Research Agent

A powerful research agent application with integrated metasearch capabilities powered by SearXNG.

## 🏗️ Project Structure

This is a monorepo containing multiple services:

```
research-agent/
├── apps/
│   ├── api/              # Main research agent API
│   └── searxng/          # Custom SearXNG instance with JSON API enabled
├── packages/             # Shared packages and utilities
├── docker-compose.yml    # Local development orchestration
└── railway.toml         # Railway deployment configuration
```

## 🚀 Features

- **Custom SearXNG Instance**: Privacy-respecting metasearch engine with JSON API enabled
- **Research Agent API**: Main application for intelligent research automation
- **Monorepo Architecture**: Easily manage multiple services in one repository
- **Railway Deployment**: One-click deployment to Railway.app

## 📦 Services

### SearXNG (apps/searxng)

A customized SearXNG instance with:
- JSON API format enabled
- CSV and RSS formats enabled
- All default search engines configured
- Optimized for API consumption

**API Endpoint**: `https://searxng-production-1797.up.railway.app/search`

**Usage Example**:
```bash
# JSON API
curl 'https://searxng-production-1797.up.railway.app/search?q=your+query&format=json'

# CSV format
curl 'https://searxng-production-1797.up.railway.app/search?q=your+query&format=csv'

# RSS feed
curl 'https://searxng-production-1797.up.railway.app/search?q=your+query&format=rss'
```

### Research Agent API (apps/api)

Main application service (coming soon):
- Intelligent query processing
- Multi-source research aggregation
- Result analysis and summarization

## 🛠️ Development Setup

### Prerequisites

- Docker and Docker Compose
- Node.js 18+ (for API development)
- Railway CLI (`npm install -g @railway/cli`)

### Local Development

1. **Clone the repository**:
   ```bash
   git clone https://github.com/hoipippeloi/research-agent.git
   cd research-agent
   ```

2. **Start services locally**:
   ```bash
   docker-compose up -d
   ```

3. **Access services**:
   - SearXNG: http://localhost:8888
   - API: http://localhost:3000

### Testing SearXNG JSON API

Test the JSON API locally:
```bash
curl 'http://localhost:8888/search?q=test&format=json' | jq
```

## 🚢 Deployment

### Railway Deployment

This project is configured for Railway deployment:

1. **Install Railway CLI**:
   ```bash
   npm install -g @railway/cli
   ```

2. **Login to Railway**:
   ```bash
   railway login
   ```

3. **Link to your Railway project**:
   ```bash
   railway link
   ```

4. **Deploy services**:
   ```bash
   railway up
   ```

### Environment Variables

Set these environment variables in Railway:

**SearXNG Service**:
- `SEARXNG_BASE_URL`: Your Railway domain
- `SEARXNG_SECRET`: A secure secret key
- `SEARXNG_LIMITER`: `false` (for development)

**API Service**:
- `SEARXNG_URL`: URL of your SearXNG instance
- `NODE_ENV`: `production`

## 📚 API Documentation

### SearXNG Search API

**Endpoint**: `/search`

**Parameters**:
- `q` (required): Search query
- `format`: Response format (`html`, `json`, `csv`, `rss`)
- `categories`: Search categories (comma-separated)
- `engines`: Specific search engines to use (comma-separated)
- `language`: Language code for results
- `pageno`: Page number (default: 1)
- `time_range`: Time filter (`day`, `month`, `year`)

**Example Request**:
```bash
curl 'https://searxng-production-1797.up.railway.app/search?q=artificial+intelligence&format=json&categories=general'
```

**Response** (JSON format):
```json
{
  "query": "artificial intelligence",
  "number_of_results": 100,
  "results": [
    {
      "title": "Result Title",
      "url": "https://example.com",
      "content": "Result snippet...",
      "engine": "google",
      "engines": ["google", "bing"],
      "parsed_url": ["https", "example.com", "/", "", ""]
    }
  ]
}
```

## 🔧 Configuration

### Custom SearXNG Settings

The SearXNG instance is configured via `apps/searxng/settings.yml`. Key configurations:

```yaml
use_default_settings: true

search:
  formats:
    - html
    - json    # API format enabled
    - csv     # CSV export enabled
    - rss     # RSS feed enabled
```

To modify SearXNG settings:
1. Edit `apps/searxng/settings.yml`
2. Rebuild the Docker image
3. Redeploy to Railway

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [SearXNG](https://github.com/searxng/searxng) - Privacy-respecting metasearch engine
- [Railway](https://railway.app) - Deployment platform

## 📧 Contact

Your Name - [@hoipippeloi](https://github.com/hoipippeloi)

Project Link: [https://github.com/hoipippeloi/research-agent](https://github.com/hoipippeloi/research-agent)