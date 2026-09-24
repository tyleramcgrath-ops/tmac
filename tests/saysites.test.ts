import { describe, expect, it } from 'vitest'
import {
  PageSchema,
  SiteSchema,
  checkPage,
  checkSpeed,
  redirectsAfterSlugChange,
  renderPage,
  robotsTxt,
  sitemapXml,
  structuredData,
  type Page,
} from '../apps/saysites/lib'
import { sampleHome, samplePages, sampleServices, sampleSite } from '../apps/saysites/lib/sample'
import { resolveHost } from '../apps/saysites/lib/sites'
import { classifyHost } from '../apps/saysites/lib/hosts'
import { serveSitePath } from '../apps/saysites/lib/serve'
import { MemoryStore } from '../apps/saysites/lib/store'
import { buildStarterSite, subdomainFor } from '../apps/saysites/lib/starter'
import { createSessionToken, hashPassword, readSessionToken, verifyPassword } from '../apps/saysites/lib/auth'

function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v))
}

describe('SaySites schema', () => {
  it('accepts the sample site and pages', () => {
    expect(SiteSchema.parse(sampleSite)).toBeTruthy()
    for (const p of samplePages) expect(PageSchema.parse(p)).toBeTruthy()
  })

  it('rejects an image without alt text', () => {
    const page = clone(sampleHome)
    const hero = page.body[0]
    const img = hero.children.find((c) => c.id === 'hero-img') as { alt: string }
    img.alt = '   '
    expect(PageSchema.safeParse(page).success).toBe(false)
  })

  it('rejects unknown properties, so AI output cannot smuggle in extra fields', () => {
    const page = clone(sampleHome) as unknown as { body: { children: Record<string, unknown>[] }[] }
    page.body[0].children[1].onclick = 'alert(1)'
    expect(PageSchema.safeParse(page).success).toBe(false)
  })

  it('rejects javascript: links', () => {
    const page = clone(sampleServices)
    const btn = page.body[0].children.find((c) => c.id === 'svc-cta') as { href: string }
    btn.href = 'javascript:alert(1)'
    expect(PageSchema.safeParse(page).success).toBe(false)
  })

  it('rejects a color that is neither a token nor hex', () => {
    const page = clone(sampleHome) as unknown as { body: { style: { background: string } }[] }
    page.body[0].style.background = 'red; background-image: url(x)'
    expect(PageSchema.safeParse(page).success).toBe(false)
  })
})

