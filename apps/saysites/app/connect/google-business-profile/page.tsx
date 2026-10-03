import type { Metadata } from 'next'
import { MarketingShell } from '@/components/MarketingShell'
import { placesReady } from '@/lib/places'
import { Faq, JsonLd, More, Pic, Steps, type QA } from '../parts'
import '../../home.css'
import '../connect.css'

const TITLE = 'Build a website from your Google Business Profile'
const DESCRIPTION = 'Search for your business, tap your Google listing, and your new website starts with your real name, address, phone number and opening hours. Change anything before it goes live.'

// Kept out of search until the Google lookup is switched on, so the page
// never promises something visitors can’t use yet.
export function generateMetadata(): Metadata {
  return {
    title: { absolute: `${TITLE} | SaySites` },
    description: DESCRIPTION,
    alternates: { canonical: '/connect/google-business-profile' },
    openGraph: { title: TITLE, description: DESCRIPTION, images: [{ url: '/og-home.jpg', width: 1200, height: 630 }] },
    ...(placesReady() ? {} : { robots: { index: false, follow: true } }),
  }
}

const FAQ: QA[] = [
  { q: 'Do I need a Google Business Profile to use SaySites?', a: 'No. If you don’t have one, type your business details in yourself; it takes about a minute. If you do, starting from it saves the typing and makes sure your website matches your Google listing exactly.' },
  { q: 'What does SaySites take from my Google listing?', a: 'Your business name, the kind of business, your street address, city, state and ZIP code, your phone number and your opening hours. Your website’s “Leave us a review” link is set up to point at your Google reviews.' },
  { q: 'Do I have to sign in to Google or give SaySites my password?', a: 'No. You search for your business the same way customers find you on Google Maps. SaySites only reads what your listing already shows the public, and never changes or posts anything on your Google account.' },
  { q: 'What if something on my listing is out of date?', a: 'Everything fills into the form first, and you can change any of it before you build. Your website and your listing should say the same thing, so it’s also a good moment to fix the listing on Google.' },
  { q: 'Why does it matter that my website matches my Google listing?', a: 'Google compares the name, address and phone number on your website with your Business Profile and other listings. When they match, it’s easier for Google to trust they’re all the same business, which helps in local results and on Google Maps.' },
  { q: 'Will my Google reviews show on my website?', a: 'Not yet. Showing your Google reviews on your site, in your customers’ own words, is coming soon. Today your site gets a “Leave us a review” link, a printable review card and ready-to-send review messages.' },
  { q: 'How much does it cost?', a: 'Starting from your Google listing is included free. What your website costs depends on what your business needs, so we quote after a short conversation. There’s no setup fee and no long-term contract.' },
]

function Searching() {
  return (
    <>
      <div className="cx-search">Rosie’s Bakery Portland<i className="cx-caret" /></div>
      <span className="cx-hint">Your business name and town, like customers search for you.</span>
    </>
  )
}

function Results() {
  return (
    <div className="cx-list">
      <div className="on"><b>Rosie’s Bakery</b><span>2210 SE Division St, Portland, OR</span></div>
      <div><b>Rosie’s Bakery &amp; Café</b><span>Salem, OR</span></div>
      <div><b>Rose City Bakehouse</b><span>NE Alberta St, Portland, OR</span></div>
    </div>
  )
}

function Filled() {
  return (
    <div className="cx-form">
      <div><span>Name</span><b>Rosie’s Bakery</b></div>
      <div><span>Kind</span><b>Bakery</b></div>
      <div><span>Phone</span><b>(503) 555-0142</b></div>
      <div><span>Hours</span><b>Tue-Fri 7am-3pm</b></div>
      <span className="cx-done">✓ Filled in from Google</span>
    </div>
  )
}

