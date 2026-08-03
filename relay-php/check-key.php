<?php
// Quick key checker — deletes itself after use
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

$configPath = __DIR__ . '/relay-config.php';
if (!file_exists($configPath)) {
    echo json_encode(['error' => 'relay-config.php not found']);
    exit;
}

// Include config
$CONFIG = [];
include $configPath;

// If 'compare' param is given, check if it matches ai_gateway_key
$compare = $_GET['compare'] ?? '';
$gateKey = $CONFIG['ai_gateway_key'] ?? '';

if ($compare !== '') {
    $match = hash_equals($gateKey, $compare);
    echo json_encode([
        'match' => $match,
        'gateKeyLength' => strlen($gateKey),
        'gateKeyPrefix' => substr($gateKey, 0, 6),
        'gateKeySuffix' => substr($gateKey, -6),
        'compareLength' => strlen($compare),
        'comparePrefix' => substr($compare, 0, 6),
        'compareSuffix' => substr($compare, -6),
    ]);
} else {
    // Return key info without full key
    echo json_encode([
        'gateKeySet' => $gateKey !== '',
        'gateKeyLength' => strlen($gateKey),
        'gateKeyPrefix' => substr($gateKey, 0, 6),
        'gateKeySuffix' => substr($gateKey, -6),
        'openaiKeySet' => ($CONFIG['openai_api_key'] ?? '') !== '',
        'openaiKeyPrefix' => substr($CONFIG['openai_api_key'] ?? '', 0, 6),
    ]);
}

// Self-delete for security
@unlink(__FILE__);
