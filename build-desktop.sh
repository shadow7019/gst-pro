#!/bin/bash

echo "🚀 Building GST Pro Desktop Application..."

# Step 1: Build the backend executable
echo "📦 Step 1: Building backend executable..."
cd backend
python build_executable.py
if [ $? -ne 0 ]; then
    echo "❌ Backend build failed!"
    exit 1
fi

# Step 2: Copy backend to frontend for packaging
echo "📁 Step 2: Preparing files for packaging..."
cd ../frontend
mkdir -p backend
cp -r ../backend/dist/* backend/
cp ../backend/gst_data.db backend/ 2>/dev/null || echo "No existing database to copy"

# Step 3: Build React app
echo "⚛️  Step 3: Building React frontend..."
yarn build
if [ $? -ne 0 ]; then
    echo "❌ Frontend build failed!"
    exit 1
fi

# Step 4: Build Electron app
echo "🖥️  Step 4: Building Electron desktop app..."
yarn electron-build

echo ""
echo "🎉 BUILD COMPLETE!"
echo ""
echo "📦 Desktop installers created in: frontend/dist/"
echo "📁 Available formats:"
ls -la dist/ 2>/dev/null || echo "No dist directory found"
echo ""
echo "🚀 To test the desktop app:"
echo "   yarn electron-dev"
echo ""
echo "💾 To install and run:"
echo "   - Windows: Run the .exe installer from dist/"
echo "   - macOS: Open the .dmg file from dist/"
echo "   - Linux: Run the .AppImage file from dist/"