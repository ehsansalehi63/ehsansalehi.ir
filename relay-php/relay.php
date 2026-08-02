<?php
/**
 * ═══════════════════════════════════════════════════════════════════════
 *  رله انتشار شبکه‌های اجتماعی — نسخه PHP
 *
 *  معادل کامل نسخه Node.js، ولی روی هاست اشتراکی بدون هیچ تنظیمی کار می‌کند.
 *  فقط این فایل را در public_html بگذارید — تمام.
 *
 *  چرا PHP؟ اپ Node.js روی hPanel نیاز به تنظیم framework، entry file و
 *  port دارد و اگر اشتباه تشخیص داده شود اصلاً اجرا نمی‌شود. PHP روی
 *  همه هاست‌های اشتراکی بومی است و بلافاصله فعال می‌شود.
 *
 *  مسیرها:
 *    GET  ?path=health                    بررسی سلامت (بدون احراز هویت)
 *    GET  ?path=cfg-export&key=SECRET      صادرات تنظیمات (برای workflow)
 *    POST ?path=publish                   انتشار در اینستاگرام/لینکدین/فیسبوک
 *    POST ?path=fetch                     دریافت محتوای تحریم‌شده
 *    POST ?path=diagnose                  تشخیص دسترسی شبکه
 *    POST ?path=instagram/refresh-token   تمدید توکن ۶۰ روزه
 *    POST /v1/chat/completions            دروازه AI سازگار با OpenAI
 *
 *  امنیت: امضای HMAC-SHA256 روی «timestamp|body» + پنجره ۵ دقیقه‌ای
 * ═══════════════════════════════════════════════════════════════════════
 */

declare(strict_types=1);

// ─── تنظیمات ─────────────────────────────────────────────────────────
// می‌توانید مقادیر را همین‌جا بگذارید یا از فایل relay-config.php بخوانید.
$CONFIG = [
    'relay_secret'      => '',   // اجباری — با openssl rand -hex 32 بسازید
    'ai_gateway_key'    => '',   // رمزی که سایت برای دروازه AI می‌فرستد
    'openai_api_key'    => '',   // کلید واقعی AgentRouter
    'openai_base'       => 'https://agentrouter.org/v1',
    'anthropic_base'    => 'https://agentrouter.org',
    'anthropic_version' => '2023-06-01',
    'instagram_token'   => '',
    'instagram_user_id' => '',
    'linkedin_token'    => '',
    'linkedin_author'   => '',
    'fb_token'          => '',
    'fb_page_id'        => '',
    'meta_version'      => 'v21.0',
    'sig_window'        => 300,   // ثانیه
];

// فایل تنظیمات جداگانه (توصیه‌شده — کلیدها را از این فایل جدا نگه دارید)
$cfgFile = __DIR__ . '/relay-config.php';
if (is_file($cfgFile)) {
    $loaded = require $cfgFile;
    if (is_array($loaded)) $CONFIG = array_merge($CONFIG, $loaded);
}

// متغیرهای محیطی اولویت دارند (اگر هاست پشتیبانی کند)
foreach ([
    'RELAY_SECRET'          => 'relay_secret',
    'AI_GATEWAY_KEY'        => 'ai_gateway_key',
    'OPENAI_API_KEY'        => 'openai_api_key',
    'OPENAI_BASE_URL'       => 'openai_base',
    'ANTHROPIC_BASE_URL'    => 'anthropic_base',
    'INSTAGRAM_ACCESS_TOKEN'=> 'instagram_token',
    'INSTAGRAM_USER_ID'     => 'instagram_user_id',
    'LINKEDIN_ACCESS_TOKEN' => 'linkedin_token',
    'LINKEDIN_AUTHOR_URN'   => 'linkedin_author',
    'FB_PAGE_ACCESS_TOKEN'  => 'fb_token',
    'FB_PAGE_ID'            => 'fb_page_id',
] as $env => $key) {
    $v = getenv($env);
    if ($v !== false && $v !== '') $CONFIG[$key] = $v;
}

$CONFIG['openai_base']    = rtrim($CONFIG['openai_base'], '/');
$CONFIG['anthropic_base'] = rtrim($CONFIG['anthropic_base'], '/');

@set_time_limit(300);
@ini_set('memory_limit', '256M');

// ─── ابزار ───────────────────────────────────────────────────────────

