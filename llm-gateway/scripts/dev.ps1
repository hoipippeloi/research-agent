#Requires -Version 7.0

<#
.SYNOPSIS
    Starts the Qwen3.5-4B development server using llama.cpp on Windows.

.DESCRIPTION
    This script runs the llama.cpp server with Qwen3.5-4B model for local development.
    It checks for prerequisites and loads environment variables from .env file.

.EXAMPLE
    .\dev.ps1

.EXAMPLE
    .\dev.ps1 -Port 9000

.EXAMPLE
    .\dev.ps1 -ContextSize 131072 -GpuLayers 50
#>

param(
    [string]$Host = "127.0.0.1",
    [int]$Port = 8080,
    [int]$ContextSize = 262000,
    [int]$GpuLayers = 99,
    [string]$ModelPath = ".\models\qwen3.5-4b-instruct-q4_K_M.gguf"
)

$ErrorActionPreference = "Stop"

# Colors for output
function Write-Success { Write-Host $args -ForegroundColor Green }
function Write-Info { Write-Host $args -ForegroundColor Cyan }
function Write-Warning { Write-Host $args -ForegroundColor Yellow }
function Write-Error { Write-Host $args -ForegroundColor Red }

# Get script directory
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir

Write-Info "╔════════════════════════════════════════════════════════════╗"
Write-Info "║     Qwen3.5-4B Development Server (Windows)                ║"
Write-Info "╚════════════════════════════════════════════════════════════╝"
Write-Host ""

# Load environment variables from .env file if it exists
$EnvFile = Join-Path $ProjectRoot ".env"
if (Test-Path $EnvFile) {
    Write-Info "Loading environment variables from .env file..."
    Get-Content $EnvFile | ForEach-Object {
        if ($_ -match "^([^#][^=]+)=(.*)$") {
            $name = $matches[1].Trim()
            $value = $matches[2].Trim()
            Set-Item -Path "env:$name" -Value $value
        }
    }
}

# Override with command-line parameters
if ($Host -ne "127.0.0.1") { $env:HOST = $Host }
if ($Port -ne 8080) { $env:PORT = $Port }
if ($ContextSize -ne 262000) { $env:CONTEXT_SIZE = $ContextSize }
if ($GpuLayers -ne 99) { $env:GPU_LAYERS = $GpuLayers }
if ($ModelPath -ne ".\models\qwen3.5-4b-instruct-q4_K_M.gguf") { $env:MODEL_PATH = $ModelPath }

# Set defaults if not provided
$Host = if ($env:HOST) { $env:HOST } else { "127.0.0.1" }
$Port = if ($env:PORT) { [int]$env:PORT } else { 8080 }
$ContextSize = if ($env:CONTEXT_SIZE) { [int]$env:CONTEXT_SIZE } else { 262000 }
$GpuLayers = if ($env:GPU_LAYERS) { [int]$env:GPU_LAYERS } else { 99 }
$ModelPath = if ($env:MODEL_PATH) { $env:MODEL_PATH } else { ".\models\qwen3.5-4b-instruct-q4_K_M.gguf" }

# Check if llama.cpp is built
$LlamaServerExe = Join-Path $ProjectRoot "llama.cpp\llama-server.exe"
if (-not (Test-Path $LlamaServerExe)) {
    Write-Error "❌ llama-server.exe not found at: $LlamaServerExe"
    Write-Warning ""
    Write-Warning "Please run setup first:"
    Write-Warning "  .\scripts\setup.ps1"
    Write-Warning ""
    Write-Warning "Or build manually:"
    Write-Warning "  git clone https://github.com/ggerganov/llama.cpp"
    Write-Warning "  cd llama.cpp"
    Write-Warning "  cmake -B build -DCMAKE_CUDA_ARCHITECTURES=89  # Adjust for your GPU"
    Write-Warning "  cmake --build build --config Release"
    exit 1
}

Write-Success "✓ Found llama-server.exe"

# Check if model file exists
$FullModelPath = if ([System.IO.Path]::IsPathRooted($ModelPath)) {
    $ModelPath
} else {
    Join-Path $ProjectRoot $ModelPath
}

if (-not (Test-Path $FullModelPath)) {
    Write-Error "❌ Model file not found at: $FullModelPath"
    Write-Warning ""
    Write-Warning "Please download the model:"
    Write-Warning "  .\scripts\setup.ps1"
    Write-Warning ""
    Write-Warning "Or manually:"
    Write-Warning "  pip install huggingface-hub"
    Write-Warning "  huggingface-cli download Qwen/Qwen3.5-4B-Instruct-GGUF qwen3.5-4b-instruct-q4_K_M.gguf --local-dir .\models"
    exit 1
}

$ModelSize = (Get-Item $FullModelPath).Length / 1GB
Write-Success "✓ Found model file (${ModelSize:N2} GB)"

# Display configuration
Write-Info ""
Write-Info "Configuration:"
Write-Host "  Host:          $Host" -ForegroundColor White
Write-Host "  Port:          $Port" -ForegroundColor White
Write-Host "  Context Size:  $ContextSize tokens" -ForegroundColor White
Write-Host "  GPU Layers:    $GpuLayers" -ForegroundColor White
Write-Host "  Model Path:    $FullModelPath" -ForegroundColor White
Write-Info ""

# Build command arguments
$Arguments = @(
    $FullModelPath,
    "--host", $Host,
    "--port", $Port.ToString(),
    "--ctx-size", $ContextSize.ToString(),
    "-ngl", $GpuLayers.ToString(),
    "-fa",  # Flash attention
    "--chat-template", "qwen3.5"
)

Write-Info "Starting Qwen3.5-4B server..."
Write-Info ""
Write-Warning "Press Ctrl+C to stop the server"
Write-Info ""

# Change to project root directory
Set-Location $ProjectRoot

# Start the server
try {
    & $LlamaServerExe @Arguments
}
catch {
    Write-Error "Failed to start server: $_"
    exit 1
}
finally {
    Write-Info ""
    Write-Info "Server stopped."
}