export default function GoogleProfilePage() {
  const live = placesReady()
  return (
    <MarketingShell>
      <JsonLd faq={FAQ} crumbs={[['SaySites', '/'], ['Connect', '/connect'], ['Google Business Profile', '/connect/google-business-profile']]} />
      <section className="page-hero cx-hero">
        <div className="wrap cx-hero-in">
          <div>
            <p className="kicker">{live ? 'Google Business Profile' : 'Google Business Profile, coming soon'}</p>
            <h1>Your Google listing, turned into your website.</h1>
            <p>Search for your business and tap your listing. Your website starts with your real name, address, phone number and opening hours, exactly as customers already see them on Google. You check it, change what you like, and it’s yours.</p>
            <div className="ind-actions">
              <a className="b b-dark" href="/signup">{live ? 'Start from my listing' : 'Start free'}</a>
              <a href="#how">How it works</a>
            </div>
            {!live && <span className="cx-soon">Starting from your listing is almost ready. Until then, you can type the same details in about a minute.</span>}
          </div>
          <div className="frame">
            <div className="frame-bar"><i /><i /><i /><span>rosies-bakery.saysites.com</span></div>
            <div className="frame-body">
              <div className="cx-site" style={{ border: 0, borderRadius: 0 }}>
                <div className="cx-site-head"><b>Rosie’s Bakery</b><i>(503) 555-0142</i></div>
                <div className="cx-site-ph" style={{ height: 240 }}><Pic id="1509440159596-0249088772ff" alt="Fresh loaves of bread on a bakery counter" sizes="(max-width: 900px) 92vw, 520px" /></div>
                <div className="cx-form" style={{ padding: 14 }}>
                  <div><span>Open</span><b>Tue-Fri 7am-3pm, Sat-Sun 7am-2pm</b></div>
                  <div><span>Find us</span><b>2210 SE Division St, Portland</b></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="ind-sec ind-alt" id="how">
        <div className="wrap">
          <div className="head">
            <p className="kicker">How it works</p>
            <h2>Three taps, no copying and pasting.</h2>
          </div>
          <Steps
            steps={[
              { title: 'Search for your business', text: 'Type your business name and town, the same way a customer would search for you on Google Maps.', pic: <Searching /> },
              { title: 'Tap your listing', text: 'Pick yours from the list. If you have two locations, pick the one this website is for.', pic: <Results /> },
              { title: 'Check it and build', text: 'Your name, kind of business, address, phone and hours are filled in. Change anything, then build your site.', pic: <Filled /> },
            ]}
          />
        </div>
      </section>

      <section className="ind-sec">
        <div className="wrap ind-two">
          <div>
            <p className="kicker">What comes over</p>
            <h2>The details customers look for first.</h2>
          </div>
          <ul className="cx-what">
            <li><b>Business name</b><span>Spelled exactly as on your listing.</span></li>
            <li><b>Kind of business</b><span>So your site starts with the right pages, like a menu for a café or services for a plumber.</span></li>
            <li><b>Address</b><span>Street, city, state and ZIP, with a directions button on phones.</span></li>
            <li><b>Phone number</b><span>A tap-to-call button on every page.</span></li>
            <li><b>Opening hours</b><span>Every day of the week, including late closings.</span></li>
            <li><b>Your review link</b><span>“Leave us a review” goes straight to your Google reviews.</span></li>
          </ul>
        </div>
      </section>

      <section className="ind-sec ind-alt">
        <div className="wrap ind-two">
          <div>
            <p className="kicker">Why it helps in search</p>
            <h2>One business, one set of details, everywhere.</h2>
          </div>
          <div className="ind-seo">
            <div><h3>Your details match</h3><p>Google checks that the name, address and phone number on your website agree with your Business Profile. Starting from your listing means they match from day one.</p></div>
            <div><h3>Written the way Google reads it</h3><p>Your details also go into the page as structured data (schema.org LocalBusiness), the format Google uses to understand who you are, where you are and when you’re open.</p></div>
            <div><h3>Fast on every phone</h3><p>Every SaySites page has to pass a 95+ speed check before it goes live, because most people searching for a local business are on their phone.</p></div>
          </div>
        </div>
      </section>

      <Faq items={FAQ} title="Starting from your Google listing" />
      <More here="/connect/google-business-profile" />
    </MarketingShell>
  )
}
