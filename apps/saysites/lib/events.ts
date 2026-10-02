// The events list: classes, live music, tastings, open days. The owner adds
// them on the Promote tab; upcoming ones show on the home page in date
// order and are described to Google as events. Past ones drop off by
// themselves, so the site never advertises something that already happened.

import type { Site } from './schema'
import type { SiteWords } from './site-words'

export type SiteEvent = NonNullable<Site['events']>[number]

// An event shows through the end of its own day anywhere in the world, so
// an evening event in California doesn't vanish at 5pm (midnight UTC).
export function upcomingEvents(site: Pick<Site, 'events'>, now = new Date()): SiteEvent[] {
  const today = new Date(now.getTime() - 12 * 3600_000).toISOString().slice(0, 10)
  return (site.events ?? []).filter((e) => e.date >= today).sort((a, b) => `${a.date}${a.time ?? ''}`.localeCompare(`${b.date}${b.time ?? ''}`))
}

export function checkEvent(raw: { title: string; date: string; time: string; place: string; note: string; href: string }, now = new Date()): { event?: Omit<SiteEvent, 'id'>; error?: string } {
  const title = raw.title.trim().slice(0, 100)
  if (!title) return { error: 'Give the event a name, like “Live music on the patio”.' }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw.date)) return { error: 'Pick the day from the calendar.' }
  if (raw.date < now.toISOString().slice(0, 10)) return { error: 'That day has already passed. Pick a later one.' }
  const time = raw.time.trim()
  if (time && !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) return { error: 'Pick the start time from the clock, or leave it empty.' }
  const href = raw.href.trim()
  let link: string | undefined
  if (href) {
    if (/^\/[^\s]*$/.test(href)) link = href
    else if (/^https:\/\/[^\s]+\.[^\s]+$/.test(href)) link = href.slice(0, 300)
    else return { error: 'Link the event to one of your pages, or to a web address starting with https://.' }
  }
  const place = raw.place.trim().slice(0, 120)
  const note = raw.note.trim().slice(0, 300)
  return { event: { title, date: raw.date, ...(time ? { time } : {}), ...(place ? { place } : {}), ...(note ? { note } : {}), ...(link ? { href: link } : {}) } }
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

// The home page section: a date tile beside each event's details.
export function eventsHtml(events: SiteEvent[], t: SiteWords): string {
  if (!events.length) return ''
  const items = events.map((e) => {
    const [, m, d] = e.date.split('-')
    const when = [e.time ? t.clock(+e.time.slice(0, 2), e.time.slice(3)) : '', e.place ?? ''].filter(Boolean).join(' · ')
    const title = e.href ? `<a href="${esc(e.href)}"${e.href.startsWith('http') ? ' rel="noopener"' : ''}>${esc(e.title)}</a>` : esc(e.title)
    return `<li><time class="sev-d" datetime="${esc(e.date)}${e.time ? `T${esc(e.time)}` : ''}"><span>${esc(t.months[+m - 1] ?? '')}</span><b>${+d}</b></time><div><h3>${title}</h3>${when ? `<p class="sev-w">${esc(when)}</p>` : ''}${e.note ? `<p>${esc(e.note)}</p>` : ''}</div></li>`
  })
  return `<section class="sev" aria-labelledby="sev-h"><div class="sev-in"><h2 id="sev-h">${esc(t.upcomingEvents)}</h2><ul>${items.join('')}</ul></div></section>`
}

export const EVENTS_CSS =
  '.sev{background:var(--c-surface);padding:72px 24px}.sev-in{max-width:var(--w);margin:0 auto}.sev h2{margin-bottom:24px}' +
  '.sev ul{list-style:none;margin:0;padding:0;display:grid;gap:14px}.sev li{display:flex;gap:20px;align-items:flex-start;background:var(--c-background);border-radius:var(--r);padding:18px 20px}' +
  '.sev-d{flex:none;width:64px;text-align:center;border-radius:calc(var(--r)*.7);background:var(--c-primary);color:var(--c-background);padding:8px 0;line-height:1.1}.sev-d span{display:block;font-size:.78em;text-transform:uppercase;letter-spacing:.08em}.sev-d b{font-size:1.6em}' +
  '.sev h3{margin:2px 0 4px;font-size:1.15em}.sev h3 a{color:inherit}.sev p{margin:0 0 4px}.sev-w{color:var(--c-muted);font-weight:500}' +
  '@media (max-width:640px){.sev{padding:48px 18px}.sev li{gap:14px;padding:14px}.sev-d{width:54px}}'

// What Google reads: each upcoming event, at the business's address unless
// the owner named another place.
export function eventData(site: Site, origin: string, now = new Date()): object[] {
  const a = site.business.address
  const address = a ? { '@type': 'PostalAddress', streetAddress: a.street, addressLocality: a.city, addressRegion: a.region, postalCode: a.postalCode, addressCountry: a.country } : undefined
  return upcomingEvents(site, now).map((e) => ({
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: e.title,
    startDate: e.time ? `${e.date}T${e.time}` : e.date,
    ...(e.note ? { description: e.note } : {}),
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    location: e.place ? { '@type': 'Place', name: e.place } : { '@type': 'Place', name: site.business.name, ...(address ? { address } : {}) },
    organizer: { '@type': 'Organization', name: site.business.name, url: origin },
    url: e.href ? (e.href.startsWith('http') ? e.href : origin + e.href) : origin + '/',
  }))
}
