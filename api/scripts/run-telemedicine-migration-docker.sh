#!/usr/bin/env bash
# Apply telemedicine schema inside the kiplombe_mysql Docker container (same pattern as add-symptoms-columns-docker.sh).
#
# Usage (from repo root or api/):
#   bash api/scripts/run-telemedicine-migration-docker.sh
#
# Override defaults:
#   MYSQL_CONTAINER=kiplombe_mysql MYSQL_USER=... MYSQL_PASSWORD=... MYSQL_DATABASE=... bash api/scripts/run-telemedicine-migration-docker.sh

set -euo pipefail

CONTAINER_NAME="${MYSQL_CONTAINER:-kiplombe_mysql}"
DB_NAME="${MYSQL_DATABASE:-kiplombe_hmis}"
DB_USER="${MYSQL_USER:-kiplombe_user}"
DB_PASSWORD="${MYSQL_PASSWORD:-kiplombe_password}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SQL40="$SCRIPT_DIR/../database/migrations/40_telemedicine_sessions_schema.sql"
SQL41="$SCRIPT_DIR/../database/migrations/41_telemedicine_zoom_manual.sql"
SQL42="$SCRIPT_DIR/../database/migrations/42_user_telemedicine_defaults.sql"
SQL43="$SCRIPT_DIR/../database/migrations/43_telemedicine_standalone_origin.sql"

for f in "$SQL40" "$SQL41" "$SQL42" "$SQL43"; do
  if [[ ! -f "$f" ]]; then
    echo "❌ Missing SQL file: $f"
    exit 1
  fi
done

echo "Checking Docker container '$CONTAINER_NAME'..."
if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}\$"; then
  echo "❌ Container '$CONTAINER_NAME' is not running."
  echo "   Start MySQL with: docker compose up -d mysql_db   (or docker-compose up -d mysql_db)"
  exit 1
fi

echo "✅ Running 40_telemedicine_sessions_schema.sql ..."
docker exec -i "$CONTAINER_NAME" mysql -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" < "$SQL40"

echo "✅ Running 41_telemedicine_zoom_manual.sql ..."
docker exec -i "$CONTAINER_NAME" mysql -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" < "$SQL41"

echo "✅ Running 42_user_telemedicine_defaults.sql ..."
docker exec -i "$CONTAINER_NAME" mysql -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" < "$SQL42"

echo "✅ Running 43_telemedicine_standalone_origin.sql ..."
docker exec -i "$CONTAINER_NAME" mysql -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" < "$SQL43"

echo ""
echo "✅ Telemedicine migration finished (database: $DB_NAME)."
