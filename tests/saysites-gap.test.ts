import { afterEach, describe, expect, it, vi } from 'vitest'
import { fetchPublicHtml, scanGap } from '../apps/saysites/lib/gap-scan'
import { __setTrustedHostsForTests } from '../apps/saysites/lib/rankforge/seo-scan/url-guard'
import { buildStarterSite } from '../apps/saysites/lib/starter'

const KW = 'car accident lawyer columbus'
const comp = (n: number) => `<!doctype html><html><head><title>Car Accident Lawyer Columbus | Firm ${n}</title><meta name="description" content="Car accident lawyer in Columbus."><script type="application/ld+json">{"@context":"https://schema.org","@type":"FAQPage","mainEntity":[]}</script></head><body><main><h1>Car Accident Lawyer Columbus</h1>
${Array.from({ length: 6 }, (_, i) => `<h2>What should I do after a crash ${i}?</h2><h3>Step ${i}</h3><p>${'Ohio drivers who are hurt in a collision can recover medical bills and lost wages. In 2024, 92% of our clients settled within a year. '.repeat(6)}</p><ul><li>Call the police</li><li>See a doctor</li></ul>`).join('')}
<table><tr><td>Fee</td><td>33%</td></tr></table></main></body></html>`

afterEach(() => {
  vi.unstubAllGlobals()
  __setTrustedHostsForTests(null)
})

describe('SaySites Citation Gap', () => {
  it('scores our own page against the pages that rank, with a work order', async () => {
    const { site, pages } = buildStarterSite({ name: 'Gap Law', type: 'lawyer', city: 'Columbus', region: 'OH', services: ['Car accidents'], palette: 'ocean' }, 'u1', 'gap-law')
    const page = pages.find((p) => p.slug === '')!
    const hosts = ['one.test', 'two.test', 'three.test']
    __setTrustedHostsForTests(hosts)
    vi.stubGlobal('fetch', async (u: string) => {
      const i = hosts.indexOf(new URL(u).hostname)
      return new Response(comp(i), { status: 200, headers: { 'content-type': 'text/html' } })
    })
    const serp = async ({ q }: { q: string }) => ({
      organic: [{ position: 1, url: 'https://gap-law.saysites.com/', domain: 'gap-law.saysites.com', title: '' }, ...hosts.map((h, i) => ({ position: i + 2, url: `https://${h}/`, domain: h, title: '' }))],
      paa: [],
      aiOverview: q === KW ? { text: 'x', sources: [{ domain: 'one.test' }] } : null,
      features: [],
    })
    const r = await scanGap({ site, pages, redirects: [] }, 'https://gap-law.saysites.com', page, KW, { key: null, io: { serp } })
    expect(r.error).toBeUndefined()
    expect(r.rank).toBeGreaterThanOrEqual(0)
    expect(r.rank).toBeLessThanOrEqual(100)
    expect(r.answer).toBeGreaterThanOrEqual(0)
    expect(r.competitors!.map((c) => c.domain)).toEqual(hosts)
    expect(r.fixes!.length).toBeGreaterThan(0)
    expect(r.aiOverview).toEqual({ shown: true, citesYou: false, sources: ['one.test'] })
  })

  it('needs a Google key, and never fetches private addresses', async () => {
    const { site, pages } = buildStarterSite({ name: 'Gap Law', type: 'lawyer', city: 'Columbus', region: 'OH', services: ['Car accidents'], palette: 'ocean' }, 'u1', 'gap-law')
    expect((await scanGap({ site, pages, redirects: [] }, 'https://gap-law.saysites.com', pages[0], KW, { key: null })).error).toMatch(/switched on/)
    const f = vi.fn()
    vi.stubGlobal('fetch', f)
    expect(await fetchPublicHtml('http://127.0.0.1/admin')).toHaveProperty('error')
    expect(await fetchPublicHtml('http://localhost:8080/')).toHaveProperty('error')
    expect(f).not.toHaveBeenCalled()
  })
})
