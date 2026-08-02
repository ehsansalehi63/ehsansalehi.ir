#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════
#  نصب ورک‌فلوهای GitHub Actions
#
#  GitHub App آرنا اجازه نوشتن در .github/workflows/ را ندارد.
#  این اسکریپت فایل‌ها را از پوشه workflows/ به جای درست کپی می‌کند.
#
#  استفاده:
#    bash workflows/install.sh
#
#  یا دستی:
#    cp workflows/*.yml .github/workflows/
# ═══════════════════════════════════════════════════════════════
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
WORKFLOWS_DIR=".github/workflows"

echo "📦 نصب ورک‌فلوها..."
echo "   از: $SCRIPT_DIR"
echo "   به: $WORKFLOWS_DIR"
echo ""

mkdir -p "$WORKFLOWS_DIR"

for f in "$SCRIPT_DIR"/*.yml; do
  NAME=$(basename "$f")
  TARGET="$WORKFLOWS_DIR/$NAME"
  cp "$f" "$TARGET"
  echo "  ✅ $NAME"
done

echo ""
echo "✅ تمام ورک‌فلوها نصب شدند."
echo ""
echo "⚠️  حتماً این Secrets را در GitHub تنظیم کنید:"
echo "   Settings → Secrets and variables → Actions"
echo ""
echo "   هاستینگر (SSH):"
echo "     SSH_IP          آدرس IP هاستینگر"
echo "     SSH_PORT        پورت SSH"
echo "     SSH_USERNAME    نام کاربری"
echo "     SSH_PASSWORD    رمز عبور"
echo ""
echo "   میزبان‌فا (FTP):"
echo "     FTP_SERVER      آدرس FTP"
echo "     FTP_USERNAME    نام کاربری FTP"
echo "     FTP_PASSWORD    رمز FTP"
echo ""
echo "   مشترک:"
echo "     HEALTH_URL      https://ehsansalehi.ir/api/deploy/health"
echo "     RELAY_URL       آدرس رله هاستینگر"
echo "     RELAY_SECRET    رمز مشترک HMAC"
echo "     CRON_SECRET     کلید تست سرتاسری"
echo ""
echo "سپس کامیت و پوش کنید:"
echo "   git add .github/workflows/"
echo "   git commit -m 'ci: add SSH-based workflows'"
echo "   git push"