function respond(int $status, array $data): never {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    header('X-Relay: social-relay-php/1.0');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit;
}

function fail(string $msg, int $status = 502, array $extra = []): never {
    respond($status, ['ok' => false, 'error' => $msg] + $extra);
}

/**
 * درخواست HTTP با cURL.
 * @return array{ok:bool,status:int,body:string,data:array,error:string}
 */
function httpCall(string $url, array $opt = []): array {
    $method  = $opt['method']  ?? 'GET';
    $headers = $opt['headers'] ?? [];
    $body    = $opt['body']    ?? null;
    $timeout = $opt['timeout'] ?? 60;

    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CUSTOMREQUEST  => $method,
        CURLOPT_HTTPHEADER     => $headers,
        CURLOPT_TIMEOUT        => $timeout,
        CURLOPT_CONNECTTIMEOUT => 20,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_SSL_VERIFYPEER => true,
        CURLOPT_USERAGENT      => 'SocialRelay/1.0',
    ]);
    if ($body !== null) curl_setopt($ch, CURLOPT_POSTFIELDS, $body);

    $raw    = curl_exec($ch);
    $status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $err    = curl_error($ch);
    curl_close($ch);

    $data = [];
    if (is_string($raw)) {
        $decoded = json_decode($raw, true);
        if (is_array($decoded)) $data = $decoded;
    }

    return [
        'ok'     => $status >= 200 && $status < 300,
        'status' => $status,
        'body'   => is_string($raw) ? $raw : '',
        'data'   => $data,
        'error'  => $err,
    ];
}

function formBody(array $fields): string {
    return http_build_query($fields);
}

// ═════════════════════════════════════════════════════════════════════
//  اینستاگرام
// ═════════════════════════════════════════════════════════════════════

/** متا کانتینر را async پردازش می‌کند؛ باید منتظر FINISHED بمانیم */
function waitForContainer(string $id, string $token, int $maxTries = 20, int $delay = 3): array {
    global $CONFIG;
    for ($i = 0; $i < $maxTries; $i++) {
        sleep($delay);
        $r = httpCall(
            'https://graph.instagram.com/' . $id
            . '?fields=status_code,status&access_token=' . urlencode($token),
            ['timeout' => 20]
        );
        $code = $r['data']['status_code'] ?? '';
        if ($code === 'FINISHED') return ['ready' => true];
        if ($code === 'ERROR' || $code === 'EXPIRED') {
            return ['ready' => false, 'error' => $r['data']['status'] ?? $code];
        }
    }
    return ['ready' => false, 'error' => 'کانتینر در زمان مجاز آماده نشد'];
}

