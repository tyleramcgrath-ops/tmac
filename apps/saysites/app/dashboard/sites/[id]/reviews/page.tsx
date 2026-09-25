import { notFound } from 'next/navigation'
import qrcode from 'qrcode-generator'
import { ActionForm } from '@/components/ActionForm'
import { CopyText } from '@/components/CopyText'
import { reviewLink, reviewMessages } from '@/lib/reviews'
import { requireUser } from '@/lib/session'
import { getStore } from '@/lib/store'
import { saveReviewUrl } from '../manage-actions'

function qrSvg(text: string): string {
  const qr = qrcode(0, 'M')
  qr.addData(text)
  qr.make()
  return qr.createSvgTag({ cellSize: 6, margin: 2, scalable: true })
}

export default async function ReviewsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await requireUser()
  const site = await getStore().siteForUser(user.id, id)
  if (!site) notFound()
  const link = reviewLink(site)
  const set = !!site.business.reviewUrl
  const messages = reviewMessages(site)

  return (
    <section className="stack">
      <div className="sec-head">
        <div>
          <h2>Reviews</h2>
          <p className="muted">Reviews are one of the strongest signals in local search, and they’re what makes people pick you. Make it easy for every customer to leave one.</p>
        </div>
      </div>

      <div className="card">
        <div className="card-head"><h3>Your review link</h3>{set && <span className="pill ok">Set</span>}</div>
        <ActionForm action={saveReviewUrl.bind(null, site.id)} submit="Save">
          <label className="field">
            <span>Google review link</span>
            <input className="input" name="reviewUrl" defaultValue={site.business.reviewUrl ?? ''} placeholder="https://g.page/r/…/review" maxLength={500} />
            <small>In your Google Business Profile, choose <strong>Ask for reviews</strong> and copy the link. Or paste your Place ID below. A Yelp, Avvo or Facebook review page works too.</small>
          </label>
          <label className="field">
            <span>Or your Google Place ID <em className="muted">(optional)</em></span>
            <input className="input" name="placeId" placeholder="ChIJ…" maxLength={200} />
          </label>
        </ActionForm>
      </div>

      {set && (
        <>
          <div className="reviews-two">
            <div className="card review-card-wrap">
              <div className="card-head"><h3>Printable card</h3><span className="muted small">Hand it over after a job, or put it by the till</span></div>
              <div className="review-card" id="review-card">
                <div className="review-qr" dangerouslySetInnerHTML={{ __html: qrSvg(link) }} />
                <div>
                  <strong>{site.business.name}</strong>
                  <p>{site.language?.startsWith('es') ? '¿Cómo lo hicimos? Escanea para dejar una reseña.' : 'How did we do? Scan to leave a review.'}</p>
                  <span>{link.replace(/^https:\/\//, '')}</span>
                </div>
              </div>
              <p className="small muted" style={{ margin: 0 }}>Print this page and the card prints on its own. The code points to <code>{link.replace(/^https:\/\//, '')}</code>, which forwards to your review link, so the card keeps working if the link ever changes.</p>
            </div>
            <div className="card">
              <div className="card-head"><h3>Your short link</h3><CopyText text={link} /></div>
              <p style={{ margin: '0 0 12px', fontWeight: 600 }}>{link.replace(/^https:\/\//, '')}</p>
              <p className="small muted" style={{ margin: 0 }}>Put it in text messages, emails and invoices. It also appears as “Leave us a review” in your website’s footer.</p>
            </div>
          </div>

          <div className="card">
            <div className="card-head"><h3>What to send</h3><span className="muted small">Copy, paste, send</span></div>
            <ul className="review-msgs">
              {messages.map((m) => (
                <li key={m.id}>
                  <div className="card-head" style={{ marginBottom: 6 }}><strong>{m.label}</strong><CopyText text={m.subject ? `${m.subject}\n\n${m.body}` : m.body} /></div>
                  {m.subject && <p className="small muted" style={{ margin: '0 0 4px' }}>Subject: {m.subject}</p>}
                  <p className="review-body">{m.body}</p>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Staying within Google’s rules</h3>
        <ul className="steps-sm">
          <li>Ask every customer, not only the ones you think were happy.</li>
          <li>Never offer a discount, gift or anything else for a review.</li>
          <li>Don’t write reviews for customers or post them yourself, and don’t review your own business.</li>
          <li>Reply to reviews, good and bad, politely and without sharing private details.</li>
        </ul>
      </div>
    </section>
  )
}
