# LLM Gateway - Qwen3.5-4B Inference Server

OpenAI-compatible inference server using Qwen3.5-4B-Instruct model via llama.cpp. Provides the `/v1/chat/completions` endpoint for seamless integration with Zed.dev, SvelteKit apps, and other AI tools.

## Features

- **OpenAI-Compatible API**: Drop-in replacement for OpenAI's chat completions
- **262K Context Window**: Massive context for complex conversations
- **Multimodal Support**: Text, images (base64), and video understanding
- **Streaming & JSON Mode**: Full support for streaming responses and structured output
- **Resource Efficient**: ~3GB model size (Q4_K_M quantization)
- **Dual Mode**: Local development with GPU acceleration or Railway cloud deployment

## Local Development (GPU Accelerated)

### Prerequisites

- **NVIDIA GPU**: ≥6GB VRAM for Q4_K_M quantization
- **CUDA 12.x**: Drivers installed
- **Git** & **Build Tools**: For compiling llama.cpp
- **Disk Space**: ~5GB (llama.cpp build + model)

### Quick Setup

Run the setup script to build llama.cpp and download the model:

```bash
./scripts/setup.sh
```

This will:
1. Clone llama.cpp repository
2. Build with CUDA support (`LLAMA_CUDA=1`)
3. Download Qwen3.5-4B-Instruct-GGUF model (~3GB)

### Start Development Server

```bash
./scripts/dev.sh
```

The server will start at `http://localhost:8080` with:
- Full GPU offload (`-ngl 99`)
- Flash attention enabled
- 262K context window
- Qwen3.5 chat template

### Test the Endpoint

```bash
curl http://localhost:8080/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "qwen3.5-4b",
    "messages": [{"role": "user", "content": "Write a TypeScript fetch wrapper"}],
    "temperature": 0.7,
    "stream": false
  }'
```

### Manual Setup (Alternative)

If you prefer manual setup:

```bash
# Clone and build llama.cpp
git clone https://github.com/ggerganov/llama.cpp
cd llama.cpp
make -j LLAMA_CUDA=1

# Download model
./llama-cli -hf Qwen/Qwen3.5-4B-Instruct-GGUF qwen3.5-4b-instruct-q4_K_M.gguf

# Run server
./llama-server ./qwen3.5-4b-instruct-q4_K_M.gguf \
  --host 127.0.0.1 --port 8080 \
  --ctx-size 262000 \
  -ngl 99 -fa \
  --chat-template qwen3.5
```

## Railway Deployment (CPU)

Deploy to Railway for cloud-based inference. With Railway Pro, this fits well within the 32GB RAM/32 vCPU limits.

### Deploy via Railway CLI

```bash
railway login
railway init
railway up
```

### Environment Variables

Set these in Railway dashboard or via CLI:

```bash
railway variables set PORT=8080
railway variables set HOST=0.0.0.0
```

### Resource Configuration

Recommended Railway settings:
- **RAM**: 8GB (minimum 6GB for stable operation)
- **vCPU**: 4 vCPU
- **Replicas**: Scale based on traffic (1 replica = ~5-15 t/s)

### Railway Endpoint

After deployment, your API will be available at:
```
https://your-app.railway.app/v1/chat/completions
```

### Cost Estimation

- **CPU Performance**: 5-15 tokens/second
- **Throughput**: ~10 requests/second per replica
- **Cost**: ~$20-40/month for moderate traffic
- **Token Cost**: ~$0.05 per 1000 tokens

## Integration

### Zed.dev Configuration

Settings → AI Providers → Custom:

```
Base URL: http://localhost:8080/v1    # Local dev
Base URL: https://your-app.railway.app/v1  # Production
API Key: ollama                        # Dummy key
Default Model: qwen3.5-4b
```

### SvelteKit Integration

```typescript
// src/lib/ai-client.ts
const API_BASE = import.meta.env.DEV 
  ? 'http://localhost:8080/v1'
  : 'https://your-app.railway.app/v1';

async function chat(messages: Array<{role: string, content: string}>) {
  const response = await fetch(`${API_BASE}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'qwen3.5-4b',
      messages,
      temperature: 0.7,
      stream: false
    })
  });
  
  return response.json();
}
```

### OpenAI SDK Compatible

```typescript
import OpenAI from 'openai';

const client = new OpenAI({
  baseURL: 'http://localhost:8080/v1',
  apiKey: 'ollama' // Dummy key
});

const completion = await client.chat.completions.create({
  model: 'qwen3.5-4b',
  messages: [{ role: 'user', content: 'Hello!' }]
});
```

## API Reference

### POST /v1/chat/completions

OpenAI-compatible chat completions endpoint.

**Request Body:**
```json
{
  "model": "qwen3.5-4b",
  "messages": [
    {"role": "system", "content": "You are a helpful assistant."},
    {"role": "user", "content": "Hello!"}
  ],
  "temperature": 0.7,
  "max_tokens": 2048,
  "stream": false,
  "response_format": { "type": "json_object" }
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
      "content": "Hello! How can I help you today?"
    },
    "finish_reason": "stop"
  }],
  "usage": {
    "prompt_tokens": 10,
    "completion_tokens": 20,
    "total_tokens": 30
  }
}
```

## Performance

### Local Development (RTX 3060+)
- **Speed**: 30-60 tokens/second
- **VRAM Usage**: 3-4GB
- **Latency**: <100ms first token

### Railway (CPU-only)
- **Speed**: 5-15 tokens/second
- **RAM Usage**: 4-6GB
- **Latency**: 200-500ms first token
- **Scaling**: Horizontal replicas for high QPS

## Monitoring

### Railway Dashboard

Monitor replica metrics:
- CPU utilization
- Memory usage
- Request rate
- Response times

### Scaling Guidelines

- **1 replica**: Development/low traffic
- **2-3 replicas**: Moderate traffic (10-30 req/s)
- **5+ replicas**: High traffic (50+ req/s)

## Troubleshooting

### CUDA Out of Memory
```bash
# Reduce GPU layers
-ngl 50  # Instead of 99

# Reduce context size
--ctx-size 131072  # Instead of 262000
```

### Model Not Found
```bash
# Re-download model
./scripts/setup.sh --force
```

### Slow Inference (Railway)
- Increase vCPU allocation
- Add replicas for horizontal scaling
- Reduce max_tokens in requests

## Project Structure

```
llm-gateway/
├── Dockerfile           # Railway deployment
├── package.json         # NPM scripts
├── scripts/
│   ├── setup.sh        # Build llama.cpp + download model
│   └── dev.sh          # Run local dev server
├── src/                # TypeScript utilities (optional)
├── llama.cpp/          # Cloned repository (gitignored)
└── models/             # Downloaded GGUF models (gitignored)
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `8080` | Server port |
| `HOST` | `127.0.0.1` (local) / `0.0.0.0` (Railway) | Bind address |
| `MODEL_PATH` | `./models/qwen3.5-4b-instruct-q4_K_M.gguf` | GGUF model path |
| `CTX_SIZE` | `262000` | Context window size |
| `GPU_LAYERS` | `99` (local) / `0` (Railway) | GPU offload layers |

## License

Model: Qwen3.5-4B-Instruct - Apache 2.0
Server: llama.cpp - MIT

## Resources

- [Qwen3.5 Model Card](https://huggingface.co/Qwen/Qwen3.5-4B-Instruct)
- [llama.cpp Documentation](https://github.com/ggerganov/llama.cpp)
- [Railway Documentation](../.agents/skills/railway-docs/SKILL.md)