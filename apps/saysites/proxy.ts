// Routes every request by host: customer websites are rewritten to the site
// renderer; saysites.com itself (homepage, login, dashboard) passes through.

import { NextResponse, type NextRequest } from 'next/server'
import { classifyHost } from './lib/hosts'

export function proxy(req: NextRequest) {
  const kind = classifyHost(req.headers.get('host'))
  const { pathname } = req.nextUrl

  // A stray backslash (e.g. "/pricing\\" pasted from a text message) crashes
  // Next's page lookup. Send it to the clean address instead.
  if (/%5c|\\/i.test(pathname)) {
    const url = req.nextUrl.clone()
    url.pathname = pathname.replace(/%5c|\\/gi, '') || '/'
    return NextResponse.redirect(url, 308)
  }

  if (kind.kind === 'customer') {
    const url = req.nextUrl.clone()
    url.pathname = `/s-render/${encodeURIComponent(kind.host)}${pathname === '/' ? '' : pathname}`
    return NextResponse.rewrite(url)
  }
  // The renderer's internal route is never addressable directly.
  if (pathname.startsWith('/s-render')) return new NextResponse('Not found', { status: 404 })
  return NextResponse.next()
}

export const config = {
  // Everything except Next's own assets. Public files (e.g. /media) are
  // shared by all hosts.
  matcher: ['/((?!_next/|media/|u/|favicon.ico).*)'],
}
