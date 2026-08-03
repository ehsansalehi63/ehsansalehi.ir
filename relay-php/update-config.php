<?php
// Updates relay-config.php to use OpenRouter - self-deletes after
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

$configPath = __DIR__ . '/relay-config.php';
if (!file_exists($configPath)) {
    echo json_encode(['error' => 'relay-config.php not found at ' . $configPath]);
    exit;
}

// Read current config
$oldContent = file_get_contents($configPath);

// Update openai_base to OpenRouter
$newContent = $oldContent;
$newContent = preg_replace(
    "#'openai_base'\s*=>\s*'[^']*'#",
    "'openai_base'       => 'https://openrouter.ai/api/v1'",
    $newContent
);

// Update anthropic_base to OpenRouter too (so claude- models also go through OpenRouter)
$newContent = preg_replace(
    "#'anthropic_base'\s*=>\s*'[^']*'#",
    "'anthropic_base'    => 'https://openrouter.ai/api/v1'",
    $newContent
);

// Write the updated config
$written = file_put_contents($configPath, $newContent);

// Verify by reading back
$verify = file_get_contents($configPath);
preg_match("#'openai_base'\s*=>\s*'([^']*)'#", $verify, $baseMatch);
preg_match("#'anthropic_base'\s*=>\s*'([^']*)'#", $verify, $anthMatch);
preg_match("#'openai_api_key'\s*=>\s*'([^']*)'#", $verify, $keyMatch);

echo json_encode([
    'written' => $written !== false,
    'bytesWritten' => $written,
    'openai_base' => $baseMatch[1] ?? 'NOT FOUND',
    'anthropic_base' => $anthMatch[1] ?? 'NOT FOUND',
    'openai_api_key_set' => strlen($keyMatch[1] ?? '') > 0,
    'openai_api_key_length' => strlen($keyMatch[1] ?? ''),
    'openai_api_key_prefix' => substr($keyMatch[1] ?? '', 0, 8),
], JSON_PRETTY_PRINT);

// Self-delete
@unlink(__FILE__);
