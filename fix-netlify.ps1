# PowerShell Netlify Configuration Fix & Validator

Write-Host "🔧 Netlify Configuration Fix & Validator" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Step 1: Check if netlify.toml exists
if (!(Test-Path "netlify.toml")) {
    Write-Host "❌ netlify.toml not found!" -ForegroundColor Red
    Write-Host "Creating a minimal working version..." -ForegroundColor Yellow
    
    @'
[build]
  command = "cd frontend && npm install && npm run build"
  publish = "frontend/build"

[build.environment]
  NODE_VERSION = "18"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
'@ | Out-File -FilePath "netlify.toml" -Encoding UTF8
    
    Write-Host "✅ Created minimal netlify.toml" -ForegroundColor Green
} else {
    Write-Host "✅ netlify.toml found" -ForegroundColor Green
}

# Step 2: Validate TOML syntax
Write-Host ""
Write-Host "🔍 Validating TOML syntax..." -ForegroundColor Yellow

$content = Get-Content "netlify.toml" -Raw

# Check for key-value pairs
if ($content -match '^\s*[^#\[].*=') {
    Write-Host "✅ Key-value pairs look valid" -ForegroundColor Green
} else {
    Write-Host "⚠️  No key-value pairs found" -ForegroundColor Yellow
}

# Check for section headers
$sections = ($content | Select-String -Pattern '^\[.*\]' -AllMatches).Matches.Count
Write-Host "✅ Found $sections section headers" -ForegroundColor Green

# Check for double brackets (arrays)
$arrays = ($content | Select-String -Pattern '^\[\[.*\]\]' -AllMatches).Matches.Count
Write-Host "✅ Found $arrays array sections" -ForegroundColor Green

# Check for quotes consistency
$quotes = ($content | Select-String -Pattern '"' -AllMatches).Matches.Count
if ($quotes % 2 -eq 0) {
    Write-Host "✅ Quotes appear balanced" -ForegroundColor Green
} else {
    Write-Host "❌ Unbalanced quotes detected!" -ForegroundColor Red
}

# Step 3: Check required sections
Write-Host ""
Write-Host "📋 Checking required configurations..." -ForegroundColor Yellow

if ($content -match '\[build\]') {
    Write-Host "✅ [build] section found" -ForegroundColor Green
    
    if ($content -match 'command\s*=\s*"([^"]*)"') {
        $buildCmd = $matches[1]
        Write-Host "   Build command: $buildCmd" -ForegroundColor White
    } else {
        Write-Host "❌ No build command found" -ForegroundColor Red
    }
    
    if ($content -match 'publish\s*=\s*"([^"]*)"') {
        $publishDir = $matches[1]
        Write-Host "   Publish directory: $publishDir" -ForegroundColor White
    } else {
        Write-Host "❌ No publish directory found" -ForegroundColor Red
    }
} else {
    Write-Host "❌ [build] section missing" -ForegroundColor Red
}

# Step 4: Check project structure
Write-Host ""
Write-Host "📁 Validating project structure..." -ForegroundColor Yellow

if (Test-Path "frontend") {
    Write-Host "✅ frontend/ directory exists" -ForegroundColor Green
    
    if (Test-Path "frontend/package.json") {
        Write-Host "✅ frontend/package.json exists" -ForegroundColor Green
        
        $packageJson = Get-Content "frontend/package.json" -Raw
        if ($packageJson -match '"build".*:') {
            Write-Host "✅ build script found in package.json" -ForegroundColor Green
        } else {
            Write-Host "❌ No build script in package.json" -ForegroundColor Red
        }
    } else {
        Write-Host "❌ frontend/package.json missing" -ForegroundColor Red
    }
} else {
    Write-Host "❌ frontend/ directory missing" -ForegroundColor Red
}

# Step 5: Show final recommendations
Write-Host ""
Write-Host "🚀 Final Recommendations:" -ForegroundColor Cyan
Write-Host "========================" -ForegroundColor Cyan

if (Test-Path "netlify.toml") {
    Write-Host "1. ✅ Commit the fixed netlify.toml:" -ForegroundColor Green
    Write-Host "   git add netlify.toml" -ForegroundColor White
    Write-Host "   git commit -m `"Fix Netlify configuration syntax`"" -ForegroundColor White
    Write-Host "   git push origin main" -ForegroundColor White
    Write-Host ""
    Write-Host "2. ✅ If issues persist, use the minimal version:" -ForegroundColor Green
    Write-Host "   copy netlify-minimal.toml netlify.toml" -ForegroundColor White
    Write-Host ""
    Write-Host "3. ✅ Manual Netlify settings (backup):" -ForegroundColor Green
    Write-Host "   Build command: cd frontend && npm install && npm run build" -ForegroundColor White
    Write-Host "   Publish directory: frontend/build" -ForegroundColor White
    Write-Host "   Node version: 18" -ForegroundColor White
}

Write-Host ""
Write-Host "📊 Current netlify.toml content:" -ForegroundColor Cyan
Write-Host "===============================" -ForegroundColor Cyan
Get-Content "netlify.toml"
Write-Host "===============================" -ForegroundColor Cyan
