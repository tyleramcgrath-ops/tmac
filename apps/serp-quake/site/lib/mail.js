// Sending a sign-in link through Resend, over plain fetch (same approach as
// apps/citation-gap/lib/mail.js). A non-2xx from the provider throws, so a
// send that failed is never reported to the customer as "on its way".
const RESEND = 'https://api.resend.com/emails';

function must(name) {
  const v = process.env[name];
  if (!v) throw new Error(name + ' is not set — the app cannot send a sign-in link without it');
  return v;
}

async function sendLoginLink(to, link) {
  const key = must('RESEND_API_KEY');
  const from = process.env.MAIL_FROM || 'SERP Quake <login@serpquake.com>';
  const res = await fetch(RESEND, {
    method: 'POST',
    headers: { authorization: 'Bearer ' + key, 'content-type': 'application/json' },
    body: JSON.stringify({
      from,
      to: [to],
      subject: 'Your SERP Quake sign-in link',
      text: [
        'Here is your sign-in link. It works once and expires in 15 minutes.',
        '',
        link,
        '',
        'If you did not ask to sign in, you can ignore this email.'
      ].join('\n')
    })
  });
  if (!res.ok) {
    let detail = '';
    try { detail = (await res.text()).slice(0, 300); } catch (e) {}
    throw new Error('mail provider returned ' + res.status + (detail ? ': ' + detail : ''));
  }
  return true;
}

module.exports = { sendLoginLink };
