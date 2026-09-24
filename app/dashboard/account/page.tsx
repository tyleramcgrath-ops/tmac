import { changePassword, deleteAccount, updateName } from '@/app/actions'
import { ActionForm } from '@/components/ActionForm'
import { requireUser } from '@/lib/session'

export default async function AccountPage() {
  const user = await requireUser()
  return (
    <div className="narrow stack">
      <div className="dash-head">
        <div>
          <p className="crumbs"><a href="/dashboard">My sites</a> / Account</p>
          <h1>Your account</h1>
          <p className="muted" style={{ margin: 0 }}>{user.email}</p>
        </div>
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