function publishInstagram(array $p): array {
    global $CONFIG;
    $token  = $p['token']  ?? $CONFIG['instagram_token'];
    $userId = $p['userId'] ?? $CONFIG['instagram_user_id'];
    if (!$token || !$userId) throw new RuntimeException('توکن یا شناسه اینستاگرام تنظیم نشده');

    $media = array_values(array_filter($p['mediaUrls'] ?? []));
    if (!$media) throw new RuntimeException('حداقل یک آدرس رسانه لازم است');

    $kind    = $p['kind'] ?? (count($media) > 1 ? 'carousel' : 'image');
    $caption = $p['caption'] ?? '';
    $base    = 'https://graph.instagram.com/' . $userId;

    if ($kind === 'carousel' && count($media) > 1) {
        $children = [];
        foreach (array_slice($media, 0, 10) as $url) {
            $r = httpCall("$base/media", [
                'method'  => 'POST',
                'headers' => ['Content-Type: application/x-www-form-urlencoded'],
                'body'    => formBody(['image_url' => $url, 'is_carousel_item' => 'true', 'access_token' => $token]),
            ]);
            if (!$r['ok'] || empty($r['data']['id'])) {
                throw new RuntimeException('کانتینر فرزند: ' . ($r['data']['error']['message'] ?? $r['status']));
            }
            $children[] = $r['data']['id'];
        }
        $r = httpCall("$base/media", [
            'method'  => 'POST',
            'headers' => ['Content-Type: application/x-www-form-urlencoded'],
            'body'    => formBody([
                'media_type' => 'CAROUSEL', 'children' => implode(',', $children),
                'caption' => $caption, 'access_token' => $token,
            ]),
        ]);
        if (!$r['ok'] || empty($r['data']['id'])) {
            throw new RuntimeException('کانتینر والد: ' . ($r['data']['error']['message'] ?? $r['status']));
        }
        $containerId = $r['data']['id'];
    } else {
        $params = ['access_token' => $token];
        if ($kind === 'reel') {
            $params += ['media_type' => 'REELS', 'video_url' => $media[0], 'caption' => $caption, 'share_to_feed' => 'true'];
        } elseif ($kind === 'story') {
            $params += ['media_type' => 'STORIES', 'image_url' => $media[0]];
        } else {
            $params += ['image_url' => $media[0], 'caption' => $caption];
        }
        $r = httpCall("$base/media", [
            'method'  => 'POST',
            'headers' => ['Content-Type: application/x-www-form-urlencoded'],
            'body'    => formBody($params),
        ]);
        if (!$r['ok'] || empty($r['data']['id'])) {
            throw new RuntimeException('ساخت کانتینر: ' . ($r['data']['error']['message'] ?? $r['status']));
        }
        $containerId = $r['data']['id'];
    }

    $wait = waitForContainer($containerId, $token, $kind === 'reel' ? 30 : 20, $kind === 'reel' ? 5 : 3);
    if (!$wait['ready']) throw new RuntimeException('کانتینر آماده نشد: ' . $wait['error']);

    $pub = httpCall("$base/media_publish", [
        'method'  => 'POST',
        'headers' => ['Content-Type: application/x-www-form-urlencoded'],
        'body'    => formBody(['creation_id' => $containerId, 'access_token' => $token]),
    ]);
    if (!$pub['ok'] || empty($pub['data']['id'])) {
        throw new RuntimeException('انتشار: ' . ($pub['data']['error']['message'] ?? $pub['status']));
    }

    return [
        'id'   => $pub['data']['id'],
        'url'  => 'https://www.instagram.com/p/' . $pub['data']['id'] . '/',
        'kind' => $kind,
    ];
}

function refreshInstagramToken(?string $token): array {
    global $CONFIG;
    $t = $token ?: $CONFIG['instagram_token'];
    if (!$t) throw new RuntimeException('توکنی برای تمدید وجود ندارد');

    $r = httpCall(
        'https://graph.instagram.com/refresh_access_token'
        . '?grant_type=ig_refresh_token&access_token=' . urlencode($t),
        ['timeout' => 30]
    );
    if (!$r['ok'] || empty($r['data']['access_token'])) {
        throw new RuntimeException($r['data']['error']['message'] ?? 'تمدید ناموفق');
    }
    return [
        'accessToken'    => $r['data']['access_token'],
        'expiresInDays'  => (int) round(($r['data']['expires_in'] ?? 0) / 86400),
        'warning'        => 'توکن جدید را در relay-config.php جایگزین کنید',
    ];
}

// ═════════════════════════════════════════════════════════════════════
//  لینکدین  (از ایران timeout می‌خورد — دلیل اصلی وجود رله)
// ═════════════════════════════════════════════════════════════════════

function publishLinkedIn(array $p): array {
    global $CONFIG;
    $token = $p['token'] ?? $CONFIG['linkedin_token'];
    if (!$token) throw new RuntimeException('توکن لینکدین تنظیم نشده');

    $author = $p['author'] ?? $CONFIG['linkedin_author'];
    if (!$author) {
        $me = httpCall('https://api.linkedin.com/v2/userinfo', [
            'headers' => ['Authorization: Bearer ' . $token],
        ]);
        if (!$me['ok'] || empty($me['data']['sub'])) {
            throw new RuntimeException('شناسه نویسنده لینکدین یافت نشد');
        }
        $author = 'urn:li:person:' . $me['data']['sub'];
    }

    $text = trim(implode("\n\n", array_filter([$p['caption'] ?? '', $p['link'] ?? ''])));
    $share = [
        'shareCommentary'    => ['text' => $text],
        'shareMediaCategory' => !empty($p['link']) ? 'ARTICLE' : 'NONE',
    ];
    if (!empty($p['link'])) {
        $share['media'] = [['status' => 'READY', 'originalUrl' => $p['link']]];
    }

    $payload = [
        'author'          => $author,
        'lifecycleState'  => 'PUBLISHED',
        'specificContent' => ['com.linkedin.ugc.ShareContent' => $share],
        'visibility'      => ['com.linkedin.ugc.MemberNetworkVisibility' => 'PUBLIC'],
    ];

    $r = httpCall('https://api.linkedin.com/v2/ugcPosts', [
        'method'  => 'POST',
        'headers' => [
            'Authorization: Bearer ' . $token,
            'Content-Type: application/json',
            'X-Restli-Protocol-Version: 2.0.0',
        ],
        'body'    => json_encode($payload, JSON_UNESCAPED_UNICODE),
    ]);
    if (!$r['ok']) throw new RuntimeException('لینکدین: ' . ($r['data']['message'] ?? $r['status']));

    return ['id' => $r['data']['id'] ?? 'ok'];
}

