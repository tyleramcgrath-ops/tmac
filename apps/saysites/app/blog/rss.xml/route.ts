import { publishedArticles } from '@/lib/articles'
import { getStore } from '@/lib/store'

export const dynamic = 'force-dynamic'

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

// The blog as an RSS feed, newest first.
export async function GET() {
  const items = (await publishedArticles(getStore())).slice(0, 30)
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel>
<title>SaySites blog</title><link>https://saysites.com/blog</link>
<description>Guides and news on getting found in Google and AI answers.</description><language>en-us</language>
${items.map((a) => `<item><title>${esc(a.title)}</title><link>https://saysites.com/blog/${a.slug}</link><guid>https://saysites.com/blog/${a.slug}</guid><pubDate>${new Date(`${a.published}T12:00:00Z`).toUTCString()}</pubDate><description>${esc(a.description)}</description></item>`).join('\n')}
</channel></rss>`
  return new Response(xml, { headers: { 'content-type': 'application/rss+xml; charset=utf-8', 'cache-control': 'public, max-age=600' } })
}
