<?php
// The only place a plan changes: events Stripe signed, verified against the raw body.
require __DIR__ . '/_lib/bootstrap.php';

if (sq_method() !== 'POST') { sq_json(405, ['error' => 'POST.']); return; }
$secret = sq_config()['stripe_webhook_secret'];
if ($secret === '' || !sq_accounts_on()) { sq_json(503, ['error' => 'Billing is not switched on yet.']); return; }
$check = sq_stripe_verify((string)file_get_contents('php://input'), $_SERVER['HTTP_STRIPE_SIGNATURE'] ?? null, $secret);
if (!$check['ok']) { error_log('stripe-webhook rejected: ' . $check['reason']); sq_json(400, ['error' => 'Bad signature.']); return; }
try { sq_json(200, ['received' => true] + sq_stripe_apply(sq_db(), $check['event'])); }
catch (Throwable $e) { error_log('stripe-webhook failed: ' . $e->getMessage()); sq_json(500, ['error' => 'Could not record that event.']); }
