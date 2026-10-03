import type { Metadata } from 'next'
import { MarketingShell } from '@/components/MarketingShell'
import { placesReady } from '@/lib/places'
import { More, Pic } from './parts'
import '../home.css'
import './connect.css'

const TITLE = 'Connect your business to your website'
const DESCRIPTION = 'Start your website from your Google Business Profile, add a Book online button from Square, Calendly or Vagaro, and soon bring in your Google reviews and Instagram and Facebook photos.'

export const metadata: Metadata = {
  title: { absolute: `${TITLE} | SaySites` },
  description: DESCRIPTION,
  alternates: { canonical: '/connect' },
  openGraph: { title: TITLE, description: DESCRIPTION, images: [{ url: '/og-home.jpg', width: 1200, height: 630 }] },
}

export default function ConnectPage() {
  const google = placesReady()
  return (
    <MarketingShell>
      <section className="page-hero">
        <div className="wrap">
          <p className="kicker">Connect</p>
          <h1>Bring what you already have.</h1>
          <p>Your business already lives in a few places: your Google listing, your booking app, your Instagram. Connect them and your website starts with your real details instead of a blank page. You choose what shows, and nothing is ever posted to your accounts.</p>
        </div>
      </section>

      <section className="ind-sec ind-alt" style={{ paddingTop: 72 }}>
        <div className="wrap cx-cards">
          <a className="cx-card" href="/connect/google-business-profile">
            <div className="cx-pic" aria-hidden="true">
              <div className="cx-search">Rosie’s Bakery Portland</div>
              <div className="cx-form">
                <div><span>Phone</span><b>(503) 555-0142</b></div>
                <div><span>Hours</span><b>Tue-Fri 7am-3pm</b></div>
                <span className="cx-done">✓ Filled in from Google</span>
              </div>
            </div>
            <h3>Google Business Profile {!google && <small>Coming soon</small>}</h3>
            <p>Search for your business, tap your listing, and your new site starts with your name, address, phone and hours, matching Google exactly.</p>
            <span className="go">How it works</span>
          </a>
          <a className="cx-card" href="/connect/booking">
            <div className="cx-pic" aria-hidden="true">
              <div className="cx-site">
                <div className="cx-site-bar">20% off your first visit</div>
                <div className="cx-site-head"><b>Maple Street Salon</b><i>Book now</i></div>
              </div>
              <div className="cx-chips"><span>Square</span><span>Calendly</span><span>Vagaro</span><span>Booksy</span><span>OpenTable</span></div>
            </div>
            <h3>Your booking app</h3>
            <p>Paste your booking link and a Book online button appears on every page, plus an optional promotion bar for your latest offer.</p>
            <span className="go">How it works</span>
          </a>
          <div className="cx-card">
            <div className="cx-pic" aria-hidden="true" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, padding: 14 }}>
              {['1579697096985-41fe1430e5df', '1566698629409-787a68fc5724', '1567042661848-7161ce446f85', '1517433670267-08bbd4be890f', '1555507036-ab1f4038808a', '1509440159596-0249088772ff'].map((id) => (
                <div key={id} className="ph" style={{ borderRadius: 8 }}><Pic id={id} alt="" sizes="160px" /></div>
              ))}
            </div>
            <h3>Instagram <small>Coming soon</small></h3>
            <p>Pick posts from Instagram and they become your website’s gallery, resized so your pages stay fast.</p>
          </div>
          <div className="cx-card">
            <div className="cx-pic" aria-hidden="true">
              <div className="cx-form">
                <div><span>Hours</span><b>Tue-Fri 7am-3pm</b></div>
                <div><span>Address</span><b>2210 SE Division St</b></div>
                <div><span>Photos</span><b>From your page</b></div>
              </div>
            </div>
            <h3>Facebook <small>Coming soon</small></h3>
            <p>Bring over your photos, hours and details from your Facebook page, so what customers see matches wherever they find you.</p>
          </div>
        </div>
      </section>

      <section className="ind-sec">
        <div className="wrap ind-two">
          <div>
            <p className="kicker">Your say</p>
            <h2>Connected, but always in your hands.</h2>
          </div>
          <div className="ind-seo">
            <div><h3>You choose what shows</h3><p>Everything that comes in fills a form or a list first. You check it, change it or leave it out before anything goes on your site.</p></div>
            <div><h3>Nothing posted for you</h3><p>SaySites reads what you connect. It never posts, comments or changes anything on your Google, Instagram or Facebook accounts.</p></div>
            <div><h3>No passwords shared</h3><p>Starting from your Google listing needs no sign-in at all, and your booking button is just a link. Where a connection needs permission, you give it on Google’s or Meta’s own page, and can take it back any time.</p></div>
          </div>
        </div>
      </section>

      <More here="/connect" />
    </MarketingShell>
  )
}
