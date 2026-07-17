#!/usr/bin/env bash
# Runs the Playwright E2E suite against the built app backed by a fresh,
# migrated Postgres database. Requires: a running local Postgres, APP_SECRET.
set -euo pipefail

: "${DATABASE_URL:?set DATABASE_URL to a live Postgres}"
: "${APP_SECRET:?set APP_SECRET}"
PORT="${E2E_PORT:-3099}"

echo "→ migrating $DATABASE_URL"
pnpm db:migrate

echo "→ starting app on :$PORT"
PORT="$PORT" APP_SECRET="$APP_SECRET" DATABASE_URL="$DATABASE_URL" \
  RF_SKIP_MIGRATE_ON_CONNECT=1 pnpm start -p "$PORT" >/tmp/e2e-app.log 2>&1 &
APP_PID=$!
trap 'kill $APP_PID 2>/dev/null || true' EXIT

echo "→ waiting for the server"
for i in $(seq 1 60); do
  if curl -sf "http://localhost:$PORT/login" >/dev/null 2>&1; then break; fi
  sleep 1
done

echo "→ running Playwright"
E2E_PORT="$PORT" npx playwright test "$@"
