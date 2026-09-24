import { logOut } from '@/app/actions'
import { currentUser } from '@/lib/session'
import { Logo } from './Logo'

// The marketing homepage doesn't read the session, so it can be served as a
// static page; everywhere else the bar reflects who is logged in.
export async function TopBar({ marketing = false }: { marketing?: boolean }) {
  const user = marketing ? null : await currentUser()
  return (
    <header className="topbar">
      <div className="wrap">
        <Logo />
        <nav aria-label="Main">
          {marketing && (
            <>
              <a className="hide-sm" href="/#how">How it works</a>
              <a className="hide-sm" href="/#features">Features</a>
              <a className="hide-sm" href="/#pricing">Pricing</a>
            </>
          )}
          {user ? (
            <>
              <a href="/dashboard">My sites</a>
              <a className="hide-sm" href="/dashboard/account">Account</a>
              <form action={logOut}>
                <button className="btn btn-ghost btn-sm" type="submit">Log out</button>
              </form>
            </>
          ) : (
            <>
              <a href="/login">Log in</a>
              <a className="btn btn-primary btn-sm" href="/signup">Start free</a>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
