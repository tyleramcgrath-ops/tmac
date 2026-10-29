<?php
// Stripe over plain curl, ported from site/lib/stripe.js. The rule it is built
// around: the success redirect is not proof of payment. Only the webhook —
// signed by Stripe and verified here — writes plan or plan_status.
declare(strict_types=1);

const SQ_STRIPE_TOLERANCE = 300;

function sq_stripe_on(): bool { return sq_config()['stripe_secret_key'] !== ''; }

function sq_stripe_call(string $path, array $body): array {
    [$status, $text] = sq_http('POST', 'https://api.stripe.com/v1/' . $path,
        ['Authorization: Bearer ' . sq_config()['stripe_secret_key'], 'Content-Type: application/x-www-form-urlencoded'],
        http_build_query($body));
    $j = json_decode($text, true) ?: [];
    if ($status < 200 || $status >= 300) throw new RuntimeException('stripe ' . $path . ': ' . ($j['error']['message'] ?? ('HTTP ' . $status)));
    return $j;
}

function sq_stripe_customer(PDO $db, array $user): string {
    if (!empty($user['stripe_customer_id'])) return $user['stripe_customer_id'];
    $c = sq_stripe_call('customers', ['email' => $user['email'], 'metadata' => ['user_id' => $user['id']]]);
    $db->prepare('UPDATE users SET stripe_customer_id = ? WHERE id = ?')->execute([$c['id'], $user['id']]);
    return $c['id'];
}

function sq_stripe_checkout(PDO $db, array $user, string $origin): array {
    $price = sq_config()['stripe_price_pro'];
    if ($price === '') return ['error' => 'Pro is not on sale yet.', 'status' => 400];
    $s = sq_stripe_call('checkout/sessions', [
        'mode' => 'subscription',
        'customer' => sq_stripe_customer($db, $user),
        'success_url' => $origin . '/app.html?billing=done',
        'cancel_url' => $origin . '/app.html?billing=cancelled',
        'line_items' => [['price' => $price, 'quantity' => 1]],
        'subscription_data' => ['metadata' => ['user_id' => $user['id'], 'plan' => 'pro']],
        'metadata' => ['user_id' => $user['id'], 'plan' => 'pro'],
        'allow_promotion_codes' => 'true',
    ]);
    return ['url' => $s['url']];
}

function sq_stripe_portal(array $user, string $origin): array {
    if (empty($user['stripe_customer_id'])) return ['error' => 'There is no subscription on this account yet.', 'status' => 400];
    $s = sq_stripe_call('billing_portal/sessions', ['customer' => $user['stripe_customer_id'], 'return_url' => $origin . '/app.html']);
    return ['url' => $s['url']];
}

function sq_stripe_verify(string $raw, ?string $header, string $secret, ?int $now = null): array {
    if ($secret === '') return ['ok' => false, 'reason' => 'no signing secret configured'];
    if (!$header) return ['ok' => false, 'reason' => 'no signature'];
    $t = null; $v1 = [];
    foreach (explode(',', $header) as $bit) {
        $kv = explode('=', $bit, 2);
        if (count($kv) !== 2) continue;
        [$k, $v] = [trim($kv[0]), trim($kv[1])];
        if ($k === 't') $t = $v; elseif ($k === 'v1') $v1[] = $v;
    }
    if ($t === null || !$v1) return ['ok' => false, 'reason' => 'malformed signature'];
    if (!ctype_digit($t) || abs(($now ?? time()) - (int)$t) > SQ_STRIPE_TOLERANCE) return ['ok' => false, 'reason' => 'timestamp outside tolerance'];
    $want = hash_hmac('sha256', $t . '.' . $raw, $secret);
    $match = false;
    foreach ($v1 as $given) { if (hash_equals($want, $given)) $match = true; }
    if (!$match) return ['ok' => false, 'reason' => 'signature does not match'];
    $event = json_decode($raw, true);
    if (!is_array($event)) return ['ok' => false, 'reason' => 'body is not JSON'];
    return ['ok' => true, 'event' => $event];
}

function sq_plan_status_for(string $s): string {
    if ($s === 'active' || $s === 'trialing') return 'active';
    if ($s === 'past_due' || $s === 'unpaid') return 'past_due';
    return 'canceled';
}

function sq_stripe_apply(PDO $db, array $event): array {
    $type = $event['type'] ?? '';
    $obj = $event['data']['object'] ?? [];
    if ($type === 'checkout.session.completed') {
        $uid = $obj['metadata']['user_id'] ?? null;
        if ($uid && !empty($obj['customer'])) $db->prepare('UPDATE users SET stripe_customer_id = ? WHERE id = ?')->execute([$obj['customer'], $uid]);
        return ['handled' => $type, 'userId' => $uid];
    }
    if (in_array($type, ['customer.subscription.created', 'customer.subscription.updated', 'customer.subscription.deleted'], true)) {
        $status = $type === 'customer.subscription.deleted' ? 'canceled' : sq_plan_status_for((string)($obj['status'] ?? ''));
        $priceId = $obj['items']['data'][0]['price']['id'] ?? null;
        $plan = $obj['metadata']['plan'] ?? (($priceId && $priceId === sq_config()['stripe_price_pro']) ? 'pro' : null);
        $renews = isset($obj['current_period_end']) ? (int)$obj['current_period_end'] : null;
        $s = $db->prepare('SELECT id FROM users WHERE stripe_customer_id = ?');
        $s->execute([$obj['customer'] ?? '']);
        $uid = $s->fetchColumn() ?: ($obj['metadata']['user_id'] ?? null);
        if (!$uid) return ['handled' => $type, 'skipped' => 'no account matches this customer'];
        if ($status === 'canceled') $db->prepare("UPDATE users SET plan_status = 'canceled', plan_renews_at = NULL WHERE id = ?")->execute([$uid]);
        elseif ($plan) $db->prepare('UPDATE users SET plan = ?, plan_status = ?, plan_renews_at = ? WHERE id = ?')->execute([$plan, $status, $renews, $uid]);
        else $db->prepare('UPDATE users SET plan_status = ?, plan_renews_at = ? WHERE id = ?')->execute([$status, $renews, $uid]);
        return ['handled' => $type, 'userId' => $uid, 'plan' => $plan, 'status' => $status];
    }
    return ['handled' => $type, 'ignored' => true];
}
