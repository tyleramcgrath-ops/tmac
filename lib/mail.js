// Sending a login link. Resend, over plain fetch — this is one POST and does not need an SDK.
//
// The failure mode that matters is the quiet one: a send that fails while the endpoint reports
// success, so the customer waits for mail that was never sent and the log says everything is
// fine. So a non-2xx from the provider throws, and a missing API key throws at the point of use
// rather than being treated as "mail disabled".
const RESEND = 'https://api.resend.com/emails';

function must(name) {
  const v = process.env[name];
  if (!v) throw new Error(name + ' is not set — the app cannot send a login link without it');
  return v;
}

async function sendLoginLink(to, link) {
  const key = must('RESEND_API_KEY');
  const from = process.env.MAIL_FROM || 'Citation Gap <login@thecitationgap.com>';

  const res = await fetch(RESEND, {
    method: 'POST',
    headers: { authorization: 'Bearer ' + key, 'content-type': 'application/json' },
    body: JSON.stringify({
      from,
      to: [to],
      subject: 'Your Citation Gap sign-in link',
      text: [
        'Here is your sign-in link. It works once and expires in 15 minutes.',
        '',
        link,
        '',
        'If you did not ask to sign in, nothing has happened to your account and you can ignore',
        'this. The link cannot be used to change anything until it is opened.'
      ].join('\n')
    })
  });

  if (!res.ok) {
    // The body carries the provider's reason; without it a 422 is indistinguishable from a 500.
    let detail = '';
    try { detail = (await res.text()).slice(0, 300); } catch (e) {}
    throw new Error('mail provider returned ' + res.status + (detail ? ': ' + detail : ''));
  }
  return true;
}

module.exports = { sendLoginLink };
