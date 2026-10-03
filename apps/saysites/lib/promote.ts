// Two small ways a site turns visitors into customers, set on the Promote
// tab: a slim promotion bar across the top of every page ("10% off your
// first visit this month"), and a booking button that sends people straight
// to the owner's own booking page (Square, Calendly, Vagaro, Booksy…).
// Neither is a pop-up: both sit in the page, as Google's guidelines prefer.

import type { Site } from './schema'

export const BOOKING_LABELS = ['Book online', 'Book now', 'Book a table', 'Book a visit', 'Schedule a call'] as const
export const BOOKING_LABELS_ES = ['Reserva en línea', 'Reserva ahora', 'Reserva una mesa', 'Agenda una visita', 'Agenda una llamada'] as const

// Booking services owners are likely to paste, for a friendly "Square
// booking page" note. Any https link works.
const SERVICES: [RegExp, string][] = [
  [/(^|\.)square(up)?\.(site|com)$/, 'Square'],
  [/(^|\.)calendly\.com$/, 'Calendly'],
  [/(^|\.)vagaro\.com$/, 'Vagaro'],
  [/(^|\.)booksy\.com$/, 'Booksy'],
  [/(^|\.)acuityscheduling\.com$|(^|\.)as\.me$/, 'Acuity'],
  [/(^|\.)fresha\.com$/, 'Fresha'],
  [/(^|\.)opentable\.com$/, 'OpenTable'],
  [/(^|\.)resy\.com$/, 'Resy'],
  [/(^|\.)glossgenius\.com$/, 'GlossGenius'],
  [/(^|\.)styleseat\.com$/, 'StyleSeat'],
  [/(^|\.)setmore\.com$/, 'Setmore'],
  [/(^|\.)mindbodyonline\.com$/, 'Mindbody'],
  [/(^|\.)schedulicity\.com$/, 'Schedulicity'],
  [/(^|\.)housecallpro\.com$/, 'Housecall Pro'],
  [/(^|\.)jobber\.com$|(^|\.)getjobber\.com$/, 'Jobber'],
]

export function bookingService(url: string): string | null {
  try {
    const host = new URL(url).hostname.toLowerCase()
    return SERVICES.find(([re]) => re.test(host))?.[1] ?? null
  } catch {
    return null
  }
}

export function checkBookingUrl(raw: string): { url?: string; error?: string } {
  let v = raw.trim()
  if (!v) return { error: 'Paste the link to your booking page.' }
  if (!/^https?:\/\//i.test(v)) v = 'https://' + v
  let u: URL
  try {
    u = new URL(v)
  } catch {
    return { error: 'That doesn’t look like a web link. Copy it from your booking page’s address bar.' }
  }
  if (u.protocol !== 'https:') return { error: 'Use the secure link, the one starting with https://.' }
  if (!u.hostname.includes('.') || /\s/.test(v)) return { error: 'That doesn’t look like a web link. Copy it from your booking page’s address bar.' }
  if (/(^|\.)saysites\.com$/.test(u.hostname)) return { error: 'Paste the link to your booking page on Square, Calendly or similar, not your website.' }
  return { url: u.toString().slice(0, 300) }
}

// A promotion links to a page on the site or to a secure web address.
export function checkPromoLink(raw: string): { href?: string; error?: string } {
  const v = raw.trim()
  if (!v) return {}
  if (/^\/[^\s]*$/.test(v)) return { href: v }
  if (/^https:\/\/[^\s]+\.[^\s]+$/.test(v)) return { href: v.slice(0, 300) }
  return { error: 'Link the promotion to one of your pages, or to a web address starting with https://.' }
}

// Shown until the end of its last day (UTC), then it quietly disappears.
export function promoActive(site: Pick<Site, 'promo'>, now = new Date()): boolean {
  const p = site.promo
  if (!p) return false
  return !p.until || now.toISOString().slice(0, 10) <= p.until
}
