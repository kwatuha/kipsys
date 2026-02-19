#!/bin/bash

# ============================================
# Database Restore Script
# ============================================
# This script restores a database dump file

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Check if dump file is provided
if [ -z "$1" ]; then
    echo -e "${RED}❌ ERROR: Please provide the dump file path${NC}"
    echo "Usage: $0 <dump_file.sql> [dump_file.sql.gz]"
    exit 1
fi

DUMP_FILE="$1"

# Check if file exists
if [ ! -f "$DUMP_FILE" ]; then
    echo -e "${RED}❌ ERROR: Dump file not found: $DUMP_FILE${NC}"
    exit 1
fi

# Load environment variables if .env exists
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Database configuration
DB_NAME="${MYSQL_DATABASE:-kiplombe_hmis}"
MYSQL_ROOT_PASSWORD="${MYSQL_ROOT_PASSWORD:-root_password}"

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}Database Restore${NC}"
echo -e "${BLUE}============================================${NC}\n"

echo "📋 Configuration:"
echo "   Database: $DB_NAME"
echo "   Dump file: $DUMP_FILE"
echo ""

# Check if MySQL container exists
MYSQL_CONTAINER=$(docker ps --format "{{.Names}}" | grep -i mysql | head -1)
if [ -z "$MYSQL_CONTAINER" ]; then
    MYSQL_CONTAINER="kiplombe_mysql"
fi

if ! docker ps | grep -q "$MYSQL_CONTAINER"; then
    echo -e "${RED}❌ ERROR: MySQL container '$MYSQL_CONTAINER' is not running${NC}"
    exit 1
fi

echo -e "${YELLOW}📥 Restoring database...${NC}"

# Determine if file is compressed
if [[ "$DUMP_FILE" == *.gz ]]; then
    echo "   Detected compressed dump file"
    RESTORE_CMD="gunzip < \"$DUMP_FILE\""
else
    RESTORE_CMD="cat \"$DUMP_FILE\""
fi

# Restore with foreign key checks disabled
eval "$RESTORE_CMD" | docker exec -i "$MYSQL_CONTAINER" mysql -u root -p"$MYSQL_ROOT_PASSWORD" << 'RESTORE_EOF'
SET FOREIGN_KEY_CHECKS=0;
SET SESSION sql_mode='NO_AUTO_VALUE_ON_ZERO';
SET @OLD_TIME_ZONE=@@TIME_ZONE;
SET TIME_ZONE='+00:00';
SOURCE /dev/stdin;
SET TIME_ZONE=@OLD_TIME_ZONE;
SET FOREIGN_KEY_CHECKS=1;
RESTORE_EOF

if [ $? -eq 0 ]; then
    echo -e "\n${GREEN}✅ Database restored successfully!${NC}"
else
    echo -e "\n${RED}❌ ERROR: Database restore failed${NC}"
    exit 1
fi