// ═════════════════════════════════════════════════════════════════════
//  فیسبوک
// ═════════════════════════════════════════════════════════════════════

function publishFacebook(array $p): array {
    global $CONFIG;
    $token  = $p['token']  ?? $CONFIG['fb_token'];
    $pageId = $p['pageId'] ?? $CONFIG['fb_page_id'];
    if (!$token || !$pageId) throw new RuntimeException('توکن یا شناسه صفحه فیسبوک تنظیم نشده');

    $graph   = 'https://graph.facebook.com/' . $CONFIG['meta_version'];
    $image   = ($p['mediaUrls'] ?? [])[0] ?? null;
    $message = trim(implode("\n\n", array_filter([$p['caption'] ?? '', $p['link'] ?? ''])));

    if ($image) {
        $url  = "$graph/$pageId/photos";
        $body = ['url' => $image, 'caption' => $message, 'access_token' => $token];
    } else {
        $url  = "$graph/$pageId/feed";
        $body = ['message' => $message, 'access_token' => $token];
        if (!empty($p['link'])) $body['link'] = $p['link'];
    }

    $r = httpCall($url, [
        'method'  => 'POST',
        'headers' => ['Content-Type: application/x-www-form-urlencoded'],
        'body'    => formBody($body),
    ]);
    if (!$r['ok']) throw new RuntimeException('فیسبوک: ' . ($r['data']['error']['message'] ?? $r['status']));

    return ['id' => $r['data']['id'] ?? ($r['data']['post_id'] ?? 'ok')];
}

// ═════════════════════════════════════════════════════════════════════
//  دریافت محتوای تحریم‌شده
// ═════════════════════════════════════════════════════════════════════

function fetchExternal(array $p): array {
    $url = $p['url'] ?? '';
    if (!$url) throw new RuntimeException('آدرس لازم است');

    $parts = parse_url($url);
    if (!$parts || !in_array(($parts['scheme'] ?? ''), ['http', 'https'], true)) {
        throw new RuntimeException('فقط http/https مجاز است');
    }

    // جلوگیری از SSRF به شبکه داخلی
    $host = strtolower($parts['host'] ?? '');
    $blocked = ['localhost', '127.0.0.1', '0.0.0.0', '::1', 'metadata.google.internal'];
    if (in_array($host, $blocked, true)
        || preg_match('/^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|169\.254\.)/', $host)) {
        throw new RuntimeException('دسترسی به شبکه داخلی مجاز نیست');
    }

    $r = httpCall($url, ['timeout' => (int) ($p['timeout'] ?? 30)]);
    if (strlen($r['body']) > 2 * 1024 * 1024) {
        throw new RuntimeException('پاسخ بیش از حد بزرگ است');
    }

    return ['status' => $r['status'], 'length' => strlen($r['body']), 'body' => $r['body']];
}

// ═════════════════════════════════════════════════════════════════════
//  دروازه AI — سازگار با OpenAI + پل به Anthropic
// ═════════════════════════════════════════════════════════════════════

function isAnthropicModel(?string $m): bool {
    return is_string($m) && preg_match('/^claude[-.]/i', trim($m)) === 1;
}

