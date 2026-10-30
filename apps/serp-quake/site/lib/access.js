// Who may see the full seismograph. One rule, in one place, so the API and the
// account summary the front end draws from can never disagree.
//
//   paid      plan 'pro' with plan_status 'active' or 'past_due' (Stripe retries a failed
//             card; a declined Tuesday payment shouldn't blank Wednesday's dashboard)
//   trial     the first TRIAL_DAYS after the account was created, no card needed
//   otherwise the public pulse only

const TRIAL_DAYS = Number(process.env.TRIAL_DAYS || 7);

function access(user, now = Date.now()) {
  if (!user) return { level: 'none', full: false };
  const paid = user.plan === 'pro' && (user.plan_status === 'active' || user.plan_status === 'past_due');
  if (paid) return { level: 'pro', full: true, status: user.plan_status, renewsAt: user.plan_renews_at || null };
  const trialEnds = new Date(new Date(user.created_at).getTime() + TRIAL_DAYS * 864e5);
  if (trialEnds.getTime() > now) {
    return { level: 'trial', full: true, trialEnds: trialEnds.toISOString(), daysLeft: Math.ceil((trialEnds.getTime() - now) / 864e5) };
  }
  return { level: 'expired', full: false, trialEnds: trialEnds.toISOString() };
}

module.exports = { access, TRIAL_DAYS };
