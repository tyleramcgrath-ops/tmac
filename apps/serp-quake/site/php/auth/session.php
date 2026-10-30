<?php
// GET who is signed in and what they may see · DELETE/POST sign out
require __DIR__ . '/../_lib/bootstrap.php';

if (sq_method() === 'GET') {
    if (!sq_accounts_on()) { sq_json(200, ['user' => null, 'accounts' => false]); return; }
    try {
        $u = sq_session_user(sq_db(), sq_read_cookie());
        if (!$u) { sq_json(200, ['user' => null, 'accounts' => true, 'billing' => sq_stripe_on()]); return; }
        sq_json(200, ['accounts' => true, 'billing' => sq_stripe_on(), 'user' => sq_public_user($u), 'access' => sq_access($u)]);
    } catch (Throwable $e) {
        error_log('auth/session read failed: ' . $e->getMessage());
        sq_json(500, ['error' => 'could not read the session']);
    }
    return;
}

if (sq_method() === 'DELETE' || sq_method() === 'POST') {
    try { if (sq_accounts_on()) sq_end_session(sq_db(), sq_read_cookie()); } catch (Throwable $e) { error_log('auth/session end failed: ' . $e->getMessage()); }
    header(sq_cookie_header('', 0), false);
    sq_json(200, ['ok' => true]);
    return;
}

sq_json(405, ['error' => 'GET or DELETE.']);
