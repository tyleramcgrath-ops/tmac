<?php
// WP-REST-compatible emulator (NOT WordPress). Implements the exact subset of
// the WordPress REST API that RankForge's execution path calls, backed by a
// JSON state file, so connect/deploy/read-back/rollback can be exercised over
// REAL HTTP with real Basic-auth — beyond the in-process test double.
//
// This is a faithful protocol emulator for transport-level proof only. It is
// explicitly not the WordPress application and must not be reported as such.
//
// Run: php -S 127.0.0.1:PORT e2e/wp-emulator.php
// Modes via env: WP_USER, WP_PASS (valid creds); WP_DROP_META=1 (accept meta
// writes with 200 but do not persist -> forces verify_failed); WP_FAIL=1 (500).

$STATE = getenv('WP_STATE') ?: sys_get_temp_dir() . '/wp-emulator-state.json';
$USER = getenv('WP_USER') ?: 'admin';
$PASS = getenv('WP_PASS') ?: 'app-pass-1234';

function load($f) {
  if (!file_exists($f)) {
    return [10 => [
      'id' => 10, 'title' => 'Original Title', 'excerpt' => 'Original meta',
      'content' => '<p>Original body</p>', 'aioseo' => 'Original meta',
      'slug' => 'services', 'type' => 'pages', 'link' => 'http://127.0.0.1/services',
    ]];
  }
  return json_decode(file_get_contents($f), true);
}
function save($f, $s) { file_put_contents($f, json_encode($s)); }

$method = $_SERVER['REQUEST_METHOD'];
$uri = $_SERVER['REQUEST_URI'];
// PHP's built-in server can surface the header under different keys; check all.
$auth = $_SERVER['HTTP_AUTHORIZATION']
  ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION']
  ?? '';
if ($auth === '' && function_exists('getallheaders')) {
  foreach (getallheaders() as $k => $v) {
    if (strcasecmp($k, 'Authorization') === 0) { $auth = $v; break; }
  }
}
if (getenv('WP_DEBUG_AUTH') === '1') {
  error_log("EMU $method $uri auth=" . ($auth !== '' ? 'present' : 'MISSING'));
}

header('Content-Type: application/json');

if (getenv('WP_FAIL') === '1') { http_response_code(500); echo json_encode(['message' => 'server error']); exit; }

// Auth check (Basic base64(user:pass)).
function authOk($auth, $user, $pass) {
  if (strpos($auth, 'Basic ') !== 0) return false;
  $decoded = base64_decode(substr($auth, 6));
  return $decoded === "$user:$pass";
}

// GET /wp-json  -> namespaces (used for AIOSEO detection + connectivity)
if (preg_match('#/wp-json/?$#', parse_url($uri, PHP_URL_PATH))) {
  echo json_encode(['namespaces' => ['wp/v2', 'aioseo/v1']]); exit;
}

// Everything else requires auth.
if (!authOk($auth, $USER, $PASS)) { http_response_code(401); echo json_encode(['code' => 'unauthorized']); exit; }

// GET /wp-json/wp/v2/users/me
if (strpos($uri, '/wp-json/wp/v2/users/me') !== false) {
  echo json_encode(['id' => 1, 'capabilities' => ['edit_posts' => true, 'edit_pages' => true]]); exit;
}

$state = load($STATE);
$path = parse_url($uri, PHP_URL_PATH);
parse_str(parse_url($uri, PHP_URL_QUERY) ?? '', $q);

// GET /wp-json/wp/v2/(pages|posts)?slug=x  -> slug lookup
if (preg_match('#/wp-json/wp/v2/(pages|posts)$#', $path, $m) && isset($q['slug'])) {
  $out = [];
  foreach ($state as $p) {
    if ($p['slug'] === $q['slug'] && $p['type'] === $m[1]) {
      $out[] = ['id' => $p['id'], 'title' => ['raw' => $p['title']]];
    }
  }
  echo json_encode($out); exit;
}

// GET/POST /wp-json/wp/v2/(pages|posts)/{id}
if (preg_match('#/wp-json/wp/v2/(pages|posts)/(\d+)#', $path, $m)) {
  $id = (int)$m[2];
  if (!isset($state[$id])) { http_response_code(404); echo json_encode(['code' => 'not_found']); exit; }
  $p = $state[$id];
  if ($method === 'POST') {
    $body = json_decode(file_get_contents('php://input'), true) ?: [];
    if (array_key_exists('title', $body)) $p['title'] = $body['title'];
    if (array_key_exists('excerpt', $body)) $p['excerpt'] = $body['excerpt'];
    if (getenv('WP_DROP_META') !== '1') {
      if (isset($body['aioseo_meta_data']['description'])) $p['aioseo'] = $body['aioseo_meta_data']['description'];
      if (isset($body['meta']['_aioseo_description'])) $p['aioseo'] = $body['meta']['_aioseo_description'];
    }
    $state[$id] = $p; save($STATE, $state);
  }
  echo json_encode([
    'id' => $p['id'],
    'title' => ['raw' => $p['title'], 'rendered' => $p['title']],
    'excerpt' => ['raw' => $p['excerpt']],
    'content' => ['raw' => $p['content'], 'rendered' => $p['content']],
    'aioseo_meta_data' => ['description' => $p['aioseo']],
    'meta' => ['_aioseo_description' => $p['aioseo']],
    'link' => $p['link'],
  ]);
  exit;
}

http_response_code(404);
echo json_encode(['code' => 'no_route']);
