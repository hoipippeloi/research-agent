# Qwen3.5-2B LLM Gateway Dockerfile for Railway Deployment
# CPU-only inference server with OpenAI-compatible API
# Uses llama.cpp's built-in Hugging Face download feature

# ============================================
# Stage 1: Build llama.cpp
# ============================================
FROM ubuntu:24.04 AS builder

# Avoid interactive prompts during package installation
ENV DEBIAN_FRONTEND=noninteractive

# Install build dependencies (including OpenSSL for HTTPS support)
RUN apt-get update && apt-get install -y \
    git \
    build-essential \
    cmake \
    libssl-dev \
    && rm -rf /var/lib/apt/lists/*

# Clone and build llama.cpp with static linking
WORKDIR /build
RUN git clone https://github.com/ggerganov/llama.cpp.git

WORKDIR /build/llama.cpp
RUN cmake -B build \
    -DCMAKE_BUILD_TYPE=Release \
    -DBUILD_SHARED_LIBS=OFF \
    -DLLAMA_NATIVE=OFF \
    -DLLAMA_NO_ACCELERATE=ON \
    -DLLAMA_CUDA=OFF \
    -DLLAMA_OPENSSL=ON \
    && cmake --build build --config Release -j$(nproc) \
    && cp build/bin/llama-server /usr/local/bin/ \
    && cp build/bin/llama-cli /usr/local/bin/

# ============================================
# Stage 2: Runtime image
# ============================================
FROM ubuntu:24.04

# Labels for identification
LABEL maintainer="Research Agent Team"
LABEL description="Qwen3.5-2B LLM Gateway with OpenAI-compatible API"
LABEL version="2.0.0"

# Avoid interactive prompts
ENV DEBIAN_FRONTEND=noninteractive

# Install runtime dependencies (libssl3t64 for HTTPS support)
RUN apt-get update && apt-get install -y \
    ca-certificates \
    curl \
    libgomp1 \
    libssl3t64 \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Create non-root user for security
RUN useradd -m -u 10001 -s /bin/bash llm

# Copy llama-server binary from builder
COPY --from=builder /usr/local/bin/llama-server /usr/local/bin/llama-server
COPY --from=builder /usr/local/bin/llama-cli /usr/local/bin/llama-cli

# Create models directory with proper permissions
RUN mkdir -p /models && chown -R llm:llm /models

# Environment variables with Railway-compatible defaults
ENV HOST=0.0.0.0 \
    PORT=8080

# Expose the default port
EXPOSE 8080

# Switch to non-root user
USER llm

# Health check with extended start period for model download
# First startup will take longer as it downloads the model from Hugging Face
HEALTHCHECK --interval=30s --timeout=10s --start-period=300s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

# Working directory
WORKDIR /app

# Start the llama.cpp server
# Uses -hf flag to automatically download model from Hugging Face on first run
# Model will be cached locally for subsequent starts
# Configuration optimized for Railway's CPU-only environment:
# - -hf: Download model directly from Hugging Face (unsloth optimized Dynamic 2.0)
# - --host 0.0.0.0: Bind to all interfaces (required for Railway)
# - --port 8080: Use Railway's default port
# - --ctx-size 262000: Full 262K context window for Qwen3.5
# - --n-gpu-layers 0: No GPU layers (CPU-only inference)
# - -t 4: Use 4 threads
# - -b 512: Batch size for processing
# - --alias: Model identifier for API responses
# - Sampling parameters from unsloth recommendations for thinking mode
# - --chat-template-kwargs: Enable thinking mode (disabled by default in 4B)

CMD ["sh", "-c", "llama-server -hf unsloth/Qwen3.5-2B-GGUF:Q4_K_M --host 0.0.0.0 --port ${PORT:-8080} --ctx-size 262000 --n-gpu-layers 0 --threads 4 --batch-size 512 --alias unsloth/Qwen3.5-2B-GGUF --temp 1.0 --top-p 0.95 --top-k 20 --min-p 0.0 --presence-penalty 1.5 --chat-template-kwargs '{\"enable_thinking\":false}' --metrics"]
