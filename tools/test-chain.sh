#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════
#  تست کامل زنجیره:  سایت (میزبان‌فا)  →  رله (هاستینگر)  →  بالادست
#
#  استفاده:
#     bash tools/test-chain.sh
#
#  متغیرها (یا از محیط، یا با پرچم):
#     SITE_URL       پیش‌فرض https://ehsansalehi.ir
#     RELAY_URL      آدرس رله هاستینگر
#     RELAY_SECRET   برای تست امضای HMAC (اختیاری ولی توصیه‌شده)
#     CRON_SECRET    برای تست از سمت سایت (اختیاری)
#
#  مثال:
#     RELAY_URL=https://xxx.hostingersite.com \
#     RELAY_SECRET=abc... CRON_SECRET=def... \
#     bash tools/test-chain.sh
#
#  هیچ پستی منتشر نمی‌کند و هیچ کلیدی را چاپ نمی‌کند.
# ═══════════════════════════════════════════════════════════════════════
set -uo pipefail

SITE_URL="${SITE_URL:-https://ehsansalehi.ir}"
RELAY_URL="${RELAY_URL:-}"
RELAY_SECRET="${RELAY_SECRET:-}"
CRON_SECRET="${CRON_SECRET:-}"
TIMEOUT="${TIMEOUT:-25}"

while [ $# -gt 0 ]; do
  case "$1" in
    --site)   SITE_URL="$2";     shift 2 ;;
    --relay)  RELAY_URL="$2";    shift 2 ;;
    --secret) RELAY_SECRET="$2"; shift 2 ;;
    --cron)   CRON_SECRET="$2";  shift 2 ;;
    -h|--help) sed -n '2,20p' "$0"; exit 0 ;;
    *) echo "گزینه ناشناخته: $1"; exit 2 ;;
  esac
done

SITE_URL="${SITE_URL%/}"
RELAY_URL="${RELAY_URL%/}"

PASS=0; FAIL=0; WARN=0
if [ -t 1 ]; then G=$'\e[32m'; R=$'\e[31m'; Y=$'\e[33m'; B=$'\e[1m'; N=$'\e[0m';
else G=; R=; Y=; B=; N=; fi

ok()   { echo "  ${G}[ OK ]${N} $1"; PASS=$((PASS+1)); }
bad()  { echo "  ${R}[FAIL]${N} $1"; [ -n "${2:-}" ] && echo "         → $2"; FAIL=$((FAIL+1)); }
warn() { echo "  ${Y}[WARN]${N} $1"; [ -n "${2:-}" ] && echo "         → $2"; WARN=$((WARN+1)); }
hdr()  { echo; echo "${B}$1${N}"; echo "${1//?/─}"; }

# مقدار یک کلید JSON را بدون نیاز به jq بیرون می‌کشد
jval() { printf '%s' "$1" | grep -o "\"$2\"[[:space:]]*:[[:space:]]*\"[^\"]*\"" | head -1 | sed 's/.*:[[:space:]]*"//; s/"$//'; }
jbool(){ printf '%s' "$1" | grep -o "\"$2\"[[:space:]]*:[[:space:]]*\(true\|false\)" | head -1 | grep -o '\(true\|false\)$'; }

echo "${B}تست زنجیره سایت ↔ رله${N}   $(date -u +%FT%TZ)"
echo "سایت: $SITE_URL"
echo "رله : ${RELAY_URL:-(تنظیم نشده)}"

# ═══ ۱) سایت زنده است؟ ════════════════════════════════════════
hdr "۱) سایت روی میزبان‌فا"

CODE=$(curl -sS -o /dev/null -w '%{http_code}' --max-time "$TIMEOUT" "$SITE_URL/" 2>/dev/null)
case "$CODE" in
  200|301|302) ok "صفحه اصلی پاسخ داد (HTTP $CODE)" ;;
  000) bad "به سایت وصل نشد" "DNS/TLS/فایروال را بررسی کنید" ;;
  *)   bad "صفحه اصلی HTTP $CODE" ;;
esac

HEALTH=$(curl -sS --max-time "$TIMEOUT" "$SITE_URL/api/deploy/health" 2>/dev/null)
if [ "$(jbool "$HEALTH" ok)" = "true" ]; then
  ok "health سایت سالم است (نسخه $(jval "$HEALTH" shortCommit), node $(jval "$HEALTH" node))"
else
  bad "health سایت پاسخ درست نداد" "${HEALTH:0:200}"
fi

# ═══ ۲) رله زنده است؟ ═════════════════════════════════════════
hdr "۲) رله روی هاستینگر"

if [ -z "$RELAY_URL" ]; then
  warn "RELAY_URL داده نشده — مراحل ۲ و ۳ رد شد"
else
  RH=$(curl -sS --max-time "$TIMEOUT" "$RELAY_URL/health" 2>/dev/null)
  # اگر rewrite کار نکرد، مسیر مستقیم relay.php را امتحان کن
  if [ "$(jbool "$RH" ok)" != "true" ]; then
    RH2=$(curl -sS --max-time "$TIMEOUT" "$RELAY_URL/relay.php?path=health" 2>/dev/null)
    if [ "$(jbool "$RH2" ok)" = "true" ]; then
      warn ".htaccess کار نمی‌کند" "مسیر /health به relay.php نمی‌رسد؛ فایل .htaccess را آپلود کنید"
      RH="$RH2"
    fi
  fi

  if [ "$(jbool "$RH" ok)" = "true" ]; then
    ok "رله زنده است (سرویس $(jval "$RH" service), PHP $(jval "$RH" php))"

    [ "$(jbool "$RH" secretConfigured)" = "true" ] \
      && ok "relay_secret تنظیم شده" \
      || bad "relay_secret خالی است" "در relay-config.php پرش کنید"

    [ "$(jbool "$RH" enabled)" = "true" ] \
      && ok "دروازه AI فعال است (openai_api_key پر شده)" \
      || warn "دروازه AI غیرفعال" "openai_api_key خالی است"

    [ "$(jbool "$RH" gateKeySet)" = "true" ] \
      && ok "ai_gateway_key تنظیم شده" \
      || warn "ai_gateway_key خالی است"
  else
    bad "رله پاسخ سالم نداد" "${RH:0:200}"
  fi
