<?php
// Shared setup for the PHP API (the SiteGround build of apps/serp-quake/site/api).
// Same endpoints, same JSON as the Node functions, so the pages don't care which
// one answers.
//
// Config lives OUTSIDE the web root: the deploy workflow writes
// <site dir>/serp-quake-config.php next to public_html, and this file sits at
// public_html/serp-quake/api/_lib/, four levels below it. SQ_CONFIG overrides
// the path (tests, local runs).

declare(strict_types=1);

// Shortest round-trip floats in JSON (3.8, not 3.7999999999999998): some hosts,
// SiteGround included, ship serialize_precision = 17.
ini_set('serialize_precision', '-1');

function sq_config(): array {
    static $cfg = null;
    if ($cfg !== null) return $cfg;
    $path = getenv('SQ_CONFIG') ?: dirname(__DIR__, 4) . '/serp-quake-config.php';
    $loaded = is_file($path) ? require $path : [];
    $cfg = array_merge([
        'db_dsn' => '', 'db_user' => '', 'db_pass' => '',
        'resend_api_key' => '', 'mail_from' => 'SERP Quake <noreply@tylermcgrath.com>',
        'app_origin' => '', 'cookie_path' => '/serp-quake',
        'stripe_secret_key' => '', 'stripe_price_pro' => '', 'stripe_webhook_secret' => '',
        'trial_days' => 7,
        'data_url' => 'https://raw.githubusercontent.com/tyleramcgrath-ops/tmac/serp-quake-data/data.json',
        'data_token' => '',
        'cache_dir' => sys_get_temp_dir(),
        'mail_outbox' => '',   // local testing only: write sign-in links to this folder instead of emailing
    ], is_array($loaded) ? $loaded : []);
    return $cfg;
}

function sq_accounts_on(): bool { return sq_config()['db_dsn'] !== ''; }

function sq_db(): PDO {
    static $pdo = null;
    if ($pdo) return $pdo;
    $c = sq_config();
    if ($c['db_dsn'] === '') throw new RuntimeException('database is not configured');
    $dsn = $c['db_dsn'];
    // 'sqlite:auto' = zero-setup accounts: one SQLite file next to public_html
    // (beside the config, never inside the web root). MySQL takes over when the
    // SQ_DB_* secrets are set.
    if ($dsn === 'sqlite:auto') $dsn = 'sqlite:' . dirname(__DIR__, 4) . '/serp-quake-accounts.sqlite';
    $opts = [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC, PDO::ATTR_TIMEOUT => 5];
    // MySQL reports an UPDATE that writes the same value as 0 rows changed; the
    // session check counts *matched* rows, so ask for those.
    if (str_starts_with($dsn, 'mysql:')) $opts[PDO::MYSQL_ATTR_FOUND_ROWS] = true;
    $pdo = new PDO($dsn, $c['db_user'] ?: null, $c['db_pass'] ?: null, $opts);
    // WAL lets page views read while a sign-in writes.
    if (str_starts_with($dsn, 'sqlite:')) $pdo->exec('PRAGMA journal_mode = WAL');
    return $pdo;
}

function sq_now(): int { return (int)(getenv('SQ_NOW') ?: time()); }

function sq_id(): string { return bin2hex(random_bytes(16)); }

function sq_json(int $status, $body): void {
    http_response_code($status);
    header('Content-Type: application/json');
    // no-cache as well as no-store: SiteGround's dynamic cache must never hand
    // one visitor's session or dashboard to another.
    header('Cache-Control: private, no-store, no-cache, must-revalidate');
    echo json_encode($body, JSON_UNESCAPED_SLASHES);
}

function sq_body(): array {
    $raw = file_get_contents('php://input') ?: '';
    $j = json_decode($raw, true);
    return is_array($j) ? $j : [];
}

function sq_method(): string { return strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET'); }

function sq_origin(): string {
    $o = sq_config()['app_origin'];
    if ($o !== '') return rtrim($o, '/');
    $host = $_SERVER['HTTP_HOST'] ?? 'localhost';
    return 'https://' . $host . rtrim(sq_config()['cookie_path'], '/');
}

function sq_redirect(string $url, array $headers = []): void {
    foreach ($headers as $h) header($h, false);
    header('Location: ' . $url, true, 302);
}

function sq_http(string $method, string $url, array $headers, ?string $body = null): array {
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_CUSTOMREQUEST => $method,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => $headers,
        CURLOPT_TIMEOUT => 20,
    ]);
    if ($body !== null) curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
    $text = curl_exec($ch);
    $status = (int)curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
    $err = curl_error($ch);
    curl_close($ch);
    if ($text === false) throw new RuntimeException('request failed: ' . $err);
    return [$status, $text];
}

require_once __DIR__ . '/auth.php';
require_once __DIR__ . '/access.php';
require_once __DIR__ . '/feed.php';
require_once __DIR__ . '/stripe.php';
require_once __DIR__ . '/mail.php';
