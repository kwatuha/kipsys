#!/bin/sh
set -e

echo "🚀 Starting Kiplombe Frontend..."

# Simple check: does next binary exist?
if [ -f "node_modules/.bin/next" ]; then
    echo "✅ Dependencies already installed, starting dev server..."
else
    echo "📦 Installing dependencies (this will take 2-5 minutes on first run)..."
    
    # Simple install - let npm handle everything
    if [ -f "package-lock.json" ]; then
        npm ci --legacy-peer-deps --prefer-offline
    else
        npm install --legacy-peer-deps --prefer-offline
    fi
    
    echo "✅ Dependencies installed successfully!"
fi

echo "🎯 Starting Next.js dev server on port 3000..."
exec "$@"