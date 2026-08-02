#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════
#  تست سرتاسری زنجیره سایت ↔ رله
#
#  استفاده:
#    SITE_URL=https://ehsansalehi.ir
#    RELAY_URL=https://darkslategrey-woodcock-525023.hostingersite.com
#    RELAY_SECRET=xxxxx
#    CRON_SECRET=xxxxx
#    bash tools/test-chain.sh
# ═══════════════════════════════════════════════════════════════
set -euo pipefail

SITE_URL="${SITE_URL:-https://ehsansalehi.ir}"
RELAY_URL="${RELAY_URL:-}"
RELAY_SECRET="${RELAY_SECRET:-}"
CRON_SECRET="${CRON_SECRET:-}"

PASS=0
FAIL=0
SKIP=0

c_ok()   { printf '\033[32m✅ %s\033[0m\n' "$*"; PASS=$((PASS+1)); }
c_fail() { printf '\033[31m❌ %s\033[0m\n' "$*"; FAIL=$((FAIL+1)); }
c_skip() { printf '\033[33m⏭️  %s\033[0m\n' "$*"; SKIP=$((SKIP+1)); }
c_info() { printf '\033[36m→  %s\033[0m\n' "$*"; }

# تابع کمکی: curl با مدیریت خطا
safe_curl() {
  local out_var="$1"
  shift
  local http_code
  http_code=$(curl -sS -o /tmp/"$out_var".json -w "%{http_code}" --max-time 15 "$@" 2>/dev/null) || true
  echo "${http_code:-000}"
}

# تابع کمکی: استخراج مقدار از JSON با بردارش فاصله بعد از دو نقطه
# (هم "key":value و هم "key": value را پیدا می‌کند)
json_bool() {
  local key="$1" file="$2"
  grep -oE "\"${key}\"[[:space:]]*:[[:space:]]*true" "$file" 2>/dev/null || echo ""
}

json_str() {
  local key="$1" file="$2"
  grep -oE "\"${key}\"[[:space:]]*:[[:space:]]*\"[^\"]*\"" "$file" 2>/dev/null | sed -E 's/.*:[[:space:]]*"([^"]*)"/\1/' || echo ""
}

echo "═══════════════════════════════════════════════════════════"
echo "  تست زنجیره سایت ↔ رله"
echo "  $(date -u +%FT%TZ)"
echo "═══════════════════════════════════════════════════════════"
echo ""

# ─── ۱) سایت اصلی ─────────────────────────────────────────
c_info "۱. سایت اصلی ($SITE_URL)"
HTTP=$(safe_curl site-main "$SITE_URL")
if [[ "$HTTP" =~ ^[0-9]+$ ]] && [ "$HTTP" -ge 200 ] && [ "$HTTP" -lt 400 ]; then
  c_ok "سایت اصلی بالا است (HTTP $HTTP)"
else
  c_fail "سایت اصلی پاسخ نمی‌دهد (HTTP $HTTP)"
fi

# ─── ۲) Health endpoint سایت ──────────────────────────────
c_info "۲. Health endpoint سایت"
HEALTH_URL="${SITE_URL}/api/deploy/health"
HTTP=$(safe_curl site-health "$HEALTH_URL")
if [ "$HTTP" = "200" ]; then
  c_ok "Health endpoint سایت کار می‌کند"
  head -5 /tmp/site-health.json 2>/dev/null
else
  c_fail "Health endpoint سایت پاسخ نمی‌دهد (HTTP $HTTP)"
fi

# ─── ۳) رله هاستینگر ─────────────────────────────────────
c_info "۳. رله هاستینگر"
if [ -z "$RELAY_URL" ]; then
  c_skip "RELAY_URL تنظیم نشده — رد شد"
else
  HTTP=$(safe_curl relay-health "$RELAY_URL/health")
  if [ "$HTTP" = "200" ]; then
    c_ok "رله بالا است"
    head -5 /tmp/relay-health.json 2>/dev/null

    # بررسی تنظیمات رله (بردارش فاصله بعد از دو نقطه در JSON)
    SECRET_OK=$(json_bool secretConfigured /tmp/relay-health.json)
    AI_OK=$(json_bool enabled /tmp/relay-health.json)
    GATE_OK=$(json_bool gateKeySet /tmp/relay-health.json)
    if [ -n "$SECRET_OK" ]; then
      c_ok "RELAY_SECRET روی رله تنظیم شده"
    else
      c_fail "RELAY_SECRET روی رله تنظیم نشده"
    fi
    if [ -n "$AI_OK" ]; then
      c_ok "دروازه AI روی رله فعال است"
    else
      c_fail "دروازه AI روی رله فعال نیست"
    fi
    if [ -n "$GATE_OK" ]; then
      c_ok "کلید دروازه AI (ai_gateway_key) تنظیم شده"
    else
      c_fail "کلید دروازه AI (ai_gateway_key) تنظیم نشده"
    fi
  else
    c_fail "رله پاسخ نمی‌دهد (HTTP $HTTP)"
  fi
fi

# ─── ۴) تست HMAC (امضای رله) ─────────────────────────────
c_info "۴. تست امضای HMAC"
if [ -z "$RELAY_URL" ] || [ -z "$RELAY_SECRET" ]; then
  c_skip "RELAY_URL یا RELAY_SECRET تنظیم نشده — رد شد"
