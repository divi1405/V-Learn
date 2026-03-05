# Creates the local PostgreSQL user and database for VeLearn.
# Run once before starting the app. Requires psql on PATH (installed with PostgreSQL).
# Usage: .\scripts\setup-local-db.ps1

$ErrorActionPreference = "Stop"

$DB_USER = "lms_user"
$DB_PASS = "lms_password"
$DB_NAME = "lms_db"

Write-Host "Creating PostgreSQL role '$DB_USER'..."
psql -U postgres -c @"
DO `$`$ BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '$DB_USER') THEN
    CREATE ROLE $DB_USER WITH LOGIN PASSWORD '$DB_PASS';
  END IF;
END `$`$;
"@

Write-Host "Creating database '$DB_NAME'..."
$exists = psql -U postgres -tAc "SELECT 1 FROM pg_database WHERE datname = '$DB_NAME'"
if ($exists -ne "1") {
    psql -U postgres -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;"
}

Write-Host "Done. Connection string:"
Write-Host "  postgresql://${DB_USER}:${DB_PASS}@localhost:5432/${DB_NAME}"
