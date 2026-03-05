# AGENTS.md for LLM Gateway

Qwen3.5-4B inference server providing OpenAI-compatible API via llama.cpp. Supports both local GPU development and Railway CPU deployment.

## Development Environment

### Prerequisites

#### Local Development (GPU)
- **NVIDIA GPU**: ≥6GB VRAM (RTX 3060 or better)
- **CUDA 12.x**: NVIDIA drivers installed
- **Git** & **Build Tools**: Compiler toolchain
- **Disk Space**: ~5GB (llama.cpp + model)

#### Railway Deployment
- Railway account (Pro recommended for 8GB+ RAM)
- Docker support enabled

### Initial Setup

#### Windows Setup
```powershell
cd llm-gateway
npm run setup:win
# or
.\scripts\setup.ps1
```

#### Linux/macOS Setup
```bash
cd llm-gateway
npm run setup
# or
./scripts/setup.sh
```

This will:
1. Clone llama.cpp repository
2. Build with CUDA support (or CPU-only if CUDA unavailable)
3. Download Qwen3.5-4B-Instruct-GGUF model (~3GB)

### Environment Variables

Create `.env` file (use `.env.example` as template):

```bash
# Server Configuration
HOST=127.0.0.1
PORT=8080

# Model Configuration
MODEL_NAME=qwen3.5-4b
MODEL_PATH=./models/qwen3.5-4b-instruct-q4_K_M.gguf
CONTEXT_SIZE=262000

# GPU Configuration (local dev)
GPU_LAYERS=99

# Railway-specific (auto-configured)
RAILWAY_ENVIRONMENT=development
```

## Commands & Workflows

### Development

```bash
# Start development server (Windows)
npm run dev:win
# or
.\scripts\dev.ps1

# Start development server (Linux/macOS)
npm run dev
# or
./scripts/dev.sh

# Test endpoint (Windows)
.\test-endpoint.ps1

# Test endpoint (Linux/macOS)
./test-endpoint.sh

# Type checking
npm run typecheck
```

### Docker Operations

```bash
# Build Docker image locally
docker build -t llm-gateway:local .

# Run Docker container locally (CPU-only)
docker run -p 8080:8080 llm-gateway:local

# Run with custom configuration
docker run -p 8080:8080 \
  -e CONTEXT_SIZE=131072 \
  -e THREADS=8 \
  llm-gateway:local
```

### Railway Deployment

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Initialize project (first time)
railway init

# Deploy to Railway
railway up

# View logs
railway logs

# Open Railway dashboard
railway open

# Set environment variables
railway variables set PORT=8080
railway variables set CONTEXT_SIZE=262000
```

### Cleanup

```bash
# Remove build artifacts and downloads
npm run clean
# or
rm -rf dist models llama.cpp
```

## Role

You are a DevOps/ML engineer responsible for:
- Maintaining the LLM inference server
- Optimizing model performance (GPU/CPU)
- Managing Railway deployments
- Ensuring API compatibility with OpenAI spec
- Monitoring resource usage and scaling

## Scope of Responsibility

### ✅ Modify
- `scripts/` - Setup and development scripts
- `Dockerfile` - Railway deployment configuration
- `railway.toml` - Railway service configuration
- `src/` - TypeScript client wrappers (optional)
- `.env.example` - Environment variable templates

### ❌ Avoid
- `llama.cpp/` - Cloned repository (gitignored)
- `models/` - Downloaded GGUF files (gitignored)
- `.env` - Local environment secrets
- Direct model file modifications

## Architecture

### Component Overview

```
┌─────────────────────────────────────────────┐
│         Client Application                  │
│    (SvelteKit / Zed.dev / Custom)          │
└─────────────────┬───────────────────────────┘
                  │
                  │ HTTP POST /v1/chat/completions
                  │
┌─────────────────▼───────────────────────────┐
│       llama.cpp Server                      │
│  (llama-server or llama-server.exe)        │
│                                             │
│  - OpenAI-compatible API                   │
│  - Streaming support                       │
│  - Qwen3.5 chat template                   │
└─────────────────┬───────────────────────────┘
                  │
                  │ Model Inference
                  │
