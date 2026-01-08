# Local Development Setup

## Quick Start

For local development, use the development docker-compose setup:

```bash
# Start local development environment
docker compose up -d

# View logs
docker compose logs -f frontend

# Access:
# - Frontend: http://localhost:3002
# - API: http://localhost:3001
# - MySQL: localhost:3307
```

## Database Migrations

If you get errors about missing columns, run migrations:

```bash
# Run a specific migration
docker exec -i kiplombe_mysql mysql -u root -proot_password kiplombe_hmis < api/database/21_enhance_service_charges_for_procedures.sql

# Or run all migrations in order
for file in api/database/*.sql; do
  docker exec -i kiplombe_mysql mysql -u root -proot_password kiplombe_hmis < "$file"
done
```

## Making Code Changes

1. **Edit code locally** - Changes are automatically picked up via volume mounts
2. **Next.js will recompile** - Takes 10-30 seconds on first access
3. **Hard refresh browser** - `Ctrl + Shift + R` to see changes

## No Container Rebuild Needed!

The development setup uses volume mounts, so:
- ✅ Code changes are instant (no rebuild)
- ✅ Only rebuild if `package.json` changes
- ✅ Fast iteration cycle

## When to Rebuild

Only rebuild containers when:
- Dependencies change (`package.json`)
- Dockerfile changes
- First time setup

```bash
# Rebuild if needed
docker compose build
docker compose up -d
```

## Production Deployment

**Only deploy to production when ready:**

```bash
# This takes 5-10 minutes - only do when ready to publish
docker compose -f docker-compose.deploy.yml build --no-cache
docker compose -f docker-compose.deploy.yml up -d
```

## Troubleshooting

### Database connection errors
```bash
# Check MySQL is running
docker compose ps mysql_db

# Check credentials in docker-compose.yml
```

### Frontend not updating
```bash
# Restart frontend (picks up changes)
docker compose restart frontend

# Check logs
docker compose logs frontend
```

### API errors
```bash
# Restart API
docker compose restart api

# Check logs
docker compose logs api
```

