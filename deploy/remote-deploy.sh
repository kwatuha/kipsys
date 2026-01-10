#!/bin/bash

# ============================================
# Kiplombe HMIS Remote Deployment Script
# ============================================
# This script deploys the application to any remote server via SSH
# 
# Usage:
#   ./deploy/remote-deploy.sh [SERVER_IP] [SSH_KEY_PATH]
#
# Or set environment variables:
#   export SERVER_IP=41.89.173.8
#   export SSH_KEY_PATH=~/.ssh/id_asusme
#   export SSH_USER=fhir
#   ./deploy/remote-deploy.sh
# ============================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration - can be overridden by environment variables or arguments
SERVER_IP="${SERVER_IP:-${1:-}}"
SSH_KEY_PATH="${SSH_KEY_PATH:-${2:-~/.ssh/id_asusme}}"
SSH_USER="${SSH_USER:-fhir}"
APP_DIR="${APP_DIR:-~/kiplombe-hmis}"
NGINX_PORT="${NGINX_PORT:-80}"

# Expand tilde in local paths only
SSH_KEY_PATH="${SSH_KEY_PATH/#\~/$HOME}"

# Note: APP_DIR tilde will be expanded on remote server via eval, not locally

# Functions
print_header() {
    echo ""
    echo -e "${BLUE}============================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}============================================${NC}"
    echo ""
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

# Check if required parameters are set
if [ -z "$SERVER_IP" ]; then
    print_error "Server IP is required!"
    echo ""
    echo "Usage:"
    echo "  $0 [SERVER_IP] [SSH_KEY_PATH]"
    echo ""
    echo "Or set environment variables:"
    echo "  export SERVER_IP=41.89.173.8"
    echo "  export SSH_KEY_PATH=~/.ssh/id_asusme"
    echo "  export SSH_USER=fhir"
    echo "  $0"
    echo ""
    exit 1
fi

# Build SSH command
SSH_CMD="ssh -i \"$SSH_KEY_PATH\" -o StrictHostKeyChecking=no -o ConnectTimeout=10 \"$SSH_USER@$SERVER_IP\""

print_header "Kiplombe HMIS Remote Deployment"
echo "Configuration:"
echo "  Server IP: $SERVER_IP"
echo "  SSH User: $SSH_USER"
echo "  SSH Key: $SSH_KEY_PATH"
echo "  App Directory: $APP_DIR"
echo "  Nginx Port: $NGINX_PORT"
echo ""

# Step 1: Test SSH connection
print_header "Step 1: Testing SSH Connection"
if eval "$SSH_CMD" 'echo "Connection successful" 2>&1' > /dev/null 2>&1; then
    print_success "SSH connection established"
else
    print_error "Failed to connect to server via SSH"
    print_info "Trying to connect..."
    eval "$SSH_CMD" 'echo "Testing connection..."' || {
        print_error "Cannot connect to $SSH_USER@$SERVER_IP using key $SSH_KEY_PATH"
        exit 1
    }
fi

# Step 2: Check server prerequisites
print_header "Step 2: Checking Server Prerequisites"
eval "$SSH_CMD" << 'EOF'
    echo "Checking Docker..."
    if command -v docker > /dev/null 2>&1; then
        echo "✓ Docker is installed"
        docker --version
    else
        echo "✗ Docker is not installed"
        exit 1
    fi
    
    echo "Checking Docker Compose..."
    if docker compose version > /dev/null 2>&1 || docker-compose version > /dev/null 2>&1; then
        echo "✓ Docker Compose is available"
    else
        echo "✗ Docker Compose is not available"
        exit 1
    fi
    
    echo "Checking Docker service..."
    if systemctl is-active --quiet docker || docker info > /dev/null 2>&1; then
        echo "✓ Docker service is running"
    else
        echo "✗ Docker service is not running"
        exit 1
    fi
EOF

if [ $? -ne 0 ]; then
    print_error "Server prerequisites check failed"
    exit 1
fi

# Step 3: Check current deployment status
print_header "Step 3: Checking Current Deployment Status"
    eval "$SSH_CMD" << 'CHECK_EOF'
    REMOTE_APP_DIR='~/kiplombe-hmis'
    REMOTE_APP_DIR="${REMOTE_APP_DIR/#\~/$HOME}"
    cd "$REMOTE_APP_DIR" 2>/dev/null || echo "App directory does not exist yet"
    
    if [ -d "$REMOTE_APP_DIR" ]; then
        echo "Current containers:"
        docker ps --filter "name=kiplombe" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" || echo "No containers found"
        
        echo ""
        echo "Checking container health:"
        if docker ps | grep -q kiplombe_frontend; then
            FRONTEND_STATUS=$(docker inspect --format='{{.State.Health.Status}}' kiplombe_frontend 2>/dev/null || echo "unknown")
            echo "Frontend health: $FRONTEND_STATUS"
        fi
        
        if docker ps | grep -q kiplombe_api; then
            API_STATUS=$(docker inspect --format='{{.State.Health.Status}}' kiplombe_api 2>/dev/null || echo "unknown")
            echo "API health: $API_STATUS"
        fi
    fi
CHECK_EOF

# Step 4: Create app directory and upload files
print_header "Step 4: Preparing Deployment Files"
LOCAL_DIR=$(cd "$(dirname "$0")/.." && pwd)
print_info "Local project directory: $LOCAL_DIR"

# Create deployment archive (exclude unnecessary files)
print_info "Creating deployment archive..."
TEMP_DIR=$(mktemp -d)
DEPLOY_ARCHIVE="$TEMP_DIR/kiplombe-hmis-deploy.tar.gz"

cd "$LOCAL_DIR"
tar -czf "$DEPLOY_ARCHIVE" \
    --exclude='node_modules' \
    --exclude='.next' \
    --exclude='.git' \
    --exclude='*.log' \
    --exclude='.env.local' \
    --exclude='.DS_Store' \
    --exclude='coverage' \
    --exclude='.cache' \
    . 2>/dev/null || true

print_success "Deployment archive created: $(du -h "$DEPLOY_ARCHIVE" | cut -f1)"

# Step 5: Upload files to server
print_header "Step 5: Uploading Files to Server"
print_info "Uploading deployment archive..."
scp -i "$SSH_KEY_PATH" -o StrictHostKeyChecking=no "$DEPLOY_ARCHIVE" "$SSH_USER@$SERVER_IP:/tmp/kiplombe-hmis-deploy.tar.gz"

if [ $? -eq 0 ]; then
    print_success "Files uploaded successfully"
else
    print_error "Failed to upload files"
    rm -rf "$TEMP_DIR"
    exit 1
fi

# Clean up local archive
rm -rf "$TEMP_DIR"

# Step 6: Extract and deploy on server
print_header "Step 6: Deploying on Server"
eval "$SSH_CMD" << 'REMOTE_EOF'
    set -e
    
    # Expand tilde in path (handled on remote server)
    REMOTE_APP_DIR='~/kiplombe-hmis'
    REMOTE_APP_DIR="${REMOTE_APP_DIR/#\~/$HOME}"
    
    echo "Creating app directory: $REMOTE_APP_DIR"
    mkdir -p "$REMOTE_APP_DIR"
    cd "$REMOTE_APP_DIR"
    
    echo "Backing up existing files (if any)..."
    if [ -f docker-compose.deploy.yml ]; then
        BACKUP_DIR="backup_$(date +%Y%m%d_%H%M%S)"
        mkdir -p "$BACKUP_DIR"
        cp -r . "$BACKUP_DIR"/ 2>/dev/null || true
        echo "✓ Backup created: $BACKUP_DIR"
    fi
    
    echo "Extracting deployment archive..."
    tar -xzf /tmp/kiplombe-hmis-deploy.tar.gz -C .
    rm /tmp/kiplombe-hmis-deploy.tar.gz
    echo "✓ Files extracted"
    
    echo "Preserving existing .env file..."
    if [ -f .env ]; then
        ENV_BACKUP=".env.backup.$(date +%Y%m%d_%H%M%S)"
        cp .env "$ENV_BACKUP"
        echo "✓ Backed up existing .env file: $ENV_BACKUP"
    fi
    
    echo "Setting up environment file if needed..."
    if [ ! -f .env ]; then
        if [ -f .env.example ]; then
            cp .env.example .env
            echo "✓ Created .env from .env.example"
        elif [ -f deploy/.env.example ]; then
            cp deploy/.env.example .env
            echo "✓ Created .env from deploy/.env.example"
        else
            echo "⚠ No .env.example found - please configure .env manually"
            # Restore backup if we have one
            if ls .env.backup.* > /dev/null 2>&1; then
                LATEST_BACKUP=$(ls -t .env.backup.* | head -1)
                cp "$LATEST_BACKUP" .env
                echo "✓ Restored .env from backup"
            fi
        fi
    else
        echo "✓ .env file already exists (preserved)"
    fi
    
    echo "Updating NGINX_PORT in .env if needed..."
    NGINX_PORT_VALUE=80
    if [ -f .env ]; then
        if grep -q "NGINX_PORT" .env; then
            sed -i "s/NGINX_PORT=.*/NGINX_PORT=$NGINX_PORT_VALUE/" .env || echo "NGINX_PORT=$NGINX_PORT_VALUE" >> .env
        else
            echo "NGINX_PORT=$NGINX_PORT_VALUE" >> .env
        fi
        echo "✓ NGINX_PORT set to $NGINX_PORT_VALUE"
    fi
REMOTE_EOF

if [ $? -ne 0 ]; then
    print_error "Deployment preparation failed"
    exit 1
fi

# Step 7: Build and start containers
print_header "Step 7: Building and Starting Containers"
print_info "Note: Dependencies will be installed AFTER container creation to avoid long build times"
eval "$SSH_CMD" << 'BUILD_EOF'
    set -e
    REMOTE_APP_DIR='~/kiplombe-hmis'
    REMOTE_APP_DIR="${REMOTE_APP_DIR/#\~/$HOME}"
    cd "$REMOTE_APP_DIR"
    
    echo "Stopping existing containers..."
    docker compose -f docker-compose.deploy.yml down 2>/dev/null || docker-compose -f docker-compose.deploy.yml down 2>/dev/null || true
    echo "✓ Existing containers stopped"
    
    echo "Pulling latest base images..."
    docker compose -f docker-compose.deploy.yml pull 2>/dev/null || docker-compose -f docker-compose.deploy.yml pull 2>/dev/null || true
    
    echo "Building application images (quick build - no dependency installation)..."
    echo "  This should be fast since dependencies install at runtime..."
    docker compose -f docker-compose.deploy.yml build --no-cache 2>&1 | tail -30
    
    echo "Starting services (dependencies will install on first run)..."
    docker compose -f docker-compose.deploy.yml up -d 2>&1
    
    echo "✓ Containers started"
    
    echo ""
    echo "📦 Installing dependencies in frontend container (this takes 3-5 minutes)..."
    echo "  Monitoring installation progress..."
    
    # Wait for container to start
    sleep 5
    
    # Monitor frontend container logs for dependency installation
    FRONTEND_READY=false
    MAX_WAIT=600  # 10 minutes max wait
    ELAPSED=0
    SLEEP_INTERVAL=10
    
    while [ $ELAPSED -lt $MAX_WAIT ]; do
        if docker ps | grep -q kiplombe_frontend; then
            # Check if dependencies are being installed or already installed
            LOGS=$(docker logs kiplombe_frontend 2>&1 | tail -5)
            
            if echo "$LOGS" | grep -q "Dependencies installed successfully\|dependencies already installed\|✅ Dependencies already installed"; then
                echo "✓ Dependencies installed or already present"
                FRONTEND_READY=true
                break
            elif echo "$LOGS" | grep -q "Installing dependencies\|npm install\|npm ci"; then
                echo "  Still installing dependencies... (waited ${ELAPSED}s)"
            elif echo "$LOGS" | grep -q "Starting Next.js\|Build completed\|server.js"; then
                echo "✓ Frontend is starting/ready"
                FRONTEND_READY=true
                break
            elif echo "$LOGS" | grep -q "error\|Error\|ERROR\|failed\|Failed"; then
                echo "⚠ Error detected in logs:"
                echo "$LOGS"
                break
            fi
        fi
        
        sleep $SLEEP_INTERVAL
        ELAPSED=$((ELAPSED + SLEEP_INTERVAL))
    done
    
    if [ "$FRONTEND_READY" = "false" ]; then
        echo "⚠ Frontend dependency installation is taking longer than expected"
        echo "  Current frontend logs:"
        docker logs --tail=20 kiplombe_frontend 2>&1 | tail -10
        echo ""
        echo "  You can monitor progress with: docker logs -f kiplombe_frontend"
    fi
    
    echo ""
    echo "Waiting additional time for services to fully initialize..."
    sleep 30
BUILD_EOF

# Step 8: Verify deployment
print_header "Step 8: Verifying Deployment"
eval "$SSH_CMD" << 'VERIFY_EOF'
    REMOTE_APP_DIR='~/kiplombe-hmis'
    REMOTE_APP_DIR="${REMOTE_APP_DIR/#\~/$HOME}"
    cd "$REMOTE_APP_DIR"
    
    echo "Container status:"
    docker ps --filter "name=kiplombe" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" || echo "No containers found"
    
    echo ""
    echo "Checking service health..."
    
    # Wait a bit more for services to be ready
    sleep 10
    
    # Check API
    if docker ps | grep -q kiplombe_api; then
        API_HEALTH=$(docker inspect --format='{{.State.Health.Status}}' kiplombe_api 2>/dev/null || echo "no-healthcheck")
        echo "API Health: $API_HEALTH"
        
        if curl -f -s http://localhost:3001/ > /dev/null 2>&1; then
            echo "✓ API is responding on port 3001"
        else
            echo "✗ API is not responding on port 3001"
            echo "API logs (last 20 lines):"
            docker logs --tail=20 kiplombe_api 2>&1 | tail -10
        fi
    fi
    
    # Check Frontend
    if docker ps | grep -q kiplombe_frontend; then
        FRONTEND_HEALTH=$(docker inspect --format='{{.State.Health.Status}}' kiplombe_frontend 2>/dev/null || echo "no-healthcheck")
        echo "Frontend Health: $FRONTEND_HEALTH"
        
        # Check if dependencies are still installing
        DEPENDENCY_STATUS=$(docker logs kiplombe_frontend 2>&1 | grep -i "installing dependencies\|dependencies installed\|building\|build completed" | tail -1 || echo "")
        if [ -n "$DEPENDENCY_STATUS" ]; then
            echo "Frontend Status: $DEPENDENCY_STATUS"
        fi
        
        if curl -f -s http://localhost:3000/ > /dev/null 2>&1; then
            echo "✓ Frontend is responding on port 3000"
        else
            echo "⚠ Frontend is not responding on port 3000 (may still be installing dependencies or building)"
            echo "Frontend logs (last 40 lines):"
            docker logs --tail=40 kiplombe_frontend 2>&1 | tail -25
            
            # Check if it's still installing
            if docker logs kiplombe_frontend 2>&1 | grep -qi "installing dependencies\|npm install\|npm ci"; then
                echo ""
                echo "ℹ Frontend is still installing dependencies. This can take 3-5 minutes."
                echo "  Monitor progress: docker logs -f kiplombe_frontend"
            elif docker logs kiplombe_frontend 2>&1 | grep -qi "building\|build"; then
                echo ""
                echo "ℹ Frontend is still building Next.js application. This can take 2-4 minutes."
                echo "  Monitor progress: docker logs -f kiplombe_frontend"
            fi
        fi
    fi
    
    # Check Nginx
    if docker ps | grep -q kiplombe_nginx; then
        echo "Nginx is running"
        
        NGINX_PORT_CHECK=80
        if curl -f -s http://localhost:$NGINX_PORT_CHECK/health > /dev/null 2>&1; then
            echo "✓ Nginx health check passed"
        else
            echo "⚠ Nginx health check endpoint not responding"
        fi
        
        if curl -f -s http://localhost:$NGINX_PORT_CHECK/ > /dev/null 2>&1; then
            echo "✓ Nginx is serving frontend"
        else
            echo "✗ Nginx is not serving frontend (may be gateway timeout)"
            echo "Nginx logs (last 20 lines):"
            docker logs --tail=20 kiplombe_nginx 2>&1 | tail -10
        fi
    fi
VERIFY_EOF

# Step 9: Final status
print_header "Step 9: Deployment Summary"
eval "$SSH_CMD" << 'SUMMARY_EOF'
    REMOTE_APP_DIR='~/kiplombe-hmis'
    REMOTE_APP_DIR="${REMOTE_APP_DIR/#\~/$HOME}"
    cd "$REMOTE_APP_DIR"
    
    echo "=== Container Status ==="
    docker ps --filter "name=kiplombe" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    
    echo ""
    echo "=== Service URLs ==="
    echo "Frontend: http://41.89.173.8:80/"
    echo "API: http://41.89.173.8:3001/"
    echo "API via Nginx: http://41.89.173.8:80/api/"
    
    echo ""
    echo "=== Useful Commands ==="
    echo "View logs: docker logs -f kiplombe_frontend (or kiplombe_api)"
    echo "Restart: docker compose -f docker-compose.deploy.yml restart"
    echo "Stop: docker compose -f docker-compose.deploy.yml down"
    echo "Status: docker compose -f docker-compose.deploy.yml ps"
SUMMARY_EOF

print_header "Deployment Complete!"
echo ""
print_success "Application deployed to $SERVER_IP"
echo ""
print_info "Access the application at:"
echo "  Frontend: http://$SERVER_IP:$NGINX_PORT/"
echo "  API: http://$SERVER_IP:$NGINX_PORT/api/"
echo ""
print_warning "Note: If services are not responding, check logs with:"
echo "  ssh -i $SSH_KEY_PATH $SSH_USER@$SERVER_IP 'cd ~/kiplombe-hmis && docker logs kiplombe_frontend'"
echo ""

