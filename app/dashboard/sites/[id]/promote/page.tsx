import { notFound } from 'next/navigation'
import { BookingForm, PromoForm } from '@/components/PromoteForms'
import { BOOKING_LABELS, BOOKING_LABELS_ES, bookingService, promoActive } from '@/lib/promote'
import { requireUser } from '@/lib/session'
import { getStore } from '@/lib/store'
import { removeBooking, removePromo, saveBooking, savePromo } from '../manage-actions'

export default async function PromotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await requireUser()
  const site = await getStore().siteForUser(user.id, id)
  if (!site) notFound()
  const c = site.globals.colors
  const look = { primary: c.primary, background: c.background, text: c.text, name: site.business.name }
  const promo = site.promo
  const ended = !!promo && !promoActive(site)
  const cta = site.header?.cta
  const booking = cta?.href.startsWith('https://') ? cta : undefined
  const service = booking ? bookingService(booking.href) : null
  const labels = site.language.startsWith('es') ? BOOKING_LABELS_ES : BOOKING_LABELS

  return (
    <section className="stack">
      <div className="sec-head">
        <div>
          <h2>Promote</h2>
          <p className="muted">Two simple ways to turn visitors into customers. Both sit neatly in your site, never as a pop-up, so they don’t annoy people or hurt you in Google.</p>
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <h3>Promotion bar</h3>
          {promo && (ended ? <span className="pill">Ended</span> : <span className="pill ok">On your site</span>)}
        </div>
        <p className="muted small">A slim bar across the top of every page. Use it for an offer, a seasonal special, new hours or an event.</p>
        <PromoForm action={savePromo.bind(null, site.id)} look={look} initial={{ text: promo?.text ?? '', href: promo?.href ?? '', until: promo?.until ?? '' }} />
        {promo && (
          <form action={removePromo.bind(null, site.id)} className="pm-remove">
            <button className="btn btn-ghost btn-sm" type="submit">Take it down</button>
          </form>
        )}
      </div>

      <div className="card">
        <div className="card-head">
          <h3>Book online button</h3>
          {booking && <span className="pill ok">On your site</span>}
        </div>
        <p className="muted small">
          Already take bookings on another site? Paste the link and a button appears at the top of every page, and at the bottom of the screen on phones, next to Call.
          {booking && service && <> Right now it goes to your <strong>{service}</strong> booking page.</>}
        </p>
        <BookingForm action={saveBooking.bind(null, site.id)} look={look} labels={labels} initial={{ url: booking?.href ?? '', label: booking?.label ?? '' }} />
        {booking && (
          <form action={removeBooking.bind(null, site.id)} className="pm-remove">
            <button className="btn btn-ghost btn-sm" type="submit">Remove the button</button>
          </form>
        )}
      </div>
    </section>
  )
}
