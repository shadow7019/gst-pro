#!/bin/bash

# GST Pro System Check Script
# This script checks for common issues and dependencies

echo "🔍 GST Pro System Check..."
echo ""

ERRORS=0

# Check if we're in the right directory
if [ ! -f "frontend/package.json" ] || [ ! -f "backend/server.py" ]; then
    echo "❌ Error: Please run this script from the GST Pro project root directory"
    ERRORS=$((ERRORS + 1))
else
    echo "✅ Project structure looks good"
fi

# Check Python
echo ""
echo "🐍 Checking Python..."
if command -v python &> /dev/null; then
    PYTHON_VERSION=$(python --version 2>&1)
    echo "✅ Found: $PYTHON_VERSION"
elif command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version 2>&1)
    echo "✅ Found: $PYTHON_VERSION"
else
    echo "❌ Python not found. Please install Python 3.8+"
    ERRORS=$((ERRORS + 1))
fi

# Check pip
if command -v pip &> /dev/null; then
    echo "✅ pip is available"
elif command -v pip3 &> /dev/null; then
    echo "✅ pip3 is available"
else
    echo "❌ pip not found"
    ERRORS=$((ERRORS + 1))
fi

# Check Node.js
echo ""
echo "📦 Checking Node.js..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo "✅ Found Node.js: $NODE_VERSION"
    
    # Check if version is >= 16
    NODE_MAJOR=$(echo $NODE_VERSION | cut -d'.' -f1 | sed 's/v//')
    if [ "$NODE_MAJOR" -lt 16 ]; then
        echo "⚠️  Warning: Node.js 16+ recommended (you have v$NODE_MAJOR)"
    fi
else
    echo "❌ Node.js not found. Please install Node.js 16+"
    ERRORS=$((ERRORS + 1))
fi

# Check npm
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    echo "✅ Found npm: $NPM_VERSION"
else
    echo "❌ npm not found"
    ERRORS=$((ERRORS + 1))
fi

# Check yarn
if command -v yarn &> /dev/null; then
    YARN_VERSION=$(yarn --version)
    echo "✅ Found yarn: $YARN_VERSION"
else
    echo "❌ yarn not found. Install with: npm install -g yarn"
    ERRORS=$((ERRORS + 1))
fi

# Check Git
echo ""
echo "🔧 Checking Git..."
if command -v git &> /dev/null; then
    GIT_VERSION=$(git --version)
    echo "✅ Found: $GIT_VERSION"
else
    echo "❌ Git not found. Please install Git"
    ERRORS=$((ERRORS + 1))
fi

# Check backend dependencies
echo ""
echo "📋 Checking Backend Dependencies..."
if [ -f "backend/requirements_standalone.txt" ]; then
    echo "✅ requirements_standalone.txt found"
    if [ -d "backend/venv" ]; then
        echo "✅ Virtual environment exists"
    else
        echo "⚠️  No virtual environment found (will be created during build)"
    fi
else
    echo "❌ backend/requirements_standalone.txt not found"
    ERRORS=$((ERRORS + 1))
fi

# Check frontend dependencies
echo ""
echo "📋 Checking Frontend Dependencies..."
if [ -f "frontend/package.json" ]; then
    echo "✅ package.json found"
    if [ -d "frontend/node_modules" ]; then
        echo "✅ node_modules exists"
    else
        echo "⚠️  node_modules not found. Run: cd frontend && yarn install"
    fi
    
    # Check for electron-builder
    if grep -q "electron-builder" frontend/package.json; then
        echo "✅ electron-builder configured"
    else
        echo "❌ electron-builder not found in package.json"
        ERRORS=$((ERRORS + 1))
    fi
else
    echo "❌ frontend/package.json not found"
    ERRORS=$((ERRORS + 1))
fi

# Check build scripts
echo ""
echo "🔨 Checking Build Scripts..."
if [ -f "build-desktop.sh" ]; then
    echo "✅ build-desktop.sh found"
    if [ -x "build-desktop.sh" ]; then
        echo "✅ build-desktop.sh is executable"
    else
        echo "⚠️  build-desktop.sh is not executable. Run: chmod +x build-desktop.sh"
    fi
else
    echo "❌ build-desktop.sh not found"
    ERRORS=$((ERRORS + 1))
fi

if [ -f "prepare-release.sh" ]; then
    echo "✅ prepare-release.sh found"
    if [ -x "prepare-release.sh" ]; then
        echo "✅ prepare-release.sh is executable"
    else
        echo "⚠️  prepare-release.sh is not executable. Run: chmod +x prepare-release.sh"
    fi
else
    echo "❌ prepare-release.sh not found"
    ERRORS=$((ERRORS + 1))
fi

# Summary
echo ""
echo "📊 Summary:"
if [ $ERRORS -eq 0 ]; then
    echo "✅ All checks passed! Your system is ready for GST Pro development."
    echo ""
    echo "🚀 Next steps:"
    echo "1. Install dependencies: cd frontend && yarn install"
    echo "2. Build desktop app: ./build-desktop.sh"
    echo "3. Create release: ./prepare-release.sh 1.0.0"
else
    echo "❌ Found $ERRORS issue(s). Please fix them before proceeding."
    echo ""
    echo "💡 Common fixes:"
    echo "- Install Python: https://python.org/downloads"
    echo "- Install Node.js: https://nodejs.org/download"
    echo "- Install yarn: npm install -g yarn"
    echo "- Install Git: https://git-scm.com/download"
fi

exit $ERRORS
