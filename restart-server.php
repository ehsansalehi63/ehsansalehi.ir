<?php
// Restart Node.js app on cPanel hosting
// Called by GitHub Actions after FTP deploy

header('Content-Type: application/json');

// Verify secret
$secret = $_GET['key'] ?? $_POST['key'] ?? '';
$expected = getenv('RESTART_SECRET') ?: '';
if (!$expected) {
    // Fall back to checking a config file
    $configFile = __DIR__ . '/restart-config.php';
    if (file_exists($configFile)) {
        $cfg = include $configFile;
        $expected = $cfg['secret'] ?? '';
    }
}
if (!$secret || !$expected || $secret !== $expected) {
    http_response_code(403);
    echo json_encode(['ok' => false, 'error' => 'Unauthorized']);
    exit;
}

$results = [];

// Method 1: Passenger restart.txt (cPanel Node.js app)
$restartFile = __DIR__ . '/tmp/restart.txt';
if (!is_dir(__DIR__ . '/tmp')) {
    @mkdir(__DIR__ . '/tmp', 0755, true);
}
@touch($restartFile);
$results['passenger_restart'] = file_exists($restartFile) ? 'ok' : 'failed';

// Method 2: Try pm2 restart
$pm2Output = @shell_exec('pm2 restart all 2>&1');
if ($pm2Output !== null) {
    $results['pm2'] = trim($pm2Output);
} else {
    $results['pm2'] = 'not available';
}

// Method 3: Try node-specific restart via cPanel
$nodeOutput = @shell_exec('kill -USR2 $(cat ' . __DIR__ . '/.pm2.pid 2>/dev/null) 2>&1');
$results['node_restart'] = $nodeOutput ?: 'no pid file';

// Method 4: Touch tmp/restart.txt for Passenger
$results['restart_txt'] = touch($restartFile) ? 'created' : 'failed';

echo json_encode(['ok' => true, 'results' => $results]);
