#!/usr/bin/env bash
# Apply migrations to a fresh local database and run the RLS/scoring tests.
set -euo pipefail

DB_NAME="${NPL_TEST_DB:-npl_cricket_hub_test}"
PGHOST="${PGHOST:-localhost}"
PGPORT="${PGPORT:-5432}"
PGUSER="${PGUSER:-$(whoami)}"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

bash "$ROOT/scripts/db-local-reset.sh"
psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$DB_NAME" -v ON_ERROR_STOP=1 -f "$ROOT/tests/sql/rls.sql"
