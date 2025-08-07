#!/bin/bash

# GST Pro Error Checker
# This script checks for common configuration errors

echo "🔍 Checking GST Pro for configuration errors..."
echo ""

ERRORS=0

# Check JSON syntax
echo "📋 Checking JSON files..."
if command -v node >/dev/null 2>&1; then
    if cd frontend && node -pe "JSON.parse(require('fs').readFileSync('package.json', 'utf8')); 'package.json is valid'" 2>/dev/null; then
        echo "✅ frontend/package.json - Valid JSON"
    else
        echo "❌ frontend/package.json - Invalid JSON syntax"
        ERRORS=$((ERRORS + 1))
    fi
    cd ..
else
    echo "⚠️  Node.js not found, skipping JSON validation"
fi

# Check YAML syntax (basic)
echo ""
echo "📋 Checking YAML files..."
YAML_FILE=".github/workflows/release.yml"
if [ -f "$YAML_FILE" ]; then
    # Check for basic YAML issues
    if grep -q "^[[:space:]]*[[:space:]]shell: bash$" "$YAML_FILE"; then
        echo "⚠️  Potential YAML indentation issue in $YAML_FILE"
    fi
    
    # Check for missing shell specifications
    if grep -q "shell: bash" "$YAML_FILE" && grep -q "shell: powershell" "$YAML_FILE"; then
        echo "✅ Shell specifications look good"
    else
        echo "⚠️  Check shell specifications in GitHub Actions"
    fi
    
    echo "✅ $YAML_FILE exists"
else
    echo "❌ $YAML_FILE not found"
    ERRORS=$((ERRORS + 1))
fi

# Check for executable permissions
echo ""
echo "🔨 Checking script permissions..."
for script in "build-desktop.sh" "prepare-release.sh" "check-system.sh"; do
    if [ -f "$script" ]; then
        if [ -x "$script" ]; then
            echo "✅ $script is executable"
        else
            echo "⚠️  $script needs execute permission: chmod +x $script"
        fi
    else
        echo "❌ $script not found"
        ERRORS=$((ERRORS + 1))
    fi
done

# Check required directories
echo ""
echo "📁 Checking directory structure..."
REQUIRED_DIRS=("backend" "frontend" "frontend/public" "frontend/src" ".github" ".github/workflows")
for dir in "${REQUIRED_DIRS[@]}"; do
    if [ -d "$dir" ]; then
        echo "✅ $dir/ exists"
    else
        echo "❌ $dir/ missing"
        ERRORS=$((ERRORS + 1))
    fi
done

# Check required files
echo ""
echo "📄 Checking required files..."
REQUIRED_FILES=(
    "frontend/package.json"
    "backend/server.py" 
    "backend/build_executable.py"
    "backend/requirements_standalone.txt"
    "frontend/public/electron.js"
    "LICENSE"
    "CHANGELOG.md"
    "CONTRIBUTING.md"
    "SECURITY.md"
    ".github/workflows/release.yml"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file"
    else
        echo "❌ $file missing"
        ERRORS=$((ERRORS + 1))
    fi
done

# Check package.json key fields
echo ""
echo "📦 Checking package.json configuration..."
if [ -f "frontend/package.json" ]; then
    if grep -q '"electron-builder"' frontend/package.json; then
        echo "✅ electron-builder dependency found"
    else
        echo "❌ electron-builder missing from devDependencies"
        ERRORS=$((ERRORS + 1))
    fi
    
    if grep -q '"main": "public/electron.js"' frontend/package.json; then
        echo "✅ main entry point configured"
    else
        echo "❌ main entry point missing or incorrect"
        ERRORS=$((ERRORS + 1))
    fi
    
    if grep -q '"build":' frontend/package.json; then
        echo "✅ build configuration found"
    else
        echo "❌ electron-builder build configuration missing"
        ERRORS=$((ERRORS + 1))
    fi
fi

# Summary
echo ""
echo "📊 Error Check Summary:"
if [ $ERRORS -eq 0 ]; then
    echo "✅ No critical errors found!"
    echo ""
    echo "🚀 Your GST Pro project looks ready for release!"
    echo ""
    echo "Next steps:"
    echo "1. Run: cd frontend && yarn install"
    echo "2. Test build: ./build-desktop.sh"
    echo "3. Create release: ./prepare-release.sh 1.0.0"
else
    echo "❌ Found $ERRORS error(s) that need to be fixed."
    echo ""
    echo "🔧 Fix these issues before proceeding with the release."
fi

echo ""
echo "💡 If you're seeing terminal errors, make sure you're using bash/zsh terminal, not PowerShell."

exit $ERRORS
