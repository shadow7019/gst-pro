#!/bin/bash

echo "🌐 Building GST Pro Web Application for Netlify Deployment..."

# Exit on any error
set -e

# Navigate to frontend directory
cd frontend

# Step 1: Clean previous builds
echo "🧹 Step 1: Cleaning previous builds..."
rm -rf build/
rm -rf node_modules/.cache/

# Step 2: Install Node.js dependencies
echo "📦 Step 2: Installing Node.js dependencies..."

# Check if yarn is available
if command -v yarn &> /dev/null; then
    echo "Using Yarn package manager"
    yarn install --frozen-lockfile --production=false
else
    echo "Using NPM package manager"
    npm ci --include=dev
fi

# Step 3: Build React app for production
echo "⚛️  Step 3: Building React frontend for production..."

# Set environment for production
export NODE_ENV=production
export GENERATE_SOURCEMAP=false
export INLINE_RUNTIME_CHUNK=false

# Build the app
if command -v yarn &> /dev/null; then
    yarn build
else
    npm run build
fi

if [ $? -ne 0 ]; then
    echo "❌ Frontend build failed!"
    exit 1
fi

# Step 4: Optimize build
echo "⚡ Step 4: Optimizing build files..."

# Create .nojekyll file to prevent GitHub Pages from ignoring files starting with underscore
touch build/.nojekyll

# Create robots.txt if it doesn't exist
if [ ! -f build/robots.txt ]; then
    cat > build/robots.txt << EOF
User-agent: *
Allow: /

Sitemap: https://your-domain.netlify.app/sitemap.xml
EOF
fi

# Create a simple manifest.json if it doesn't exist
if [ ! -f build/manifest.json ]; then
    cat > build/manifest.json << EOF
{
  "short_name": "GST Pro",
  "name": "GST Pro - Automated GST & Tax Platform",
  "icons": [
    {
      "src": "favicon.ico",
      "sizes": "64x64 32x32 24x24 16x16",
      "type": "image/x-icon"
    }
  ],
  "start_url": ".",
  "display": "standalone",
  "theme_color": "#000000",
  "background_color": "#ffffff"
}
EOF
fi

# Step 5: Create _redirects file for Netlify (backup for netlify.toml)
echo "🔄 Step 5: Creating Netlify redirects..."
cat > build/_redirects << EOF
# SPA fallback
/*    /index.html   200

# API proxy (if needed for development)
/api/*  http://localhost:8001/api/:splat  200

# Security headers
/*
  X-Frame-Options: DENY
  X-XSS-Protection: 1; mode=block
  X-Content-Type-Options: nosniff
EOF

# Step 6: Generate sitemap
echo "🗺️  Step 6: Generating sitemap..."
cat > build/sitemap.xml << EOF
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://your-domain.netlify.app/</loc>
    <lastmod>$(date +%Y-%m-%d)</lastmod>
    <priority>1.0</priority>
  </url>
</urlset>
EOF

# Step 7: Verify build
echo "✅ Step 7: Verifying build integrity..."

# Check if essential files exist
if [ ! -f build/index.html ]; then
    echo "❌ Error: index.html not found in build directory"
    exit 1
fi

if [ ! -d build/static ]; then
    echo "❌ Error: static directory not found in build directory"
    exit 1
fi

# Calculate build size
BUILD_SIZE=$(du -sh build/ | cut -f1)
echo "📊 Build size: $BUILD_SIZE"

# Count files
FILE_COUNT=$(find build/ -type f | wc -l)
echo "📄 Total files: $FILE_COUNT"

echo ""
echo "🎉 WEB BUILD COMPLETE!"
echo ""
echo "📁 Build location: frontend/build/"
echo "📊 Build size: $BUILD_SIZE"
echo "📄 Total files: $FILE_COUNT"
echo ""
echo "🌐 Ready for deployment to:"
echo "   - Netlify (recommended)"
echo "   - Vercel"  
echo "   - GitHub Pages"
echo "   - Any static hosting service"
echo ""
echo "☁️ Netlify Deployment:"
echo "   1. Connect your GitHub repo to Netlify"
echo "   2. Netlify will auto-detect the netlify.toml config"
echo "   3. Build command: 'cd frontend && npm run build'"
echo "   4. Publish directory: 'frontend/build'"
echo ""
echo "🔧 Manual deployment:"
echo "   Upload the contents of 'frontend/build/' to your hosting service"
echo ""
echo "🧪 Test locally:"
echo "   npx serve -s build -p 3000"
