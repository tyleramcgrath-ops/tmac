<?php
// GET the public needle: magnitude, Richter's mood, a week of the trace.
require __DIR__ . '/_lib/bootstrap.php';

if (sq_method() !== 'GET') { sq_json(405, ['error' => 'GET.']); return; }
try {
    $p = sq_pulse(sq_feed());
    http_response_code(200);
    header('Content-Type: application/json');
    header('Cache-Control: public, max-age=120');
    echo json_encode($p, JSON_UNESCAPED_SLASHES);
} catch (Throwable $e) {
    error_log('pulse: feed failed: ' . $e->getMessage());
    sq_json(502, ['error' => 'The seismograph feed is unreachable just now.']);
}
