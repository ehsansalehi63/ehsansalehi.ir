# دیپلوی سریع و قابل مشاهده روی Mizbanfa/cPanel

هدف این طرح این است که تجربه‌ای شبیه Vercel داشته باشیم:

- دیپلوی سریع‌تر از FTP فایل‌به‌فایل
- لاگ واضح در GitHub Actions و داخل هاست
- Health Check بعد از دیپلوی
- نمایش نسخه/کامیت فعال سایت از طریق API
- جلوگیری دائمی از مشکل `HOSTNAME=cip17.mizbanfadns.net` در Next.js standalone

## Endpointهای بررسی وضعیت

بعد از دیپلوی، این آدرس باید نسخه فعال سایت را نشان بدهد:

```bash
curl -s https://ehsansalehi.ir/api/deploy/health
```

برای تست دیتابیس هم:

```bash
curl -s https://ehsansalehi.ir/api/deploy/health?db=1
```

اگر DNS هنوز مشکل داشت، با IP مستقیم تست کنید:

```bash
curl -s -H 'Host: ehsansalehi.ir' http://88.135.68.17/api/deploy/health
```

## Build Info

بعد از هر build، فایل‌های زیر ساخته می‌شوند:

- `public/deploy-info.json`
- `.next/standalone/deploy-info.json`

این فایل‌ها شامل commit، زمان build، run id و نسخه Node هستند.

## روش پیشنهادی سریع: Upload یک tar.gz + Extract روی هاست

FTP-Deploy-Action هزاران فایل را یکی‌یکی sync می‌کند و روی هاست اشتراکی کند/پرخطاست. روش سریع‌تر:

1. GitHub Actions پروژه را build می‌کند.
2. خروجی standalone به یک فایل tar.gz تبدیل می‌شود.
3. فقط همان یک فایل به هاست منتقل می‌شود.
4. روی هاست extract می‌شود، `tmp/restart.txt` touch می‌شود و health check اجرا می‌شود.

## Secretهای لازم برای GitHub Actions

در GitHub → Settings → Secrets and variables → Actions این Secretها را بسازید:

```txt
CPANEL_SSH_HOST      cip17.mizbanfadns.net یا IP/host SSH میزبان‌فا
CPANEL_SSH_PORT      22 یا پورتی که میزبان‌فا داده
CPANEL_SSH_USER      deltadasht
CPANEL_SSH_KEY       Private key مخصوص deploy، نه پسورد
CPANEL_APP_DIR       /home/deltadasht/ehsansalehi.ir
```

اگر SSH ندارید، از پشتیبانی میزبان‌فا بخواهید SSH/Terminal برای اکانت فعال باشد یا کلید public شما را در `~/.ssh/authorized_keys` بگذارند.

## Workflow پیشنهادی

به دلیل محدودیت GitHub App آرنا، فایل workflow را باید دستی در GitHub UI بسازید/ویرایش کنید. مسیر پیشنهادی:

```txt
.github/workflows/deploy-mizbanfa-fast.yml
```

محتوا:

