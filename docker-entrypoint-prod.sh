#!/bin/bash
set -e

echo "🚀 Starting Kiplombe Frontend (Production Mode)..."

# 1. Ensure dependencies are correct
if [ -d "node_modules" ] && [ "$(ls -A node_modules 2>/dev/null)" ]; then
    echo "✅ Dependencies already installed"
    MOD_COUNT=$(find node_modules -maxdepth 1 -type d 2>/dev/null | wc -l)
    echo "   Found $MOD_COUNT packages"
else
    echo "📦 Installing dependencies (this will take 3-5 minutes)..."
    echo "   This is normal for first startup - dependencies install at runtime"
    echo "   Progress will be shown below..."
    # Using --legacy-peer-deps to handle common UI library conflicts
    npm install --legacy-peer-deps --prefer-offline --no-audit --no-fund 2>&1 | while IFS= read -r line; do
        # Show progress for important messages
        if echo "$line" | grep -qE "(added|removed|changed|audited|found)"; then
            echo "   $line"
        fi
    done
    echo "✅ Dependencies installation completed!"
fi

# 2. Pre-Build Diagnostic (CRITICAL for debugging "Module Not Found")
echo "🔍 Running pre-build diagnostic..."
if [ -f "tsconfig.json" ]; then
    echo "✅ tsconfig.json found"
    # Check if the alias is defined
    grep -q "@/\*" tsconfig.json && echo "✅ Alias @/* defined in tsconfig" || echo "❌ Alias @/* MISSING in tsconfig"
else
    echo "❌ tsconfig.json NOT FOUND in $(pwd)"
fi

if [ -d "components/ui" ]; then
    echo "✅ components/ui directory found"
else
    echo "❌ components/ui directory NOT FOUND"
    ls -F
fi

# 3. Build only if .next doesn't exist or is incomplete
if [ -d ".next" ] && [ -f ".next/BUILD_ID" ] && [ -d ".next/standalone" ]; then
    echo "✅ Build already exists, skipping rebuild..."
else
    echo "🧹 Cleaning old build artifacts..."
    rm -rf .next

    echo "📦 Building Next.js application..."
    export DOCKER_BUILD=true
    [ -n "$NEXT_PUBLIC_API_URL" ] && export NEXT_PUBLIC_API_URL && echo "🔗 API URL: $NEXT_PUBLIC_API_URL"

    # Execute build
    npm run build || {
        echo "❌ Build failed! This usually means the paths in tsconfig.json don't match the folder structure."
        echo "Showing directory structure for debugging:"
        find . -maxdepth 2 -not -path '*/.*'
        exit 1
    }
fi

echo "✅ Build completed successfully!"

# 4. Standalone Mode Configuration
if [ -d ".next/standalone" ]; then
    echo "📦 Setting up standalone build..."

    # Ensure .next directory exists in standalone
    mkdir -p .next/standalone/.next

    # Copy public folder to standalone (always ensure it's there)
    if [ -d "public" ]; then
        if [ ! -d ".next/standalone/public" ] || [ "$(find public -type f | wc -l)" -gt "$(find .next/standalone/public -type f 2>/dev/null | wc -l)" ]; then
            echo "   Copying public folder..."
            cp -r public .next/standalone/ 2>/dev/null || true
        fi
    fi

    # Always ensure static files are copied (critical for serving assets)
    if [ -d ".next/static" ]; then
        ORIGINAL_COUNT=$(find .next/static -type f 2>/dev/null | wc -l)
        STANDALONE_COUNT=$(find .next/standalone/.next/static -type f 2>/dev/null | wc -l)

        # Copy if missing or if standalone has fewer files (incomplete copy)
        if [ ! -d ".next/standalone/.next/static" ] || [ "$STANDALONE_COUNT" -lt "$ORIGINAL_COUNT" ]; then
            echo "   Copying static files to standalone build..."
            rm -rf .next/standalone/.next/static 2>/dev/null || true
            cp -r .next/static .next/standalone/.next/ 2>/dev/null || true
            FINAL_COUNT=$(find .next/standalone/.next/static -type f 2>/dev/null | wc -l)
            echo "   ✓ Static files copied ($FINAL_COUNT files)"
        else
            echo "   ✓ Static files already present ($STANDALONE_COUNT files)"
        fi
    else
        echo "   ⚠️  WARNING: .next/static directory not found!"
    fi

    # Copy server files (always ensure they're there)
    if [ -d ".next/server" ]; then
        if [ ! -d ".next/standalone/.next/server" ]; then
            echo "   Copying server files..."
            cp -r .next/server .next/standalone/.next/ 2>/dev/null || true
        fi
    fi

    # Copy build metadata (always ensure it's there)
    if [ -f ".next/BUILD_ID" ]; then
        cp .next/BUILD_ID .next/standalone/.next/ 2>/dev/null || true
    fi
    cp .next/*.json .next/standalone/.next/ 2>/dev/null || true

    echo "✅ Standalone build configured"

    # Final verification
    echo "   Verifying standalone build integrity..."
    if [ -d ".next/standalone/.next/static" ]; then
        STATIC_COUNT=$(find .next/standalone/.next/static -type f 2>/dev/null | wc -l)
        if [ "$STATIC_COUNT" -gt 0 ]; then
            echo "   ✓ Found $STATIC_COUNT static files in standalone build"
        else
            echo "   ✗ Static files directory exists but is empty!"
        fi
    else
        echo "   ✗ Static files directory missing in standalone build!"
    fi

    if [ -f ".next/standalone/server.js" ]; then
        echo "   ✓ server.js found"
    else
        echo "   ✗ server.js NOT FOUND in standalone build!"
    fi
fi

# 5. Start the Server
echo "🎯 Starting Next.js server..."

if [ -f ".next/standalone/server.js" ]; then
    echo "🚀 Using standalone mode: node .next/standalone/server.js"
    echo "   Working directory: $(pwd)/.next/standalone"
    echo "   Verifying static files are accessible..."
    if [ -d ".next/standalone/.next/static" ]; then
        echo "   ✓ Static files directory exists"
    else
        echo "   ✗ WARNING: Static files directory missing!"
    fi
    cd .next/standalone
    exec node server.js
else
    echo "🚀 Using standard mode: npm start"
    echo "   Note: If static files are missing, the build may be incomplete"
    exec npm start
fi
