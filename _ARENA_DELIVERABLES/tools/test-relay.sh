#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════
#  تست کامل رله هاستینگر
#
#  استفاده:
#    export RELAY_URL="https://your-relay.hostingersite.com"
#    export RELAY_SECRET="رشته ۶۴ کاراکتری شما"
#    bash test-relay.sh
# ═══════════════════════════════════════════════════════════════
set -uo pipefail

RELAY="${RELAY_URL:-}"
SECRET="${RELAY_SECRET:-}"

ok()   { printf '\033[32m  ✅ %s\033[0m\n' "$*"; }
bad()  { printf '\033[31m  ❌ %s\033[0m\n' "$*"; }
warn() { printf '\033[33m  ⚠️  %s\033[0m\n' "$*"; }
head_() { printf '\n\033[36m═══ %s ═══\033[0m\n' "$*"; }

if [ -z "$RELAY" ] || [ -z "$SECRET" ]; then
  bad "RELAY_URL و RELAY_SECRET را تنظیم کنید"
  echo
  echo "  export RELAY_URL='https://your-relay.hostingersite.com'"
  echo "  export RELAY_SECRET='...'"
  exit 2
fi

RELAY="${RELAY%/}"   # حذف اسلش انتهایی

# امضای HMAC روی «timestamp|body»
sign() {
  local body="$1" ts
  ts=$(date +%s)
  local sig
  sig=$(printf '%s|%s' "$ts" "$body" | openssl dgst -sha256 -hmac "$SECRET" -r | cut -d' ' -f1)
  echo "$ts|$sig"
}

call() {
  local path="$1" body="${2:-\{\}}"
  local pair ts sig
  pair=$(sign "$body"); ts="${pair%%|*}"; sig="${pair##*|}"
  curl -sS --max-time 90 -X POST "$RELAY$path" \
    -H "X-Relay-Timestamp: $ts" \
    -H "X-Relay-Signature: $sig" \
    -H 'Content-Type: application/json' \
    -d "$body"
}

# ── ۱) سلامت ──────────────────────────────────────────────
head_ "۱) سلامت رله"
H=$(curl -sS --max-time 20 "$RELAY/health" 2>&1)
if grep -q '"ok":[[:space:]]*true' <<<"$H"; then
  ok "رله زنده است"
  if grep -q '"secretConfigured":[[:space:]]*true' <<<"$H"; then
    ok "RELAY_SECRET روی رله تنظیم شده"
  else
    bad "RELAY_SECRET روی رله تنظیم نشده — متغیر را اضافه و Restart کنید"
    exit 1
  fi
else
  bad "رله پاسخ نداد"
  echo "$H" | head -5
  exit 1
fi

# ── ۲) احراز هویت ────────────────────────────────────────
head_ "۲) امنیت"
CODE=$(curl -sS -o /dev/null -w '%{http_code}' --max-time 20 -X POST "$RELAY/diagnose" -d '{}')
[ "$CODE" = "403" ] && ok "درخواست بدون امضا رد شد (403)" || warn "انتظار 403 بود، دریافت: $CODE"

# ── ۳) امضای معتبر ───────────────────────────────────────
head_ "۳) امضای معتبر"
D=$(call /diagnose '{}')
if grep -q '"ok":[[:space:]]*true' <<<"$D"; then
  ok "امضا پذیرفته شد"
else
  bad "امضا رد شد — احتمالاً SECRET در دو طرف یکسان نیست"
  echo "$D" | head -5
  exit 1
fi

# ── ۴) دسترسی به سرویس‌ها ────────────────────────────────
head_ "۴) دسترسی از هاستینگر به سرویس‌های خارجی"
if command -v python3 >/dev/null 2>&1; then
  echo "$D" | python3 -c '
import json, sys
try:
    d = json.load(sys.stdin)["result"]
except Exception as e:
    print("  خطا در خواندن پاسخ:", e)
    sys.exit(0)

for r in d.get("reachability", []):
    mark = "OK " if r.get("ok") else "XX "
    name = r.get("name", "?")
    ms   = r.get("ms", "?")
    err  = r.get("error", "")
    print("  [%s] %-26s %6s ms  %s" % (mark, name, ms, err))

print("")
print("  پیکربندی:")
for k, v in d.get("configured", {}).items():
    print("    [%s] %s" % ("OK" if v else "--", k))
'
else
  echo "$D" | head -40
fi

# ── ۵) جمع‌بندی ──────────────────────────────────────────
head_ "۵) جمع‌بندی"
grep -q '"name":[[:space:]]*"api.linkedin.com","ok":[[:space:]]*true' <<<"$(echo "$D"|tr -d ' ')" \
  && ok "لینکدین از رله در دسترس است" \
  || warn "لینکدین در دسترس نیست — خروجی بالا را بررسی کنید"

grep -q '"name":"graph.instagram.com","ok":true' <<<"$(echo "$D"|tr -d ' ')" \
  && ok "اینستاگرام از رله در دسترس است" \
  || warn "اینستاگرام در دسترس نیست"

grep -q '"name":"agentrouter.org","ok":true' <<<"$(echo "$D"|tr -d ' ')" \
  && ok "AgentRouter از رله در دسترس است" \
  || warn "AgentRouter در دسترس نیست"

echo
echo "  📋 این خروجی کامل را برای بررسی بفرستید."
echo
