import type { Metadata } from 'next'
import { MarketingShell } from '@/components/MarketingShell'
import { Faq, JsonLd, More, Pic, Steps, type QA } from '../parts'
import '../../home.css'
import '../connect.css'

const TITLE = 'Add a Book Online button to your website'
const DESCRIPTION = 'Already take bookings with Square, Calendly, Vagaro, Booksy, Acuity or OpenTable? Paste your booking link and a Book online button appears on every page of your SaySites website.'

export const metadata: Metadata = {
  title: { absolute: `${TITLE} | SaySites` },
  description: DESCRIPTION,
  alternates: { canonical: '/connect/booking' },
  openGraph: { title: TITLE, description: DESCRIPTION, images: [{ url: '/og-home.jpg', width: 1200, height: 630 }] },
}

const FAQ: QA[] = [
  { q: 'Which booking apps work?', a: 'Any booking page with a web address that starts with https://. That includes Square Appointments, Calendly, Vagaro, Booksy, Acuity Scheduling, Fresha, GlossGenius, StyleSeat, Setmore, Mindbody, OpenTable, Resy, Housecall Pro and Jobber.' },
  { q: 'Where do I find my booking link?', a: 'Open your booking page the way a customer would, then copy the address from the top of your browser. Most booking apps also have a “Share” or “Copy link” button in their settings.' },
  { q: 'Where does the button show on my website?', a: 'At the top right of every page, and on phones at the bottom of the screen next to the Call button, so it’s always one tap away.' },
  { q: 'What can the button say?', a: 'Book online, Book now, Book a table, Book a visit or Schedule a call. Pick the one that fits your business; you can change it any time.' },
  { q: 'Do my bookings or customer details go through SaySites?', a: 'No. The button takes customers straight to your own booking page, so your calendar, reminders and payments stay exactly where they are today.' },
  { q: 'Can I show a special offer too?', a: 'Yes. On the same Promote tab you can add a promotion bar across the top of every page, like “20% off your first visit this month”, link it to your booking page, and set a last day so it disappears on its own.' },
  { q: 'Is it a pop-up?', a: 'No. Both the button and the promotion bar sit neatly in your page. Pop-ups that cover the page annoy visitors on phones, and Google’s guidelines warn against them.' },
]

function Paste() {
  return (
    <div className="cx-paste">
      <small>Your booking page</small>
      <code>https://calendly.com/maple-street/haircut</code>
      <small>Square, Calendly, Vagaro, Booksy, Acuity, OpenTable…</small>
    </div>
  )
}

function Label() {
  return (
    <>
      <small className="cx-hint">The button says</small>
      <div className="cx-chips"><span>Book online</span><span className="on">Book now</span><span>Book a visit</span><span>Schedule a call</span></div>
    </>
  )
}

function Phone() {
  return (
    <div className="cx-phone">
      <div className="cx-site-bar">20% off your first visit</div>
      <div className="cx-site-ph"><Pic id="1688583417770-ff6cc18071dc" alt="" sizes="170px" /></div>
      <div className="cx-phone-bar"><span>Call</span><span>Book now</span></div>
    </div>
  )
}

export default function BookingPage() {
  return (
    <MarketingShell>
      <JsonLd faq={FAQ} crumbs={[['SaySites', '/'], ['Connect', '/connect'], ['Book online button', '/connect/booking']]} />
      <section className="page-hero cx-hero">
        <div className="wrap cx-hero-in">
          <div>
            <p className="kicker">Online booking</p>
            <h1>Let customers book you from any page.</h1>
            <p>Keep the booking app you already use. Paste its link on your Promote tab and a Book online button appears across your whole website, and next to Call on phones. No new calendar to learn, nothing to move.</p>
            <div className="ind-actions">
              <a className="b b-dark" href="/signup">Start free</a>
              <a href="#how">How it works</a>
            </div>
          </div>
          <div className="frame">
            <div className="frame-bar"><i /><i /><i /><span>maple-street-salon.saysites.com</span></div>
            <div className="frame-body">
              <div className="cx-site" style={{ border: 0, borderRadius: 0 }}>
                <div className="cx-site-bar">20% off your first visit this month</div>
                <div className="cx-site-head"><b>Maple Street Salon</b><i>Book now</i></div>
                <div className="cx-site-ph" style={{ height: 260 }}><Pic id="1688583417770-ff6cc18071dc" alt="Freshly painted pastel nails" sizes="(max-width: 900px) 92vw, 520px" /></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="ind-sec ind-alt" id="how">
        <div className="wrap">
          <div className="head">
            <p className="kicker">How it works</p>
            <h2>Paste, pick, done.</h2>
          </div>
          <Steps
            steps={[
              { title: 'Paste your booking link', text: 'Copy the address of your booking page from Square, Calendly, Vagaro or whichever app you use, and paste it on your Promote tab.', pic: <Paste /> },
              { title: 'Pick what it says', text: 'Book online, Book now, Book a table, Book a visit or Schedule a call. You see it on your site as you choose.', pic: <Label /> },
              { title: 'It’s on every page', text: 'The button sits at the top of every page, and on phones next to Call at the bottom of the screen.', pic: <Phone /> },
            ]}
          />
        </div>
      </section>

      <section className="ind-sec">
        <div className="wrap ind-two">
          <div>
            <p className="kicker">Why it brings more bookings</p>
            <h2>Fewer steps between “I need this” and a booking.</h2>
          </div>
          <div className="ind-seo">
            <div><h3>Always in reach</h3><p>People rarely scroll back up to find a contact page. A button on every page, and pinned to the bottom of the screen on phones, catches them whenever they’re ready.</p></div>
            <div><h3>Your offer, in the same place</h3><p>Add a promotion bar with a last day, like “20% off your first visit this month”, and link it straight to your booking page.</p></div>
            <div><h3>Nothing new to manage</h3><p>Your calendar, reminders, deposits and customer list stay in the booking app you already trust. The button just sends people there.</p></div>
          </div>
        </div>
      </section>

      <Faq items={FAQ} title="Adding online booking" />
      <More here="/connect/booking" />
    </MarketingShell>
  )
}