describe('SaySites renderer', () => {
  const home = renderPage(sampleSite, sampleHome, samplePages)

  it('renders a complete document with SEO head tags', () => {
    expect(home.html.startsWith('<!doctype html><html lang="en">')).toBe(true)
    expect(home.html).toContain('<title>Rivertown Plumbing | 24/7 Plumber in Rivertown, OH</title>')
    expect(home.html).toContain('<meta name="description"')
    expect(home.html).toContain('<link rel="canonical" href="https://rivertown-plumbing.saysites.com/">')
    expect(home.html).toContain('<meta property="og:title"')
  })

  it('always has a favicon: the logo, or an inline monogram', () => {
    expect(home.html).toMatch(/<link rel="icon" href="data:image\/svg\+xml,[^"]+">/)
    const withLogo = renderPage({ ...sampleSite, business: { ...sampleSite.business, logo: '/media/logo.png' } }, sampleHome, samplePages)
    expect(withLogo.html).toContain('<link rel="icon" href="/media/logo.png">')
  })

  it('uses semantic elements and a single h1', () => {
    expect(home.html.match(/<h1\b/g)).toHaveLength(1)
    expect(home.html).toContain('<main>')
    expect(home.html).toContain('<nav aria-label="Main">')
    expect(home.html).toContain('<section class="e-hero bx">')
  })

  it('emits only CSS for elements on the page', () => {
    expect(home.css).toContain('.faq summary')
    const services = renderPage(sampleSite, sampleServices, samplePages)
    expect(services.css).not.toContain('.faq')
    expect(services.css).not.toContain('.btn-outline')
    expect(services.css).toContain('.btn-secondary')
  })

  it('applies responsive overrides inside media queries', () => {
    expect(home.css).toMatch(/@media \(max-width:640px\)\{[^@]*\.e-hero-in\{flex-direction:column;gap:24px\}/)
    expect(home.css).toMatch(/@media \(max-width:1024px\)\{[^@]*\.e-why-in\{grid-template-columns:repeat\(2,minmax\(0,1fr\)\)\}/)
  })

  it('resolves color tokens to CSS variables', () => {
    expect(home.css).toContain('--c-primary:#0f5ea8')
    expect(home.css).toMatch(/\.e-hero\{[^}]*background:var\(--c-surface\)/)
  })

  it('lets rows share width but keeps buttons at their natural size', () => {
    expect(home.css).toContain('.e-hero-in>:not(.btn){flex:1 1 0;min-width:0}')
    expect(home.css).not.toMatch(/\.e-hero-actions>\*/)
  })

  it('loads the hero image eagerly and sizes it', () => {
    expect(home.html).toMatch(/<img class="e-hero-img" [^>]*width="1200" height="800" fetchpriority="high"/)
  })

  it('escapes text so content cannot inject markup', () => {
    const page = clone(sampleServices)
    const h = page.body[0].children[0] as { text: string }
    h.text = '<script>alert(1)</script> & "quotes"'
    const out = renderPage(sampleSite, page, samplePages)
    expect(out.html).not.toContain('<script>alert')
    expect(out.html).toContain('&lt;script&gt;alert(1)&lt;/script&gt; &amp; &quot;quotes&quot;')
  })

  it('marks the current nav link', () => {
    const services = renderPage(sampleSite, sampleServices, samplePages)
    expect(services.html).toContain('<a href="/services" aria-current="page">Services</a>')
  })
})

describe('SaySites structured data', () => {
  it('puts LocalBusiness (as the specific type) and FAQPage on the home page', () => {
    const data = structuredData(sampleSite, sampleHome, samplePages) as Record<string, unknown>[]
    const biz = data.find((d) => d['@type'] === 'Plumber')!
    expect(biz.name).toBe('Rivertown Plumbing')
    expect(biz.telephone).toBe('(555) 201-4480')
    expect((biz.address as Record<string, string>).addressLocality).toBe('Rivertown')
    const faq = data.find((d) => d['@type'] === 'FAQPage')!
    expect((faq.mainEntity as unknown[]).length).toBe(2)
  })

  it('adds breadcrumbs below the home page', () => {
    const data = structuredData(sampleSite, sampleServices, samplePages) as Record<string, unknown>[]
    const crumbs = data.find((d) => d['@type'] === 'BreadcrumbList')!
    expect(crumbs.itemListElement).toEqual([
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://rivertown-plumbing.saysites.com/' },
      { '@type': 'ListItem', position: 2, name: 'Services', item: 'https://rivertown-plumbing.saysites.com/services' },
    ])
    expect(data.find((d) => d['@type'] === 'Plumber')).toBeUndefined()
  })

  it('keeps JSON-LD from closing its script tag', () => {
    const page = clone(sampleHome)
    const faq = page.body[2].children[1] as { items: { question: string; answer: string }[] }
    faq.items[0].answer = '</script><script>alert(1)</script>'
    const out = renderPage(sampleSite, page, samplePages)
    expect(out.html).not.toContain('</script><script>alert')
  })
})

describe('SaySites pre-publish SEO checks', () => {
  it('passes the sample pages with no errors', () => {
    for (const p of samplePages) {
      expect(checkPage(p, samplePages).filter((i) => i.severity === 'error')).toEqual([])
    }
  })

  it('flags a missing h1, a second h1, and skipped heading levels', () => {
    const page = clone(sampleServices)
    const h = page.body[0].children[0] as { level: number }
    h.level = 3
    expect(checkPage(page, samplePages).map((i) => i.code)).toContain('missing-h1')

    const two = clone(sampleHome)
    ;(two.body[1].children[0] as Page['body'][number]).children[0] = { id: 'why-1-h', type: 'heading', level: 1, text: 'Again' }
    expect(checkPage(two, samplePages).map((i) => i.code)).toContain('multiple-h1')

    const skip = clone(sampleServices)
    skip.body[0].children.splice(1, 0, { id: 'deep', type: 'heading', level: 4, text: 'Too deep' })
    expect(checkPage(skip, samplePages).map((i) => i.code)).toContain('heading-skip')
  })

  it('flags duplicate ids and broken internal links', () => {
    const page = clone(sampleServices)
    page.body[0].children.push({ id: 'svc-h', type: 'text', text: 'dupe' })
    page.body[0].children.push({ id: 'bad-link', type: 'button', label: 'Pricing', href: '/pricing', variant: 'primary' })
    const codes = checkPage(page, samplePages).map((i) => i.code)
    expect(codes).toContain('duplicate-id')
    expect(codes).toContain('broken-link')
  })
})

describe('SaySites speed gate', () => {
  it('passes the sample pages', () => {
    for (const p of samplePages) {
      const result = checkSpeed(renderPage(sampleSite, p, samplePages))
      expect(result.issues).toEqual([])
      expect(result.pass).toBe(true)
    }
  })

  it('keeps the home page small', () => {
    const result = checkSpeed(renderPage(sampleSite, sampleHome, samplePages))
    expect(result.htmlBytes).toBeLessThan(15_000)
    expect(result.cssBytes).toBeLessThan(5_000)
  })

  it('fails on scripts, external stylesheets and too many eager images', () => {
    const bad = checkSpeed({
      html: '<html><head><link rel="stylesheet" href="x.css"><script src="a.js"></script></head><body><img src="a" width="1" height="1"><img src="b" width="1" height="1"><img src="c"></body></html>',
      css: '@font-face{font-family:x}',
    })
    expect(bad.pass).toBe(false)
    expect(bad.issues.map((i) => i.code).sort()).toEqual(['blocking-stylesheet', 'eager-images', 'font-or-import', 'javascript', 'unsized-images'])
  })
})

describe('SaySites sitemap, robots and redirects', () => {
  it('lists only published, indexable pages', () => {
    const draft: Page = { ...clone(sampleServices), id: 'd', slug: 'draft', status: 'draft' }
    const hidden: Page = { ...clone(sampleServices), id: 'h', slug: 'thanks', seo: { ...sampleServices.seo, noindex: true } }
    const xml = sitemapXml(sampleSite, [...samplePages, draft, hidden])
    expect(xml).toContain('<loc>https://rivertown-plumbing.saysites.com/</loc>')
    expect(xml).toContain('<loc>https://rivertown-plumbing.saysites.com/services</loc>')
    expect(xml).not.toContain('/draft')
    expect(xml).not.toContain('/thanks')
    expect(robotsTxt(sampleSite)).toContain('Sitemap: https://rivertown-plumbing.saysites.com/sitemap.xml')
  })

  it('uses the custom domain once attached', () => {
    expect(robotsTxt({ ...sampleSite, customDomain: 'rivertownplumbing.com' })).toContain('https://rivertownplumbing.com/sitemap.xml')
  })

  it('301s the old slug and never leaves chains or loops', () => {
    let r = redirectsAfterSlugChange([], 'services', 'plumbing-services')
    expect(r).toEqual([{ from: '/services', to: '/plumbing-services', status: 301 }])
    r = redirectsAfterSlugChange(r, 'plumbing-services', 'our-services')
    expect(r).toEqual([
      { from: '/services', to: '/our-services', status: 301 },
      { from: '/plumbing-services', to: '/our-services', status: 301 },
    ])
    // Renaming back to an old slug drops the redirect that would now loop.
    r = redirectsAfterSlugChange(r, 'our-services', 'services')
    expect(r.find((x) => x.from === '/services')).toBeUndefined()
    expect(r.every((x) => x.to === '/services')).toBe(true)
  })
})

describe('SaySites host routing', () => {
  it('sends saysites.com, www, the Vercel test address and localhost to the main app', () => {
    for (const h of ['saysites.com', 'www.saysites.com', 'saysites.vercel.app', 'saysites-git-main-team.vercel.app', 'localhost:3000', null]) {
      expect(classifyHost(h).kind).toBe('main')
    }
  })

  it('sends subdomains, ss- test addresses and other domains to customer sites', () => {
    expect(classifyHost('rivertown-plumbing.saysites.com')).toEqual({ kind: 'customer', subdomain: 'rivertown-plumbing', host: 'rivertown-plumbing.saysites.com' })
    expect(classifyHost('ss-rivertown-plumbing.vercel.app')).toMatchObject({ kind: 'customer', subdomain: 'rivertown-plumbing' })
    expect(classifyHost('rivertown-plumbing.localhost:3000')).toMatchObject({ kind: 'customer', subdomain: 'rivertown-plumbing' })
    expect(classifyHost('WWW.RivertownPlumbing.com')).toEqual({ kind: 'customer', subdomain: null, host: 'rivertownplumbing.com' })
  })

  it('resolves a subdomain to its site; test addresses are previews', async () => {
    const store = new MemoryStore()
    const live = await resolveHost('rivertown-plumbing.saysites.com', store)
    expect(live?.bundle.site.business.name).toBe('Rivertown Plumbing')
    expect(live?.preview).toBe(false)
    expect((await resolveHost('ss-rivertown-plumbing.vercel.app', store))?.preview).toBe(true)
    expect(await resolveHost('nobody-here.saysites.com', store)).toBeNull()
    expect(await resolveHost('saysites.com', store)).toBeNull()
  })

  it('resolves a customer domain', async () => {
    const store = new MemoryStore()
    const u = await store.createUser({ email: 'a@b.co', name: 'A', passwordHash: 'x' })
    const { site, pages } = buildStarterSite({ name: 'Acme Roofing', type: 'roofer', city: 'Denver', region: 'CO', services: ['Roof repair'], palette: 'slate' }, u.id, 'acme-roofing')
    await store.createSite(u.id, { ...site, customDomain: 'acmeroofing.com' }, pages)
    expect((await resolveHost('www.acmeroofing.com', store))?.bundle.site.business.name).toBe('Acme Roofing')
  })
})

describe('SaySites serving', () => {
  const bundle = { site: sampleSite, pages: samplePages, redirects: [{ from: '/old', to: '/services', status: 301 as const }] }

  it('serves pages, sitemap and robots, and 404s the rest', async () => {
    expect(serveSitePath(bundle, [], { preview: false }).status).toBe(200)
    expect(serveSitePath(bundle, ['services'], { preview: false }).status).toBe(200)
    expect(serveSitePath(bundle, ['nope'], { preview: false }).status).toBe(404)
    expect(await serveSitePath(bundle, ['sitemap.xml'], { preview: false }).text()).toContain('<urlset')
    expect(await serveSitePath(bundle, ['robots.txt'], { preview: false }).text()).toContain('Allow: /')
  })

  it('never lets previews be indexed', async () => {
    const res = serveSitePath(bundle, [], { preview: true })
    expect(res.headers.get('x-robots-tag')).toBe('noindex')
    expect(await serveSitePath(bundle, ['robots.txt'], { preview: true }).text()).toContain('Disallow: /')
  })

  it('follows redirects and prefixes links under a base path', async () => {
    const r = serveSitePath(bundle, ['old'], { preview: true, basePath: '/preview/rivertown-plumbing' })
    expect(r.status).toBe(301)
    expect(r.headers.get('location')).toBe('/preview/rivertown-plumbing/services')
    const html = await serveSitePath(bundle, [], { preview: true, basePath: '/preview/rivertown-plumbing' }).text()
    expect(html).toContain('href="/preview/rivertown-plumbing/services"')
    expect(html).toContain('<link rel="canonical" href="https://rivertown-plumbing.saysites.com/">')
  })
})

describe('SaySites accounts', () => {
  it('hashes and verifies passwords', async () => {
    const h = await hashPassword('correct-horse-9')
    expect(h.startsWith('scrypt$')).toBe(true)
    expect(await verifyPassword('correct-horse-9', h)).toBe(true)
    expect(await verifyPassword('wrong', h)).toBe(false)
    expect(await verifyPassword('x', 'garbage')).toBe(false)
  })

  it('signs sessions that cannot be forged or outlive their expiry', () => {
    const t = createSessionToken('user-1', 1_000)
    expect(readSessionToken(t, 2_000)).toBe('user-1')
    expect(readSessionToken(t, 1_000 + 31 * 86_400_000)).toBeNull()
    const [payload] = t.split('.')
    const forged = Buffer.from(JSON.stringify({ uid: 'admin', exp: 9e15 })).toString('base64url') + '.' + t.split('.')[1]
    expect(readSessionToken(forged, 2_000)).toBeNull()
    expect(readSessionToken(payload, 2_000)).toBeNull()
    expect(readSessionToken(undefined)).toBeNull()
  })
})

describe('SaySites starter sites', () => {
  const input = { name: 'Bright Smile Dental', type: 'dentist' as const, city: 'Austin', region: 'TX', phone: '(512) 555-0142', email: 'hi@brightsmile.example', services: ['Cleanings and checkups', 'Teeth whitening', 'Invisalign'], palette: 'forest' as const }

  it('builds a valid three-page site that passes the SEO and speed checks', () => {
    const { site, pages } = buildStarterSite(input, 'owner-1', 'bright-smile-dental')
    expect(SiteSchema.parse(site).business.schemaType).toBe('Dentist')
    expect(pages.map((p) => p.slug)).toEqual(['', 'services', 'contact'])
    for (const p of pages) {
      PageSchema.parse(p)
      expect(checkPage(p, pages).filter((i) => i.severity === 'error')).toEqual([])
      expect(checkSpeed(renderPage(site, p, pages)).pass).toBe(true)
    }
  })

  it('writes local SEO titles and keeps brand names intact', () => {
    const { pages } = buildStarterSite(input, 'owner-1', 'bright-smile-dental')
    expect(pages[0].seo.title).toBe('Bright Smile Dental | Dental care in Austin, TX')
    const html = renderPage(buildStarterSite(input, 'o', 's').site, pages[0], pages).html
    expect(html).toContain('cleanings and checkups, teeth whitening, Invisalign')
  })

  it('works without a phone number or services', () => {
    const { site, pages } = buildStarterSite({ ...input, phone: '', email: '', services: [] }, 'o', 'x')
    expect(site.nav.map((n) => n.label)).toEqual(['Services', 'Contact'])
    for (const p of pages) expect(checkPage(p, pages).filter((i) => i.severity === 'error')).toEqual([])
  })

  it('makes readable subdomains', () => {
    expect(subdomainFor('Bright Smile Dental')).toBe('bright-smile-dental')
    expect(subdomainFor("Joe's Café & Bar!")).toBe('joe-s-cafe-and-bar')
    expect(subdomainFor('!!!')).toBe('my-site')
  })
})

describe('SaySites store (memory)', () => {
  it('keeps each owner’s sites private and records a revision per page', async () => {
    const store = new MemoryStore()
    const a = await store.createUser({ email: 'a@x.co', name: 'A', passwordHash: 'h' })
    const b = await store.createUser({ email: 'b@x.co', name: 'B', passwordHash: 'h' })
    const { site, pages } = buildStarterSite({ name: 'A Co', type: 'plumber', city: 'C', region: 'D', services: [], palette: 'ocean' }, a.id, 'a-co')
    await store.createSite(a.id, site, pages)
    expect((await store.sitesForUser(a.id)).map((s) => s.id)).toEqual([site.id])
    expect(await store.siteForUser(b.id, site.id)).toBeNull()
    expect(await store.subdomainTaken('a-co')).toBe(true)
    expect(await store.subdomainTaken('rivertown-plumbing')).toBe(true)
    expect(store.revisions).toHaveLength(3)
    await expect(store.createSite(b.id, { ...site, id: 'other' }, [])).rejects.toThrow()
  })
})
