<?php
// POST {email}  ask for a sign-in link · GET ?token=  redeem it (from the email)
require __DIR__ . '/../_lib/bootstrap.php';

const SQ_SAME_ANSWER = ['ok' => true, 'message' => 'If that address can sign in, a link is on its way.'];

if (!sq_accounts_on()) { sq_json(503, ['error' => 'Accounts are not switched on yet.']); return; }
$base = sq_origin();

if (sq_method() === 'POST') {
    $email = sq_normalise_email(sq_body()['email'] ?? '');
    if (!$email) { sq_json(400, ['error' => 'That does not look like an email address.']); return; }
    try {
        [, $token] = sq_issue_login_token(sq_db(), $email);
        sq_send_login_link($email, $base . '/api/auth/link.php?token=' . rawurlencode($token));
    } catch (Throwable $e) {
        error_log('auth/link request failed: ' . $e->getMessage());
        sq_json(500, ['error' => 'Could not send the link just now. Try again shortly.']);
        return;
    }
    // Same answer whether or not the address has an account.
    sq_json(200, SQ_SAME_ANSWER);
    return;
}

if (sq_method() === 'GET') {
    try { $out = sq_redeem_login_token(sq_db(), (string)($_GET['token'] ?? '')); }
    catch (Throwable $e) { error_log('auth/link redeem failed: ' . $e->getMessage()); sq_redirect($base . '/login.html?signin=error'); return; }
    if (!$out['ok']) {
        $why = $out['reason'] === 'expired' ? 'expired' : ($out['reason'] === 'already_used' ? 'used' : 'invalid');
        sq_redirect($base . '/login.html?signin=' . $why);
        return;
    }
    sq_redirect($base . '/app.html', [sq_cookie_header($out['sessionId'], SQ_SESSION_TTL)]);
    return;
}

sq_json(405, ['error' => 'POST to ask for a link, GET to redeem one.']);