┌─────────────────▼───────────────────────────┐
│    Qwen3.5-4B-Instruct (Q4_K_M)            │
│         (~3GB GGUF file)                    │
│                                             │
│  - 262K context window                     │
│  - Multimodal (text/image/video)           │
│  - Optimized for code & reasoning          │
└─────────────────────────────────────────────┘
```

### Request Flow

1. **Client** sends OpenAI-format request to `/v1/chat/completions`
2. **llama-server** processes request with Qwen3.5 template
3. **Model** generates response (streaming or non-streaming)
4. **Server** returns OpenAI-compatible response
5. **Client** receives completion with usage stats

## API Reference

### POST /v1/chat/completions

OpenAI-compatible chat completions endpoint.

**Request:**
```json
{
  "model": "qwen3.5-4b",
  "messages": [
    {"role": "system", "content": "You are a helpful coding assistant."},
    {"role": "user", "content": "Write a TypeScript function"}
  ],
  "temperature": 0.7,
  "max_tokens": 2048,
  "stream": false,
  "response_format": {"type": "json_object"}
}
```

**Response:**
```json
{
  "id": "chatcmpl-123",
  "object": "chat.completion",
  "created": 1699000000,
  "model": "qwen3.5-4b",
  "choices": [{
    "index": 0,
    "message": {
      "role": "assistant",
      "content": "Here's a TypeScript function..."
    },
    "finish_reason": "stop"
  }],
  "usage": {
    "prompt_tokens": 25,
    "completion_tokens": 150,
    "total_tokens": 175
  }
}
```

### GET /health

Health check endpoint (if configured).

**Response:**
```json
{
  "status": "healthy",
  "model": "qwen3.5-4b",
  "uptime": 3600
}
```

### GET /v1/models

List available models (if supported).

**Response:**
```json
{
  "object": "list",
  "data": [{
    "id": "qwen3.5-4b",
    "object": "model",
    "created": 1699000000,
    "owned_by": "qwen"
  }]
}
```

## Testing

### Manual Testing

```bash
# Basic test
curl http://localhost:8080/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "qwen3.5-4b",
    "messages": [{"role": "user", "content": "Hello"}],
    "max_tokens": 50
  }'

# Streaming test
curl http://localhost:8080/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "qwen3.5-4b",
    "messages": [{"role": "user", "content": "Count to 10"}],
    "stream": true
  }'
```

### Automated Testing

Run the comprehensive test suite:

```bash
# Windows
.\test-endpoint.ps1 -BaseUrl "http://localhost:8080"

# Linux/macOS
./test-endpoint.sh http://localhost:8080