/** OpenAI chat.completions → Anthropic messages */
function openaiToAnthropic(array $body): array {
    $flatten = static function ($c): string {
        if (is_string($c)) return $c;
        if (is_array($c)) {
            $out = '';
            foreach ($c as $part) {
                if (is_array($part) && ($part['type'] ?? '') === 'text') $out .= $part['text'] ?? '';
            }
            return $out;
        }
        return (string) $c;
    };

    $messages = $body['messages'] ?? [];
    $system = [];
    $convo  = [];
    foreach ($messages as $m) {
        $role = $m['role'] ?? '';
        if ($role === 'system') {
            $system[] = $flatten($m['content'] ?? '');
        } elseif ($role === 'user' || $role === 'assistant') {
            $convo[] = ['role' => $role, 'content' => $flatten($m['content'] ?? '')];
        }
    }

    $out = [
        'model'      => $body['model'] ?? '',
        'max_tokens' => $body['max_tokens'] ?? ($body['max_completion_tokens'] ?? 4096),
        'messages'   => $convo ?: [['role' => 'user', 'content' => '']],
    ];
    if ($system) $out['system'] = implode("\n\n", $system);
    if (isset($body['temperature'])) $out['temperature'] = $body['temperature'];
    if (isset($body['top_p']))       $out['top_p'] = $body['top_p'];
    if (isset($body['stop'])) {
        $out['stop_sequences'] = is_array($body['stop']) ? $body['stop'] : [$body['stop']];
    }
    return $out;
}

/** Anthropic messages → OpenAI chat.completions */
function anthropicToOpenai(array $data, string $model): array {
    $text = '';
    foreach ($data['content'] ?? [] as $c) {
        if (($c['type'] ?? '') === 'text') $text .= $c['text'] ?? '';
    }
    $stopMap = ['end_turn' => 'stop', 'max_tokens' => 'length', 'stop_sequence' => 'stop'];
    $in  = (int) ($data['usage']['input_tokens']  ?? 0);
    $out = (int) ($data['usage']['output_tokens'] ?? 0);

    return [
        'id'      => $data['id'] ?? ('chatcmpl-' . time()),
        'object'  => 'chat.completion',
        'created' => time(),
        'model'   => $data['model'] ?? $model,
        'choices' => [[
            'index'         => 0,
            'message'       => ['role' => 'assistant', 'content' => $text],
            'finish_reason' => $stopMap[$data['stop_reason'] ?? ''] ?? 'stop',
        ]],
        'usage'   => [
            'prompt_tokens'     => $in,
            'completion_tokens' => $out,
            'total_tokens'      => $in + $out,
        ],
    ];
}

function aiGateway(string $subPath, string $rawBody): never {
    global $CONFIG;

    // کلید دروازه از هدر Authorization
    $auth = $_SERVER['HTTP_AUTHORIZATION']
        ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION']
        ?? '';
    $incoming = trim(preg_replace('/^Bearer\s+/i', '', $auth));

    $gate = $CONFIG['ai_gateway_key'];
    if ($gate !== '') {
        if ($incoming === '' || !hash_equals($gate, $incoming)) {
            respond(401, ['error' => ['message' => 'کلید دروازه AI نامعتبر است', 'type' => 'invalid_request_error']]);
        }
    } elseif ($incoming === '') {
        respond(401, ['error' => ['message' => 'هدر Authorization لازم است', 'type' => 'invalid_request_error']]);
    }

    // کلید واقعی همیشه از تنظیمات رله — هرگز کلید سایت به بیرون نمی‌رود
    $upstreamKey = $CONFIG['openai_api_key'] ?: $incoming;
    if (!$upstreamKey) {
        respond(500, ['error' => ['message' => 'OPENAI_API_KEY روی رله تنظیم نشده', 'type' => 'server_error']]);
    }

    $t0 = microtime(true);
    $parsed = json_decode($rawBody, true);

    // مسیریابی هوشمند: مدل‌های claude-* از endpoint سازگار با Anthropic
    if ($subPath === '/v1/chat/completions' && is_array($parsed) && isAnthropicModel($parsed['model'] ?? null)) {
        if (!empty($parsed['stream'])) {
            respond(400, ['error' => [
                'message' => 'حالت stream برای مدل‌های Claude از طریق رله پشتیبانی نمی‌شود؛ stream:false بگذارید',
                'type'    => 'invalid_request_error',
            ]]);
        }

        $r = httpCall($CONFIG['anthropic_base'] . '/v1/messages', [
            'method'  => 'POST',
            'headers' => [
                'x-api-key: ' . $upstreamKey,
                'Authorization: Bearer ' . $upstreamKey,
                'anthropic-version: ' . $CONFIG['anthropic_version'],
                'Content-Type: application/json',
            ],
            'body'    => json_encode(openaiToAnthropic($parsed), JSON_UNESCAPED_UNICODE),
            'timeout' => 180,
        ]);

        $ms = (int) ((microtime(true) - $t0) * 1000);
        header('X-Relay-Route: anthropic');
        header('X-Relay-Upstream-Ms: ' . $ms);

        if (!$r['ok']) {
            $msg = $r['data']['error']['message'] ?? ($r['body'] !== '' ? substr($r['body'], 0, 300) : 'HTTP ' . $r['status']);
            respond($r['status'] ?: 502, ['error' => ['message' => $msg, 'type' => 'upstream_error']]);
        }
        respond(200, anthropicToOpenai($r['data'], (string) ($parsed['model'] ?? '')));
    }

    // مسیر عادی OpenAI — base معمولاً به /v1 ختم می‌شود، پس تکرار را حذف می‌کنیم
    $base   = preg_replace('#/v1$#', '', $CONFIG['openai_base']);
    $target = $base . $subPath;

    $r = httpCall($target, [
        'method'  => $_SERVER['REQUEST_METHOD'] === 'GET' ? 'GET' : 'POST',
        'headers' => [
            'Authorization: Bearer ' . $upstreamKey,
            'Content-Type: application/json',
        ],
        'body'    => $rawBody !== '' ? $rawBody : null,
        'timeout' => 180,
    ]);

    $ms = (int) ((microtime(true) - $t0) * 1000);
    http_response_code($r['status'] ?: 502);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    header('X-Relay-Route: openai');
    header('X-Relay-Upstream-Ms: ' . $ms);
    echo $r['body'] !== '' ? $r['body'] : json_encode(['error' => ['message' => $r['error'] ?: 'بدون پاسخ']]);
    exit;
}

