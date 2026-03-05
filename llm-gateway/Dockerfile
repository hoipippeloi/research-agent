# Qwen3.5-4B LLM Gateway Dockerfile for Railway Deployment
# CPU-only inference server with OpenAI-compatible API

# ============================================
# Stage 1: Build llama.cpp
# ============================================
FROM ubuntu:24.04 AS builder

# Avoid interactive prompts during package installation
ENV DEBIAN_FRONTEND=noninteractive

# Install build dependencies
RUN apt-get update && apt-get install -y \
    git \
    build-essential \
    cmake \
    python3 \
    python3-pip \
    python3-venv \
    wget \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Create virtual environment and install huggingface-hub
RUN python3 -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"
RUN pip install --no-cache-dir huggingface-hub

# Clone llama.cpp
WORKDIR /build
RUN git clone https://github.com/ggerganov/llama.cpp.git

# Build llama.cpp with CPU-only support (no GPU acceleration for Railway)
WORKDIR /build/llama.cpp
RUN cmake -B build \
    -DCMAKE_BUILD_TYPE=Release \
    -DBUILD_SHARED_LIBS=OFF \
    -DLLAMA_NATIVE=OFF \
    -DLLAMA_NO_ACCELERATE=ON \
    -DLLAMA_CUDA=OFF \
    && cmake --build build --config Release -j$(nproc) \
    && cp build/bin/llama-server /usr/local/bin/ \
    && cp build/bin/llama-cli /usr/local/bin/

# Download Qwen3.5-4B GGUF model from unsloth (optimized Dynamic 2.0 quantization)
# Using wget for reliable downloads in Railway's build environment
WORKDIR /models
RUN wget -q https://huggingface.co/unsloth/Qwen3.5-4B-GGUF/resolve/main/Qwen3.5-4B-Q4_K_M.gguf \
    -O /models/Qwen3.5-4B-Q4_K_M.gguf

# ============================================
# Stage 2: Runtime image
# ============================================
FROM ubuntu:24.04

# Labels for identification
LABEL maintainer="Research Agent Team"
LABEL description="Qwen3.5-4B LLM Gateway with OpenAI-compatible API"
LABEL version="1.0.0"

# Avoid interactive prompts
ENV DEBIAN_FRONTEND=noninteractive

# Install runtime dependencies only
RUN apt-get update && apt-get install -y \
    ca-certificates \
    curl \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Create non-root user for security
RUN useradd -m -u 10001 -s /bin/bash llm

# Copy llama-server binary from builder
COPY --from=builder /usr/local/bin/llama-server /usr/local/bin/llama-server
COPY --from=builder /usr/local/bin/llama-cli /usr/local/bin/llama-cli

# Copy model from builder
COPY --from=builder /models/Qwen3.5-4B-Q4_K_M.gguf /models/Qwen3.5-4B-Q4_K_M.gguf

# Set proper permissions
RUN chown -R llm:llm /models

# Environment variables with Railway-compatible defaults
ENV HOST=0.0.0.0 \
    PORT=8080 \
    MODEL_PATH=/models/Qwen3.5-4B-Q4_K_M.gguf \
    CONTEXT_SIZE=262000 \
    GPU_LAYERS=0 \
    THREADS=4 \
    BATCH_SIZE=512 \
    RAILWAY_ENVIRONMENT=production

# Expose the default port
EXPOSE 8080

# Switch to non-root user
USER llm

# Health check to verify the server is running
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

# Working directory
WORKDIR /app

# Start the llama.cpp server
# Configuration optimized for Railway's CPU-only environment:
# - --host 0.0.0.0: Bind to all interfaces (required for Railway)
# - --port 8080: Use Railway's default port
# - --ctx-size 262000: Full 262K context window for Qwen3.5
# - -ngl 0: No GPU layers (CPU-only inference)
# - -t 4: Use 4 threads (adjustable via THREADS env var)
# - -b 512: Batch size for processing
# - --chat-template qwen3.5: Use Qwen3.5 chat template for proper formatting
# - --metrics: Enable Prometheus metrics endpoint
# - --log-format text: Human-readable logs

CMD ["sh", "-c", "llama-server ${MODEL_PATH} \
    --host ${HOST} \
    --port ${PORT} \
    --ctx-size ${CONTEXT_SIZE} \
    -ngl ${GPU_LAYERS} \
    -t ${THREADS} \
    -b ${BATCH_SIZE} \
    --alias 'unsloth/Qwen3.5-4B-GGUF' \
    --temp 1.0 \
    --top-p 0.95 \
    --top-k 20 \
    --min-p 0.0 \
    --presence-penalty 1.5 \
    --chat-template qwen3.5 \
    --chat-template-kwargs '{\"enable_thinking\":true}' \
    --metrics \
    --log-format text"]
