<?php
// The sign-in email, through Resend. A non-2xx throws, so a failed send is never
// reported to the customer as "on its way".
declare(strict_types=1);

function sq_send_login_link(string $to, string $link): void {
    $c = sq_config();
    if ($c['mail_outbox'] !== '') { file_put_contents(rtrim($c['mail_outbox'], '/') . '/' . $to . '.txt', $link); return; }
    if ($c['resend_api_key'] === '') throw new RuntimeException('resend_api_key is not set — cannot send a sign-in link');
    $text = "Here is your sign-in link. It works once and expires in 15 minutes.\n\n$link\n\nIf you did not ask to sign in, you can ignore this email.";
    [$status, $body] = sq_http('POST', 'https://api.resend.com/emails',
        ['Authorization: Bearer ' . $c['resend_api_key'], 'Content-Type: application/json'],
        json_encode(['from' => $c['mail_from'], 'to' => [$to], 'subject' => 'Your SERP Quake sign-in link', 'text' => $text]));
    if ($status < 200 || $status >= 300) throw new RuntimeException('mail provider returned ' . $status . ': ' . substr($body, 0, 300));
}
