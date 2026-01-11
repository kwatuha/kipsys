#!/bin/bash

# ============================================
# Kiplombe HMIS Remote Deployment Script (Final Fix)
# ============================================

set -e

# --- Configuration ---
SERVER_IP="${SERVER_IP:-41.89.173.8}"
SSH_KEY_PATH="${SSH_KEY_PATH:-~/.ssh/id_asusme}"
SSH_USER="${SSH_USER:-fhir}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

SSH_KEY_PATH="${SSH_KEY_PATH/#\~/$HOME}"
SSH_CMD="ssh -i \"$SSH_KEY_PATH\" -o StrictHostKeyChecking=no \"$SSH_USER@$SERVER_IP\""

print_header() {
    echo -e "\n${BLUE}============================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}============================================${NC}\n"
}

# --- Step 1: Package Source ---
print_header "Step 1: Packaging Source Code"
LOCAL_DIR=$(cd "$(dirname "$0")/.." && pwd)
cd "$LOCAL_DIR"

TEMP_DIR=$(mktemp -d)
DEPLOY_ARCHIVE="$TEMP_DIR/kiplombe-hmis-deploy.tar.gz"

# We must ensure all root config files are included for Next.js aliases to work
tar -czf "$DEPLOY_ARCHIVE" \
    --exclude='node_modules' \
    --exclude='.next' \
    --exclude='.git' \
    --exclude='*.log' \
    app/ api/ components/ public/ styles/ lib/ hooks/ scripts/ nginx/ deploy/ \
    package.json package-lock.json tsconfig.json next.config.mjs \
    tailwind.config.ts postcss.config.mjs components.json \
    docker-compose.deploy.yml Dockerfile* \
    docker-entrypoint*.sh

# --- Step 2: Upload ---
print_header "Step 2: Uploading to $SERVER_IP"
scp -i "$SSH_KEY_PATH" "$DEPLOY_ARCHIVE" "$SSH_USER@$SERVER_IP:/tmp/kiplombe-hmis-deploy.tar.gz"

# --- Step 3: Server Extraction & Clean ---
print_header "Step 3: Server Extraction"
eval "$SSH_CMD" << 'REMOTE_EOF'
    set -e
    cd ~/kiplombe-hmis

    echo "🧹 Wiping old files to ensure a clean build context..."
    find . -maxdepth 1 ! -name '.env*' ! -name 'backup_*' ! -name '.' -exec rm -rf {} +
    
    echo "📦 Extracting..."
    tar -xzf /tmp/kiplombe-hmis-deploy.tar.gz -C .
    rm /tmp/kiplombe-hmis-deploy.tar.gz

    chmod +x *.sh 2>/dev/null || true
REMOTE_EOF

# --- Step 4: Build ---
print_header "Step 4: Building Frontend (Watching Context)"
eval "$SSH_CMD" << 'BUILD_EOF'
    set -e
    cd ~/kiplombe-hmis
    
    echo "🛑 Stopping containers..."
    docker compose -f docker-compose.deploy.yml down --remove-orphans || true
    
    echo "🏗️ Building Frontend..."
    # We use --no-cache to force Docker to re-read the fresh tsconfig.json
    docker compose -f docker-compose.deploy.yml build --no-cache frontend
    
    echo "🚀 Starting..."
    docker compose -f docker-compose.deploy.yml up -d
    
    echo -e "\n${YELLOW}ℹ Monitoring logs for 2 minutes...${NC}"
    (docker logs -f kiplombe_frontend & ) ; sleep 120 ; kill $! 2>/dev/null || true
BUILD_EOF

print_header "🚀 Deployment Complete!"
