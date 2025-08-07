# GST Pro Error Checker (PowerShell Version)
# Run this in PowerShell to check for common errors

Write-Host "🔍 Checking GST Pro for configuration errors..." -ForegroundColor Cyan
Write-Host ""

$errors = 0

# Check if we're in the right directory
if (-not (Test-Path "frontend/package.json") -or -not (Test-Path "backend/server.py")) {
    Write-Host "❌ Please run this script from the GST Pro project root directory" -ForegroundColor Red
    $errors++
}
else {
    Write-Host "✅ Project structure looks good" -ForegroundColor Green
}

# Check JSON syntax
Write-Host ""
Write-Host "📋 Checking JSON files..." -ForegroundColor Yellow
if (Get-Command node -ErrorAction SilentlyContinue) {
    try {
        $packageJson = Get-Content "frontend/package.json" -Raw | ConvertFrom-Json
        Write-Host "✅ frontend/package.json - Valid JSON" -ForegroundColor Green
    }
    catch {
        Write-Host "❌ frontend/package.json - Invalid JSON syntax" -ForegroundColor Red
        $errors++
    }
}
else {
    Write-Host "⚠️  Node.js not found, skipping JSON validation" -ForegroundColor Yellow
}

# Check required files
Write-Host ""
Write-Host "📄 Checking required files..." -ForegroundColor Yellow
$requiredFiles = @(
    "frontend/package.json",
    "backend/server.py", 
    "backend/build_executable.py",
    "backend/requirements_standalone.txt",
    "frontend/public/electron.js",
    "LICENSE",
    "CHANGELOG.md",
    "CONTRIBUTING.md",
    "SECURITY.md",
    ".github/workflows/release.yml"
)

foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Write-Host "✅ $file" -ForegroundColor Green
    }
    else {
        Write-Host "❌ $file missing" -ForegroundColor Red
        $errors++
    }
}

# Check package.json dependencies
Write-Host ""
Write-Host "📦 Checking package.json configuration..." -ForegroundColor Yellow
if (Test-Path "frontend/package.json") {
    $packageContent = Get-Content "frontend/package.json" -Raw
    
    if ($packageContent -match '"electron-builder"') {
        Write-Host "✅ electron-builder dependency found" -ForegroundColor Green
    }
    else {
        Write-Host "❌ electron-builder missing from devDependencies" -ForegroundColor Red
        $errors++
    }
    
    if ($packageContent -match '"main": "public/electron.js"') {
        Write-Host "✅ main entry point configured" -ForegroundColor Green
    }
    else {
        Write-Host "❌ main entry point missing or incorrect" -ForegroundColor Red
        $errors++
    }
    
    if ($packageContent -match '"build":') {
        Write-Host "✅ build configuration found" -ForegroundColor Green
    }
    else {
        Write-Host "❌ electron-builder build configuration missing" -ForegroundColor Red
        $errors++
    }
}

# Summary
Write-Host ""
Write-Host "📊 Error Check Summary:" -ForegroundColor Cyan
if ($errors -eq 0) {
    Write-Host "✅ No critical errors found!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🚀 Your GST Pro project looks ready for release!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:"
    Write-Host "1. Open Git Bash or WSL terminal (not PowerShell)"
    Write-Host "2. Run: cd frontend && yarn install"
    Write-Host "3. Test build: ./build-desktop.sh"
    Write-Host "4. Create release: ./prepare-release.sh 1.0.0"
}
else {
    Write-Host "❌ Found $errors error(s) that need to be fixed." -ForegroundColor Red
    Write-Host ""
    Write-Host "🔧 Fix these issues before proceeding with the release." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "💡 Important: Use Git Bash, WSL, or Codespace terminal (bash) for building, not PowerShell." -ForegroundColor Yellow

exit $errors