```yaml
name: Fast Deploy to Mizbanfa cPanel

on:
  push:
    branches:
      - main
  workflow_dispatch:

jobs:
  build-package-deploy:
    runs-on: ubuntu-latest
    timeout-minutes: 25
    env:
      NEXT_PUBLIC_SITE_URL: https://ehsansalehi.ir
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build and create deploy bundle
        id: bundle
        run: |
          BUNDLE_PATH=$(bash scripts/create-mizbanfa-bundle.sh | tail -1)
          echo "bundle_path=$BUNDLE_PATH" >> "$GITHUB_OUTPUT"
          ls -lh "$BUNDLE_PATH"

      - name: Configure SSH
        run: |
          mkdir -p ~/.ssh
          printf '%s\n' "${{ secrets.CPANEL_SSH_KEY }}" > ~/.ssh/id_ed25519
          chmod 600 ~/.ssh/id_ed25519
          ssh-keyscan -p "${{ secrets.CPANEL_SSH_PORT || '22' }}" "${{ secrets.CPANEL_SSH_HOST }}" >> ~/.ssh/known_hosts

      - name: Upload bundle and installer
        run: |
          SSH_PORT="${{ secrets.CPANEL_SSH_PORT || '22' }}"
          SSH_TARGET="${{ secrets.CPANEL_SSH_USER }}@${{ secrets.CPANEL_SSH_HOST }}"
          APP_DIR="${{ secrets.CPANEL_APP_DIR }}"
          DEPLOY_ID="${{ github.run_id }}-${{ github.run_attempt }}-${{ github.sha }}"
          REMOTE_DIR="$APP_DIR/incoming"
          ssh -p "$SSH_PORT" "$SSH_TARGET" "mkdir -p '$REMOTE_DIR' '$APP_DIR/scripts'"
          scp -P "$SSH_PORT" "${{ steps.bundle.outputs.bundle_path }}" "$SSH_TARGET:$REMOTE_DIR/$DEPLOY_ID.tar.gz"
          scp -P "$SSH_PORT" scripts/remote-mizbanfa-install.sh "$SSH_TARGET:$APP_DIR/scripts/remote-mizbanfa-install.sh"

      - name: Install bundle and run health checks
        run: |
          SSH_PORT="${{ secrets.CPANEL_SSH_PORT || '22' }}"
          SSH_TARGET="${{ secrets.CPANEL_SSH_USER }}@${{ secrets.CPANEL_SSH_HOST }}"
          APP_DIR="${{ secrets.CPANEL_APP_DIR }}"
          DEPLOY_ID="${{ github.run_id }}-${{ github.run_attempt }}-${{ github.sha }}"
          ssh -p "$SSH_PORT" "$SSH_TARGET" \
            "APP_DIR='$APP_DIR' DEPLOY_ID='$DEPLOY_ID' DOMAIN='ehsansalehi.ir' IP='88.135.68.17' bash '$APP_DIR/scripts/remote-mizbanfa-install.sh' '$APP_DIR/incoming/$DEPLOY_ID.tar.gz'"

      - name: Public health check
        run: |
          curl --fail --show-error --silent --location --max-time 30 \
            https://ehsansalehi.ir/api/deploy/health
```

## لاگ‌ها کجا دیده می‌شوند؟

1. داخل GitHub Actions، مرحله‌های build/upload/install/health check واضح دیده می‌شوند.
2. داخل هاست، لاگ هر دیپلوی اینجاست:

```txt
/home/deltadasht/ehsansalehi.ir/deploy-logs/<DEPLOY_ID>.log
```

آخرین وضعیت deploy را می‌توانید از health endpoint ببینید:

```bash
curl -s -H 'Host: ehsansalehi.ir' http://88.135.68.17/api/deploy/health
```

## اگر هنوز FTP می‌خواهید

Workflow فعلی FTP کار می‌کند، اما کند است و ممکن است timeout بدهد. حداقل مطمئن شوید بعد از build این script اجرا می‌شود:

```bash
npm run build
```

چون `postbuild` حالا دو کار انجام می‌دهد:

1. `deploy-info.json` می‌سازد.
2. `server.js` خروجی standalone را مجبور می‌کند روی `0.0.0.0` bind شود.

## Rollback اضطراری

اسکریپت نصب قبل از هر deploy یک backup می‌سازد:

```txt
/home/deltadasht/ehsansalehi.ir/backups/runtime-<DEPLOY_ID>.tar.gz
```

برای rollback دستی:

```bash
cd /home/deltadasht/ehsansalehi.ir
mkdir -p /tmp/rollback-ehsan
tar -xzf backups/runtime-DEPLOY_ID.tar.gz -C /tmp/rollback-ehsan
cp -a /tmp/rollback-ehsan/.next /home/deltadasht/ehsansalehi.ir/.next
cp -a /tmp/rollback-ehsan/public /home/deltadasht/ehsansalehi.ir/public
cp -a /tmp/rollback-ehsan/server.js /home/deltadasht/ehsansalehi.ir/server.js
cp -a /tmp/rollback-ehsan/package.json /home/deltadasht/ehsansalehi.ir/package.json
touch /home/deltadasht/ehsansalehi.ir/tmp/restart.txt
```
