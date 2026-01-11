#!/bin/bash
set -e

echo "🚀 Starting Kiplombe Frontend (Production Mode)..."

# 1. Ensure dependencies are correct
if [ -d "node_modules" ] && [ "$(ls -A node_modules 2>/dev/null)" ]; then
    echo "✅ Dependencies already installed"
else
    echo "📦 Installing dependencies (this will take 3-5 minutes)..."
    # Using --legacy-peer-deps to handle common UI library conflicts
    npm install --legacy-peer-deps --prefer-offline --no-audit --no-fund
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

# 3. Force a Clean Build
# We remove any existing .next folder to ensure Webpack doesn't use a stale cache
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

echo "✅ Build completed successfully!"

# 4. Standalone Mode Configuration
if [ -d ".next/standalone" ]; then
    echo "📦 Setting up standalone build..."
    # Standalone needs public and static folders copied manually
    cp -r public .next/standalone/ 2>/dev/null || true
    mkdir -p .next/standalone/.next
    cp -r .next/static .next/standalone/.next/ 2>/dev/null || true
    echo "✅ Standalone build configured"
fi

# 5. Start the Server
echo "🎯 Starting Next.js server..."

if [ -f ".next/standalone/server.js" ]; then
    echo "🚀 Using standalone: node .next/standalone/server.js"
    cd .next/standalone
    exec node server.js
else
    echo "🚀 Using npm start"
    exec npm start
fi
