#!/usr/bin/env bash
# reset-db.sh — Drop and recreate the local development database.
# WARNING: destructive. Never run against production.

set -e

DB_NAME="${DB_NAME:-farmconnect_dev}"

echo "[reset-db] Dropping database: $DB_NAME"
psql -U postgres -c "DROP DATABASE IF EXISTS \"$DB_NAME\";"
psql -U postgres -c "CREATE DATABASE \"$DB_NAME\";"
echo "[reset-db] Done. Run 'pnpm --filter @farmconnect/api db:migrate' to apply migrations."
