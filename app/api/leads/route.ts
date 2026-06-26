// Lead capture for the RankForge SEO audit widget.
//
// Stores nothing by default (no DB in this app) but always logs the lead and,
// when LEADS_WEBHOOK_URL is configured, forwards it there (e.g. a CRM/Zapier/
// Slack incoming webhook). Returns quickly so the UI can unlock results.

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export async function POST(request: Request) {
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const email = String(body.email ?? '').trim().toLowerCase()
  if (!EMAIL_RE.test(email)) {
    return Response.json({ error: 'Enter a valid email address.' }, { status: 400 })
  }

  const lead = {
    email,
    domain: String(body.domain ?? '').slice(0, 200),
    keyword: String(body.keyword ?? '').slice(0, 120) || null,
    score: typeof body.score === 'number' ? body.score : null,
    source: 'rankforge-scan-widget',
    receivedAt: new Date().toISOString(),
  }

  // Always leave a server-side trail.
  console.log('[lead]', JSON.stringify(lead))

  // Optional forward to a CRM / automation webhook.
  const hook = process.env.LEADS_WEBHOOK_URL
  if (hook) {
    try {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), 6000)
      await fetch(hook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(lead),
        signal: controller.signal,
      }).finally(() => clearTimeout(timer))
    } catch {
      // Never fail the user-facing flow because a webhook is down.
    }
  }

  return Response.json({ ok: true })
}
