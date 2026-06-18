import { NextResponse } from 'next/server'
import {
  buildFaqBlock,
  buildShortAnswerBlock,
  wpApplyChanges,
  wpFindPost,
  wpTestConnection,
  WpError,
  type WpApplyOptions,
  type WpConnection,
} from '@/lib/wordpress'
import { validateUrl } from '@/lib/validate'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 60

function readConnection(body: Record<string, unknown>): WpConnection | { error: string } {
  const raw = (body.connection ?? {}) as Record<string, unknown>
  const site = validateUrl(String(raw.site ?? ''))
  if (!site.ok) return { error: `WordPress address: ${site.error}` }
  const username = String(raw.username ?? '').trim()
  const appPassword = String(raw.appPassword ?? '')
  if (!username) return { error: 'Enter your WordPress username.' }
  if (!appPassword.trim()) return { error: 'Enter your WordPress application password.' }
  return { site: site.value!, username, appPassword }
}

export async function POST(request: Request) {
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const conn = readConnection(body)
  if ('error' in conn) return NextResponse.json({ error: conn.error }, { status: 400 })

  const action = String(body.action ?? '')

  try {
    if (action === 'test') {
      const result = await wpTestConnection(conn)
      return NextResponse.json(result, { status: result.ok ? 200 : 400 })
    }

    if (action === 'apply') {
      const pageUrl = validateUrl(String(body.pageUrl ?? ''))
      if (!pageUrl.ok) return NextResponse.json({ error: pageUrl.error }, { status: 400 })

      const ref = await wpFindPost(conn, pageUrl.value!)
      if (!ref) {
        return NextResponse.json(
          { error: 'Could not find a matching post or page on your WordPress site for that URL. Make sure the URL points at a published post or page (not the homepage).' },
          { status: 404 }
        )
      }

      const changes = (body.changes ?? {}) as Record<string, unknown>
      const opts: WpApplyOptions = {}
      if (typeof changes.title === 'string' && changes.title.trim()) opts.title = changes.title.trim()
      if (typeof changes.metaDescription === 'string' && changes.metaDescription.trim()) {
        opts.metaDescription = changes.metaDescription.trim()
      }
      if (typeof changes.shortAnswer === 'string' && changes.shortAnswer.trim()) {
        opts.shortAnswerHtml = buildShortAnswerBlock(changes.shortAnswer.trim())
      }
      if (Array.isArray(changes.faq) && changes.faq.length > 0) {
        const faq = (changes.faq as Array<{ q?: unknown; a?: unknown }>)
          .filter((f) => typeof f.q === 'string' && typeof f.a === 'string')
          .map((f) => ({ q: String(f.q), a: String(f.a) }))
        if (faq.length > 0) opts.faqHtml = buildFaqBlock(faq)
      }

      if (Object.keys(opts).length === 0) {
        return NextResponse.json({ error: 'No changes were selected to apply.' }, { status: 400 })
      }

      const results = await wpApplyChanges(conn, ref, opts)
      return NextResponse.json({ ok: true, page: { link: ref.link, title: ref.title }, results })
    }

    return NextResponse.json({ error: 'Unknown action.' }, { status: 400 })
  } catch (err) {
    if (err instanceof WpError) {
      return NextResponse.json({ error: err.userMessage }, { status: 502 })
    }
    console.error('[api] wordpress action failed:', err)
    return NextResponse.json({ error: 'WordPress action failed unexpectedly.' }, { status: 500 })
  }
}
