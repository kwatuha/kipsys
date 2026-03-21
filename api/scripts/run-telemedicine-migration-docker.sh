#!/usr/bin/env bash
# Apply telemedicine schema inside the kiplombe_mysql Docker container (same pattern as add-symptoms-columns-docker.sh).
#
# Usage (from repo root or api/):
#   bash api/scripts/run-telemedicine-migration-docker.sh
#
# Override defaults:
#   MYSQL_CONTAINER=kiplombe_mysql MYSQL_USER=... MYSQL_PASSWORD=... MYSQL_DATABASE=... bash api/scripts/run-telemedicine-migration-docker.sh
#
# Use MySQL root (same as: mysql -uroot -proot_password) for local docker-compose:
#   MYSQL_TELEMEDICINE_USE_ROOT=1 MYSQL_ROOT_PASSWORD=root_password bash api/scripts/run-telemedicine-migration-docker.sh

set -euo pipefail

CONTAINER_NAME="${MYSQL_CONTAINER:-kiplombe_mysql}"
DB_NAME="${MYSQL_DATABASE:-kiplombe_hmis}"
DB_USER="${MYSQL_USER:-kiplombe_user}"
DB_PASSWORD="${MYSQL_PASSWORD:-kiplombe_password}"
# Match local docker-compose root (optional): MYSQL_TELEMEDICINE_USE_ROOT=1 MYSQL_ROOT_PASSWORD=root_password
MYSQL_ROOT_PASSWORD="${MYSQL_ROOT_PASSWORD:-root_password}"

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

mysql_apply() {
  local sqlfile="$1"
  local label="$2"
  echo "✅ Running $label ..."
  if [ "${MYSQL_TELEMEDICINE_USE_ROOT:-}" = "1" ]; then
    docker exec -i "$CONTAINER_NAME" mysql -uroot -p"$MYSQL_ROOT_PASSWORD" "$DB_NAME" < "$sqlfile"
  else
    docker exec -i "$CONTAINER_NAME" mysql -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" < "$sqlfile"
  fi
}

mysql_apply "$SQL40" "40_telemedicine_sessions_schema.sql"
mysql_apply "$SQL41" "41_telemedicine_zoom_manual.sql"
mysql_apply "$SQL42" "42_user_telemedicine_defaults.sql"
mysql_apply "$SQL43" "43_telemedicine_standalone_origin.sql"

echo ""
echo "✅ Telemedicine migration finished (database: $DB_NAME)."
