<?php
// POST ?action=checkout → {url} to Stripe Checkout · ?action=portal → {url} to the billing portal.
// Neither grants anything; only stripe-webhook.php writes a plan.
require __DIR__ . '/_lib/bootstrap.php';

if (sq_method() !== 'POST') { sq_json(405, ['error' => 'POST.']); return; }
if (!sq_accounts_on() || !sq_stripe_on()) { sq_json(503, ['error' => 'Billing is not switched on yet.']); return; }
try { $u = sq_session_user(sq_db(), sq_read_cookie()); }
catch (Throwable $e) { sq_json(500, ['error' => 'Could not read the session.']); return; }
if (!$u) { sq_json(401, ['error' => 'Sign in first.']); return; }
try {
    $out = ($_GET['action'] ?? 'checkout') === 'portal' ? sq_stripe_portal($u, sq_origin()) : sq_stripe_checkout(sq_db(), $u, sq_origin());
    if (isset($out['error'])) { sq_json($out['status'], ['error' => $out['error']]); return; }
    sq_json(200, $out);
} catch (Throwable $e) {
    error_log('stripe failed: ' . $e->getMessage());
    sq_json(502, ['error' => 'Could not reach the payment provider just now.']);
}
