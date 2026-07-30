#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════
#  تشخیص وضعیت هاست میزبان‌فا / هاستینگر
#  این اسکریپت هیچ چیزی را تغییر نمی‌دهد — فقط گزارش می‌دهد.
#
#  اجرا:
#    bash diagnose-host.sh              # گزارش روی صفحه
#    bash diagnose-host.sh > report.txt # ذخیره در فایل
# ═══════════════════════════════════════════════════════════════

echo "════════════════════════════════════════════════════"
echo "  گزارش تشخیص هاست"
echo "  تاریخ: $(date -u '+%Y-%m-%d %H:%M UTC')"
echo "════════════════════════════════════════════════════"
echo

# ── ۱) هویت سرور ──────────────────────────────────────
echo "── ۱) هویت سرور ──"
echo "hostname : $(hostname 2>/dev/null || echo '?')"
echo "user     : $(whoami 2>/dev/null || echo '?')"
echo "home     : $HOME"
echo "os       : $(cat /etc/redhat-release 2>/dev/null || uname -sr)"
echo "arch     : $(uname -m)"
echo

# ── ۲) منابع ──────────────────────────────────────────
echo "── ۲) منابع ──"
echo "cpu cores: $(nproc 2>/dev/null || grep -c ^processor /proc/cpuinfo 2>/dev/null || echo '?')"
if command -v free >/dev/null 2>&1; then
  echo "memory   : $(free -m 2>/dev/null | awk '/^Mem:/{print $2" MB total, "$7" MB available"}')"
fi
echo "disk     : $(df -h "$HOME" 2>/dev/null | awk 'NR==2{print $4" free of "$2}')"
echo "load     : $(uptime 2>/dev/null | sed 's/.*load average: //')"
echo "ulimit   : nproc=$(ulimit -u 2>/dev/null) nofile=$(ulimit -n 2>/dev/null)"
echo

# ── ۳) ابزارهای موجود ─────────────────────────────────
echo "── ۳) ابزارهای موجود ──"
for t in node npm npx git curl wget tar gzip unzip zip rsync ssh php python3 mysql ffmpeg convert openssl jq crontab; do
  if command -v "$t" >/dev/null 2>&1; then
    v=$("$t" --version 2>&1 | head -1 | cut -c1-45)
    printf "  ✅ %-9s %s\n" "$t" "$v"
  else
    printf "  ❌ %-9s (موجود نیست)\n" "$t"
  fi
done
echo

# ── ۴) نسخه‌های Node موجود در cPanel ─────────────────
echo "── ۴) نسخه‌های Node در cPanel ──"
if [ -d "$HOME/nodevenv" ]; then
  find "$HOME/nodevenv" -maxdepth 2 -mindepth 2 -type d 2>/dev/null | while read -r d; do
    echo "  📦 $d"
  done
else
  echo "  (پوشه nodevenv یافت نشد)"
fi
ls -d /opt/alt/alt-nodejs*/root/usr/bin 2>/dev/null | while read -r d; do
  echo "  📦 $d"
done
echo

# ── ۵) دسترسی شبکه (مهم‌ترین بخش) ────────────────────
echo "── ۵) دسترسی شبکه ──"
check() {
  local name="$1" url="$2" t0 t1 code ms
  t0=$(date +%s%N 2>/dev/null || echo 0)
  code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 12 "$url" 2>/dev/null || echo "000")
  t1=$(date +%s%N 2>/dev/null || echo 0)
  ms=$(( (t1 - t0) / 1000000 ))
  if [ "$code" = "000" ]; then
    printf "  ❌ %-22s ناموفق (timeout یا مسدود)\n" "$name"
  elif [ "$ms" -gt 5000 ]; then
    printf "  ⚠️  %-22s HTTP %s — %s ms (کند)\n" "$name" "$code" "$ms"
  else
    printf "  ✅ %-22s HTTP %s — %s ms\n" "$name" "$code" "$ms"
  fi
}
check "github.com"        "https://github.com"
check "raw.githubusercontent" "https://raw.githubusercontent.com"
check "npm registry"      "https://registry.npmjs.org"
check "npm mirror (IR)"   "https://mirror-npm.runflare.com"
check "graph.facebook"    "https://graph.facebook.com"
check "api.telegram.org"  "https://api.telegram.org"
check "agentrouter.org"   "https://agentrouter.org"
check "google.com"        "https://www.google.com"
echo

# ── ۶) سرعت دانلود واقعی ─────────────────────────────
echo "── ۶) سرعت دانلود (فایل ۱ مگابایتی) ──"
spd=$(curl -s -o /dev/null -w '%{speed_download}' --max-time 40 \
  "https://raw.githubusercontent.com/nodejs/node/main/README.md" 2>/dev/null || echo 0)
kb=$(awk "BEGIN{printf \"%.0f\", $spd/1024}" 2>/dev/null || echo 0)
if [ "$kb" -gt 500 ]; then
  echo "  ✅ گیت‌هاب: ${kb} KB/s (خوب)"
elif [ "$kb" -gt 50 ]; then
  echo "  ⚠️  گیت‌هاب: ${kb} KB/s (کند — از روش tar.gz استفاده کنید)"
else
  echo "  ❌ گیت‌هاب: ${kb} KB/s (غیرقابل استفاده — حتماً معماری معکوس)"
fi
echo

# ── ۷) امکان Cron ────────────────────────────────────
echo "── ۷) Cron ──"
if command -v crontab >/dev/null 2>&1; then
  n=$(crontab -l 2>/dev/null | grep -vc '^#' || echo 0)
  echo "  ✅ crontab در دسترس — $n خط فعال"
else
  echo "  ❌ crontab در دسترس نیست (از بخش Cron Jobs در cPanel استفاده کنید)"
fi
echo

# ── ۸) وضعیت اپ فعلی ─────────────────────────────────
echo "── ۸) اپ فعلی ──"
for d in "$HOME"/*/ ; do
  if [ -f "$d/server.js" ] || [ -f "$d/package.json" ]; then
    echo "  📁 $(basename "$d")"
    [ -f "$d/package.json" ]     && echo "      package.json ✅"
    [ -f "$d/server.js" ]        && echo "      server.js ✅ (Next standalone)"
    [ -f "$d/.env" ]             && echo "      .env ✅ ($(wc -l < "$d/.env" 2>/dev/null) خط)"
    [ -d "$d/node_modules" ]     && echo "      node_modules ✅ ($(du -sh "$d/node_modules" 2>/dev/null | cut -f1))"
    [ -f "$d/tmp/restart.txt" ]  && echo "      tmp/restart.txt ✅ (ری‌استارت کار می‌کند)"
  fi
done
echo

# ── ۹) دیتابیس ───────────────────────────────────────
echo "── ۹) دیتابیس ──"
if command -v mysql >/dev/null 2>&1; then
  echo "  ✅ کلاینت mysql موجود است"
else
  echo "  ⚠️  کلاینت mysql موجود نیست (از phpMyAdmin استفاده کنید)"
fi
echo

echo "════════════════════════════════════════════════════"
echo "  پایان گزارش — این خروجی را برای من بفرستید"
echo "════════════════════════════════════════════════════"
