#!/bin/bash
# Development server script for Qwen3.5-4B using llama.cpp
# Run this script to start the local inference server with GPU acceleration

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"

# Load environment variables from .env if it exists
if [ -f "$PROJECT_ROOT/.env" ]; then
    echo -e "${GREEN}Loading environment variables from .env${NC}"
    export $(cat "$PROJECT_ROOT/.env" | grep -v '^#' | xargs)
fi

# Configuration with defaults
HOST=${HOST:-127.0.0.1}
PORT=${PORT:-8080}
MODEL_NAME=${MODEL_NAME:-qwen3.5-4b}
CONTEXT_SIZE=${CONTEXT_SIZE:-262000}
GPU_LAYERS=${GPU_LAYERS:-99}
THREADS=${THREADS:-4}
BATCH_SIZE=${BATCH_SIZE:-512}

# Paths
LLAMA_CPP_DIR="$PROJECT_ROOT/llama.cpp"
LLAMA_SERVER="$LLAMA_CPP_DIR/llama-server"
MODELS_DIR="$PROJECT_ROOT/models"
MODEL_FILE="${HUGGINGFACE_FILE:-qwen3.5-4b-instruct-q4_K_M.gguf}"
MODEL_PATH="$MODELS_DIR/$MODEL_FILE"

# Check if llama.cpp exists
if [ ! -d "$LLAMA_CPP_DIR" ]; then
    echo -e "${RED}Error: llama.cpp not found at $LLAMA_CPP_DIR${NC}"
    echo -e "${YELLOW}Please run './scripts/setup.sh' first to build llama.cpp and download the model${NC}"
    exit 1
fi

# Check if llama-server binary exists
if [ ! -f "$LLAMA_SERVER" ]; then
    echo -e "${RED}Error: llama-server binary not found at $LLAMA_SERVER${NC}"
    echo -e "${YELLOW}Please run './scripts/setup.sh' to build llama.cpp${NC}"
    exit 1
fi

# Check if model exists
if [ ! -f "$MODEL_PATH" ]; then
    echo -e "${RED}Error: Model not found at $MODEL_PATH${NC}"
    echo -e "${YELLOW}Please run './scripts/setup.sh' to download the model${NC}"
    exit 1
fi

# Create logs directory
mkdir -p "$PROJECT_ROOT/logs"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Starting Qwen3.5-4B Development Server${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Model:${NC} $MODEL_NAME"
echo -e "${GREEN}Model Path:${NC} $MODEL_PATH"
echo -e "${GREEN}Host:${NC} $HOST"
echo -e "${GREEN}Port:${NC} $PORT"
echo -e "${GREEN}Context Size:${NC} $CONTEXT_SIZE tokens"
echo -e "${GREEN}GPU Layers:${NC} $GPU_LAYERS"
echo -e "${GREEN}Threads:${NC} $THREADS"
echo -e "${GREEN}Batch Size:${NC} $BATCH_SIZE"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${YELLOW}API Endpoint:${NC} http://$HOST:$PORT/v1/chat/completions"
echo -e "${YELLOW}Press Ctrl+C to stop the server${NC}"
echo ""

# Start the llama.cpp server
# Options explained:
# --host: Bind to this address (127.0.0.1 for local dev)
# --port: Listen on this port
# --ctx-size: Context window size (262K for Qwen3.5)
# -ngl: Number of GPU layers to offload (99 = all layers)
# -fa: Flash attention for faster inference
# --chat-template: Use Qwen3.5 chat template
# -c: Context size (same as --ctx-size)
# -b: Batch size for processing
# -t: Number of threads
# --log-disable: Disable logging to file (use stdout instead)

exec "$LLAMA_SERVER" "$MODEL_PATH" \
  --host "$HOST" \
  --port "$PORT" \
  --ctx-size "$CONTEXT_SIZE" \
  -ngl "$GPU_LAYERS" \
  -fa \
  --chat-template qwen3.5 \
  -b "$BATCH_SIZE" \
  -t "$THREADS" \
  --metrics \
  2>&1 | tee "$PROJECT_ROOT/logs/server-$(date +%Y%m%d-%H%M%S).log"
