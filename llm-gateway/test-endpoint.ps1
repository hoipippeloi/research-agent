#Requires -Version 7.0

<#
.SYNOPSIS
    Tests the Qwen3.5-4B LLM Gateway endpoint.

.DESCRIPTION
    This script tests the OpenAI-compatible /v1/chat/completions endpoint
    to verify the server is running correctly.

.EXAMPLE
    .\test-endpoint.ps1

.EXAMPLE
    .\test-endpoint.ps1 -BaseUrl "https://your-app.railway.app"

.EXAMPLE
    .\test-endpoint.ps1 -Stream
#>

param(
    [string]$BaseUrl = "http://localhost:8080",
    [switch]$Stream,
    [string]$Message = "Write a haiku about coding"
)

$ErrorActionPreference = "Stop"

# Colors for output
function Write-Success { Write-Host $args -ForegroundColor Green }
function Write-Info { Write-Host $args -ForegroundColor Cyan }
function Write-Warning { Write-Host $args -ForegroundColor Yellow }
function Write-Error { Write-Host $args -ForegroundColor Red }

Write-Info "╔════════════════════════════════════════════════════════════╗"
Write-Info "║         Qwen3.5-4B Endpoint Tester (Windows)               ║"
Write-Info "╚════════════════════════════════════════════════════════════╝"
Write-Host ""

# Test health endpoint first
Write-Info "Testing health endpoint..."
try {
    $HealthResponse = Invoke-RestMethod -Uri "$BaseUrl/health" -Method Get -TimeoutSec 5 -ErrorAction SilentlyContinue
    Write-Success "✓ Health endpoint is responding"
} catch {
    Write-Warning "⚠ Health endpoint not available (this is OK if using llama.cpp built-in server)"
}

Write-Host ""

# Test chat completions endpoint
Write-Info "Testing chat completions endpoint: $BaseUrl/v1/chat/completions"
Write-Info "Message: $Message"
Write-Host ""

# Prepare request body
$RequestBody = @{
    model = "qwen3.5-4b"
    messages = @(
        @{
            role = "user"
            content = $Message
        }
    )
    temperature = 0.7
    max_tokens = 100
    stream = $Stream.IsPresent
}

$Headers = @{
    "Content-Type" = "application/json"
}

if ($Stream) {
    Write-Info "Streaming mode enabled"
    Write-Host ""

    try {
        $RequestJson = $RequestBody | ConvertTo-Json -Depth 10

        # For streaming, we need to read the response as it comes
        $Response = Invoke-WebRequest -Uri "$BaseUrl/v1/chat/completions" `
            -Method Post `
            -Headers $Headers `
            -Body $RequestJson `
            -TimeoutSec 60 `
            -ErrorAction Stop

        Write-Success "✓ Streaming request successful"
        Write-Host ""
        Write-Info "Response:"
        Write-Host $Response.Content -ForegroundColor White

    } catch {
        Write-Error "✗ Streaming request failed: $_"
        Write-Error $_.Exception.Message
        exit 1
    }
} else {
    Write-Info "Non-streaming mode"
    Write-Host ""

    try {
        $RequestJson = $RequestBody | ConvertTo-Json -Depth 10

        Write-Info "Sending request..."
        $Response = Invoke-RestMethod -Uri "$BaseUrl/v1/chat/completions" `
            -Method Post `
            -Headers $Headers `
            -Body $RequestJson `
            -TimeoutSec 120 `
            -ErrorAction Stop

        Write-Success "✓ Request successful"
        Write-Host ""

        # Display response
        Write-Info "Response:"
        Write-Host "─────────────────────────────────────────────" -ForegroundColor DarkGray
        Write-Host "ID: $($Response.id)" -ForegroundColor White
        Write-Host "Model: $($Response.model)" -ForegroundColor White
        Write-Host "Created: $([DateTimeOffset]::FromUnixTimeSeconds($Response.created).LocalDateTime)" -ForegroundColor White
        Write-Host "─────────────────────────────────────────────" -ForegroundColor DarkGray

        if ($Response.choices -and $Response.choices.Count -gt 0) {
            $Content = $Response.choices[0].message.content
            $Role = $Response.choices[0].message.role
            $FinishReason = $Response.choices[0].finish_reason

            Write-Host "Role: $Role" -ForegroundColor White
            Write-Host "Finish Reason: $FinishReason" -ForegroundColor White
            Write-Host "─────────────────────────────────────────────" -ForegroundColor DarkGray
            Write-Host ""
            Write-Info "Assistant Response:"
            Write-Host $Content -ForegroundColor Green
            Write-Host ""
            Write-Host "─────────────────────────────────────────────" -ForegroundColor DarkGray
        }

        # Display usage statistics
        if ($Response.usage) {
            Write-Host ""
            Write-Info "Token Usage:"
            Write-Host "  Prompt Tokens:   $($Response.usage.prompt_tokens)" -ForegroundColor White
            Write-Host "  Completion Tokens: $($Response.usage.completion_tokens)" -ForegroundColor White
            Write-Host "  Total Tokens:    $($Response.usage.total_tokens)" -ForegroundColor White
        }

    } catch {
        Write-Error "✗ Request failed: $_"
        Write-Error $_.Exception.Message

        if ($_.Exception.Response) {
            $Reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $ErrorResponse = $Reader.ReadToEnd()
            Write-Error "Error details: $ErrorResponse"
        }

        exit 1
    }
}

Write-Host ""
Write-Success "✓ Endpoint test completed successfully"
