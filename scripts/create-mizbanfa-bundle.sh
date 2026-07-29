#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

BUNDLE_DIR="${BUNDLE_DIR:-deploy-artifacts}"
mkdir -p "$BUNDLE_DIR"

BUILD_ID="${GITHUB_RUN_ID:-$(date +%Y%m%d%H%M%S)}"
SHORT_SHA="${GITHUB_SHA:-$(git rev-parse --short=12 HEAD 2>/dev/null || echo local)}"
SHORT_SHA="${SHORT_SHA:0:12}"
BUNDLE_NAME="ehsansalehi-${BUILD_ID}-${SHORT_SHA}.tar.gz"
BUNDLE_PATH="$BUNDLE_DIR/$BUNDLE_NAME"

echo "[bundle] Installing dependencies if needed..."
if [ ! -d node_modules ]; then
  npm ci
fi

echo "[bundle] Building Next.js standalone output..."
npm run build

echo "[bundle] Preparing standalone payload..."
rm -rf .next/standalone/public .next/standalone/.next/static
cp -r public .next/standalone/public
mkdir -p .next/standalone/.next
cp -r .next/static .next/standalone/.next/static
mkdir -p .next/standalone/tmp
printf '%s\n' "bundle-created-at=$(date -u +%Y-%m-%dT%H:%M:%SZ)" > .next/standalone/tmp/restart.txt

echo "[bundle] Creating $BUNDLE_PATH"
tar \
  --exclude='./node_modules' \
  --exclude='./.npm' \
  --exclude='./.cache' \
  -C .next/standalone \
  -czf "$BUNDLE_PATH" .

BYTES=$(wc -c < "$BUNDLE_PATH" | tr -d ' ')
echo "[bundle] Ready: $BUNDLE_PATH ($BYTES bytes)"
echo "$BUNDLE_PATH"
