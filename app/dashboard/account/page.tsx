import { changePassword, deleteAccount, updateName } from '@/app/actions'
import { ActionForm } from '@/components/ActionForm'
import { requireUser } from '@/lib/session'
import { billingReady, loadAccess } from '@/lib/billing'
import { getStore } from '@/lib/store'
import { formatDate } from '@/lib/render'
import { managePlan, startPlan } from './billing-actions'

const NOTES: Record<string, [string, string]> = {
  welcome: ['good', 'You’re all set. Thank you for joining SaySites.'],
  soon: ['', 'Plans open very soon. Your trial keeps going until then.'],
  error: ['bad', 'We couldn’t reach our payment provider. Please try again in a minute.'],
}

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ billing?: string }> }) {
  const user = await requireUser()
  const note = NOTES[(await searchParams).billing ?? '']
  const a = await loadAccess(getStore(), user)
  const promo = a.billing?.promo
  return (
    <div className="narrow stack">
      <div className="dash-head">
        <div>
          <p className="crumbs"><a href="/dashboard">My sites</a> / Account</p>
          <h1>Your account</h1>
          <p className="muted" style={{ margin: 0 }}>{user.email}</p>
        </div>
      </div>
      {note && <p className={`notice ${note[0]}`}>{note[1]}</p>}
      <div className="card" id="plan">
        <h3>Your plan</h3>
        {a.status === 'comp' ? (
          <p className="muted">Complimentary. Everything is included.</p>
        ) : a.status === 'active' || a.status === 'past_due' ? (
          <>
            <p className="muted">{a.status === 'past_due' ? 'Your last payment didn’t go through. Please update your card to keep your site going.' : `Active${a.billing?.currentPeriodEnd ? `, renews ${formatDate(a.billing.currentPeriodEnd)}` : ''}.`}</p>
            <form action={managePlan}><button className="btn btn-ghost" type="submit">Manage billing</button></form>
          </>
        ) : (
          <>
            <p className="muted">
              {a.locked
                ? 'Your free trial has ended. Your website and everything you’ve made are saved. Start your plan to keep editing and keep Sofie working for you.'
                : a.status === 'canceled'
                  ? 'Your plan is cancelled. Start it again any time.'
                  : a.billing?.feedbackReward
                    ? `Free until ${formatDate(a.billing.trialEndsAt)}: three months on us, for your feedback. Thank you.`
                    : `Free trial: ${a.daysLeft} day${a.daysLeft === 1 ? '' : 's'} left.`}
            </p>
            {billingReady() ? (
              <form action={startPlan} className="row" style={{ alignItems: 'end' }}>
                <label className="field"><span>Promo code <em className="muted">(optional)</em></span><input className="input" name="promo" defaultValue={promo ?? ''} maxLength={40} autoCapitalize="characters" /></label>
                <button className="btn btn-primary" type="submit">Start my plan</button>
              </form>
            ) : (
              <p className="small muted">Plans open very soon{promo ? `. Your code ${promo} is saved and will be applied.` : '.'}</p>
            )}
          </>
        )}
      </div>
      <div className="card">
        <h3>Your name</h3>
        <ActionForm action={updateName} submit="Save">
          <label className="field"><span>Name</span><input className="input" name="name" defaultValue={user.name} required maxLength={80} autoComplete="name" /></label>
        </ActionForm>
      </div>
      <div className="card">
        <h3>Password</h3>
        <ActionForm action={changePassword} submit="Change password">
          <div className="row">
            <label className="field"><span>Current password</span><input className="input" name="current" type="password" required autoComplete="current-password" /></label>
            <label className="field"><span>New password</span><input className="input" name="next" type="password" required minLength={8} autoComplete="new-password" /></label>
          </div>
        </ActionForm>
      </div>
      <div className="card danger-zone">
        <h3>Delete your account</h3>
        <p className="muted small">This deletes your account and every website you’ve built, with their pages, Sofie history and messages. It can’t be undone.</p>
        <ActionForm action={deleteAccount} submit="Delete my account" danger>
          <label className="field"><span>Enter your password to confirm</span><input className="input" name="password" type="password" required autoComplete="current-password" /></label>
        </ActionForm>
      </div>
    </div>
  )
}
