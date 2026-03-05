#!/bin/bash
# Test script for Qwen3.5-4B LLM Gateway endpoint
# Usage: ./test-endpoint.sh [API_URL]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
API_URL=${1:-http://localhost:8080}
ENDPOINT="${API_URL}/v1/chat/completions"

echo -e "${BLUE}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     Qwen3.5-4B Endpoint Test Suite                          ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Test 1: Health check
test_health() {
    echo -e "${YELLOW}Test 1: Health Check${NC}"
    echo "Checking: ${API_URL}/health"

    if curl -f -s "${API_URL}/health" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Health check passed${NC}"
        return 0
    else
        echo -e "${YELLOW}⚠ Health endpoint not available (this is OK)${NC}"
        return 0
    fi
}

# Test 2: Simple non-streaming completion
test_non_streaming() {
    echo -e "${YELLOW}Test 2: Non-Streaming Completion${NC}"
    echo "Endpoint: $ENDPOINT"

    RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$ENDPOINT" \
        -H "Content-Type: application/json" \
        -d '{
            "model": "qwen3.5-4b",
            "messages": [
                {"role": "user", "content": "Say \"Hello, World!\" and nothing else."}
            ],
            "temperature": 0.1,
            "max_tokens": 50,
            "stream": false
        }')

    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | head -n -1)

    if [ "$HTTP_CODE" -eq 200 ]; then
        echo -e "${GREEN}✓ Request successful (HTTP $HTTP_CODE)${NC}"
        echo -e "${BLUE}Response:${NC}"
        echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"

        # Check if response contains expected fields
        if echo "$BODY" | grep -q '"choices"' && echo "$BODY" | grep -q '"message"'; then
            echo -e "${GREEN}✓ Response structure valid${NC}"

            # Extract and display the assistant's message
            MESSAGE=$(echo "$BODY" | python3 -c "import sys, json; print(json.load(sys.stdin)['choices'][0]['message']['content'])" 2>/dev/null)
            if [ -n "$MESSAGE" ]; then
                echo -e "${GREEN}✓ Assistant message: \"$MESSAGE\"${NC}"
            fi
        else
            echo -e "${RED}✗ Invalid response structure${NC}"
            return 1
        fi
    else
        echo -e "${RED}✗ Request failed (HTTP $HTTP_CODE)${NC}"
        echo -e "${RED}Response:${NC}"
        echo "$BODY"
        return 1
    fi
}

# Test 3: Streaming completion
test_streaming() {
    echo -e "${YELLOW}Test 3: Streaming Completion${NC}"
    echo "Endpoint: $ENDPOINT"

    HTTP_CODE=$(curl -s -w "%{http_code}" -o /tmp/stream_response.txt -X POST "$ENDPOINT" \
        -H "Content-Type: application/json" \
        -d '{
            "model": "qwen3.5-4b",
            "messages": [
                {"role": "user", "content": "Count from 1 to 5"}
            ],
            "temperature": 0.1,
            "max_tokens": 50,
            "stream": true
        }')

    if [ "$HTTP_CODE" -eq 200 ]; then
        echo -e "${GREEN}✓ Streaming request successful (HTTP $HTTP_CODE)${NC}"
        echo -e "${BLUE}Streaming response:${NC}"

        # Display first few chunks
        head -n 5 /tmp/stream_response.txt
        echo "..."
        echo "(Full response saved to /tmp/stream_response.txt)"

        # Check if it's actually streaming (multiple data: lines)
        CHUNK_COUNT=$(grep -c "^data:" /tmp/stream_response.txt || echo "0")
        if [ "$CHUNK_COUNT" -gt 1 ]; then
            echo -e "${GREEN}✓ Received $CHUNK_COUNT stream chunks${NC}"
        else
            echo -e "${YELLOW}⚠ Expected multiple chunks, got $CHUNK_COUNT${NC}"
        fi

        rm -f /tmp/stream_response.txt
    else
        echo -e "${RED}✗ Streaming request failed (HTTP $HTTP_CODE)${NC}"
        cat /tmp/stream_response.txt
        rm -f /tmp/stream_response.txt
        return 1
    fi
}

# Test 4: Model listing (if supported)
test_models() {
    echo -e "${YELLOW}Test 4: Model Listing${NC}"
    echo "Checking: ${API_URL}/v1/models"

    RESPONSE=$(curl -s -w "\n%{http_code}" "${API_URL}/v1/models")
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | head -n -1)

    if [ "$HTTP_CODE" -eq 200 ]; then
        echo -e "${GREEN}✓ Models endpoint available${NC}"
        echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"
    else
        echo -e "${YELLOW}⚠ Models endpoint not available (this is OK)${NC}"
    fi
}

# Test 5: Error handling (invalid request)
test_error_handling() {
    echo -e "${YELLOW}Test 5: Error Handling${NC}"

    RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$ENDPOINT" \
        -H "Content-Type: application/json" \
        -d '{
            "model": "qwen3.5-4b",
            "messages": []
        }')

    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | head -n -1)

    if [ "$HTTP_CODE" -ge 400 ]; then
        echo -e "${GREEN}✓ Error handling works (HTTP $HTTP_CODE)${NC}"
        echo -e "${BLUE}Error response:${NC}"
        echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"
    else
        echo -e "${YELLOW}⚠ Unexpected response code for invalid request: HTTP $HTTP_CODE${NC}"
    fi
}

# Run all tests
main() {
    echo -e "${BLUE}Testing API at: $API_URL${NC}"
    echo -e "${BLUE}Endpoint: $ENDPOINT${NC}"
    echo ""

    PASSED=0
    FAILED=0

    # Run tests
    test_health && ((PASSED++)) || ((FAILED++))
    echo ""

    test_non_streaming && ((PASSED++)) || ((FAILED++))
    echo ""

    test_streaming && ((PASSED++)) || ((FAILED++))
    echo ""

    test_models && ((PASSED++)) || ((FAILED++))
    echo ""

    test_error_handling && ((PASSED++)) || ((FAILED++))
    echo ""

    # Summary
    echo -e "${BLUE}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║                    Test Summary                             ║${NC}"
    echo -e "${BLUE}╚══════════════════════════════════════════════════════════════╝${NC}"
    echo -e "${GREEN}Passed: $PASSED${NC}"
    echo -e "${RED}Failed: $FAILED${NC}"

    if [ $FAILED -eq 0 ]; then
        echo -e "${GREEN}✓ All tests passed!${NC}"
        exit 0
    else
        echo -e "${RED}✗ Some tests failed${NC}"
        exit 1
    fi
}

# Run main function
main
