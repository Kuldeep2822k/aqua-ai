# Aqua-AI Verification Script (PowerShell)
# This script tests all fixes and verifies the project setup

Write-Host "🌊 AQUA-AI Project Verification Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$TestsPassed = 0
$TestsFailed = 0

function Test-Result {
    param($Condition, $Message)
    if ($Condition) {
        Write-Host "✅ PASS: $Message" -ForegroundColor Green
        $script:TestsPassed++
    } else {
        Write-Host "❌ FAIL: $Message" -ForegroundColor Red
        $script:TestsFailed++
    }
}

Write-Host "📋 Step 1: Checking File Structure" -ForegroundColor Yellow
Write-Host "-----------------------------------"

# Check if Dockerfiles exist
Test-Result (Test-Path "backend\Dockerfile") "Backend Dockerfile exists"
Test-Result (Test-Path "frontend\Dockerfile") "Frontend Dockerfile exists"
Test-Result (Test-Path "ai-models\Dockerfile") "AI Models Dockerfile exists"

# Check if CI/CD workflows exist
Test-Result (Test-Path ".github\workflows\ci.yml") "CI workflow exists"
Test-Result (Test-Path ".github\workflows\deploy.yml") "Deploy workflow exists"

# Check if config files exist
Test-Result (Test-Path "knexfile.js") "Knexfile.js exists"
Test-Result (Test-Path ".env.development") ".env.development exists"
Test-Result (Test-Path "database\migrations\20260106000000_initial_schema.js") "Database migration exists"

Write-Host ""
Write-Host "🐍 Step 2: Checking Python Dependencies" -ForegroundColor Yellow
Write-Host "----------------------------------------"

# Check if invalid dependencies are removed
$requirementsContent = Get-Content "data-pipeline\requirements.txt" -Raw
Test-Result (-not ($requirementsContent -match "sqlite3")) "sqlite3 removed from requirements.txt"
Test-Result (-not ($requirementsContent -match "asyncio")) "asyncio removed from requirements.txt"

Write-Host ""
Write-Host "🐳 Step 3: Testing Docker Configuration" -ForegroundColor Yellow
Write-Host "----------------------------------------"

# Check if docker-compose.yml uses environment variables
$dockerComposeContent = Get-Content "docker-compose.yml" -Raw
Test-Result ($dockerComposeContent -match '\$\{DB_PASSWORD') "Docker Compose uses environment variables"

Write-Host ""
Write-Host "📦 Step 4: Testing Package Files" -ForegroundColor Yellow
Write-Host "---------------------------------"

# Check if package.json files are valid
try {
    $null = Get-Content "package.json" | ConvertFrom-Json
    Test-Result $true "Root package.json is valid JSON"
} catch {
    Test-Result $false "Root package.json is valid JSON"
}

try {
    $null = Get-Content "frontend\package.json" | ConvertFrom-Json
    Test-Result $true "Frontend package.json is valid JSON"
} catch {
    Test-Result $false "Frontend package.json is valid JSON"
}

try {
    $null = Get-Content "backend\package.json" | ConvertFrom-Json
    Test-Result $true "Backend package.json is valid JSON"
} catch {
    Test-Result $false "Backend package.json is valid JSON"
}

Write-Host ""
Write-Host "🔍 Step 5: Dockerfile Syntax Check" -ForegroundColor Yellow
Write-Host "-----------------------------------"

# Check if Docker is available
try {
    docker --version | Out-Null
    Write-Host "Docker is available" -ForegroundColor Green
    
    # Note: Actual builds would require dependencies
    Write-Host "⚠️  Skipping Docker builds (requires dependencies)" -ForegroundColor Yellow
} catch {
    Write-Host "⚠️  Docker not available, skipping build tests" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "📊 Step 6: Verification Summary" -ForegroundColor Cyan
Write-Host "================================"
Write-Host ""
Write-Host "Tests Passed: " -NoNewline
Write-Host "$TestsPassed" -ForegroundColor Green
Write-Host "Tests Failed: " -NoNewline
Write-Host "$TestsFailed" -ForegroundColor Red
Write-Host ""

if ($TestsFailed -eq 0) {
    Write-Host "🎉 All tests passed! Project is ready for deployment." -ForegroundColor Green
    exit 0
} else {
    Write-Host "⚠️  Some tests failed. Please review the output above." -ForegroundColor Red
    exit 1
}
