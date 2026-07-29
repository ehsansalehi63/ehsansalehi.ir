#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-$HOME/ehsansalehi.ir}"
BUNDLE_PATH="${1:-}"
DEPLOY_ID="${DEPLOY_ID:-$(date +%Y%m%d%H%M%S)}"
DOMAIN="${DOMAIN:-ehsansalehi.ir}"
IP="${IP:-88.135.68.17}"
NODE_BIN="${NODE_BIN:-$HOME/nodevenv/ehsansalehi.ir/22/bin/node}"
LOG_DIR="$APP_DIR/deploy-logs"
LOG_FILE="$LOG_DIR/$DEPLOY_ID.log"

if [ -z "$BUNDLE_PATH" ] || [ ! -f "$BUNDLE_PATH" ]; then
  echo "Usage: APP_DIR=/home/user/ehsansalehi.ir $0 /path/to/bundle.tar.gz" >&2
  exit 2
fi

mkdir -p "$LOG_DIR" "$APP_DIR/tmp"
exec > >(tee -a "$LOG_FILE") 2>&1

echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] deploy started id=$DEPLOY_ID"
echo "app_dir=$APP_DIR"
echo "bundle=$BUNDLE_PATH"

TMP_DIR="$APP_DIR/.deploy-tmp-$DEPLOY_ID"
BACKUP_DIR="$APP_DIR/backups"
mkdir -p "$TMP_DIR" "$BACKUP_DIR"

echo "[deploy] Extracting bundle..."
tar -xzf "$BUNDLE_PATH" -C "$TMP_DIR"

echo "[deploy] Validating bundle..."
test -f "$TMP_DIR/server.js"
test -d "$TMP_DIR/.next"
test -d "$TMP_DIR/public"

echo "[deploy] Backing up current runtime files..."
tar -czf "$BACKUP_DIR/runtime-$DEPLOY_ID.tar.gz" \
  -C "$APP_DIR" \
  --ignore-failed-read \
  server.js package.json deploy-info.json .next public 2>/dev/null || true

echo "[deploy] Installing runtime files while preserving .env and .htaccess..."
rm -rf "$APP_DIR/.next" "$APP_DIR/public"
cp -a "$TMP_DIR/.next" "$APP_DIR/.next"
cp -a "$TMP_DIR/public" "$APP_DIR/public"
cp -a "$TMP_DIR/server.js" "$APP_DIR/server.js"
cp -a "$TMP_DIR/package.json" "$APP_DIR/package.json"
if [ -f "$TMP_DIR/deploy-info.json" ]; then
  cp -a "$TMP_DIR/deploy-info.json" "$APP_DIR/deploy-info.json"
fi

# cPanel Node.js app owns .htaccess and .env; never overwrite them from a bundle.
if [ ! -f "$APP_DIR/.htaccess" ]; then
  cat > "$APP_DIR/.htaccess" <<EOF
PassengerAppRoot "$APP_DIR"
PassengerBaseURI "/"
PassengerNodejs "$NODE_BIN"
PassengerAppType node
PassengerStartupFile server.js
EOF
fi

# Keep cPanel Passenger awake on the new payload.
touch "$APP_DIR/tmp/restart.txt"
rm -rf "$TMP_DIR"

echo "[deploy] Restart marker touched. Waiting for Passenger..."
sleep 5

echo "[deploy] Local health check over server IP..."
set +e
curl -fsSI -H "Host: $DOMAIN" "http://$IP/" | sed -n '1,20p'
HEALTH_STATUS=${PIPESTATUS[0]}
set -e

if [ "$HEALTH_STATUS" -ne 0 ]; then
  echo "[deploy] WARNING: HTTP health check failed with status $HEALTH_STATUS. Check cPanel Passenger/AutoSSL/DNS."
else
  echo "[deploy] HTTP health check passed."
fi

echo "[deploy] API deploy health (best effort)..."
curl -fsS -H "Host: $DOMAIN" "http://$IP/api/deploy/health" || true
echo

echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] deploy finished id=$DEPLOY_ID"
echo "log=$LOG_FILE"
