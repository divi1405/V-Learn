#!/usr/bin/env bash
# Creates the local PostgreSQL user and database for VeLearn.
# Run once before starting the app. Requires psql on PATH.

set -euo pipefail

DB_USER="lms_user"
DB_PASS="lms_password"
DB_NAME="lms_db"

echo "Creating PostgreSQL role '${DB_USER}'..."
psql -U postgres -c "DO \$\$ BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '${DB_USER}') THEN
    CREATE ROLE ${DB_USER} WITH LOGIN PASSWORD '${DB_PASS}';
  END IF;
END \$\$;"

echo "Creating database '${DB_NAME}'..."
psql -U postgres -c "SELECT 1 FROM pg_database WHERE datname = '${DB_NAME}'" \
  | grep -q 1 || psql -U postgres -c "CREATE DATABASE ${DB_NAME} OWNER ${DB_USER};"

echo "Done. Connection string:"
echo "  postgresql://${DB_USER}:${DB_PASS}@localhost:5432/${DB_NAME}"
