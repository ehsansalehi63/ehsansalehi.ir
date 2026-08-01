<?php
/**
 * ═══════════════════════════════════════════════════════════
 *  تشخیص وضعیت هاست — نسخه آماده (بدون نیاز به ویرایش)
 *
 *  نصب:
 *    ۱) این فایل را با FTP در پوشه public_html آپلود کنید
 *    ۲) نام فایل را دقیقاً diagnose-READY.php نگه دارید
 *    ۳) این لینک را باز کنید (کلید از قبل داخل فایل هست):
 *
 *       https://ehsansalehi.ir/diagnose-READY.php?key=Mfzv7PjcU8BUVj7FRDU7Leenkas
 *
 *    ۴) کل خروجی را کپی کنید و بفرستید
 *    ۵) ⚠️ بعد از تشخیص، فایل را از هاست پاک کنید
 * ═══════════════════════════════════════════════════════════
 */

const SECRET = 'Mfzv7PjcU8BUVj7FRDU7Leenkas';   // کلید آماده — نیازی به تغییر نیست

$given = $_GET['key'] ?? '';
if ($given !== SECRET) {
    http_response_code(403);
    header('Content-Type: text/plain; charset=utf-8');
    echo "دسترسی رد شد.\n\n";
    echo "کلیدی که فرستادید : " . ($given === '' ? '(خالی)' : $given) . "\n";
    echo "طول کلید ارسالی  : " . strlen($given) . "\n";
    echo "طول کلید صحیح    : " . strlen(SECRET) . "\n\n";
    echo "لینک درست:\n";
    echo "  " . (isset($_SERVER['HTTPS']) ? 'https' : 'http') . "://"
       . ($_SERVER['HTTP_HOST'] ?? 'yourdomain.ir')
       . ($_SERVER['SCRIPT_NAME'] ?? '/diagnose-READY.php')
       . "?key=" . SECRET . "\n";
    exit;
}

header('Content-Type: text/plain; charset=utf-8');
set_time_limit(180);

function line($s = '') { echo $s . "\n"; }
function ok($l, $v)    { printf("  ✅ %-24s %s\n", $l, $v); }
function bad($l, $v)   { printf("  ❌ %-24s %s\n", $l, $v); }
function warn($l, $v)  { printf("  ⚠️  %-24s %s\n", $l, $v); }

line('════════════════════════════════════════════════════');
line('  گزارش تشخیص هاست (PHP)');
line('  تاریخ: ' . gmdate('Y-m-d H:i') . ' UTC');
line('════════════════════════════════════════════════════');
line();

// ── ۱) محیط ─────────────────────────────────────────
line('── ۱) محیط ──');
ok('PHP version', PHP_VERSION);
ok('OS', PHP_OS . ' / ' . php_uname('r'));
ok('document root', $_SERVER['DOCUMENT_ROOT'] ?? '?');
ok('script path', __DIR__);
ok('memory_limit', ini_get('memory_limit'));
ok('max_execution_time', ini_get('max_execution_time'));
ok('upload_max_filesize', ini_get('upload_max_filesize'));
ok('post_max_size', ini_get('post_max_size'));
line();

// ── ۲) توابع کلیدی ──────────────────────────────────
line('── ۲) توابع کلیدی ──');
$disabled = array_filter(array_map('trim', explode(',', (string)ini_get('disable_functions'))));
foreach (['exec', 'shell_exec', 'proc_open', 'popen', 'system', 'passthru'] as $fn) {
    if (in_array($fn, $disabled, true) || !function_exists($fn)) {
        bad($fn, 'غیرفعال');
    } else {
        ok($fn, 'فعال');
    }
}
foreach (['curl_init' => 'cURL', 'gzopen' => 'zlib', 'mysqli_connect' => 'MySQLi'] as $fn => $label) {
    function_exists($fn) ? ok($label, 'موجود') : bad($label, 'موجود نیست');
}
class_exists('ZipArchive') ? ok('ZipArchive', 'موجود') : bad('ZipArchive', 'موجود نیست');
class_exists('PharData')   ? ok('PharData (tar.gz)', 'موجود') : bad('PharData', 'موجود نیست');
line();

