#!/usr/bin/env bash
#
# Grant `roles/firebaseauth.admin` to the Cloud Functions Gen-2 runtime service
# account for a given Firebase project. Required one-time setup for the
# `setAdminClaim` and `rollupScoresForShow` callables (issue #139 PR A) so they
# can call `admin.auth().getUser` / `setCustomUserClaims`.
#
# Gen-2 Cloud Functions run as `<project-number>-compute@developer.gserviceaccount.com`
# by default, which gets `roles/editor` but NOT the Firebase Auth management
# permissions needed by the Admin SDK to read or update users. Symptom without
# this grant: `auth/insufficient-permission` from `setCustomUserClaims`.
#
# Usage:
#   scripts/grant-functions-auth-admin.sh <project-id>
# Example:
#   scripts/grant-functions-auth-admin.sh set-picks
#
# Idempotent — re-running on a project that already has the binding is a no-op
# (gcloud will report "Updated IAM policy for project [...]." with no change).
#
# Requires: gcloud CLI authenticated as a principal with
# `resourcemanager.projects.setIamPolicy` on the target project (typically
# Project Owner or IAM Admin).

set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "usage: $0 <project-id>" >&2
  exit 64
fi

PROJECT_ID="$1"

if ! command -v gcloud >/dev/null 2>&1; then
  echo "error: gcloud CLI not found on PATH" >&2
  echo "install: https://cloud.google.com/sdk/docs/install" >&2
  exit 127
fi

echo "Resolving project number for '${PROJECT_ID}'..."
PROJECT_NUMBER=$(gcloud projects describe "${PROJECT_ID}" --format='value(projectNumber)')

if [[ -z "${PROJECT_NUMBER}" ]]; then
  echo "error: could not resolve project number for '${PROJECT_ID}'" >&2
  exit 1
fi

SERVICE_ACCOUNT="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"
ROLE="roles/firebaseauth.admin"

echo "Granting ${ROLE} to ${SERVICE_ACCOUNT} on project ${PROJECT_ID}..."
gcloud projects add-iam-policy-binding "${PROJECT_ID}" \
  --member="serviceAccount:${SERVICE_ACCOUNT}" \
  --role="${ROLE}" \
  --condition=None \
  >/dev/null

echo "Done. IAM propagation to running functions takes ~30-60s."
echo "Verify: gcloud projects get-iam-policy ${PROJECT_ID} \\"
echo "          --flatten='bindings[].members' \\"
echo "          --format='value(bindings.role)' \\"
echo "          --filter=\"bindings.members:${SERVICE_ACCOUNT}\""
