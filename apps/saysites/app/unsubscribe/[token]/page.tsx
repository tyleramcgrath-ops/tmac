import type { Metadata } from 'next'
import { MarketingShell } from '@/components/MarketingShell'
import '../../home.css'

export const metadata: Metadata = { title: 'Unsubscribe', robots: { index: false } }

// The unsubscribe link in every outreach email. One button, no sign-in.
export default async function Unsubscribe({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<{ done?: string }> }) {
  const [{ token }, { done }] = await Promise.all([params, searchParams])
  return (
    <MarketingShell closing={false}>
      <section className="page-hero">
        <div className="wrap">
          <p className="kicker">Email from SaySites</p>
          {done ? (
            <>
              <h1>You’re unsubscribed.</h1>
              <p>We won’t email you again. Sorry for the bother.</p>
            </>
          ) : (
            <>
              <h1>Stop these emails?</h1>
              <p>One click and we won’t email you again, at this address or about your website.</p>
              <form action="/api/unsubscribe" method="post" style={{ marginTop: 28 }}>
                <input type="hidden" name="t" value={token} />
                <button className="b b-dark" type="submit">Unsubscribe</button>
              </form>
            </>
          )}
        </div>
      </section>
    </MarketingShell>
  )
}