# Test production deployment
.\test-endpoint.ps1 -BaseUrl "https://your-app.railway.app"
```

## Integration Patterns

### SvelteKit Integration

```typescript
// src/lib/server/llm-client.ts
const LLM_BASE_URL = import.meta.env.DEV 
  ? 'http://localhost:8080/v1'
  : process.env.LLM_GATEWAY_URL || 'https://your-app.railway.app/v1';

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export async function generateCompletion(
  messages: ChatMessage[],
  options: {
    temperature?: number;
    max_tokens?: number;
    stream?: boolean;
  } = {}
) {
  const response = await fetch(`${LLM_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'qwen3.5-4b',
      messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.max_tokens ?? 2048,
      stream: options.stream ?? false
    })
  });

  if (!response.ok) {
    throw new Error(`LLM request failed: ${response.statusText}`);
  }

  return response.json();
}
```

### OpenAI SDK Compatible

```typescript
import OpenAI from 'openai';

const client = new OpenAI({
  baseURL: process.env.LLM_GATEWAY_URL || 'http://localhost:8080/v1',
  apiKey: 'ollama' // Dummy key (not validated)
});

// Use exactly like OpenAI API
const completion = await client.chat.completions.create({
  model: 'qwen3.5-4b',
  messages: [{ role: 'user', content: 'Hello!' }],
  stream: true
});

for await (const chunk of completion) {
  process.stdout.write(chunk.choices[0]?.delta?.content || '');
}
```

## Performance Optimization

### Local Development (GPU)

**Optimal Settings:**
```bash
./llama-server model.gguf \
  --host 127.0.0.1 --port 8080 \
  --ctx-size 262000 \
  -ngl 99 \           # Full GPU offload
  -fa \                # Flash attention
  -b 512 \             # Batch size
  -t 4 \               # Threads (for CPU fallback)
  --chat-template qwen3.5
```

**Performance:**
- **Speed**: 30-60 tokens/second
- **VRAM**: 3-4GB
- **Latency**: <100ms first token

**Troubleshooting:**
```bash
# CUDA out of memory
-ngl 50  # Reduce GPU layers

# Reduce context window
--ctx-size 131072  # 128K instead of 262K
```

### Railway Deployment (CPU)

**Optimal Settings:**
```bash
# In railway.toml or environment
THREADS=4
BATCH_SIZE=512
CONTEXT_SIZE=262000
GPU_LAYERS=0
```

**Performance:**
- **Speed**: 5-15 tokens/second
- **RAM**: 4-6GB
- **Latency**: 200-500ms first token

**Scaling Guidelines:**
- **1 replica**: Development/low traffic (5-15 t/s)
- **2-3 replicas**: Moderate traffic (10-30 req/s)
- **5+ replicas**: High traffic (50+ req/s)

**Resource Allocation:**
```toml
# railway.toml
[deploy]
# Minimum viable
memory = "6GB"
cpu = "2"

# Recommended
memory = "8GB"
cpu = "4"

# High performance
memory = "16GB"
cpu = "8"
```

## Monitoring & Observability

### Railway Dashboard Metrics

Monitor these key metrics:
- **CPU Utilization**: Should stay below 80%
- **Memory Usage**: Should stay below 80% of allocated
- **Request Rate**: Requests per second
- **Response Time**: P50, P95, P99 latencies

### Logging

Server logs are automatically captured by Railway. View with:
```bash
railway logs
railway logs --tail  # Follow logs in real-time
```

### Health Checks

Railway performs automatic health checks:
```toml
# railway.toml
[services.healthcheck]
path = "/health"
interval = 30
timeout = 10
retries = 3
startPeriod = 60
```

## Security Best Practices

### API Authentication (Optional)

Add API key validation:

```dockerfile
# In Dockerfile CMD
CMD ["sh", "-c", "llama-server ${MODEL_PATH} \
    --host ${HOST} --port ${PORT} \
    --api-key ${API_KEY} \
    ..."]
```

```bash
# In Railway
railway variables set API_KEY="your-secret-key-here"
```

```typescript
// In client
const response = await fetch(url, {
  headers: {
    'Authorization': `Bearer ${process.env.LLM_API_KEY}`
  }
});
```

### Network Security

- **Local dev**: Binds to `127.0.0.1` (localhost only)
- **Railway**: Binds to `0.0.0.0` (required for Railway)
- **HTTPS**: Automatically provided by Railway
- **CORS**: Configure in llama-server if needed

## Common Tasks

### Update Model Version

```bash
# Download new model version
cd llm-gateway
huggingface-cli download Qwen/Qwen3.5-4B-Instruct-GGUF \
  qwen3.5-4b-instruct-q5_K_M.gguf \
  --local-dir ./models

# Update .env
MODEL_PATH=./models/qwen3.5-4b-instruct-q5_K_M.gguf

# Restart server
./scripts/dev.sh
```

### Rebuild llama.cpp

```bash
# Force rebuild
./scripts/setup.sh --force

# Or manually
rm -rf llama.cpp
git clone https://github.com/ggerganov/llama.cpp
cd llama.cpp
make LLAMA_CUDA=1  # or LLAMA_NO_ACCELERATE=1 for CPU
```

### Scale on Railway

```bash
# Via CLI
railway scale --replicas 3

# Or in railway.toml
[[services.autoscaling]]
minReplicas = 1
maxReplicas = 5

[[services.autoscaling.metrics]]
type = "CPU"
target = 70
```

### Debug Inference Issues

```bash
# Enable verbose logging
./llama-server model.gguf \
  --log-disable false \
  --verbose \
  ...

# Check model loading
./llama-cli -m model.gguf -p "test" --verbose

# Monitor GPU usage (local)
nvidia-smi -l 1
```

## Troubleshooting

### Common Issues

#### Model Not Found
```
Error: Model not found at ./models/qwen3.5-4b-instruct-q4_K_M.gguf
```
**Solution:**
```bash
./scripts/setup.sh  # Re-download model
# Or manually
huggingface-cli download Qwen/Qwen3.5-4B-Instruct-GGUF \
  qwen3.5-4b-instruct-q4_K_M.gguf --local-dir ./models
```

#### CUDA Out of Memory
```
CUDA error: out of memory
```
**Solution:**
```bash
# Reduce GPU layers in .env
GPU_LAYERS=50  # Instead of 99

# Or reduce context size
CONTEXT_SIZE=131072  # 128K instead of 262K
```

#### Slow Inference (Railway)
```
Token generation: 2-3 t/s (too slow)
```
**Solution:**
```bash
# Increase resources in Railway dashboard
# Or add replicas for horizontal scaling
railway scale --replicas 3

# Reduce context size if not needed
CONTEXT_SIZE=131072
```

#### Server Won't Start
```
Error: Address already in use
```
**Solution:**
```bash
# Kill existing process on port 8080
# Windows
netstat -ano | findstr :8080
taskkill /PID <PID> /F

# Linux/macOS
lsof -ti:8080 | xargs kill -9

# Or use different port
PORT=9000 ./scripts/dev.sh
```

#### Docker Build Fails
```
Error: failed to solve: process "/bin/sh -c ..." did not complete successfully
```
**Solution:**
```bash
# Clear Docker cache
docker system prune -a

# Rebuild with no cache
docker build --no-cache -t llm-gateway:local .

# Check available disk space (needs ~10GB)
df -h
```

### Performance Issues

#### High Latency
- **Local**: Check GPU utilization with `nvidia-smi`
- **Railway**: Increase CPU allocation or add replicas
- **Both**: Reduce `max_tokens` in requests

#### Low Throughput
- **Local**: Increase batch size (`-b 1024`)
- **Railway**: Scale horizontally with more replicas
- **Both**: Use streaming for better perceived performance

#### Memory Leaks
- Monitor memory usage over time
- Restart server periodically if needed
- Check for unclosed connections in client code

## Change Management

### Update llama.cpp Version

```bash
cd llama.cpp
git pull origin main
make clean
make LLAMA_CUDA=1  # or LLAMA_NO_ACCELERATE=1
cd ..
```

### Modify Server Configuration

1. Edit `.env` file with new settings
2. Restart server: `./scripts/dev.sh`
3. Test endpoint: `./test-endpoint.sh`
4. Update `railway.toml` for production
5. Deploy: `railway up`

### Add New Model

1. Download new GGUF model to `models/` directory
2. Update `MODEL_PATH` in `.env`
3. Update `Dockerfile` if deploying to Railway
4. Test thoroughly before deploying

## Boundaries & Prohibitions

### ❌ NEVER
- Commit `.env` files or API keys
- Commit `models/` directory (large GGUF files)
- Commit `llama.cpp/` directory (cloned repo)
- Use `any` type in TypeScript code
- Skip testing endpoint after configuration changes
- Deploy untested changes to production
- Expose local server to public internet (0.0.0.0 in dev)
- Ignore CUDA out of memory errors

### ✅ ALWAYS
- Use `.env.example` as template for new environments
- Test endpoint after server startup
- Monitor resource usage on Railway
- Use non-root user in Docker (already configured)
- Document configuration changes in README
- Version pin critical dependencies
- Use health checks in production
- Set appropriate timeouts for client requests

## Resources & Documentation

### External Links
- [llama.cpp GitHub](https://github.com/ggerganov/llama.cpp)
- [Qwen3.5 Model Card](https://huggingface.co/Qwen/Qwen3.5-4B-Instruct)
- [Railway Documentation](https://docs.railway.app/)
- [OpenAI API Reference](https://platform.openai.com/docs/api-reference/chat)

### Internal References
- [Root AGENTS.md](../AGENTS.md) - Main project guidelines
- [Railway Skill](../.agents/skills/railway-docs/SKILL.md) - Deployment guide
- [TDD Workflow](../.agents/skills/tdd-workflow/SKILL.md) - Testing methodology

## Quick Reference

### File Structure
```
llm-gateway/
├── Dockerfile           # Railway deployment
├── railway.toml         # Railway configuration
├── package.json         # NPM scripts
├── tsconfig.json        # TypeScript config
├── .env.example         # Environment template
├── scripts/
│   ├── setup.sh        # Linux/macOS setup
│   ├── setup.ps1       # Windows setup
│   ├── dev.sh          # Linux/macOS dev server
│   └── dev.ps1         # Windows dev server
├── test-endpoint.sh    # Linux/macOS testing
├── test-endpoint.ps1   # Windows testing
├── llama.cpp/          # Cloned repo (gitignored)
├── models/             # GGUF models (gitignored)
└── src/                # TypeScript utilities (optional)
```

### Essential Commands
```bash
# Setup
npm run setup          # Linux/macOS
npm run setup:win      # Windows

# Development
npm run dev            # Linux/macOS
npm run dev:win        # Windows

# Testing
./test-endpoint.sh     # Linux/macOS
.\test-endpoint.ps1    # Windows

# Deployment
railway up             # Deploy to Railway
railway logs           # View logs

# Cleanup
npm run clean          # Remove build artifacts
```

### Environment Variables
| Variable | Default | Description |
|----------|---------|-------------|
| `HOST` | `127.0.0.1` (local) / `0.0.0.0` (Railway) | Server bind address |
| `PORT` | `8080` | Server port |
| `MODEL_PATH` | `./models/qwen3.5-4b-instruct-q4_K_M.gguf` | GGUF model file path |
| `CONTEXT_SIZE` | `262000` | Context window size |
| `GPU_LAYERS` | `99` (local) / `0` (Railway) | GPU offload layers |
| `THREADS` | `4` | CPU threads |
| `BATCH_SIZE` | `512` | Processing batch size |

**Remember**: This gateway provides a production-ready LLM inference server. Always test thoroughly before deploying changes, and monitor resource usage to ensure optimal performance.