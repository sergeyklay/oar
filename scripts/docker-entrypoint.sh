#!/bin/sh
set -e


node scripts/migrate.mjs
node scripts/seed-production.mjs

exec node server.js
