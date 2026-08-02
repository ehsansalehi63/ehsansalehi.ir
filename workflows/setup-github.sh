#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════
#  تنظیم کامل ورک‌فلوهای GitHub Actions
#
#  GitHub App آرنا اجازه نوشتن در .github/workflows/ را ندارد.
#  این اسکریپت ورک‌فلوها را از طریق GitHub API ایجاد می‌کند.
#
#  استفاده:
#    export GITHUB_TOKEN=ghp_XXXXX   # توکن شخصی شما (نه App token)
#    bash workflows/setup-github.sh
#
#  یا دستی:
#    ۱. در گیت‌هاب بروید به .github/workflows/
#    ۲. فایل جدید بسازید
#    ۳. محتوای فایل‌های workflows/*.yml را کپی کنید
# ═══════════════════════════════════════════════════════════════
set -euo pipefail

REPO="ehsansalehi63/ehsansalehi.ir"
BRANCH="arena/019fc27e-ehsansalehi-ir"

if [ -z "${GITHUB_TOKEN:-}" ]; then
  echo "❌ GITHUB_TOKEN تنظیم نشده"
  echo ""
  echo "توکن شخصی خود را تنظیم کنید:"
  echo "  export GITHUB_TOKEN=ghp_XXXXX"
  echo ""
  echo "یا ورک‌فلوها را دستی در GitHub UI بسازید:"
  echo "  https://github.com/$REPO/new/$BRANCH/.github/workflows"
  echo ""
  echo "فایل‌ها:"
  for f in workflows/*.yml; do
    echo "  - .github/workflows/$(basename "$f")"
  done
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "📦 ایجاد ورک‌فلوها در GitHub..."
echo "   مخزن: $REPO"
echo "   برنچ: $BRANCH"
echo ""

for f in "$SCRIPT_DIR"/*.yml; do
  NAME=$(basename "$f")
  PATH_IN_REPO=".github/workflows/$NAME"
  CONTENT=$(base64 -w0 < "$f")

  echo "  📝 $NAME"

  # بررسی وجود فایل
  EXISTING_SHA=""
  HTTP_CODE=$(curl -sS -o /tmp/existing.json -w "%{http_code}" \
    -H "Authorization: token $GITHUB_TOKEN" \
    -H "Accept: application/vnd.github.v3+json" \
    "https://api.github.com/repos/$REPO/contents/$PATH_IN_REPO?ref=$BRANCH" 2>&1 || echo "000")

  if [ "$HTTP_CODE" = "200" ]; then
    EXISTING_SHA=$(grep -o '"sha":"[^"]*"' /tmp/existing.json | head -1 | cut -d'"' -f4)
    echo "     (فایل موجود — به‌روزرسانی)"
  else
    echo "     (فایل جدید)"
  fi

  # ایجاد یا به‌روزرسانی
  ARGS=(-f message="ci: add $NAME")
  ARGS+=(-f content="$CONTENT")
  ARGS+=(-f branch="$BRANCH")
  if [ -n "$EXISTING_SHA" ]; then
    ARGS+=(-f sha="$EXISTING_SHA")
  fi

  RESULT=$(gh api "repos/$REPO/contents/$PATH_IN_REPO" \
    --method PUT "${ARGS[@]}" 2>&1) || {
    echo "     ❌ خطا: $RESULT"
    continue
  }
  echo "     ✅ ایجاد شد"
done

echo ""
echo "✅ تمام ورک‌فلوها ایجاد شدند."
echo ""
echo "⚠️  حالا این Secrets را در GitHub تنظیم کنید:"
echo "   https://github.com/$REPO/settings/secrets/actions"
echo ""
echo "   هاستینگر:"
echo "     SSH_IP          (آدرس IP هاستینگر)"
echo "     SSH_PORT        (پورت SSH)"
echo "     SSH_USERNAME    (نام کاربری)"
echo "     SSH_PASSWORD    (رمز عبور)"
echo ""
echo "   میزبان‌فا:"
echo "     FTP_SERVER      (آدرس FTP)"
echo "     FTP_USERNAME    (نام کاربری FTP)"
echo "     FTP_PASSWORD    (رمز FTP)"
echo ""
echo "   مشترک:"
echo "     HEALTH_URL      (https://ehsansalehi.ir/api/deploy/health)"
echo "     RELAY_URL       (آدرس رله هاستینگر)"
echo "     RELAY_SECRET    (رمز مشترک HMAC)"
echo "     CRON_SECRET     (کلید تست سرتاسری)"
