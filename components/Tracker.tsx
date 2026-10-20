'use client'

// Counts page views and key actions for the admin dashboard, and remembers
// how a visitor first arrived (in their own browser) so a lead can be
// credited to the page and source that brought it in. No cookies.

import { usePathname } from 'next/navigation'
import { useEffect } from 'react'

type Gtag = (...args: unknown[]) => void
const send = (body: object) => {
  const data = JSON.stringify(body)
  if (!navigator.sendBeacon?.('/api/t', new Blob([data], { type: 'application/json' })))
    fetch('/api/t', { method: 'POST', body: data, headers: { 'Content-Type': 'application/json' }, keepalive: true }).catch(() => {})
}
const store = (k: string, v?: string) => {
  try { return v === undefined ? (k.startsWith('s:') ? sessionStorage.getItem(k) : localStorage.getItem(k)) : (k.startsWith('s:') ? sessionStorage.setItem(k, v) : localStorage.setItem(k, v)) } catch { return null }
}

export function track(event: string, label = '') {
  send({ t: 'e', e: event, l: label, p: location.pathname })
  ;(window as unknown as { gtag?: Gtag }).gtag?.('event', event, { event_label: label })
}

export function Tracker() {
  const path = usePathname()

  useEffect(() => {
    if (!path || path.startsWith('/admin')) return
    const first = !store('s:lmn')
    if (first) {
      store('s:lmn', '1')
      // First touch is kept for 90 days and sent along with any lead.
      const prev = store('lmn_src')
      const fresh = !prev || Date.now() - (JSON.parse(prev).ts ?? 0) > 90 * 86400_000
      const p = new URLSearchParams(location.search)
      if (fresh || p.get('utm_source') || p.get('gclid')) {
        const src: Record<string, string | number> = { ts: Date.now(), landing: path, referrer: document.referrer.slice(0, 200) }
        for (const k of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'gclid', 'fbclid', 'msclkid']) { const v = p.get(k); if (v) src[k] = v.slice(0, 100) }
        store('lmn_src', JSON.stringify(src))
      }
    }
    send({ t: 'v', p: path, s: first, r: first ? document.referrer : '', q: first ? location.search.slice(1, 400) : '' })
  }, [path])

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement).closest?.('a, button') as HTMLAnchorElement | null
      if (!a) return
      const href = a.getAttribute('href') ?? ''
      if (href.startsWith('tel:')) track('phone_click', location.pathname)
      else if (href.startsWith('mailto:')) track('email_click', location.pathname)
      else if (href.startsWith('/get-started')) track('case_review_click', location.pathname)
      else if (/^https?:/.test(href) && !href.includes(location.host)) track('outbound_click', href.slice(0, 200))
    }
    const onFocus = (e: FocusEvent) => {
      const form = (e.target as HTMLElement).closest?.('form')
      if (form && !form.dataset.started && (e.target as HTMLElement).matches('input, textarea, select')) {
        form.dataset.started = '1'
        if (form.closest('.lead, .case-form, [data-lead]') || form.querySelector('[name="email"]')) track('form_start', location.pathname)
      }
    }
    document.addEventListener('click', onClick, true)
    document.addEventListener('focusin', onFocus)
    return () => { document.removeEventListener('click', onClick, true); document.removeEventListener('focusin', onFocus) }
  }, [])

  return null
}

/** The visitor's first-touch source, attached to lead submissions. */
export function leadSource(): Record<string, string> {
  try {
    const s = JSON.parse(localStorage.getItem('lmn_src') || '{}') as Record<string, string | number>
    const out: Record<string, string> = {}
    for (const [k, v] of Object.entries(s)) if (k !== 'ts') out[k] = String(v)
    if (s.ts) out.first = new Date(Number(s.ts)).toISOString()
    return out
  } catch {
    return {}
  }
}
