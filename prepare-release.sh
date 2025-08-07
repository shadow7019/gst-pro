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

# Check if we're in the right directory
if [ ! -f "frontend/package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Update package.json version
echo "📝 Updating package.json version..."
cd frontend

# Use different commands based on what's available
if command -v npm &> /dev/null; then
    npm version ${VERSION} --no-git-tag-version
elif command -v yarn &> /dev/null; then
    yarn version --new-version ${VERSION} --no-git-tag-version
else
    echo "❌ Error: Neither npm nor yarn found"
    exit 1
fi

cd ..

# Update version in README if needed
echo "📝 Updating README version references..."
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    sed -i '' "s/GST-Pro-Setup-[0-9]\+\.[0-9]\+\.[0-9]\+\.exe/GST-Pro-Setup-${VERSION}.exe/g" README.md
    sed -i '' "s/GST-Pro-[0-9]\+\.[0-9]\+\.[0-9]\+\.dmg/GST-Pro-${VERSION}.dmg/g" README.md  
    sed -i '' "s/GST-Pro-[0-9]\+\.[0-9]\+\.[0-9]\+\.AppImage/GST-Pro-${VERSION}.AppImage/g" README.md
    sed -i '' "s/Download GST Pro v[0-9]\+\.[0-9]\+\.[0-9]\+/Download GST Pro v${VERSION}/g" README.md
else
    # Linux and others
    sed -i "s/GST-Pro-Setup-[0-9]\+\.[0-9]\+\.[0-9]\+\.exe/GST-Pro-Setup-${VERSION}.exe/g" README.md
    sed -i "s/GST-Pro-[0-9]\+\.[0-9]\+\.[0-9]\+\.dmg/GST-Pro-${VERSION}.dmg/g" README.md  
    sed -i "s/GST-Pro-[0-9]\+\.[0-9]\+\.[0-9]\+\.AppImage/GST-Pro-${VERSION}.AppImage/g" README.md
    sed -i "s/Download GST Pro v[0-9]\+\.[0-9]\+\.[0-9]\+/Download GST Pro v${VERSION}/g" README.md
fi

# Check if git is available
if ! command -v git &> /dev/null; then
    echo "❌ Error: Git not found"
    exit 1
fi

# Create git tag
echo "🏷️  Creating git tag: ${TAG_NAME}"
git add .
git commit -m "Release version ${VERSION}

- Update version to ${VERSION}
- Update README with new version numbers
- Prepare for release" || echo "No changes to commit"

git tag -a ${TAG_NAME} -m "GST Pro ${TAG_NAME} - Release

🎉 GST Pro Desktop Application Release ${VERSION}

✨ Features:
- Complete offline GST calculations for Indian businesses
- Expense tracking with automatic GST calculation
- Income management and comprehensive reporting
- AI-powered tax consultation and guidance
- Cross-platform desktop app (Windows, macOS, Linux)
- Local SQLite database - 100% privacy focused
- Modern React UI with Shadcn/ui components

🔧 Technical:
- Python FastAPI backend with standalone executable
- React 18 frontend with TypeScript support
- Electron desktop framework for cross-platform compatibility
- Automated build system with professional installers
- Complete offline operation with no dependencies

📦 Downloads:
- Windows: GST-Pro-Setup-${VERSION}.exe
- macOS: GST-Pro-${VERSION}.dmg  
- Linux: GST-Pro-${VERSION}.AppImage

🛡️ Privacy & Security:
- 100% local data storage
- No external data transmission
- Secure SQLite database
- No telemetry or tracking"

echo ""
echo "✅ Release preparation complete!"
echo ""
echo "📋 Next steps:"
echo "1. Review the changes: git log --oneline -5"
echo "2. Push the changes: git push origin main"
echo "3. Push the tag: git push origin ${TAG_NAME}"
echo "4. GitHub Actions will automatically build and create the release"
echo ""
echo "🔗 Release will be available at:"
echo "   https://github.com/shadow7019/gst-pro/releases/tag/${TAG_NAME}"
echo ""
echo "📦 Manual build option (if needed):"
echo "   ./build-desktop.sh"
echo ""
