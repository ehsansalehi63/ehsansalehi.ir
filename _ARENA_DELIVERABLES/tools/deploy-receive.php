<?php
/**
 * ═══════════════════════════════════════════════════════════════
 *  گیرنده دیپلوی — جایگزین SSH روی هاست اشتراکی
 *
 *  GitHub Actions یک فایل tar.gz می‌فرستد، این اسکریپت:
 *    ۱) امضای HMAC را بررسی می‌کند
 *    ۲) از نسخه فعلی بکاپ می‌گیرد
 *    ۳) بسته را استخراج می‌کند (.env دست‌نخورده می‌ماند)
 *    ۴) اپ Node را ری‌استارت می‌کند
 *    ۵) health check می‌زند
 *    ۶) اگر خطا بود، خودکار به نسخه قبل برمی‌گردد
 *
 *  نصب:
 *    ۱) DEPLOY_SECRET را عوض کنید (۳۲+ کاراکتر تصادفی)
 *    ۲) APP_DIR را با مسیر واقعی اپ تنظیم کنید
 *    ۳) با FTP در public_html آپلود کنید
 *    ۴) همان secret را در GitHub Secrets بگذارید
 * ═══════════════════════════════════════════════════════════════
 */

// ─── تنظیمات ────────────────────────────────────────────────
const DEPLOY_SECRET = 'CHANGE-ME-TO-A-LONG-RANDOM-STRING';
const APP_DIR       = '/home/USERNAME/ehsansalehi.ir';   // ← مسیر اپ
const HEALTH_URL    = 'https://ehsansalehi.ir/api/health';
const KEEP_BACKUPS  = 3;
const MAX_UPLOAD_MB = 200;

// فایل‌هایی که هرگز نباید بازنویسی شوند
const PRESERVE = ['.env', '.env.local', '.htaccess', 'tmp', 'uploads', 'deploy-logs', 'backups'];

// ─── راه‌اندازی ─────────────────────────────────────────────
header('Content-Type: application/json; charset=utf-8');
set_time_limit(600);
ini_set('memory_limit', '512M');

$LOG = [];
function logg(string $m): void {
    global $LOG;
    $LOG[] = gmdate('H:i:s') . ' ' . $m;
}
function respond(bool $ok, string $msg, array $extra = []): never {
    global $LOG;
    http_response_code($ok ? 200 : 500);
    echo json_encode(
        ['ok' => $ok, 'message' => $msg, 'log' => $LOG] + $extra,
        JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT
    );
    exit;
}

// ─── ۱) احراز هویت ──────────────────────────────────────────
$action = $_POST['action'] ?? $_GET['action'] ?? 'deploy';
$sig    = $_SERVER['HTTP_X_DEPLOY_SIGNATURE'] ?? $_POST['signature'] ?? '';
$ts     = $_SERVER['HTTP_X_DEPLOY_TIMESTAMP'] ?? $_POST['timestamp'] ?? '';

if ($action === 'ping') {
    respond(true, 'receiver alive', [
        'php'      => PHP_VERSION,
        'app_dir'  => APP_DIR,
        'writable' => is_writable(APP_DIR),
        'phar'     => class_exists('PharData'),
        'exec'     => function_exists('shell_exec'),
    ]);
}

// جلوگیری از replay attack — درخواست قدیمی‌تر از ۵ دقیقه رد می‌شود
if (!$ts || abs(time() - (int)$ts) > 300) {
    respond(false, 'timestamp نامعتبر یا منقضی');
}
$expected = hash_hmac('sha256', $ts . '|' . $action, DEPLOY_SECRET);
if (!hash_equals($expected, $sig)) {
    http_response_code(403);
    respond(false, 'امضای نامعتبر');
}

logg("احراز هویت موفق — action={$action}");

// ─── ۲) دریافت بسته ─────────────────────────────────────────
if (!isset($_FILES['bundle'])) {
    respond(false, 'فایل bundle ارسال نشده');
}
$up = $_FILES['bundle'];
if ($up['error'] !== UPLOAD_ERR_OK) {
    respond(false, 'خطای آپلود کد ' . $up['error']);
}
$sizeMb = round($up['size'] / 1048576, 1);
if ($sizeMb > MAX_UPLOAD_MB) {
    respond(false, "حجم بیش از حد: {$sizeMb} MB");
}
logg("بسته دریافت شد: {$sizeMb} MB");

$deployId = gmdate('Ymd-His') . '-' . substr(bin2hex(random_bytes(3)), 0, 6);
$work     = APP_DIR . '/.deploy/' . $deployId;
$backups  = APP_DIR . '/backups';
@mkdir($work, 0755, true);
@mkdir($backups, 0755, true);

$tarGz = $work . '/bundle.tar.gz';
if (!move_uploaded_file($up['tmp_name'], $tarGz)) {
    respond(false, 'ذخیره بسته ناموفق بود');
}

// ─── ۳) استخراج ─────────────────────────────────────────────
$extract = $work . '/extracted';
@mkdir($extract, 0755, true);

