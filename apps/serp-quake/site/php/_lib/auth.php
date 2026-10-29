<?php
// Magic-link sign-in, the PHP twin of site/lib/auth.js:
//   - only the sha256 of an emailed token is stored, so a table dump can't log anyone in
//   - redemption is single-use: one conditional UPDATE wins, a second click finds it used
//   - the cookie is HttpOnly, Secure, SameSite=Lax, scoped to the site's folder
declare(strict_types=1);

const SQ_TOKEN_TTL = 15 * 60;
const SQ_SESSION_TTL = 30 * 86400;
const SQ_COOKIE = 'sq_session';

function sq_normalise_email($raw): ?string {
    $e = strtolower(trim((string)$raw));
    if (strlen($e) < 3 || strlen($e) > 254) return null;
    return preg_match('/^[^\s@]+@[^\s@]+\.[^\s@]+$/', $e) ? $e : null;
}

function sq_user_by_email(PDO $db, string $email): ?array {
    $s = $db->prepare('SELECT * FROM users WHERE email = ?');
    $s->execute([$email]);
    return $s->fetch() ?: null;
}

function sq_upsert_user(PDO $db, string $email): array {
    $u = sq_user_by_email($db, $email);
    if ($u) return $u;
    try {
        $db->prepare('INSERT INTO users (id, email, created_at) VALUES (?, ?, ?)')->execute([sq_id(), $email, sq_now()]);
    } catch (PDOException $e) {
        // Two links requested at once for a new address: the other insert won.
    }
    return sq_user_by_email($db, $email);
}

function sq_issue_login_token(PDO $db, string $email): array {
    $user = sq_upsert_user($db, $email);
    $token = rtrim(strtr(base64_encode(random_bytes(32)), '+/', '-_'), '=');
    $db->prepare('INSERT INTO login_tokens (id, user_id, token_hash, created_at, expires_at) VALUES (?, ?, ?, ?, ?)')
       ->execute([sq_id(), $user['id'], hash('sha256', $token), sq_now(), sq_now() + SQ_TOKEN_TTL]);
    return [$user, $token];
}

function sq_redeem_login_token(PDO $db, string $token): array {
    if ($token === '') return ['ok' => false, 'reason' => 'missing'];
    $hash = hash('sha256', $token);
    $s = $db->prepare('SELECT * FROM login_tokens WHERE token_hash = ?');
    $s->execute([$hash]);
    $row = $s->fetch();
    if (!$row) return ['ok' => false, 'reason' => 'unknown'];
    if ($row['used_at'] !== null) return ['ok' => false, 'reason' => 'already_used'];
    if ((int)$row['expires_at'] <= sq_now()) return ['ok' => false, 'reason' => 'expired'];
    // The guard is in the WHERE: of two simultaneous clicks only one UPDATE matches.
    $u = $db->prepare('UPDATE login_tokens SET used_at = ? WHERE id = ? AND used_at IS NULL');
    $u->execute([sq_now(), $row['id']]);
    if ($u->rowCount() !== 1) return ['ok' => false, 'reason' => 'already_used'];
    $sid = sq_id();
    $db->prepare('INSERT INTO sessions (id, user_id, created_at, expires_at, last_seen_at) VALUES (?, ?, ?, ?, ?)')
       ->execute([$sid, $row['user_id'], sq_now(), sq_now() + SQ_SESSION_TTL, sq_now()]);
    return ['ok' => true, 'sessionId' => $sid, 'userId' => $row['user_id']];
}

function sq_session_user(PDO $db, ?string $sid): ?array {
    if (!$sid || !preg_match('/^[0-9a-f]{32}$/', $sid)) return null;
    $u = $db->prepare('UPDATE sessions SET last_seen_at = ? WHERE id = ? AND expires_at > ?');
    $u->execute([sq_now(), $sid, sq_now()]);
    if ($u->rowCount() < 1) return null;
    $s = $db->prepare('SELECT u.* FROM users u JOIN sessions s ON s.user_id = u.id WHERE s.id = ?');
    $s->execute([$sid]);
    return $s->fetch() ?: null;
}

function sq_end_session(PDO $db, ?string $sid): void {
    if ($sid) $db->prepare('DELETE FROM sessions WHERE id = ?')->execute([$sid]);
}

function sq_read_cookie(): ?string { return $_COOKIE[SQ_COOKIE] ?? null; }

function sq_cookie_header(string $value, int $maxAge): string {
    return 'Set-Cookie: ' . SQ_COOKIE . '=' . $value . '; Path=' . sq_config()['cookie_path'] . '; HttpOnly; Secure; SameSite=Lax; Max-Age=' . $maxAge;
}
