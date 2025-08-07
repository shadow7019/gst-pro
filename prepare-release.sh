#!/bin/bash

# GST Pro Release Preparation Script
# This script prepares the software for release

set -e

echo "🚀 Preparing GST Pro for Release..."

# Check if version is provided
if [ -z "$1" ]; then
    echo "❌ Error: Please provide a version number"
    echo "Usage: ./prepare-release.sh 1.0.0"
    exit 1
fi

VERSION=$1
TAG_NAME="v${VERSION}"

echo "📦 Preparing release version: ${VERSION}"

# Update package.json version
echo "📝 Updating package.json version..."
cd frontend
npm version ${VERSION} --no-git-tag-version
cd ..

# Update version in README if needed
echo "📝 Updating README version references..."
sed -i.bak "s/GST-Pro-Setup-x\.x\.x\.exe/GST-Pro-Setup-${VERSION}.exe/g" README.md
sed -i.bak "s/GST-Pro-x\.x\.x\.dmg/GST-Pro-${VERSION}.dmg/g" README.md  
sed -i.bak "s/GST-Pro-x\.x\.x\.AppImage/GST-Pro-${VERSION}.AppImage/g" README.md
rm -f README.md.bak

# Create git tag
echo "🏷️  Creating git tag: ${TAG_NAME}"
git add .
git commit -m "Release version ${VERSION}" || echo "No changes to commit"
git tag -a ${TAG_NAME} -m "Release version ${VERSION}"

echo ""
echo "✅ Release preparation complete!"
echo ""
echo "📋 Next steps:"
echo "1. Push the changes: git push origin main"
echo "2. Push the tag: git push origin ${TAG_NAME}"
echo "3. GitHub Actions will automatically build and create the release"
echo ""
echo "🔗 Release will be available at:"
echo "   https://github.com/shadow7019/gst-pro/releases/tag/${TAG_NAME}"
echo ""
echo "📦 Manual build option:"
echo "   ./build-desktop.sh"
echo ""
