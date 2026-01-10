#!/bin/bash
set -e

echo "🚀 Starting Kiplombe Frontend (Production Mode)..."

# Check if node_modules exists and has content
if [ -d "node_modules" ] && [ "$(ls -A node_modules 2>/dev/null)" ]; then
    echo "✅ Dependencies already installed"
else
    echo "📦 Installing dependencies (this will take 3-5 minutes on first run)..."
    echo "   Installing with --legacy-peer-deps flag..."
    
    # Check if package-lock.json exists
    if [ -f "package-lock.json" ]; then
        echo "   Using package-lock.json for exact version matching..."
        npm ci --legacy-peer-deps --prefer-offline --no-audit --no-fund || {
            echo "⚠ npm ci failed, trying npm install instead..."
            npm install --legacy-peer-deps --prefer-offline --no-audit --no-fund
        }
    else
        echo "   Using npm install (no package-lock.json found)..."
        npm install --legacy-peer-deps --prefer-offline --no-audit --no-fund
    fi
    
    if [ $? -eq 0 ]; then
        echo "✅ Dependencies installed successfully!"
    else
        echo "❌ Dependency installation failed!"
        exit 1
    fi
fi

# Check if .next build exists, if not build it
if [ ! -d ".next" ] || [ -z "$(ls -A .next 2>/dev/null)" ] || [ ! -f ".next/BUILD_ID" ]; then
    echo "📦 Building Next.js application (this will take 2-4 minutes)..."
    
    # Enable standalone mode for production Docker builds
    export DOCKER_BUILD=true
    
    # Set build-time environment variable if provided
    if [ -n "$NEXT_PUBLIC_API_URL" ]; then
        export NEXT_PUBLIC_API_URL
        echo "   Using NEXT_PUBLIC_API_URL: $NEXT_PUBLIC_API_URL"
    fi
    
    # Run build with standalone output
    echo "   Building with standalone output mode..."
    npm run build || {
        echo "❌ Build failed! Showing last 30 lines of output..."
        npm run build 2>&1 | tail -30
        exit 1
    }
    
    echo "✅ Build completed successfully!"
    
    # Handle standalone build setup
    if [ -d ".next/standalone" ]; then
        echo "📦 Setting up standalone build..."
        # Copy public folder and static assets to standalone directory
        if [ -d "public" ] && [ ! -d ".next/standalone/public" ]; then
            cp -r public .next/standalone/ 2>/dev/null || true
        fi
        if [ -d ".next/static" ] && [ ! -d ".next/standalone/.next/static" ]; then
            mkdir -p .next/standalone/.next
            cp -r .next/static .next/standalone/.next/ 2>/dev/null || true
        fi
        echo "✅ Standalone build configured"
    fi
else
    echo "✅ Next.js build already exists, skipping build step"
fi

echo "🎯 Starting Next.js server on port 3000..."
echo "   Listening on 0.0.0.0:3000"

# Determine which command to run (standalone mode is preferred for production)
if [ -f ".next/standalone/server.js" ]; then
    echo "   Using standalone build: node .next/standalone/server.js"
    cd .next/standalone
    exec node server.js
elif [ -f "server.js" ]; then
    echo "   Using: node server.js"
    exec node server.js
elif [ -f "package.json" ]; then
    # Check if start script exists
    if grep -q '"start"' package.json; then
        echo "   Using: npm start"
        exec npm start
    else
        echo "   Using: npm run start:prod (if available) or npm run dev"
        exec npm run start:prod 2>/dev/null || npm run dev
    fi
else
    echo "   ❌ No server file or package.json found!"
    exit 1
fi

