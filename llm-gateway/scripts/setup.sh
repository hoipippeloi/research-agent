#!/bin/bash
set -e

# Qwen3.5-4B LLM Gateway Setup Script
# This script clones llama.cpp, builds it with CUDA support, and downloads the model

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
LLAMA_CPP_DIR="llama.cpp"
MODEL_DIR="models"
MODEL_NAME="qwen3.5-4b-instruct-q4_K_M.gguf"
HUGGINGFACE_REPO="Qwen/Qwen3.5-4B-Instruct-GGUF"
HUGGINGFACE_FILE="qwen3.5-4b-instruct-q4_K_M.gguf"

echo -e "${BLUE}=== Qwen3.5-4B LLM Gateway Setup ===${NC}"
echo ""

# Check for required tools
check_prerequisites() {
    echo -e "${YELLOW}Checking prerequisites...${NC}"

    local missing_tools=()

    if ! command -v git &> /dev/null; then
        missing_tools+=("git")
    fi

    if ! command -v make &> /dev/null; then
        missing_tools+=("make")
    fi

    if ! command -v gcc &> /dev/null && ! command -v clang &> /dev/null; then
        missing_tools+=("gcc or clang")
    fi

    if [ ${#missing_tools[@]} -ne 0 ]; then
        echo -e "${RED}Error: Missing required tools: ${missing_tools[*]}${NC}"
        echo "Please install the missing tools and try again."
        exit 1
    fi

    echo -e "${GREEN}✓ All prerequisites satisfied${NC}"
}

# Check for CUDA (optional but recommended)
check_cuda() {
    echo -e "${YELLOW}Checking for CUDA...${NC}"

    if command -v nvcc &> /dev/null; then
        echo -e "${GREEN}✓ CUDA found: $(nvcc --version | grep "release" | awk '{print $5}' | sed 's/,//')${NC}"
        echo -e "${GREEN}  GPU acceleration will be enabled${NC}"
        return 0
    else
        echo -e "${YELLOW}⚠ CUDA not found - will build CPU-only version${NC}"
        echo -e "${YELLOW}  For GPU acceleration, install CUDA Toolkit 12.x${NC}"
        return 1
    fi
}

# Clone llama.cpp repository
clone_llama_cpp() {
    echo -e "${YELLOW}Cloning llama.cpp repository...${NC}"

    if [ -d "$LLAMA_CPP_DIR" ]; then
        echo -e "${YELLOW}llama.cpp directory already exists${NC}"
        read -p "Do you want to remove it and re-clone? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            echo -e "${YELLOW}Removing existing llama.cpp directory...${NC}"
            rm -rf "$LLAMA_CPP_DIR"
        else
            echo -e "${BLUE}Using existing llama.cpp directory${NC}"
            return 0
        fi
    fi

    git clone https://github.com/ggerganov/llama.cpp
    echo -e "${GREEN}✓ llama.cpp cloned successfully${NC}"
}

# Build llama.cpp
build_llama_cpp() {
    echo -e "${YELLOW}Building llama.cpp...${NC}"

    cd "$LLAMA_CPP_DIR"

    # Check if already built
    if [ -f "llama-server" ] || [ -f "llama-cli" ]; then
        echo -e "${YELLOW}llama.cpp appears to already be built${NC}"
        read -p "Do you want to rebuild? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo -e "${BLUE}Using existing build${NC}"
            cd ..
            return 0
        fi
    fi

    # Build with CUDA if available, otherwise CPU-only
    if check_cuda; then
        echo -e "${YELLOW}Building with CUDA support...${NC}"
        make -j LLAMA_CUDA=1
    else
        echo -e "${YELLOW}Building CPU-only version...${NC}"
        make -j LLAMA_NO_ACCELERATE=1
    fi

    cd ..
    echo -e "${GREEN}✓ llama.cpp built successfully${NC}"
}

# Download Qwen3.5-4B model
download_model() {
    echo -e "${YELLOW}Downloading Qwen3.5-4B model (~3GB)...${NC}"

    # Create models directory
    mkdir -p "$MODEL_DIR"

    # Check if model already exists
    if [ -f "$MODEL_DIR/$MODEL_NAME" ]; then
        echo -e "${YELLOW}Model already exists at $MODEL_DIR/$MODEL_NAME${NC}"

        # Check file size (should be ~3GB)
        local file_size=$(stat -f%z "$MODEL_DIR/$MODEL_NAME" 2>/dev/null || stat -c%s "$MODEL_DIR/$MODEL_NAME" 2>/dev/null)
        local expected_size=3000000000  # ~3GB

        if [ "$file_size" -gt $((expected_size - 500000000)) ]; then
            echo -e "${GREEN}✓ Model file size looks correct ($(numfmt --to=iec $file_size))${NC}"
            read -p "Do you want to re-download? (y/N): " -n 1 -r
            echo
            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                echo -e "${BLUE}Using existing model${NC}"
                return 0
            fi
        else
            echo -e "${YELLOW}⚠ Model file size seems incorrect, re-downloading...${NC}"
        fi
    fi

    # Try using llama-cli first (if available)
    if [ -f "$LLAMA_CPP_DIR/llama-cli" ]; then
        echo -e "${YELLOW}Using llama-cli to download model...${NC}"
        cd "$LLAMA_CPP_DIR"
        ./llama-cli -hf "$HUGGINGFACE_REPO" "$HUGGINGFACE_FILE" || {
            echo -e "${YELLOW}llama-cli download failed, trying huggingface-cli...${NC}"
            cd ..
            download_with_huggingface_cli
        }
        cd ..

        # Move model to models directory if it's in the current directory
        if [ -f "$HUGGINGFACE_FILE" ]; then
            mv "$HUGGINGFACE_FILE" "$MODEL_DIR/"
        fi
    else
        download_with_huggingface_cli
    fi

    # Verify download
    if [ -f "$MODEL_DIR/$MODEL_NAME" ]; then
        echo -e "${GREEN}✓ Model downloaded successfully${NC}"
        echo -e "${GREEN}  Location: $MODEL_DIR/$MODEL_NAME${NC}"
        local file_size=$(stat -f%z "$MODEL_DIR/$MODEL_NAME" 2>/dev/null || stat -c%s "$MODEL_DIR/$MODEL_NAME" 2>/dev/null)
        echo -e "${GREEN}  Size: $(numfmt --to=iec $file_size)${NC}"
    else
        echo -e "${RED}Error: Model download failed${NC}"
        exit 1
    fi
}

# Alternative download using huggingface-cli
download_with_huggingface_cli() {
    echo -e "${YELLOW}Using huggingface-cli to download model...${NC}"

    # Check if huggingface-cli is installed
    if ! command -v huggingface-cli &> /dev/null; then
        echo -e "${YELLOW}huggingface-cli not found, installing...${NC}"
        pip install huggingface-hub
    fi

    huggingface-cli download "$HUGGINGFACE_REPO" "$HUGGINGFACE_FILE" --local-dir "$MODEL_DIR"
}

# Verify installation
verify_installation() {
    echo -e "${YELLOW}Verifying installation...${NC}"

    local errors=0

    # Check llama-server
    if [ ! -f "$LLAMA_CPP_DIR/llama-server" ]; then
        echo -e "${RED}✗ llama-server not found${NC}"
        errors=$((errors + 1))
    else
        echo -e "${GREEN}✓ llama-server found${NC}"
    fi

    # Check model
    if [ ! -f "$MODEL_DIR/$MODEL_NAME" ]; then
        echo -e "${RED}✗ Model not found${NC}"
        errors=$((errors + 1))
    else
        echo -e "${GREEN}✓ Model found${NC}"
    fi

    if [ $errors -eq 0 ]; then
        echo -e "${GREEN}✓ Installation verified successfully${NC}"
        return 0
    else
        echo -e "${RED}✗ Installation verification failed${NC}"
        return 1
    fi
}

# Print next steps
print_next_steps() {
    echo ""
    echo -e "${GREEN}=== Setup Complete! ===${NC}"
    echo ""
    echo -e "${BLUE}Next steps:${NC}"
    echo ""
    echo "1. Start the development server:"
    echo -e "   ${YELLOW}./scripts/dev.sh${NC}"
    echo ""
    echo "2. Test the API:"
    echo -e "   ${YELLOW}curl http://localhost:8080/v1/chat/completions \\${NC}"
    echo -e "   ${YELLOW}  -H \"Content-Type: application/json\" \\${NC}"
    echo -e "   ${YELLOW}  -d '{\"model\": \"qwen3.5-4b\", \"messages\": [{\"role\": \"user\", \"content\": \"Hello!\"}]}'${NC}"
    echo ""
    echo "3. Integrate with your app:"
    echo "   - Zed.dev: http://localhost:8080/v1"
    echo "   - SvelteKit: Use http://localhost:8080/v1 as base URL"
    echo ""
    echo -e "${BLUE}For Railway deployment:${NC}"
    echo "   Run: railway up"
    echo "   The Dockerfile will handle the production setup"
    echo ""
}

# Force mode handling
FORCE=false
if [ "$1" = "--force" ] || [ "$1" = "-f" ]; then
    FORCE=true
    echo -e "${YELLOW}Force mode enabled - will overwrite existing files${NC}"
fi

# Main execution
main() {
    check_prerequisites
    check_cuda
    clone_llama_cpp
    build_llama_cpp
    download_model
    verify_installation
    print_next_steps
}

# Run main function
main
