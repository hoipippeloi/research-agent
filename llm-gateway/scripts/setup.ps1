# Qwen3.5-4B Setup Script for Windows PowerShell
# Builds llama.cpp and downloads the model

param(
    [switch]$Force,
    [switch]$NoCUDA,
    [string]$Model = "qwen3.5-4b-instruct-q4_K_M.gguf"
)

$ErrorActionPreference = "Stop"

# Colors for output
function Write-Success { Write-Host "[✓] $args" -ForegroundColor Green }
function Write-Info { Write-Host "[i] $args" -ForegroundColor Cyan }
function Write-Warning { Write-Host "[!] $args" -ForegroundColor Yellow }
function Write-Error { Write-Host "[✗] $args" -ForegroundColor Red }

# Get script directory
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RootDir = Split-Path -Parent $ScriptDir
$LlamaCppDir = Join-Path $RootDir "llama.cpp"
$ModelsDir = Join-Path $RootDir "models"
$ModelPath = Join-Path $ModelsDir $Model

Write-Host "╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     Qwen3.5-4B Gateway Setup (Windows)                      ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Check prerequisites
Write-Info "Checking prerequisites..."

# Check Git
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Error "Git is not installed. Please install Git from https://git-scm.com/"
    exit 1
}
Write-Success "Git found: $(git --version)"

# Check CMake
if (-not (Get-Command cmake -ErrorAction SilentlyContinue)) {
    Write-Error "CMake is not installed. Please install CMake from https://cmake.org/"
    exit 1
}
Write-Success "CMake found: $(cmake --version | Select-Object -First 1)"

# Check for Visual Studio Build Tools
$VSWhere = "${env:ProgramFiles(x86)}\Microsoft Visual Studio\Installer\vswhere.exe"
if (Test-Path $VSWhere) {
    $VSInstallPath = & $VSWhere -latest -property installationPath
    if ($VSInstallPath) {
        Write-Success "Visual Studio found: $VSInstallPath"
    }
} else {
    Write-Warning "Visual Studio not detected. Build might fail."
    Write-Info "Install Visual Studio Build Tools from https://visualstudio.microsoft.com/downloads/"
}

# Check for CUDA (if not disabled)
$UseCUDA = -not $NoCUDA
if ($UseCUDA) {
    $NVCC = Get-Command nvcc -ErrorAction SilentlyContinue
    if ($NVCC) {
        Write-Success "CUDA found: $(nvcc --version | Select-String 'release')"
    } else {
        Write-Warning "CUDA not found. Building CPU-only version."
        Write-Info "Install CUDA Toolkit from https://developer.nvidia.com/cuda-downloads"
        $UseCUDA = $false
    }
} else {
    Write-Info "Building CPU-only version (CUDA disabled)"
}

# Create models directory
if (-not (Test-Path $ModelsDir)) {
    New-Item -ItemType Directory -Path $ModelsDir | Out-Null
    Write-Success "Created models directory: $ModelsDir"
}

# Clone llama.cpp
if ((Test-Path $LlamaCppDir) -and -not $Force) {
    Write-Info "llama.cpp already exists. Use -Force to rebuild."
} else {
    if (Test-Path $LlamaCppDir) {
        Write-Info "Removing existing llama.cpp directory..."
        Remove-Item -Recurse -Force $LlamaCppDir
    }

    Write-Info "Cloning llama.cpp repository..."
    git clone https://github.com/ggerganov/llama.cpp $LlamaCppDir

    if ($LASTEXITCODE -eq 0) {
        Write-Success "Cloned llama.cpp successfully"
    } else {
        Write-Error "Failed to clone llama.cpp"
        exit 1
    }

    # Build llama.cpp
    Write-Info "Building llama.cpp (this may take several minutes)..."

    $BuildDir = Join-Path $LlamaCppDir "build"
    if (Test-Path $BuildDir) {
        Remove-Item -Recurse -Force $BuildDir
    }
    New-Item -ItemType Directory -Path $BuildDir | Out-Null

    Push-Location $BuildDir

    # Configure with CMake
    $CMakeArgs = @(
        "..",
        "-DCMAKE_BUILD_TYPE=Release"
    )

    if ($UseCUDA) {
        $CMakeArgs += "-DLLAMA_CUDA=ON"
    }

    Write-Info "Configuring build with CMake..."
    & cmake $CMakeArgs

    if ($LASTEXITCODE -ne 0) {
        Pop-Location
        Write-Error "CMake configuration failed"
        exit 1
    }

    # Build
    Write-Info "Compiling llama.cpp..."
    & cmake --build . --config Release -j 4

    if ($LASTEXITCODE -ne 0) {
        Pop-Location
        Write-Error "Build failed"
        exit 1
    }

    Pop-Location
    Write-Success "Built llama.cpp successfully"
}

