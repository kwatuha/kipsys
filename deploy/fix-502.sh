#!/bin/bash

# ============================================
# Quick Fix for 502 Bad Gateway
# ============================================

set -e

SERVER_IP="${SERVER_IP:-41.89.173.8}"
SSH_KEY_PATH="${SSH_KEY_PATH:-~/.ssh/id_asusme}"
SSH_USER="${SSH_USER:-fhir}"

SSH_KEY_PATH="${SSH_KEY_PATH/#\~/$HOME}"
SSH_CMD="ssh -i \"$SSH_KEY_PATH\" -o StrictHostKeyChecking=no \"$SSH_USER@$SERVER_IP\""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}502 Bad Gateway Quick Fix${NC}"
echo -e "${BLUE}============================================${NC}\n"

eval "$SSH_CMD" << 'FIX_EOF'
    set -e
    cd ~/kiplombe-hmis

    echo -e "${YELLOW}Step 1: Stopping all containers...${NC}"
    docker compose -f docker-compose.deploy.yml down || true

    echo -e "\n${YELLOW}Step 2: Waiting 5 seconds...${NC}"
    sleep 5

    echo -e "\n${YELLOW}Step 3: Starting containers...${NC}"
    docker compose -f docker-compose.deploy.yml up -d

    echo -e "\n${YELLOW}Step 4: Waiting for services to start (30 seconds)...${NC}"
    sleep 30

    echo -e "\n${YELLOW}Step 5: Checking container status...${NC}"
    docker ps --filter "name=kiplombe" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

    echo -e "\n${YELLOW}Step 6: Testing API health...${NC}"
    for i in {1..10}; do
        if curl -s -f http://localhost:3001/ > /dev/null 2>&1; then
            echo "   ✓ API is responding"
            break
        fi
        echo "   Waiting for API... ($i/10)"
        sleep 3
    done

    echo -e "\n${YELLOW}Step 7: Testing Frontend health...${NC}"
    for i in {1..20}; do
        if curl -s -f http://localhost:3000/ > /dev/null 2>&1; then
            echo "   ✓ Frontend is responding"
            break
        fi
        echo "   Waiting for Frontend... ($i/20)"
        sleep 3
    done

    echo -e "\n${YELLOW}Step 8: Testing Nginx proxy...${NC}"
    if curl -s -f http://localhost:8081/ > /dev/null 2>&1; then
        echo "   ✓ Nginx proxy is working"
    else
        echo "   ✗ Nginx proxy is not working - check logs"
        echo "   Run: docker logs kiplombe_nginx"
    fi

    echo -e "\n${GREEN}============================================${NC}"
    echo -e "${GREEN}Fix Complete${NC}"
    echo -e "${GREEN}============================================${NC}\n"

    echo -e "${YELLOW}If still getting 502, check logs:${NC}"
    echo "   docker logs kiplombe_api"
    echo "   docker logs kiplombe_frontend"
    echo "   docker logs kiplombe_nginx"
FIX_EOF
