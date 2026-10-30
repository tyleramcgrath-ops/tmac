<?php
// Who may see the full seismograph — the same rule as site/lib/access.js:
// Pro (active or past_due) or within the first trial_days after sign-up.
declare(strict_types=1);

function sq_access(?array $user, ?int $now = null): array {
    $now = $now ?? sq_now();
    if (!$user) return ['level' => 'none', 'full' => false];
    $paid = $user['plan'] === 'pro' && in_array($user['plan_status'], ['active', 'past_due'], true);
    if ($paid) return ['level' => 'pro', 'full' => true, 'status' => $user['plan_status'], 'renewsAt' => $user['plan_renews_at'] ? gmdate('c', (int)$user['plan_renews_at']) : null];
    $ends = (int)$user['created_at'] + (int)sq_config()['trial_days'] * 86400;
    if ($ends > $now) return ['level' => 'trial', 'full' => true, 'trialEnds' => gmdate('c', $ends), 'daysLeft' => (int)ceil(($ends - $now) / 86400)];
    return ['level' => 'expired', 'full' => false, 'trialEnds' => gmdate('c', $ends)];
}

function sq_public_user(array $u): array {
    return ['email' => $u['email'], 'plan' => $u['plan'], 'planStatus' => $u['plan_status'], 'since' => gmdate('c', (int)$u['created_at']), 'hasBilling' => !empty($u['stripe_customer_id'])];
}
