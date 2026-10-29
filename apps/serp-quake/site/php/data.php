<?php
// GET the full seismograph — signed-in accounts on a trial or Pro only.
require __DIR__ . '/_lib/bootstrap.php';

if (sq_method() !== 'GET') { sq_json(405, ['error' => 'GET.']); return; }
if (!sq_accounts_on()) { sq_json(503, ['error' => 'Accounts are not switched on yet.']); return; }
try { $u = sq_session_user(sq_db(), sq_read_cookie()); }
catch (Throwable $e) { error_log('data: session failed: ' . $e->getMessage()); sq_json(500, ['error' => 'Could not read the session.']); return; }
if (!$u) { sq_json(401, ['error' => 'Sign in first.']); return; }
$a = sq_access($u);
if (!$a['full']) { sq_json(402, ['error' => 'Your free trial has ended.', 'access' => $a]); return; }
try { sq_json(200, sq_feed()); }
catch (Throwable $e) { error_log('data: feed failed: ' . $e->getMessage()); sq_json(502, ['error' => 'The seismograph feed is unreachable just now.']); }
