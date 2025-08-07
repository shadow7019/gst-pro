#!/bin/bash

echo "🔍 GST Pro - Netlify Configuration Validator"
echo "=============================================="

# Check if we're in the right directory
if [ ! -f "netlify.toml" ]; then
    echo "❌ Error: netlify.toml not found in current directory"
    echo "   Run this script from the project root"
    exit 1
fi

echo "✅ netlify.toml found"

# Validate netlify.toml syntax
echo ""
echo "🔧 Validating netlify.toml configuration..."

# Check for required sections
if grep -q "\[build\]" netlify.toml; then
    echo "✅ [build] section found"
else
    echo "❌ [build] section missing"
fi

if grep -q "command" netlify.toml; then
    echo "✅ build command defined"
    echo "   Command: $(grep 'command =' netlify.toml | cut -d'"' -f2)"
else
    echo "❌ build command missing"
fi

if grep -q "publish" netlify.toml; then
    echo "✅ publish directory defined"
    echo "   Directory: $(grep 'publish =' netlify.toml | cut -d'"' -f2)"
else
    echo "❌ publish directory missing"
fi

# Check if frontend directory exists
echo ""
echo "📁 Checking project structure..."

if [ -d "frontend" ]; then
    echo "✅ frontend directory found"
else
    echo "❌ frontend directory missing"
fi

if [ -f "frontend/package.json" ]; then
    echo "✅ frontend/package.json found"
    
    # Check for required scripts
    if grep -q '"build":' frontend/package.json; then
        echo "✅ build script found in package.json"
    else
        echo "❌ build script missing in package.json"
    fi
else
    echo "❌ frontend/package.json missing"
fi

# Check build scripts
echo ""
echo "🛠️  Checking build scripts..."

if [ -f "build-web.sh" ]; then
    echo "✅ build-web.sh found"
else
    echo "❌ build-web.sh missing"
fi

if [ -f "build-desktop.sh" ]; then
    echo "✅ build-desktop.sh found"
else
    echo "❌ build-desktop.sh missing"
fi

# Test netlify.toml syntax by attempting to parse it
echo ""
echo "🧪 Testing configuration syntax..."

# Simple syntax check - look for common errors
if grep -q "base.*=.*\".*\"" netlify.toml; then
    BASE_DIR=$(grep 'base =' netlify.toml | cut -d'"' -f2)
    if [ -n "$BASE_DIR" ] && [ ! -d "$BASE_DIR" ]; then
        echo "❌ Base directory '$BASE_DIR' does not exist"
        echo "   This will cause 'Base directory does not exist' error"
    else
        echo "✅ Base directory configuration valid"
    fi
else
    echo "✅ No base directory specified (building from root)"
fi

# Check for environment variables section
if grep -q "\[build.environment\]" netlify.toml; then
    echo "✅ Build environment section found"
    
    if grep -q "NODE_VERSION" netlify.toml; then
        NODE_VER=$(grep 'NODE_VERSION =' netlify.toml | cut -d'"' -f2)
        echo "   Node.js version: $NODE_VER"
    fi
else
    echo "⚠️  No build environment section (using defaults)"
fi

# Check for redirects (SPA support)
if grep -q "\[\[redirects\]\]" netlify.toml; then
    echo "✅ SPA redirects configured"
else
    echo "⚠️  No SPA redirects (may break React Router)"
fi

echo ""
echo "📊 Configuration Summary:"
echo "========================="

if [ -f "netlify.toml" ]; then
    echo "Build Command: $(grep 'command =' netlify.toml | cut -d'"' -f2 | head -1)"
    echo "Publish Dir:   $(grep 'publish =' netlify.toml | cut -d'"' -f2 | head -1)"
    echo "Node Version:  $(grep 'NODE_VERSION =' netlify.toml | cut -d'"' -f2 | head -1)"
fi

echo ""
echo "🚀 Next Steps:"
echo "=============="
echo "1. Commit and push netlify.toml to your repository"
echo "2. Connect your repo to Netlify"
echo "3. Netlify will auto-detect the configuration"
echo "4. Your site will be built using the specified settings"
echo ""
echo "📝 Manual Netlify Settings (if needed):"
echo "   Build command: cd frontend && npm install && npm run build"
echo "   Publish directory: frontend/build"
echo "   Production branch: main"
echo ""

if [ -f "NETLIFY_DEPLOYMENT.md" ]; then
    echo "📚 For detailed instructions, see: NETLIFY_DEPLOYMENT.md"
else
    echo "📚 For more help, visit: https://docs.netlify.com/"
fi
