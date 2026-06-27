// WordPress connector for the /app tool (read-only).
//
// Connects to a site's REST API with an application password (Basic auth) to
// verify the connection, detect AIOSEO, and list posts/pages so they can be
// audited. Credentials come from the request body (entered in the UI and kept
// in the user's browser) or from server env (WP_SITE_URL / WP_USER /
// WP_APP_PASSWORD). Nothing is persisted server-side.

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 30

function creds(body: Record<string, unknown>) {
  const siteUrl = String(body.siteUrl ?? process.env.WP_SITE_URL ?? '')
    .trim()
    .replace(/\/+$/, '')
  const username = String(body.username ?? process.env.WP_USER ?? '').trim()
  const appPassword = String(body.appPassword ?? process.env.WP_APP_PASSWORD ?? '').trim()
  return { siteUrl, username, appPassword }
}

function authHeaders(username: string, appPassword: string): Record<string, string> {
  const h: Record<string, string> = { Accept: 'application/json' }
  if (username && appPassword) {
    h.Authorization = 'Basic ' + Buffer.from(`${username}:${appPassword}`).toString('base64')
  }
  return h
}

async function wpFetch(url: string, headers: Record<string, string>, timeoutMs = 12_000) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(url, { headers, signal: controller.signal }).finally(() =>
      clearTimeout(timer)
    )
  } finally {
    clearTimeout(timer)
  }
}

export async function POST(request: Request) {
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const action = String(body.action ?? 'test')
  const { siteUrl, username, appPassword } = creds(body)

  if (!/^https?:\/\/[^\s]+\.[^\s]+/.test(siteUrl)) {
    return Response.json(
      { error: 'Enter your WordPress site URL, e.g. https://example.com' },
      { status: 400 }
    )
  }
  const headers = authHeaders(username, appPassword)

  try {
    if (action === 'test') {
      const res = await wpFetch(`${siteUrl}/wp-json`, headers)
      if (!res.ok) {
        return Response.json(
          { error: `WordPress REST API returned ${res.status}. Check the URL and that the REST API is enabled.` },
          { status: 502 }
        )
      }
      const data = await res.json()
      const namespaces: string[] = Array.isArray(data?.namespaces) ? data.namespaces : []
      const authed = !!(username && appPassword)
      // Verify the credentials actually authenticate (edit context needs auth).
      let authValid = false
      if (authed) {
        const probe = await wpFetch(
          `${siteUrl}/wp-json/wp/v2/posts?per_page=1&context=edit`,
          headers
        )
        authValid = probe.ok
      }
      return Response.json({
        ok: true,
        name: data?.name ?? siteUrl,
        description: data?.description ?? '',
        hasAioseo: namespaces.some((n) => n.toLowerCase().includes('aioseo')),
        authProvided: authed,
        authValid,
        namespaces: namespaces.slice(0, 40),
      })
    }

    if (action === 'posts' || action === 'pages') {
      const type = action === 'pages' ? 'pages' : 'posts'
      const res = await wpFetch(
        `${siteUrl}/wp-json/wp/v2/${type}?per_page=15&_fields=id,link,title,modified,status`,
        headers
      )
      if (!res.ok) {
        return Response.json({ error: `Could not list ${type} (${res.status}).` }, { status: 502 })
      }
      const data = await res.json()
      const items = (Array.isArray(data) ? data : []).map((p: Record<string, unknown>) => ({
        id: p.id,
        link: p.link,
        title:
          typeof p.title === 'object' && p.title
            ? String((p.title as Record<string, unknown>).rendered ?? '')
            : String(p.title ?? ''),
        modified: p.modified ?? null,
        status: p.status ?? null,
      }))
      return Response.json({ ok: true, type, items })
    }

    return Response.json({ error: 'Unknown action.' }, { status: 400 })
  } catch {
    return Response.json(
      { error: 'Could not reach the WordPress site. Check the URL and that it is publicly accessible.' },
      { status: 502 }
    )
  }
}
