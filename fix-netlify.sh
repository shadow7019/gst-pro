#!/bin/bash

echo "🔧 Netlify Configuration Fix & Validator"
echo "========================================"

# Step 1: Check if netlify.toml exists
if [ ! -f "netlify.toml" ]; then
    echo "❌ netlify.toml not found!"
    echo "Creating a minimal working version..."
    
    cat > netlify.toml << 'EOF'
[build]
  command = "cd frontend && npm install && npm run build"
  publish = "frontend/build"

[build.environment]
  NODE_VERSION = "18"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
EOF
    
    echo "✅ Created minimal netlify.toml"
else
    echo "✅ netlify.toml found"
fi

# Step 2: Validate TOML syntax
echo ""
echo "🔍 Validating TOML syntax..."

# Check for common syntax errors
if grep -q '^[[:space:]]*[^#\[].*=' netlify.toml; then
    echo "✅ Key-value pairs look valid"
else
    echo "⚠️  No key-value pairs found"
fi

# Check for section headers
SECTIONS=$(grep -c '^\[.*\]' netlify.toml)
echo "✅ Found $SECTIONS section headers"

# Check for double brackets (arrays)
ARRAYS=$(grep -c '^\[\[.*\]\]' netlify.toml)
echo "✅ Found $ARRAYS array sections"

# Check for quotes consistency
UNMATCHED_QUOTES=$(grep -o '"' netlify.toml | wc -l)
if [ $((UNMATCHED_QUOTES % 2)) -eq 0 ]; then
    echo "✅ Quotes appear balanced"
else
    echo "❌ Unbalanced quotes detected!"
fi

# Step 3: Check required sections
echo ""
echo "📋 Checking required configurations..."

if grep -q '\[build\]' netlify.toml; then
    echo "✅ [build] section found"
    
    if grep -q 'command.*=' netlify.toml; then
        BUILD_CMD=$(grep 'command.*=' netlify.toml | head -1 | sed 's/.*command.*=.*"\(.*\)".*/\1/')
        echo "   Build command: $BUILD_CMD"
    else
        echo "❌ No build command found"
    fi
    
    if grep -q 'publish.*=' netlify.toml; then
        PUBLISH_DIR=$(grep 'publish.*=' netlify.toml | head -1 | sed 's/.*publish.*=.*"\(.*\)".*/\1/')
        echo "   Publish directory: $PUBLISH_DIR"
    else
        echo "❌ No publish directory found"
    fi
else
    echo "❌ [build] section missing"
fi

# Step 4: Test with Python TOML parser (if available)
echo ""
echo "🐍 Testing with Python TOML parser..."

if command -v python3 &> /dev/null; then
    python3 -c "
import sys
try:
    import tomllib
    with open('netlify.toml', 'rb') as f:
        data = tomllib.load(f)
    print('✅ TOML syntax is valid!')
    if 'build' in data:
        print(f'   Build command: {data[\"build\"].get(\"command\", \"Not set\")}')
        print(f'   Publish dir: {data[\"build\"].get(\"publish\", \"Not set\")}')
except ImportError:
    try:
        import toml
        with open('netlify.toml', 'r') as f:
            data = toml.load(f)
        print('✅ TOML syntax is valid!')
    except ImportError:
        print('⚠️  Python TOML parser not available')
except Exception as e:
    print(f'❌ TOML parsing error: {e}')
" 2>/dev/null || echo "⚠️  Python TOML validation not available"
else
    echo "⚠️  Python not found, skipping TOML validation"
fi

# Step 5: Check project structure
echo ""
echo "📁 Validating project structure..."

if [ -d "frontend" ]; then
    echo "✅ frontend/ directory exists"
    
    if [ -f "frontend/package.json" ]; then
        echo "✅ frontend/package.json exists"
        
        if grep -q '"build".*:' frontend/package.json; then
            echo "✅ build script found in package.json"
        else
            echo "❌ No build script in package.json"
        fi
    else
        echo "❌ frontend/package.json missing"
    fi
else
    echo "❌ frontend/ directory missing"
fi

# Step 6: Show final recommendations
echo ""
echo "🚀 Final Recommendations:"
echo "========================"

if [ -f "netlify.toml" ]; then
    echo "1. ✅ Commit the fixed netlify.toml:"
    echo "   git add netlify.toml"
    echo "   git commit -m 'Fix Netlify configuration syntax'"
    echo "   git push origin main"
    echo ""
    echo "2. ✅ If issues persist, use the minimal version:"
    echo "   cp netlify-minimal.toml netlify.toml"
    echo ""
    echo "3. ✅ Manual Netlify settings (backup):"
    echo "   Build command: cd frontend && npm install && npm run build"
    echo "   Publish directory: frontend/build"
    echo "   Node version: 18"
fi

echo ""
echo "📊 Current netlify.toml content:"
echo "==============================="
cat netlify.toml
echo ""
echo "==============================="
