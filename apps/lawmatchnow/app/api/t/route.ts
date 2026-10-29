// Receives the page-view / action beacon from components/Tracker.tsx.

import { NextResponse } from 'next/server'
import { classify, isBot, recordEvent, recordView } from '@/lib/admin/traffic'

const EVENTS = new Set(['case_review_click', 'phone_click', 'email_click', 'form_start', 'search', 'outbound_click', 'profile_contact', 'tool_use'])

export async function POST(req: Request) {
  if (isBot(req.headers.get('user-agent'))) return new NextResponse(null, { status: 204 })
  const b = (await req.json().catch(() => null)) as { t?: string; p?: string; r?: string; q?: string; e?: string; l?: string; s?: boolean } | null
  if (!b?.p || typeof b.p !== 'string' || !b.p.startsWith('/') || b.p.startsWith('/admin')) return new NextResponse(null, { status: 204 })
  try {
    if (b.t === 'e' && b.e && EVENTS.has(b.e)) await recordEvent(b.e, String(b.l ?? '').slice(0, 200))
    else if (b.t === 'v') {
      const host = req.headers.get('host') ?? ''
      await recordView(b.p.split('?')[0], b.s ? { source: classify(String(b.r ?? ''), new URLSearchParams(String(b.q ?? '')), host) } : undefined)
    }
  } catch (err) {
    console.error('[track]', (err as Error).message)
  }
  return new NextResponse(null, { status: 204 })
}