$extracted = false;
if (function_exists('shell_exec') && !in_array('shell_exec', array_map('trim', explode(',', (string)ini_get('disable_functions'))), true)) {
    @shell_exec('tar -xzf ' . escapeshellarg($tarGz) . ' -C ' . escapeshellarg($extract) . ' 2>&1');
    $extracted = file_exists($extract . '/server.js');
    logg($extracted ? 'استخراج با tar ✅' : 'tar ناموفق — تلاش با PharData');
}
if (!$extracted && class_exists('PharData')) {
    try {
        $tar = $work . '/bundle.tar';
        (new PharData($tarGz))->decompress();          // → bundle.tar
        (new PharData($tar))->extractTo($extract, null, true);
        @unlink($tar);
        $extracted = file_exists($extract . '/server.js');
        logg($extracted ? 'استخراج با PharData ✅' : 'PharData ناموفق');
    } catch (Throwable $e) {
        logg('خطای PharData: ' . $e->getMessage());
    }
}
if (!$extracted) {
    respond(false, 'استخراج بسته ناموفق بود — نه tar و نه PharData کار نکرد');
}

// اعتبارسنجی بسته
foreach (['server.js', '.next', 'public'] as $must) {
    if (!file_exists($extract . '/' . $must)) {
        respond(false, "بسته ناقص است: {$must} یافت نشد");
    }
}
logg('اعتبارسنجی بسته ✅');

// ─── ۴) بکاپ نسخه فعلی ──────────────────────────────────────
$backupDir = $backups . '/' . $deployId;
@mkdir($backupDir, 0755, true);
foreach (['server.js', 'package.json', '.next', 'public'] as $item) {
    $src = APP_DIR . '/' . $item;
    if (file_exists($src)) {
        if (function_exists('shell_exec')) {
            @shell_exec('cp -a ' . escapeshellarg($src) . ' ' . escapeshellarg($backupDir . '/') . ' 2>&1');
        }
    }
}
logg('بکاپ ساخته شد: ' . $deployId);

// ─── ۵) نصب فایل‌های جدید ───────────────────────────────────
function rrmdir(string $d): void {
    if (!is_dir($d)) { @unlink($d); return; }
    foreach (array_diff(scandir($d) ?: [], ['.', '..']) as $f) {
        rrmdir($d . '/' . $f);
    }
    @rmdir($d);
}
function rcopy(string $src, string $dst): void {
    if (is_dir($src)) {
        @mkdir($dst, 0755, true);
        foreach (array_diff(scandir($src) ?: [], ['.', '..']) as $f) {
            rcopy("$src/$f", "$dst/$f");
        }
    } else {
        @copy($src, $dst);
    }
}

foreach (array_diff(scandir($extract) ?: [], ['.', '..']) as $item) {
    if (in_array($item, PRESERVE, true)) {
        logg("حفظ شد (بازنویسی نشد): {$item}");
        continue;
    }
    $target = APP_DIR . '/' . $item;
    if (file_exists($target)) rrmdir($target);
    rcopy($extract . '/' . $item, $target);
}
logg('فایل‌های جدید نصب شدند ✅');

// ─── ۶) ری‌استارت اپ ────────────────────────────────────────
@mkdir(APP_DIR . '/tmp', 0755, true);
@file_put_contents(APP_DIR . '/tmp/restart.txt', gmdate('c') . " deploy={$deployId}\n");
logg('درخواست ری‌استارت ثبت شد');

// ─── ۷) بررسی سلامت ─────────────────────────────────────────
$healthy = false;
$lastCode = 0;
for ($i = 1; $i <= 12; $i++) {
    sleep(5);
    $ch = curl_init(HEALTH_URL);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => 12,
        CURLOPT_SSL_VERIFYPEER => false,
        CURLOPT_FOLLOWLOCATION => true,
    ]);
    $body = curl_exec($ch);
    $lastCode = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    if ($lastCode >= 200 && $lastCode < 400) {
        $healthy = true;
        logg("health check ✅ بعد از {$i} تلاش (HTTP {$lastCode})");
        break;
    }
    logg("تلاش {$i}: HTTP {$lastCode}");
}

// ─── ۸) بازگشت خودکار در صورت خطا ───────────────────────────
if (!$healthy) {
    logg('⚠️ health check ناموفق — بازگشت به نسخه قبل');
    foreach (array_diff(scandir($backupDir) ?: [], ['.', '..']) as $item) {
        $target = APP_DIR . '/' . $item;
        if (file_exists($target)) rrmdir($target);
        rcopy($backupDir . '/' . $item, $target);
    }
    @file_put_contents(APP_DIR . '/tmp/restart.txt', gmdate('c') . " rollback={$deployId}\n");
    logg('بازگشت انجام شد');
    rrmdir($work);
    respond(false, 'دیپلوی ناموفق — به نسخه قبل بازگشتیم', [
        'deploy_id'   => $deployId,
        'health_code' => $lastCode,
    ]);
}

// ─── ۹) پاکسازی ─────────────────────────────────────────────
rrmdir($work);
$all = glob($backups . '/*', GLOB_ONLYDIR) ?: [];
rsort($all);
foreach (array_slice($all, KEEP_BACKUPS) as $old) {
    rrmdir($old);
    logg('بکاپ قدیمی حذف شد: ' . basename($old));
}

// لاگ دائمی
@mkdir(APP_DIR . '/deploy-logs', 0755, true);
@file_put_contents(
    APP_DIR . "/deploy-logs/{$deployId}.log",
    implode("\n", $LOG) . "\n"
);

respond(true, '✅ دیپلوی با موفقیت انجام شد', [
    'deploy_id' => $deployId,
    'size_mb'   => $sizeMb,
]);
