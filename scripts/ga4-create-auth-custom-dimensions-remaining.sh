#!/usr/bin/env bash
# Creates the four EVENT-scoped auth custom dimensions left after `method` / auth_method.
# Prereq: gcloud user login with analytics.edit, same pattern as:
#   TOKEN=$(gcloud auth print-access-token --scopes="https://www.googleapis.com/auth/analytics.edit")
#
# Env:
#   GA4_PROPERTY_ID   default 527619709 (see docs/AUTH_TELEMETRY_RUNBOOK.md)
#   GOOGLE_USER_PROJECT  GCP project for x-goog-user-project header (default: set-picks)

set -uo pipefail

PROPERTY_ID="${GA4_PROPERTY_ID:-527619709}"
GOOGLE_USER_PROJECT="${GOOGLE_USER_PROJECT:-set-picks}"

TOKEN="$(gcloud auth print-access-token --scopes="https://www.googleapis.com/auth/analytics.edit")"

post() {
  local payload="$1"
  curl -sS -X POST \
    "https://analyticsadmin.googleapis.com/v1beta/properties/${PROPERTY_ID}/customDimensions" \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "x-goog-user-project: ${GOOGLE_USER_PROJECT}" \
    -H "Content-Type: application/json" \
    -d "${payload}"
  echo
}

echo "=== error_code / auth_error_code ==="
post '{"parameterName":"error_code","displayName":"auth_error_code","description":"Firebase Auth error code","scope":"EVENT"}'

echo "=== stage / auth_rollback_stage ==="
post '{"parameterName":"stage","displayName":"auth_rollback_stage","description":"Which post-signup write failed","scope":"EVENT"}'

echo "=== has_consent / auth_partial_has_consent ==="
post '{"parameterName":"has_consent","displayName":"auth_partial_has_consent","description":"Whether partial doc has termsPrivacyAcceptedAt","scope":"EVENT"}'

echo "=== surface / auth_partial_surface ==="
post '{"parameterName":"surface","displayName":"auth_partial_surface","description":"Which route detected partial profile","scope":"EVENT"}'

echo "Done. List: curl -sS \"https://analyticsadmin.googleapis.com/v1beta/properties/${PROPERTY_ID}/customDimensions\" -H \"Authorization: Bearer \$(gcloud auth print-access-token --scopes=https://www.googleapis.com/auth/analytics.edit)\" -H \"x-goog-user-project: ${GOOGLE_USER_PROJECT}\""
