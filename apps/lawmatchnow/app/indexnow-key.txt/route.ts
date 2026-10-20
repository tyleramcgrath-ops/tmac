// The IndexNow ownership key (see lib/admin/seo.ts).

export const dynamic = 'force-dynamic'

export function GET() {
  const key = process.env.INDEXNOW_KEY?.trim()
  return key ? new Response(key, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } }) : new Response('Not found', { status: 404 })
}
