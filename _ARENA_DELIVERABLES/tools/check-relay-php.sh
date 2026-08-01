#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════
#  بررسی سلامت رله PHP روی هاستینگر
#
#  استفاده:
#    bash check-relay-php.sh https://your-domain.com [RELAY_SECRET]
#
#  اگر SECRET را ندهید، فقط تست‌های بدون احراز هویت اجرا می‌شود.
# ═══════════════════════════════════════════════════════════════
set -uo pipefail

URL="${1:-}"
SECRET="${2:-}"

ok()   { printf '\033[32m  ✅ %s\033[0m\n' "$*"; }
bad()  { printf '\033[31m  ❌ %s\033[0m\n' "$*"; }
warn() { printf '\033[33m  ⚠️  %s\033[0m\n' "$*"; }
hd()   { printf '\n\033[36m═══ %s ═══\033[0m\n' "$*"; }

if [ -z "$URL" ]; then
  bad "آدرس را بدهید"
  echo
  echo "  bash check-relay-php.sh https://your-domain.com [RELAY_SECRET]"
  exit 2
fi
URL="${URL%/}"

FOUND_PATH=""     # مسیری که کار می‌کند
BODY=""

# ─── ۱) آیا فایل اصلاً آپلود شده؟ ─────────────────────────
hd "۱) آیا relay.php روی سرور هست؟"
CODE=$(curl -s -o /dev/null -w '%{http_code}' --max-time 20 "$URL/relay.php?path=health")
case "$CODE" in
  200) ok "relay.php پیدا شد و پاسخ می‌دهد" ;;
  404) bad "relay.php پیدا نشد — فایل در public_html آپلود نشده"
       echo "     مسیر درست: /home/USER/domains/DOMAIN/public_html/relay.php"
       exit 1 ;;
  403) bad "دسترسی مسدود (403) — مجوز فایل را روی 644 بگذارید" ; exit 1 ;;
  500) bad "خطای داخلی PHP (500) — لاگ خطا را در hPanel ببینید" ; exit 1 ;;
  000) bad "اتصال برقرار نشد — آدرس یا SSL را بررسی کنید" ; exit 1 ;;
  *)   warn "کد غیرمنتظره: $CODE" ;;
esac

# ─── ۲) کدام فرمت مسیر کار می‌کند؟ ────────────────────────
hd "۲) مسیریابی (.htaccess)"
CLEAN=$(curl -s -o /dev/null -w '%{http_code}' --max-time 20 "$URL/health")
if [ "$CLEAN" = "200" ]; then
  ok "آدرس تمیز کار می‌کند:  $URL/health"
  FOUND_PATH="clean"
else
  warn ".htaccess فعال نیست (کد $CLEAN) — از فرمت ?path= استفاده کنید"
  echo "     یعنی به‌جای /publish باید بنویسید /relay.php?path=publish"
  FOUND_PATH="query"
fi

# ─── ۳) محتوای پاسخ سلامت ─────────────────────────────────
hd "۳) وضعیت رله"
if [ "$FOUND_PATH" = "clean" ]; then
  BODY=$(curl -s --max-time 20 "$URL/health")
else
  BODY=$(curl -s --max-time 20 "$URL/relay.php?path=health")
fi

if command -v python3 >/dev/null 2>&1; then
  echo "$BODY" | python3 -c '
import json,sys
try:
    d = json.load(sys.stdin)
except Exception:
    print("  ❌ پاسخ JSON نیست — احتمالاً صفحه HTML هاستینگر برگشته")
    sys.exit(0)

print("  ✅ سرویس:", d.get("service","?"), "| PHP:", d.get("php","?"))
print("  " + ("✅" if d.get("secretConfigured") else "❌"), "relay_secret تنظیم شده")
g = d.get("aiGateway", {})
print("  " + ("✅" if g.get("enabled") else "⬜"), "کلید AgentRouter تنظیم شده")
print("  " + ("✅" if g.get("gateKeySet") else "⬜"), "ai_gateway_key تنظیم شده")
'
else
  echo "$BODY" | head -12
fi

# ─── ۴) آیا فایل تنظیمات محافظت شده؟ ──────────────────────
hd "۴) امنیت فایل تنظیمات"
CFG=$(curl -s --max-time 15 "$URL/relay-config.php")
CFG_CODE=$(curl -s -o /dev/null -w '%{http_code}' --max-time 15 "$URL/relay-config.php")
if [ "$CFG_CODE" = "403" ] || [ "$CFG_CODE" = "404" ]; then
  ok "relay-config.php از دسترسی مستقیم مسدود است"
elif grep -qi "relay_secret\|openai_api_key\|<?php" <<<"$CFG"; then
  bad "🚨 خطر: محتوای relay-config.php قابل مشاهده است!"
  echo "     فوراً .htaccess را آپلود کنید و کلیدها را عوض کنید"
else
  ok "چیزی لو نمی‌رود (کد $CFG_CODE)"
fi

# ─── ۵) تست با احراز هویت ─────────────────────────────────
if [ -n "$SECRET" ]; then
  hd "۵) تست امضا و دسترسی شبکه"
  if [ "$FOUND_PATH" = "clean" ]; then
    EP="$URL/diagnose"
  else
    EP="$URL/relay.php?path=diagnose"
  fi

  TS=$(date +%s)
  SIG=$(printf '%s|{}' "$TS" | openssl dgst -sha256 -hmac "$SECRET" -r | cut -d' ' -f1)
  D=$(curl -s --max-time 90 -X POST "$EP" \
        -H "X-Relay-Timestamp: $TS" \
        -H "X-Relay-Signature: $SIG" \
        -H 'Content-Type: application/json' -d '{}')

  if grep -q '"ok":[[:space:]]*true' <<<"$D"; then
    ok "امضای HMAC پذیرفته شد"
    echo
    echo "  دسترسی از هاستینگر به سرویس‌های خارجی:"
    if command -v python3 >/dev/null 2>&1; then
      echo "$D" | python3 -c '
import json,sys
try:
    d = json.load(sys.stdin)["result"]
except Exception as e:
    print("    خطا:", e); sys.exit(0)
for r in d.get("reachability", []):
    mark = "OK " if r.get("ok") else "XX "
    print("    [%s] %-24s %5s ms  %s" % (mark, r.get("name","?"), r.get("ms","?"), r.get("error","")))
'
    fi
  else
    bad "امضا رد شد"
    echo "$D" | head -4
    echo "     احتمالاً relay_secret در فایل با چیزی که دادید فرق دارد"
  fi
else
  hd "۵) تست امضا"
  warn "RELAY_SECRET را ندادید — این بخش رد شد"
  echo "     برای تست کامل:  bash check-relay-php.sh $URL YOUR_SECRET"
fi

# ─── جمع‌بندی ─────────────────────────────────────────────
hd "خلاصه"
if [ "$FOUND_PATH" = "clean" ]; then
  echo "  آدرس رله برای تنظیم در سایت:"
  echo "    RELAY_URL=$URL"
  echo "    OPENAI_BASE_URL=$URL/v1"
else
  echo "  ⚠️ .htaccess کار نمی‌کند. دو گزینه دارید:"
  echo "     الف) در hPanel مطمئن شوید mod_rewrite فعال است"
  echo "     ب) یا در سایت از این آدرس استفاده کنید:"
  echo "        RELAY_URL=$URL/relay.php?path="
fi
echo
