#!/bin/bash

echo "🚀 Building GST Pro Desktop Application..."

# Exit on any error
set -e

# Step 1: Build the backend executable
echo "📦 Step 1: Building backend executable..."
cd backend

# Check if Python is available
if ! command -v python &> /dev/null; then
    if ! command -v python3 &> /dev/null; then
        echo "❌ Error: Python not found. Please install Python 3.8+"
        exit 1
    else
        echo "Using python3 command"
        PYTHON_CMD="python3"
    fi
else
    PYTHON_CMD="python"
fi

# Install dependencies if needed
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    $PYTHON_CMD -m venv venv
fi

# Activate virtual environment
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]]; then
    source venv/Scripts/activate
else
    source venv/bin/activate
fi

# Install requirements
echo "Installing Python dependencies..."
pip install -r requirements_standalone.txt
pip install pyinstaller

# Build executable
$PYTHON_CMD build_executable.py
if [ $? -ne 0 ]; then
    echo "❌ Backend build failed!"
    exit 1
fi

# Step 2: Copy backend to frontend for packaging
echo "📁 Step 2: Preparing files for packaging..."
cd ../frontend
mkdir -p backend

if [ -d "../backend/dist" ]; then
    cp -r ../backend/dist/* backend/ || echo "Warning: Could not copy some backend files"
else
    echo "Warning: No backend dist directory found"
fi

if [ -f "../backend/gst_data.db" ]; then
    cp ../backend/gst_data.db backend/ || echo "Warning: Could not copy database"
else
    echo "Note: No existing database to copy"
fi

# Step 3: Install Node.js dependencies
echo "📦 Step 3: Installing Node.js dependencies..."
if ! command -v yarn &> /dev/null; then
    echo "❌ Error: Yarn not found. Please install Yarn"
    echo "Run: npm install -g yarn"
    exit 1
fi

yarn install --frozen-lockfile
if [ $? -ne 0 ]; then
    echo "❌ Node.js dependencies installation failed!"
    exit 1
fi

# Step 4: Build React app
echo "⚛️  Step 4: Building React frontend..."
yarn build
if [ $? -ne 0 ]; then
    echo "❌ Frontend build failed!"
    exit 1
fi

# Step 5: Build Electron app
echo "🖥️  Step 5: Building Electron desktop app..."
yarn electron-builder --publish never
if [ $? -ne 0 ]; then
    echo "❌ Electron build failed!"
    exit 1
fi

echo ""
echo "🎉 BUILD COMPLETE!"
echo ""
echo "📦 Desktop installers created in: frontend/dist/"
echo "📁 Available formats:"
ls -la dist/ 2>/dev/null || echo "No dist directory found"
echo ""
echo "🌐 Web build created in: frontend/build/"
echo "� Web build files:"
ls -la build/ 2>/dev/null || echo "Web build directory found"
echo ""
echo "�🚀 To test the desktop app:"
echo "   yarn electron-dev"
echo ""
echo "🌍 To test the web version locally:"
echo "   cd frontend && npx serve -s build -p 3000"
echo ""
echo "💾 To install and run desktop version:"
echo "   - Windows: Run the .exe installer from dist/"
echo "   - macOS: Open the .dmg file from dist/"
echo "   - Linux: Run the .AppImage file from dist/"
echo ""
echo "☁️ For Netlify deployment:"
echo "   - Web build is ready in frontend/build/"
echo "   - netlify.toml configuration is set up"
echo "   - Connect your GitHub repo to Netlify for auto-deployment"