# Download model
if ((Test-Path $ModelPath) -and -not $Force) {
    Write-Info "Model already exists: $ModelPath"
    Write-Info "Use -Force to re-download"
} else {
    Write-Info "Downloading Qwen3.5-4B model ($Model)..."
    Write-Info "This may take several minutes (model size ~3GB)"

    # Try using huggingface-cli if available
    $HFCLI = Get-Command huggingface-cli -ErrorAction SilentlyContinue
    if ($HFCLI) {
        Write-Info "Using huggingface-cli to download model..."
        & huggingface-cli download Qwen/Qwen3.5-4B-Instruct-GGUF $Model --local-dir $ModelsDir

        if ($LASTEXITCODE -eq 0) {
            Write-Success "Downloaded model successfully"
        } else {
            Write-Warning "huggingface-cli download failed, trying direct download..."
            $UseDirectDownload = $true
        }
    } else {
        Write-Info "huggingface-cli not found, using direct download..."
        $UseDirectDownload = $true
    }

    if ($UseDirectDownload) {
        # Direct download URL
        $ModelUrl = "https://huggingface.co/Qwen/Qwen3.5-4B-Instruct-GGUF/resolve/main/$Model"

        try {
            # Use .NET WebClient for download with progress
            $WebClient = New-Object System.Net.WebClient

            # Register progress event
            Register-ObjectEvent -InputObject $WebClient -EventName DownloadProgressChanged -SourceIdentifier WebClient.DownloadProgress -Action {
                $Global:DownloadProgress = $EventArgs.ProgressPercentage
                Write-Progress -Activity "Downloading Model" -Status "$($EventArgs.ProgressPercentage)% Complete" -PercentComplete $EventArgs.ProgressPercentage
            }

            $WebClient.DownloadFileAsync($ModelUrl, $ModelPath)

            # Wait for download to complete
            while ($WebClient.IsBusy) {
                Start-Sleep -Milliseconds 100
            }

            Unregister-Event -SourceIdentifier WebClient.DownloadProgress
            $WebClient.Dispose()

            if (Test-Path $ModelPath) {
                Write-Success "Downloaded model successfully"
            } else {
                Write-Error "Failed to download model"
                exit 1
            }
        }
        catch {
            Write-Error "Download failed: $_"
            Write-Info "Please download manually from: $ModelUrl"
            Write-Info "Save to: $ModelPath"
            exit 1
        }
    }
}

# Verify setup
Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║                  Setup Complete!                            ║" -ForegroundColor Green
Write-Host "╚══════════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""

Write-Success "Model location: $ModelPath"
Write-Success "llama.cpp location: $LlamaCppDir"
Write-Host ""

Write-Info "Next steps:"
Write-Host "  1. Start the development server:" -ForegroundColor White
Write-Host "     .\scripts\dev.ps1" -ForegroundColor Yellow
Write-Host ""
Write-Host "  2. Test the endpoint:" -ForegroundColor White
Write-Host "     curl http://localhost:8080/v1/chat/completions ..." -ForegroundColor Yellow
Write-Host ""

# Create convenience scripts info
Write-Info "Available commands:"
Write-Host "  .\scripts\dev.ps1         - Start development server" -ForegroundColor White
Write-Host "  .\scripts\setup.ps1 -Force - Rebuild and re-download" -ForegroundColor White
Write-Host "  .\scripts\setup.ps1 -NoCUDA - Build without GPU support" -ForegroundColor White
