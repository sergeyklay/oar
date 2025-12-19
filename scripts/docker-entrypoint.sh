#!/bin/sh
set -e

# Validate that NEXT_SERVER_ACTIONS_ENCRYPTION_KEY is set
if [ -z "$NEXT_SERVER_ACTIONS_ENCRYPTION_KEY" ]; then
  echo "ERROR: NEXT_SERVER_ACTIONS_ENCRYPTION_KEY is required but not set." >&2
  echo "Hint: Provide it via docker run -e NEXT_SERVER_ACTIONS_ENCRYPTION_KEY=<key>" >&2
  echo "      or set it in your docker-compose.yml environment section." >&2
  exit 1
fi

echo "Running database migrations..."
node scripts/migrate.mjs

echo "Seeding bill categories..."
node scripts/seed-categories.mjs

echo "Starting Next.js server..."
exec node server.js

