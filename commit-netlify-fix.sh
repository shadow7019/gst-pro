#!/bin/bash
# Git Commands to Commit and Push Netlify Fixes

echo "🚀 Committing Netlify Configuration Fixes..."

# Stage the files
git add netlify.toml
git add NETLIFY-FIX-GUIDE.md
git add GIT-COMMIT-COMMANDS.md

# Check what's being committed
echo "📋 Files to be committed:"
git status --porcelain

# Commit with descriptive message
git commit -m "Fix Netlify deployment configuration

- Simplify netlify.toml to resolve TOML parsing errors
- Remove complex CSP headers that caused parsing failures
- Add comprehensive deployment troubleshooting guide
- Maintain essential build settings and security headers
- Ready for production deployment"

# Push to GitHub
git push origin main

echo "✅ Successfully pushed Netlify configuration fixes!"
echo "🌐 Your GST Pro app should now deploy successfully on Netlify!"
