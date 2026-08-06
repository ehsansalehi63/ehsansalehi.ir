#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════
#  دیپلوی سریع به cPanel — بدون SSH
#
#  دو روش پشتیبانی می‌شود (خودکار انتخاب می‌شود):
#    A) cPanel API Token  ← ترجیح داده می‌شود
#    B) PHP Deploy Receiver ← اگر API نبود
#
#  استفاده:
#    export DEPLOY_METHOD=api            # یا php
#    export CPANEL_HOST=cip17.example.net
#    export CPANEL_USER=username
#    export CPANEL_TOKEN=xxxxx           # روش A
#    export DEPLOY_URL=https://site.ir/deploy-receive.php   # روش B
#    export DEPLOY_SECRET=xxxxx          # روش B
#    export APP_DIR=/home/username/app
#    bash deploy-cpanel.sh bundle.tar.gz
# ═══════════════════════════════════════════════════════════════
set -euo pipefail

BUNDLE="${1:-}"
METHOD="${DEPLOY_METHOD:-api}"
APP_DIR="${APP_DIR:-}"
HEALTH_URL="${HEALTH_URL:-}"

c_ok()   { printf '\033[32m✅ %s\033[0m\n' "$*"; }
c_err()  { printf '\033[31m❌ %s\033[0m\n' "$*" >&2; }
c_info() { printf '\033[36m→  %s\033[0m\n' "$*"; }

[ -f "$BUNDLE" ] || { c_err "بسته یافت نشد: $BUNDLE"; exit 2; }
SIZE=$(du -h "$BUNDLE" | cut -f1)
c_info "بسته: $BUNDLE ($SIZE)"

# ═══ روش A: cPanel API Token ═══════════════════════════════
deploy_api() {
  : "${CPANEL_HOST:?CPANEL_HOST لازم است}"
  : "${CPANEL_USER:?CPANEL_USER لازم است}"
  : "${CPANEL_TOKEN:?CPANEL_TOKEN لازم است}"
  : "${APP_DIR:?APP_DIR لازم است}"

  local AUTH="Authorization: cpanel ${CPANEL_USER}:${CPANEL_TOKEN}"
  local BASE="https://${CPANEL_HOST}:2083/execute"
  local INCOMING="${APP_DIR}/incoming"
  local NAME; NAME="deploy-$(date -u +%Y%m%d-%H%M%S).tar.gz"

  c_info "تست اتصال به cPanel API..."
  local test_resp
  test_resp=$(curl -sS --max-time 30 -H "$AUTH" \
    "${BASE}/Fileman/list_files?dir=$(printf '%s' "$APP_DIR" | jq -sRr @uri)" 2>&1) || true
  if ! grep -q '"errors":null\|"status":1' <<<"$test_resp"; then
    c_err "اتصال به API ناموفق. پاسخ:"
    echo "$test_resp" | head -5
    return 1
  fi
  c_ok "اتصال به cPanel API برقرار است"

  c_info "ساخت پوشه incoming..."
  curl -sS --max-time 30 -H "$AUTH" \
    --data-urlencode "path=${INCOMING}" \
    "${BASE}/Fileman/mkdir" >/dev/null 2>&1 || true

  c_info "آپلود بسته..."
  local up
  up=$(curl -sS --max-time 900 -H "$AUTH" \
    -F "dir=${INCOMING}" \
    -F "file-1=@${BUNDLE};filename=${NAME}" \
    "${BASE}/Fileman/upload_files")
  grep -q '"errors":null\|"status":1' <<<"$up" || { c_err "آپلود ناموفق: $up"; return 1; }
  c_ok "آپلود کامل شد"

  c_info "استخراج روی سرور..."
  local ex
  ex=$(curl -sS --max-time 300 -H "$AUTH" \
    --data-urlencode "sourcefiles=${INCOMING}/${NAME}" \
    --data-urlencode "destdir=${APP_DIR}" \
    "${BASE}/Archive/extract_archive")
  grep -q '"errors":null\|"status":1' <<<"$ex" || { c_err "استخراج ناموفق: $ex"; return 1; }
  c_ok "استخراج کامل شد"

  c_info "ساخت پوشه tmp..."
  curl -sS --max-time 30 -H "$AUTH" \
    --data-urlencode "path=${APP_DIR}/tmp" \
    "${BASE}/Fileman/mkdir" >/dev/null 2>&1 || true

  c_info "ری‌استارت اپ..."
  curl -sS --max-time 60 -H "$AUTH" \
    --data-urlencode "dir=${APP_DIR}/tmp" \
    --data-urlencode "file=restart.txt" \
    --data-urlencode "content=$(date -u +%FT%TZ)" \
    "${BASE}/Fileman/save_file_content" >/dev/null 2>&1 || true
  c_ok "ری‌استارت درخواست شد"

  c_info "پاکسازی فایل موقت..."
  curl -sS --max-time 60 -H "$AUTH" \
    --data-urlencode "sourcefiles=${INCOMING}/${NAME}" \
    "${BASE}/Fileman/trash_files" >/dev/null 2>&1 || true
}

# ═══ روش B: PHP Receiver ═══════════════════════════════════
deploy_php() {
  : "${DEPLOY_URL:?DEPLOY_URL لازم است}"
  : "${DEPLOY_SECRET:?DEPLOY_SECRET لازم است}"

  c_info "تست گیرنده PHP..."
  local ping
  ping=$(curl -sS --max-time 30 "${DEPLOY_URL}?action=ping") || true
  grep -q '"ok":true' <<<"$ping" || { c_err "گیرنده پاسخ نداد: $ping"; return 1; }
  c_ok "گیرنده PHP فعال است"

  local TS SIG
  TS=$(date +%s)
  SIG=$(printf '%s|deploy' "$TS" | openssl dgst -sha256 -hmac "$DEPLOY_SECRET" -r | cut -d' ' -f1)

  c_info "ارسال بسته و اجرای دیپلوی..."
  local resp
  resp=$(curl -sS --max-time 900 \
    -H "X-Deploy-Signature: ${SIG}" \
    -H "X-Deploy-Timestamp: ${TS}" \
    -F "action=deploy" \
    -F "bundle=@${BUNDLE}" \
    "$DEPLOY_URL")

  echo "$resp" | (jq . 2>/dev/null || cat)
  grep -q '"ok":true' <<<"$resp" || { c_err "دیپلوی ناموفق"; return 1; }
}

# ═══ اجرا ══════════════════════════════════════════════════
START=$(date +%s)

case "$METHOD" in
  api) deploy_api ;;
  php) deploy_php ;;
  *)   c_err "DEPLOY_METHOD باید api یا php باشد"; exit 2 ;;
esac

# ═══ بررسی سلامت ═══════════════════════════════════════════
if [ -n "$HEALTH_URL" ]; then
  c_info "بررسی سلامت سایت..."
  for i in $(seq 1 15); do
    sleep 4
    CODE=$(curl -s -o /dev/null -w '%{http_code}' --max-time 15 "$HEALTH_URL" || echo 000)
    if [ "$CODE" -ge 200 ] && [ "$CODE" -lt 400 ]; then
      c_ok "سایت سالم است (HTTP $CODE) بعد از $i تلاش"
      break
    fi
    printf '   تلاش %s: HTTP %s\n' "$i" "$CODE"
    [ "$i" = 15 ] && { c_err "health check ناموفق"; exit 1; }
  done
fi

ELAPSED=$(( $(date +%s) - START ))
c_ok "دیپلوی کامل شد در ${ELAPSED} ثانیه"