// ═════════════════════════════════════════════════════════════════════
//  تشخیص دسترسی
// ═════════════════════════════════════════════════════════════════════

function diagnose(): array {
    global $CONFIG;

    $targets = [
        'graph.instagram.com' => 'https://graph.instagram.com',
        'graph.facebook.com'  => 'https://graph.facebook.com',
        'api.linkedin.com'    => 'https://api.linkedin.com',
        'agentrouter.org'     => 'https://agentrouter.org',
        'coindesk.com'        => 'https://www.coindesk.com',
        'venturebeat.com'     => 'https://venturebeat.com',
        'api.pinterest.com'   => 'https://api.pinterest.com',
    ];

    $results = [];
    foreach ($targets as $name => $url) {
        $t0 = microtime(true);
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_NOBODY         => true,
            CURLOPT_TIMEOUT        => 12,
            CURLOPT_FOLLOWLOCATION => true,
        ]);
        curl_exec($ch);
        $code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $err  = curl_error($ch);
        curl_close($ch);

        $entry = ['name' => $name, 'ok' => $code > 0 && $code < 500, 'ms' => (int) ((microtime(true) - $t0) * 1000)];
        if ($code) $entry['status'] = $code;
        if ($err)  $entry['error']  = substr($err, 0, 60);
        $results[] = $entry;
    }

    return [
        'php'        => PHP_VERSION,
        'configured' => [
            'instagram' => (bool) ($CONFIG['instagram_token'] && $CONFIG['instagram_user_id']),
            'linkedin'  => (bool) $CONFIG['linkedin_token'],
            'facebook'  => (bool) ($CONFIG['fb_token'] && $CONFIG['fb_page_id']),
            'ai'        => (bool) $CONFIG['openai_api_key'],
            'secret'    => (bool) $CONFIG['relay_secret'],
        ],
        'reachability' => $results,
    ];
}

// ═════════════════════════════════════════════════════════════════════
//  مسیریابی
// ═════════════════════════════════════════════════════════════════════

$rawBody = file_get_contents('php://input') ?: '';
$uriPath = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?? '/';
$uriPath = preg_replace('#/{2,}#', '/', $uriPath);

// دروازه AI — با مسیر واقعی /v1/... شناسایی می‌شود (نیازمند .htaccess)
if (str_contains($uriPath, '/v1/chat/completions') || str_contains($uriPath, '/v1/models')) {
    $sub = str_contains($uriPath, '/v1/models') ? '/v1/models' : '/v1/chat/completions';
    aiGateway($sub, $rawBody);
}

