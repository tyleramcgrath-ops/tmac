<?php
// The readings, as the GitHub Actions scanner publishes them (data.json on the
// serp-quake-data branch), with a 3-minute file cache and a stale fallback.
// pulse() mirrors site/lib/feed.js: the needle, not the instrument.
declare(strict_types=1);

function sq_feed(): array {
    $c = sq_config();
    if (getenv('SQ_DATA_FILE')) return json_decode((string)file_get_contents(getenv('SQ_DATA_FILE')), true);
    $cache = rtrim($c['cache_dir'], '/') . '/serp-quake-feed-' . md5($c['data_url']) . '.json';
    if (is_file($cache) && time() - filemtime($cache) < 180) return json_decode((string)file_get_contents($cache), true);
    try {
        $h = ['Accept: application/json'];
        if ($c['data_token'] !== '') $h[] = 'Authorization: Bearer ' . $c['data_token'];
        [$status, $text] = sq_http('GET', $c['data_url'], $h);
        $data = $status === 200 ? json_decode($text, true) : null;
        if (!is_array($data)) throw new RuntimeException('feed HTTP ' . $status);
        @file_put_contents($cache, $text);
        return $data;
    } catch (Throwable $e) {
        if (is_file($cache)) return json_decode((string)file_get_contents($cache), true);
        throw $e;
    }
}

function sq_mood(?float $m): array {
    $m = $m ?? 0;
    if ($m >= 7) return ['panic', 'Core-update-level shaking. Richter is not okay.'];
    if ($m >= 5) return ['nervous', 'Something big is rolling out. Richter is sweating.'];
    if ($m >= 3) return ['alert', 'Above-normal churn. Richter has one eye open.'];
    return ['zen', 'Normal churn. Richter is chilling.'];
}

function sq_pulse(array $data): array {
    $sw = $data['sweeps'] ?? [];
    $last = $sw ? $sw[count($sw) - 1] : null;
    $m = $last ? ($last['m24'] ?? $last['m'] ?? null) : null;
    $cls = null;
    foreach ($data['scale'] ?? [] as $s) { if (($m ?? 0) >= $s['min']) { $cls = $s['name']; break; } }
    $ongoing = null;
    foreach ($data['events'] ?? [] as $e) { if (!empty($e['ongoing'])) $ongoing = $e; }
    $t = $last ? strtotime($last['t']) : 0;
    $spark = [];
    foreach ($sw as $s) { if (strtotime($s['t']) >= $t - 7 * 86400) $spark[] = isset($s['m24']) && $s['m24'] !== null ? round($s['m24'], 1) : null; }
    [$mood, $line] = sq_mood($m);
    return [
        't' => $last['t'] ?? null,
        'mode' => $data['mode'] ?? null,
        'magnitude' => $m === null ? null : round($m, 1),
        'class' => $cls,
        'mood' => $mood,
        'line' => $line,
        'calibrating' => (bool)($last['calibrating'] ?? false),
        'quake' => $ongoing ? ['since' => $ongoing['start'], 'peak' => round($ongoing['peak'], 1), 'confirmed' => $ongoing['confirmed'] ?? []] : null,
        'spark' => $spark,
    ];
}