fi

# ═══ ۳) امضای HMAC پذیرفته می‌شود؟ ════════════════════════════
hdr "۳) احراز هویت HMAC و دسترسی بالادست"

if [ -z "$RELAY_URL" ] || [ -z "$RELAY_SECRET" ]; then
  warn "RELAY_SECRET داده نشده — تست امضا رد شد"
elif ! command -v openssl >/dev/null 2>&1; then
  warn "openssl نصب نیست — تست امضا رد شد"
else
  BODY='{}'
  TS=$(date +%s)
  SIG=$(printf '%s' "${TS}|${BODY}" | openssl dgst -sha256 -hmac "$RELAY_SECRET" -hex | sed 's/.*= *//')

  DIAG=$(curl -sS --max-time 45 -X POST "$RELAY_URL/diagnose" \
    -H 'Content-Type: application/json' \
    -H "X-Relay-Timestamp: $TS" \
    -H "X-Relay-Signature: $SIG" \
    -d "$BODY" 2>/dev/null)

  if [ "$(jbool "$DIAG" ok)" = "true" ]; then
    ok "امضای HMAC پذیرفته شد"
    echo
    echo "    دسترسی رله به سرویس‌های بالادست:"
    # هر جفت host/ms را از خروجی diagnose بیرون بکش
    printf '%s' "$DIAG" \
      | grep -o '{[^{}]*}' \
      | while IFS= read -r item; do
          H=$(printf '%s' "$item" | grep -o '"host"[[:space:]]*:[[:space:]]*"[^"]*"' | sed 's/.*"\([^"]*\)"$/\1/')
          [ -z "$H" ] && continue
          O=$(printf '%s' "$item" | grep -o '"ok"[[:space:]]*:[[:space:]]*\(true\|false\)' | grep -o '\(true\|false\)$')
          M=$(printf '%s' "$item" | grep -o '"ms"[[:space:]]*:[[:space:]]*[0-9]*' | grep -o '[0-9]*$')
          if [ "$O" = "true" ]; then printf '      %s[OK ]%s %-30s %s ms\n' "$G" "$N" "$H" "${M:-?}"
          else                       printf '      %s[!! ]%s %-30s ناموفق\n' "$R" "$N" "$H"; fi
        done
  elif printf '%s' "$DIAG" | grep -qi '403\|امضا\|timestamp'; then
    bad "امضا رد شد" "RELAY_SECRET سایت و رله یکی نیست، یا ساعت سرور اختلاف دارد"
    echo "         ${DIAG:0:200}"
  else
    bad "diagnose پاسخ نداد" "${DIAG:0:200}"
  fi
fi

# ═══ ۴) تست سرتاسری از داخل خود سایت ══════════════════════════
hdr "۴) زنجیره کامل از دید سایت"

if [ -z "$CRON_SECRET" ]; then
  warn "CRON_SECRET داده نشده — تست سرتاسری رد شد" \
       "این مهم‌ترین تست است: نشان می‌دهد خودِ سایت به رله می‌رسد"
else
  CHAIN=$(curl -sS --max-time 60 "$SITE_URL/api/admin/relay-test?key=$CRON_SECRET" 2>/dev/null)

  if printf '%s' "$CHAIN" | grep -q '"step"'; then
    printf '%s' "$CHAIN" | grep -o '{[^{}]*"step"[^{}]*}' | while IFS= read -r item; do
      S=$(printf '%s' "$item" | grep -o '"step"[[:space:]]*:[[:space:]]*"[^"]*"' | sed 's/.*"\([^"]*\)"$/\1/')
      O=$(printf '%s' "$item" | grep -o '"ok"[[:space:]]*:[[:space:]]*\(true\|false\)' | grep -o '\(true\|false\)$')
      D=$(printf '%s' "$item" | grep -o '"detail"[[:space:]]*:[[:space:]]*"[^"]*"' | sed 's/.*"\([^"]*\)"$/\1/')
      if [ "$O" = "true" ]; then printf '  %s[ OK ]%s %s\n' "$G" "$N" "$S"
      else printf '  %s[FAIL]%s %s\n         → %s\n' "$R" "$N" "$S" "$D"; fi
    done
    if [ "$(jbool "$CHAIN" ok)" = "true" ]; then ok "زنجیره کامل سالم است"
    else bad "زنجیره در یکی از مراحل بالا شکست"; fi
  elif printf '%s' "$CHAIN" | grep -q 'کلید نامعتبر'; then
    bad "CRON_SECRET اشتباه است"
  elif printf '%s' "$CHAIN" | grep -q '404\|<!DOCTYPE'; then
    bad "endpoint وجود ندارد" "نسخه فعلی سایت شامل /api/admin/relay-test نیست — دیپلوی کنید"
  else
    bad "پاسخ نامفهوم" "${CHAIN:0:200}"
  fi
fi

# ═══ خلاصه ════════════════════════════════════════════════════
hdr "خلاصه"
echo "  موفق: ${G}${PASS}${N}    هشدار: ${Y}${WARN}${N}    ناموفق: ${R}${FAIL}${N}"
echo
[ "$FAIL" -gt 0 ] && exit 1
exit 0
