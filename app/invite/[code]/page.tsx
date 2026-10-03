import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { TopBar } from '@/components/TopBar'
import { logOut } from '@/app/actions'
import { currentUser } from '@/lib/session'
import { getStore } from '@/lib/store'
import { INVITE_CODE } from '@/lib/team'
import { acceptInvite } from './actions'

export const metadata: Metadata = { title: 'Join the team', robots: { index: false } }
export const dynamic = 'force-dynamic'

// An invite to work a site's leads, sent by its owner from Leads → Team.
export default async function InvitePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  if (!INVITE_CODE.test(code)) notFound()
  const store = getStore()
  const inv = await store.invite(code)
  const site = inv ? await store.siteById(inv.siteId) : null
  const [owner, user] = await Promise.all([site ? store.userById(site.orgId) : null, currentUser()])

  return (
    <>
      <TopBar />
      <main className="auth">
        <div className="auth-card">
          {!inv || !site ? (
            <>
              <h1>This invite has been used</h1>
              <p className="sub">It was accepted already, or cancelled. Ask whoever sent it for a new one.</p>
              <p className="switch"><a href={user ? '/dashboard' : '/login'}>{user ? 'Go to your dashboard' : 'Log in'}</a></p>
            </>
          ) : (
            <>
              <h1>Join {site.business.name}</h1>
              <p className="sub">{owner ? `${owner.name} invited you` : 'You’ve been invited'} to help with {site.business.name}’s leads on SaySites: new requests from the website, follow-ups and notes.</p>
              {!user ? (
                <>
                  <a className="btn btn-primary btn-block" href={`/signup?invite=${code}`}>Create my login</a>
                  <p className="switch">Already have a SaySites login? <a href={`/login?invite=${code}`}>Log in</a></p>
                  <p className="muted small">Use {inv.email}, the address this invite went to.</p>
                </>
              ) : user.email.toLowerCase() === inv.email.toLowerCase() ? (
                <form action={acceptInvite.bind(null, code)}>
                  <button className="btn btn-primary btn-block">Join the team</button>
                </form>
              ) : (
                <>
                  <p className="notice">This invite is for {inv.email}, but you’re logged in as {user.email}.</p>
                  <form action={logOut}>
                    <button className="btn btn-ghost btn-block">Log out and switch</button>
                  </form>
                </>
              )}
            </>
          )}
        </div>
      </main>
    </>
  )
}