else
  TS=$(date +%s)
  BODY='{}'
  SIG=$(printf '%s|%s' "$TS" "$BODY" | openssl dgst -sha256 -hmac "$RELAY_SECRET" -r 2>/dev/null | cut -d' ' -f1)

  HTTP=$(curl -sS -o /tmp/relay-diagnose.json -w "%{http_code}" --max-time 30 \
    -X POST "$RELAY_URL/diagnose" \
    -H "X-Relay-Timestamp: $TS" \
    -H "X-Relay-Signature: $SIG" \
    -H 'Content-Type: application/json' \
    -d "$BODY" 2>/dev/null) || true
  HTTP=${HTTP:-000}

  if [ "$HTTP" = "200" ]; then
    c_ok "امضای HMAC پذیرفته شد"
    echo "  دسترسی از هاستینگر:"
    grep -oE '"name"[[:space:]]*:[[:space:]]*"[^"]*"' /tmp/relay-diagnose.json 2>/dev/null | while read -r line; do
      NAME=$(echo "$line" | sed -E 's/.*:[[:space:]]*"([^"]*)"/\1/')
      echo "    - $NAME"
    done
  else
    c_fail "امضای HMAC رد شد (HTTP $HTTP)"
    head -5 /tmp/relay-diagnose.json 2>/dev/null
  fi
fi

# ─── ۵) تست endpoint سرتاسری سایت ─────────────────────────
c_info "۵. تست سرتاسری سایت (relay-test)"
if [ -z "$CRON_SECRET" ]; then
  c_skip "CRON_SECRET تنظیم نشده — رد شد"
else
  HTTP=$(curl -sS -o /tmp/relay-test.json -w "%{http_code}" --max-time 60 \
    "${SITE_URL}/api/admin/relay-test?key=${CRON_SECRET}" 2>/dev/null) || true
  HTTP=${HTTP:-000}

  if [ "$HTTP" = "200" ]; then
    c_ok "تست سرتاسری موفق"
    SUMMARY=$(json_str summary /tmp/relay-test.json)
    VERDICT=$(json_str verdict /tmp/relay-test.json)
    echo "  خلاصه: $SUMMARY"
    [ -n "$VERDICT" ] && echo "  نتیجه: $VERDICT"
  else
    c_fail "تست سرتاسری ناموفق (HTTP $HTTP)"
    head -10 /tmp/relay-test.json 2>/dev/null
  fi
fi

# ─── ۶) تست integrations-test ─────────────────────────────
c_info "۶. تست اتصال سرویس‌ها (integrations-test)"
if [ -z "$CRON_SECRET" ]; then
  c_skip "CRON_SECRET تنظیم نشده — رد شد"
else
  HTTP=$(curl -sS -o /tmp/integrations.json -w "%{http_code}" --max-time 30 \
    -H "Authorization: Bearer $CRON_SECRET" \
    "${SITE_URL}/api/admin/integrations-test" 2>/dev/null) || true
  HTTP=${HTTP:-000}

  if [ "$HTTP" = "200" ]; then
    c_ok "integrations-test پاسخ داد"
    for svc in telegram linkedin openai instagram; do
      SVC_OK=$(grep -oE "\"${svc}\"[[:space:]]*:[[:space:]]*\{[^}]*\"ok\"[[:space:]]*:[[:space:]]*true" /tmp/integrations.json 2>/dev/null || echo "")
      if [ -n "$SVC_OK" ]; then
        c_ok "  $svc: متصل ✅"
      else
        SVC_FAIL=$(grep -oE "\"${svc}\"[[:space:]]*:[[:space:]]*\{[^}]*\"ok\"[[:space:]]*:[[:space:]]*false" /tmp/integrations.json 2>/dev/null || echo "")
        if [ -n "$SVC_FAIL" ]; then
          c_fail "  $svc: قطع ❌"
        else
          c_skip "  $svc: تنظیم نشده"
        fi
      fi
    done
  else
    c_fail "integrations-test پاسخ نمی‌دهد (HTTP $HTTP)"
  fi
fi

# ─── ۷) تست SSH ──────────────────────────────────────────
c_info "۷. تست اتصال SSH به هاستینگر"
if [ -z "${SSH_IP:-}" ]; then
  c_skip "SSH_IP تنظیم نشده — رد شد"
else
  SSH_PORT="${SSH_PORT:-22}"
  SSH_USER="${SSH_USERNAME:-}"
  if [ -z "$SSH_USER" ]; then
    c_skip "SSH_USERNAME تنظیم نشده — رد شد"
  else
    if ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10 -o PasswordAuthentication=yes -p "$SSH_PORT" "${SSH_USER}@${SSH_IP}" "echo OK" 2>/dev/null; then
      c_ok "اتصال SSH به هاستینگر برقرار است"
    else
      c_fail "اتصال SSH به هاستینگر برقرار نیست (در GitHub Actions با sshpass/ssh-action کار می‌کند)"
    fi
  fi
fi

# ─── خلاصه ────────────────────────────────────────────────
echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  خلاصه:  ✅ $PASS موفق  |  ❌ $FAIL ناموفق  |  ⏭️ $SKIP رد شده"
echo "═══════════════════════════════════════════════════════════"

if [ "$FAIL" -gt 0 ]; then
  exit 1
fi
