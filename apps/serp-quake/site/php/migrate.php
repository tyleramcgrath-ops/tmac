<?php
// Creates the account tables if they don't exist. Command line only — the deploy
// runs it over SSH after uploading; over the web it refuses.
//   php api/migrate.php
// Plain SQL that runs on both MySQL (SiteGround) and SQLite (the tests).
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
require __DIR__ . '/_lib/bootstrap.php';

if (!sq_accounts_on()) { fwrite(STDERR, "No database configured; accounts stay off.\n"); exit(0); }
$db = sq_db();
$mysql = $db->getAttribute(PDO::ATTR_DRIVER_NAME) === 'mysql';
$tail = $mysql ? ' ENGINE=InnoDB DEFAULT CHARSET=utf8mb4' : '';
$db->exec("CREATE TABLE IF NOT EXISTS users (
  id CHAR(32) PRIMARY KEY,
  email VARCHAR(254) NOT NULL UNIQUE,
  created_at BIGINT NOT NULL,
  stripe_customer_id VARCHAR(64) NULL UNIQUE,
  plan VARCHAR(16) NOT NULL DEFAULT 'free',
  plan_status VARCHAR(16) NOT NULL DEFAULT 'none',
  plan_renews_at BIGINT NULL
)$tail");
$db->exec("CREATE TABLE IF NOT EXISTS sessions (
  id CHAR(32) PRIMARY KEY,
  user_id CHAR(32) NOT NULL,
  created_at BIGINT NOT NULL,
  expires_at BIGINT NOT NULL,
  last_seen_at BIGINT NULL
)$tail");
$db->exec("CREATE TABLE IF NOT EXISTS login_tokens (
  id CHAR(32) PRIMARY KEY,
  user_id CHAR(32) NOT NULL,
  token_hash CHAR(64) NOT NULL UNIQUE,
  created_at BIGINT NOT NULL,
  expires_at BIGINT NOT NULL,
  used_at BIGINT NULL
)$tail");
// Index names are created once; re-running is fine because of the try.
foreach (['CREATE INDEX sessions_user_idx ON sessions (user_id)', 'CREATE INDEX login_tokens_user_idx ON login_tokens (user_id)'] as $sql) {
    try { $db->exec($sql); } catch (PDOException $e) { /* already exists */ }
}
// Old sessions and tokens are swept on every deploy.
$db->prepare('DELETE FROM sessions WHERE expires_at < ?')->execute([time()]);
$db->prepare('DELETE FROM login_tokens WHERE expires_at < ?')->execute([time() - 86400]);
echo "SERP Quake tables ready.\n";