// مسیر از پارامتر ?path= یا از انتهای URL
$path = $_GET['path'] ?? '';
if ($path === '') {
    $path = trim(str_replace(basename(__FILE__), '', $uriPath), '/');
}
$path = trim($path, '/');
if ($path === '' || $path === 'index.php' || $path === basename(__FILE__)) $path = 'health';

// ─── سلامت — بدون احراز هویت ───
if ($path === 'health') {
    respond(200, [
        'ok'      => true,
        'service' => 'social-relay-php',
        'version' => '1.1-cfg',
        'time'    => gmdate('c'),
        'php'     => PHP_VERSION,
        'secretConfigured' => (bool) $CONFIG['relay_secret'],
        'aiGateway' => [
            'enabled'           => (bool) $CONFIG['openai_api_key'],
            'upstream'          => $CONFIG['openai_base'],
            'anthropicUpstream' => $CONFIG['anthropic_base'],
            'gateKeySet'        => (bool) $CONFIG['ai_gateway_key'],
        ],
    ]);
}

// ─── صادرات تنظیمات (برای sync-env workflow) ───
// GET ?path=cfg-export&key=RELAY_SECRET  →  returns ai_gateway_key + relay_secret
if ($path === 'cfg-export') {
    $key = $_GET['key'] ?? '';
    if (!$key || !hash_equals($CONFIG['relay_secret'], $key)) {
        fail('کلید نامعتبر', 403);
    }
    respond(200, [
        'ok'         => true,
        'gate_key'   => $CONFIG['ai_gateway_key'],
        'relay_secret' => $CONFIG['relay_secret'],
        'has_openai' => (bool) $CONFIG['openai_api_key'],
    ]);
}

// ─── از اینجا به بعد امضای HMAC لازم است ───
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    fail('فقط POST مجاز است', 405);
}
if (!$CONFIG['relay_secret']) {
    fail('RELAY_SECRET روی رله تنظیم نشده', 500);
}

$ts  = $_SERVER['HTTP_X_RELAY_TIMESTAMP'] ?? '';
$sig = $_SERVER['HTTP_X_RELAY_SIGNATURE'] ?? '';
if ($ts === '' || $sig === '') fail('هدر امضا یا timestamp موجود نیست', 403);

$drift = abs(time() - (int) $ts);
if ($drift > (int) $CONFIG['sig_window']) {
    fail("timestamp منقضی یا نامعتبر (اختلاف {$drift}s)", 403);
}

$expected = hash_hmac('sha256', $ts . '|' . $rawBody, $CONFIG['relay_secret']);
if (!hash_equals($expected, $sig)) fail('امضای نامعتبر', 403);

$body = [];
if ($rawBody !== '') {
    $decoded = json_decode($rawBody, true);
    if (!is_array($decoded)) fail('JSON نامعتبر', 400);
    $body = $decoded;
}

$started = microtime(true);

try {
    switch ($path) {
        case 'publish':
            $channel = strtolower((string) ($body['channel'] ?? ''));
            $result = match ($channel) {
                'instagram' => publishInstagram($body),
                'linkedin'  => publishLinkedIn($body),
                'facebook'  => publishFacebook($body),
                default     => fail("کانال ناشناخته: $channel", 400,
                                    ['supported' => ['instagram', 'linkedin', 'facebook']]),
            };
            respond(200, [
                'ok' => true, 'channel' => $channel, 'result' => $result,
                'ms' => (int) ((microtime(true) - $started) * 1000),
            ]);

        case 'fetch':
            respond(200, [
                'ok' => true, 'result' => fetchExternal($body),
                'ms' => (int) ((microtime(true) - $started) * 1000),
            ]);

        case 'instagram/refresh-token':
            respond(200, ['ok' => true, 'result' => refreshInstagramToken($body['token'] ?? null)]);

        case 'diagnose':
            respond(200, ['ok' => true, 'result' => diagnose()]);

        default:
            fail('مسیر یافت نشد', 404, [
                'available' => ['health', 'publish', 'fetch', 'diagnose', 'instagram/refresh-token'],
            ]);
    }
} catch (Throwable $e) {
    fail($e->getMessage(), 502, ['ms' => (int) ((microtime(true) - $started) * 1000)]);
}
