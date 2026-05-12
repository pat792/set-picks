#!/usr/bin/env bash
# Registers auth anomaly events as GA4 key events (modern "conversion" surface).
# Requires the same gcloud + analytics.edit setup as ga4-create-auth-custom-dimensions-remaining.sh
#
# If create returns an error about the event being unknown, send at least one hit from prod
# (setlistpickem.com) for that event name first, then re-run.
#
# Env:
#   GA4_PROPERTY_ID       default 527619709
#   GOOGLE_USER_PROJECT   default set-picks

set -uo pipefail

PROPERTY_ID="${GA4_PROPERTY_ID:-527619709}"
GOOGLE_USER_PROJECT="${GOOGLE_USER_PROJECT:-set-picks}"

TOKEN="$(gcloud auth print-access-token --scopes="https://www.googleapis.com/auth/analytics.edit")"

post_key_event() {
  local event_name="$1"
  curl -sS -X POST \
    "https://analyticsadmin.googleapis.com/v1beta/properties/${PROPERTY_ID}/keyEvents" \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "x-goog-user-project: ${GOOGLE_USER_PROJECT}" \
    -H "Content-Type: application/json" \
    -d "{\"eventName\":\"${event_name}\",\"countingMethod\":\"ONCE_PER_EVENT\"}"
  echo
}

echo "=== key event: auth_partial_profile ==="
post_key_event "auth_partial_profile"

echo "=== key event: auth_rollback_failed ==="
post_key_event "auth_rollback_failed"

echo "List key events:"
echo "curl -sS \"https://analyticsadmin.googleapis.com/v1beta/properties/${PROPERTY_ID}/keyEvents\" \\"
echo "  -H \"Authorization: Bearer \$(gcloud auth print-access-token --scopes=https://www.googleapis.com/auth/analytics.edit)\" \\"
echo "  -H \"x-goog-user-project: ${GOOGLE_USER_PROJECT}\""
