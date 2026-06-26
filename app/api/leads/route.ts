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

  if (typeof body.source === 'string' && body.source) {
    lead.source = String(body.source).slice(0, 60)
  }

  // Always leave a server-side trail.
  console.log('[lead]', JSON.stringify(lead))

  // Fan out to whichever destinations are configured. None of these can fail
  // the user-facing flow.
  await Promise.allSettled([
    forwardGeneric(lead),
    forwardSlack(lead),
  ])

  return Response.json({ ok: true })
}

type Lead = {
  email: string
  domain: string
  keyword: string | null
  score: number | null
  source: string
  receivedAt: string
}

async function postJson(url: string, payload: unknown) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 6000)
  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    }).finally(() => clearTimeout(timer))
  } catch {
    /* destination down — ignore */
  }
}

// Generic JSON webhook — point this at Zapier / Make / a Google Apps Script Web
// App (→ Google Sheet) / a CRM intake endpoint.
async function forwardGeneric(lead: Lead) {
  const hook = process.env.LEADS_WEBHOOK_URL
  if (hook) await postJson(hook, lead)
}

// Slack incoming webhook — posts a formatted message to a channel.
async function forwardSlack(lead: Lead) {
  const hook = process.env.SLACK_WEBHOOK_URL
  if (!hook) return
  const fields = [
    `*Email:*\n${lead.email}`,
    `*Domain:*\n${lead.domain || '—'}`,
    `*SEO score:*\n${lead.score ?? '—'}`,
    `*Keyword:*\n${lead.keyword || '—'}`,
  ]
  await postJson(hook, {
    text: `New SEO audit lead: ${lead.email} (${lead.domain || 'no domain'})`,
    blocks: [
      {
        type: 'header',
        text: { type: 'plain_text', text: '🔥 New SEO Audit Lead', emoji: true },
      },
      {
        type: 'section',
        fields: fields.map((t) => ({ type: 'mrkdwn', text: t })),
      },
      {
        type: 'context',
        elements: [
          { type: 'mrkdwn', text: `Source: ${lead.source} · ${lead.receivedAt}` },
        ],
      },
    ],
  })
}