// ── ۳) آیا می‌توانیم دستور اجرا کنیم؟ ───────────────
line('── ۳) اجرای دستور ──');
$canExec = function_exists('shell_exec') && !in_array('shell_exec', $disabled, true);
if ($canExec) {
    ok('shell_exec', 'کار می‌کند');
    foreach (['node -v', 'npm -v', 'git --version', 'tar --version'] as $cmd) {
        $out = @shell_exec($cmd . ' 2>&1');
        $out = $out ? trim(explode("\n", $out)[0]) : 'یافت نشد';
        printf("      %-16s %s\n", $cmd, substr($out, 0, 45));
    }
    // Node در مسیرهای cPanel
    $found = @shell_exec('ls -d ~/nodevenv/*/*/bin/node 2>/dev/null');
    if ($found) { line('      Node در nodevenv:'); line('      ' . trim($found)); }
} else {
    bad('shell_exec', 'غیرفعال — دیپلوی باید با PharData انجام شود');
}
line();

// ── ۴) دسترسی شبکه (مهم‌ترین) ───────────────────────
line('── ۴) دسترسی شبکه ──');
function probe(string $label, string $url): void {
    if (!function_exists('curl_init')) { bad($label, 'cURL نیست'); return; }
    $t0 = microtime(true);
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_NOBODY         => true,
        CURLOPT_TIMEOUT        => 12,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_SSL_VERIFYPEER => false,
    ]);
    curl_exec($ch);
    $code = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $err  = curl_error($ch);
    curl_close($ch);
    $ms = (int)((microtime(true) - $t0) * 1000);

    if ($code === 0)      bad($label, "ناموفق ({$err})");
    elseif ($ms > 5000)   warn($label, "HTTP {$code} — {$ms} ms (کند)");
    else                  ok($label, "HTTP {$code} — {$ms} ms");
}
probe('github.com',        'https://github.com');
probe('raw.githubusercontent','https://raw.githubusercontent.com');
probe('npm registry',      'https://registry.npmjs.org');
probe('npm mirror (IR)',   'https://mirror-npm.runflare.com');
probe('graph.facebook.com','https://graph.facebook.com');
probe('api.telegram.org',  'https://api.telegram.org');
probe('agentrouter.org',   'https://agentrouter.org');
line();

// ── ۵) سرعت دانلود ──────────────────────────────────
line('── ۵) سرعت دانلود از گیت‌هاب ──');
if (function_exists('curl_init')) {
    $ch = curl_init('https://raw.githubusercontent.com/nodejs/node/main/README.md');
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => 40,
        CURLOPT_SSL_VERIFYPEER => false,
    ]);
    $body = curl_exec($ch);
    $spd  = (float)curl_getinfo($ch, CURLINFO_SPEED_DOWNLOAD);
    curl_close($ch);
    $kb = (int)round($spd / 1024);
    if ($kb > 500)      ok('سرعت', "{$kb} KB/s (خوب)");
    elseif ($kb > 50)   warn('سرعت', "{$kb} KB/s (کند — از tar.gz استفاده کنید)");
    else                bad('سرعت', "{$kb} KB/s (معماری معکوس الزامی است)");
}
line();

// ── ۶) اپ فعلی ──────────────────────────────────────
line('── ۶) اپ‌های موجود ──');
$home = dirname($_SERVER['DOCUMENT_ROOT'] ?? __DIR__);
foreach ((glob($home . '/*', GLOB_ONLYDIR) ?: []) as $dir) {
    if (file_exists("$dir/package.json") || file_exists("$dir/server.js")) {
        line('  📁 ' . basename($dir));
        foreach (['package.json', 'server.js', '.env', 'tmp/restart.txt'] as $f) {
            if (file_exists("$dir/$f")) line("      $f ✅");
        }
        if (is_dir("$dir/node_modules")) line('      node_modules ✅');
    }
}
line();

// ── ۷) قابلیت نوشتن ─────────────────────────────────
line('── ۷) دسترسی نوشتن ──');
$probe = __DIR__ . '/.write-test-' . bin2hex(random_bytes(4));
if (@file_put_contents($probe, 'x') !== false) {
    @unlink($probe);
    ok('نوشتن در ' . basename(__DIR__), 'مجاز');
} else {
    bad('نوشتن', 'غیرمجاز');
}
line();

line('════════════════════════════════════════════════════');
line('  پایان — این خروجی را کامل کپی و ارسال کنید');
line('  ⚠️ سپس این فایل را از هاست پاک کنید');
line('════════════════════════════════════════════════════');
