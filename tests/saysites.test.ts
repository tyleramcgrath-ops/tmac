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
  walk,
  type Page,
} from '../apps/saysites/lib'
import { sampleHome, samplePages, sampleServices, sampleSite } from '../apps/saysites/lib/sample'
import { resolveHost } from '../apps/saysites/lib/sites'
import { classifyHost } from '../apps/saysites/lib/hosts'
import { handleCall, serveSitePath } from '../apps/saysites/lib/serve'
import { MemoryStore } from '../apps/saysites/lib/store'
import { buildStarterSite, subdomainFor } from '../apps/saysites/lib/starter'
import { createSessionToken, hashPassword, readSessionToken, verifyPassword } from '../apps/saysites/lib/auth'
import { GUIDELINES, GUIDELINES_REVIEWED } from '../apps/saysites/lib/guidelines'
import { accessFor, canSell, cleanPromo, newBilling, planForPrice, priceId } from '../apps/saysites/lib/billing'
import { costMicros, monthShare, overCap, siteBudget } from '../apps/saysites/lib/usage'
import { formEncode, verifySignature } from '../apps/saysites/lib/stripe'
import { cacheLatest } from '../apps/saysites/lib/sofie'
import { createHmac } from 'crypto'
import { photoSetFor } from '../apps/saysites/lib/unsplash'
import { creditsInUse } from '../apps/saysites/lib/sites'
import { photoKey, photoUses, repeatedPhotos } from '../apps/saysites/lib/photo-rules'
import { typeFromName } from '../apps/saysites/lib/type-hints'
import { BUSINESS_TYPES, tidyPlace, tidyRegion, tidyServices } from '../apps/saysites/lib/starter'
import { Workspace, runTool } from '../apps/saysites/lib/sofie'

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
    // Well under the 30KB budget; this catches accidental bloat.
    expect(result.cssBytes).toBeLessThan(6_000)
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
    // The sample services page is thin (a heading and a line), so the
    // originality check holds it back from Google until it says more.
    expect(xml).not.toContain('<loc>https://rivertown-plumbing.saysites.com/services</loc>')
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

describe('Sofie', async () => {
  const { Workspace, runTool, askSofie } = await import('../apps/saysites/lib/sofie')
  const built = buildStarterSite({ name: 'Rivertown Plumbing', type: 'plumber', city: 'Rivertown', region: 'OH', phone: '(555) 201-4480', services: ['Leak repair', 'Water heaters'], palette: 'ocean' }, 'o', 'rivertown', { siteId: 'site_t', now: '2026-01-01T00:00:00.000Z' })

  it('edits text, style and site settings through validated tools', async () => {
    const ws = new Workspace(built)
    expect(await runTool(ws, 'update_element', { page: 'home', id: 'hero-title', fields_json: '{"text":"Plumbing done right"}', summary: 'New headline' })).toBe('Done.')
    expect(await runTool(ws, 'update_element', { page: 'home', id: 'hero', fields_json: '{"style":{"padding":{"desktop":{"top":40,"right":24,"bottom":40,"left":24}}}}', summary: 'Tighter hero' })).toBe('Done.')
    expect(await runTool(ws, 'update_site', { changes_json: '{"business":{"hours":["Mo-Fr 08:00-17:00"]},"globals":{"colors":{"primary":"#2f6b4f"}}}', summary: 'Hours and color' })).toBe('Done.')
    const home = ws.pages.find((p) => p.slug === '')!
    expect(JSON.stringify(home)).toContain('Plumbing done right')
    expect(ws.site.business.hours).toEqual(['Mo-Fr 08:00-17:00'])
    expect(ws.site.globals.colors.primary).toBe('#2f6b4f')
    expect(ws.site.globals.colors.secondary).toBe(built.site.globals.colors.secondary)
    expect(ws.changes).toEqual(['New headline', 'Tighter hero', 'Hours and color'])
    expect(ws.problems()).toEqual([])
  })

  it('rejects unsafe or invalid changes and leaves the site untouched', async () => {
    const ws = new Workspace(built)
    expect(await runTool(ws, 'update_element', { page: 'home', id: 'hero-cta', fields_json: '{"href":"javascript:alert(1)"}', summary: 'x' })).toMatch(/^Error:/)
    expect(await runTool(ws, 'update_element', { page: 'home', id: 'hero-title', fields_json: '{"type":"text"}', summary: 'x' })).toMatch(/^Error:/)
    expect(await runTool(ws, 'update_site', { changes_json: '{"subdomain":"someone-else"}', summary: 'x' })).toMatch(/^Error:/)
    expect(await runTool(ws, 'insert_elements', { page: 'home', parent_id: '', index: -1, elements_json: '[{"id":"hero","type":"container","layout":"flex","children":[]}]', summary: 'x' })).toMatch(/unique/)
    expect(await runTool(ws, 'update_element', { page: 'nope', id: 'x', fields_json: '{}', summary: 'x' })).toMatch(/no page/i)
    expect(ws.changes).toEqual([])
    expect(ws.snapshot()).toEqual(built)
  })

  it('adds sections and pages, and the publish gate catches broken structure', async () => {
    const ws = new Workspace(built)
    const section = [{ id: 'hours', type: 'container', tag: 'section', layout: 'flex', boxed: true, children: [{ id: 'hours-h', type: 'heading', level: 2, text: 'Opening hours' }] }]
    expect(await runTool(ws, 'insert_elements', { page: 'home', parent_id: '', index: 2, elements_json: JSON.stringify(section), summary: 'Added hours' })).toBe('Done.')
    expect(ws.pages[0].body[2].id).toBe('hours')
    expect(await runTool(ws, 'add_page', { slug: 'about', name: 'About', title: 'About Rivertown Plumbing', description: 'Who we are.', body_json: JSON.stringify([{ id: 'a', type: 'container', layout: 'flex', children: [{ id: 'a-h', type: 'heading', level: 1, text: 'About us' }] }]), add_to_nav: true, summary: 'Added About page' })).toBe('Done.')
    expect(ws.site.nav.map((n) => n.href)).toContain('/about')
    await runTool(ws, 'insert_elements', { page: 'about', parent_id: 'a', index: -1, elements_json: '[{"id":"a-h2","type":"heading","level":1,"text":"Second title"}]', summary: 'x' })
    expect(ws.problems().join(' ')).toMatch(/about/)
  })

  it('runs a conversation: tools, then a plain reply', async () => {
    const script = [
      { stop_reason: 'tool_use', content: [{ type: 'tool_use', id: 't1', name: 'update_element', input: { page: 'home', id: 'hero-title', fields_json: '{"text":"We fix leaks fast"}', summary: 'Updated the headline' } }] },
      { stop_reason: 'end_turn', content: [{ type: 'text', text: 'Done! Your headline now says “We fix leaks fast”.' }] },
    ]
    const calls: unknown[] = []
    const client = { beta: { messages: { create: async (req: unknown) => (calls.push(req), script.shift()) } } }
    const out = await askSofie({ snapshot: built, history: [], message: 'Change the headline', client: client as never })
    expect(out.reply).toContain('We fix leaks fast')
    expect(out.changes).toEqual(['Updated the headline'])
    expect(JSON.stringify(out.snapshot.pages[0])).toContain('We fix leaks fast')
    expect(calls).toHaveLength(2)
  })
})

describe('SaySites contact forms', async () => {
  const { handleFormPost } = await import('../apps/saysites/lib/serve')
  const { toWeek, fromWeek } = await import('../apps/saysites/lib/hours')

  async function setup() {
    const store = new MemoryStore()
    const user = await store.createUser({ email: 'o@example.com', name: 'O', passwordHash: 'x' })
    const { site, pages } = buildStarterSite({ name: 'Form Co', type: 'plumber', city: 'Rivertown', region: 'OH', services: ['Leaks'], palette: 'ocean' }, `org_${user.id}`, 'form-co')
    await store.createSite(user.id, site, pages)
    return { store, bundle: { site, pages, redirects: [] } }
  }
  const post = (fields: Record<string, string>, referer = 'https://form-co.saysites.com/contact') => {
    const body = new URLSearchParams(fields)
    return new Request('https://form-co.saysites.com/__form', { method: 'POST', body, headers: { referer, 'content-type': 'application/x-www-form-urlencoded' } })
  }

  it('renders a plain HTML form with a hidden honeypot and no script', async () => {
    const { bundle } = await setup()
    const contact = bundle.pages.find((p) => p.slug === 'contact')!
    const html = renderPage(bundle.site, contact, bundle.pages).html
    expect(html).toContain('<form class="sform')
    expect(html).toContain('action="/__form"')
    expect(html).toContain('name="website"')
    expect(checkSpeed(renderPage(bundle.site, contact, bundle.pages)).pass).toBe(true)
  })

  it('stores a message and sends the visitor back to the page', async () => {
    const { store, bundle } = await setup()
    const res = await handleFormPost(bundle, post({ form: 'contact-form', name: 'Jamie', email: 'j@example.com', message: 'Leaky tap' }), { preview: false }, store)
    expect(res.status).toBe(303)
    expect(res.headers.get('location')).toBe('/contact#sent')
    const msgs = await store.messagesForSite(bundle.site.id)
    expect(msgs).toHaveLength(1)
    expect(msgs[0]).toMatchObject({ name: 'Jamie', email: 'j@example.com', body: 'Leaky tap', page: '/contact', read: false })
    expect(await store.unreadCount(bundle.site.id)).toBe(1)
  })

  it('quietly drops bot submissions and rejects unknown forms and bad emails', async () => {
    const { store, bundle } = await setup()
    const bot = await handleFormPost(bundle, post({ form: 'contact-form', name: 'x', email: 'x@x.co', message: 'spam', website: 'http://spam' }), { preview: false }, store)
    expect(bot.status).toBe(303)
    expect(await store.messagesForSite(bundle.site.id)).toHaveLength(0)
    expect((await handleFormPost(bundle, post({ form: 'nope', name: 'a', email: 'a@b.co', message: 'hi' }), { preview: false }, store)).status).toBe(404)
    expect((await handleFormPost(bundle, post({ form: 'contact-form', name: 'a', email: 'not-an-email', message: 'hi' }), { preview: false }, store)).status).toBe(422)
  })

  it('keeps the preview prefix and ignores another site as the referer', async () => {
    const { store, bundle } = await setup()
    const base = '/preview/form-co'
    const ok = await handleFormPost(bundle, post({ form: 'contact-form', name: 'a', email: 'a@b.co', message: 'hi' }, 'https://form-co.saysites.com/preview/form-co/contact'), { preview: true, basePath: base }, store)
    expect(ok.headers.get('location')).toBe('/preview/form-co/contact#sent')
    const other = await handleFormPost(bundle, post({ form: 'contact-form', name: 'a', email: 'a@b.co', message: 'hi' }, 'https://evil.example/x'), { preview: false }, store)
    expect(other.headers.get('location')).toBe('/#sent')
  })

  it('only lets a site read and change its own messages', async () => {
    const { store, bundle } = await setup()
    const m = await store.addMessage({ siteId: bundle.site.id, name: 'a', email: 'a@b.co', phone: '', body: 'hi', page: '/' })
    await store.setMessageRead('some-other-site', m.id, true)
    await store.deleteMessage('some-other-site', m.id)
    expect(await store.messagesForSite(bundle.site.id)).toMatchObject([{ id: m.id, read: false }])
  })

  it('round-trips opening hours between Google format and per-day rows', () => {
    const week = toWeek(['Mo-Fr 08:00-17:00', 'Sa 09:00-13:00'])
    expect(week.We).toEqual({ open: '08:00', close: '17:00' })
    expect(week.Su).toBeNull()
    expect(fromWeek(week)).toEqual(['Mo-Fr 08:00-17:00', 'Sa 09:00-13:00'])
    expect(fromWeek({ ...week, We: null })).toEqual(['Mo-Tu 08:00-17:00', 'Th-Fr 08:00-17:00', 'Sa 09:00-13:00'])
  })
})

describe('SaySites showcase', async () => {
  const { SHOWCASE, SHOWCASE_INFO } = await import('../apps/saysites/lib/showcase')
  it('every example site is valid, passes the SEO checks and the speed gate', () => {
    expect(Object.keys(SHOWCASE).sort()).toEqual(Object.keys(SHOWCASE_INFO).sort())
    for (const [sub, { site, pages }] of Object.entries(SHOWCASE)) {
      expect(SiteSchema.safeParse(site).success, sub).toBe(true)
      for (const p of pages) {
        expect(PageSchema.safeParse(p).success, `${sub}/${p.slug}`).toBe(true)
        expect(checkPage(p, pages).filter((i) => i.severity === 'error'), `${sub}/${p.slug}`).toEqual([])
        expect(checkSpeed(renderPage(site, p, pages)).pass, `${sub}/${p.slug}`).toBe(true)
      }
    }
  })

  it('shows 12-hour opening times in the footer', () => {
    const { site, pages } = SHOWCASE['rivertown-plumbing']
    const html = renderPage(site, pages[0], pages).html
    expect(html).toContain('Mon–Fri 7am–6pm')
  })
})

describe('SaySites store', async () => {
  const { SHOWCASE } = await import('../apps/saysites/lib/showcase')
  const { formatPrice } = await import('../apps/saysites/lib/render')
  const { site, pages } = SHOWCASE['field-and-thread']
  const shop = pages.find((p) => p.slug === 'shop')!

  it('renders product cards with prices, and asks to get in touch without a payment link', () => {
    const html = renderPage(site, shop, pages).html
    expect(html).toContain('Heavy flannel shirt')
    expect(html).toContain('$88')
    expect(html).toContain('Sold out')
    expect(html).toContain('href="/contact">Ask about this')
    expect(checkSpeed(renderPage(site, shop, pages)).pass).toBe(true)
  })

  it('gives Google product data with price and availability', () => {
    const ld = structuredData(site, shop, pages) as { '@type': string; name?: string; offers?: { price: string; availability: string } }[]
    const products = ld.filter((d) => d['@type'] === 'Product')
    expect(products).toHaveLength(site.store!.products.length)
    expect(products.find((p) => p.name === 'Merino scarf')!.offers).toMatchObject({ price: '64.00', availability: 'https://schema.org/OutOfStock' })
  })

  it('only accepts Stripe payment links for checkout', () => {
    const bad = clone(site)
    bad.store!.products[0].buyUrl = 'https://evil.example/pay'
    expect(SiteSchema.safeParse(bad).success).toBe(false)
    bad.store!.products[0].buyUrl = 'https://buy.stripe.com/test_abc123'
    expect(SiteSchema.safeParse(bad).success).toBe(true)
  })

  it('formats prices', () => {
    expect(formatPrice(900, 'USD')).toBe('$9')
    expect(formatPrice(1250, 'GBP')).toBe('£12.50')
    expect(formatPrice(123456, 'USD')).toBe('$1,234.56')
  })
})

describe('SaySites deleting', () => {
  it('deletes a site and its messages, only for its owner, and an account with its sites', async () => {
    const store = new MemoryStore()
    const a = await store.createUser({ email: 'a@example.com', name: 'A', passwordHash: 'x' })
    const b = await store.createUser({ email: 'b@example.com', name: 'B', passwordHash: 'x' })
    const { site, pages } = buildStarterSite({ name: 'Gone Co', type: 'plumber', city: 'X', region: 'OH', services: [], palette: 'ocean' }, 'org', 'gone-co')
    await store.createSite(a.id, site, pages)
    await store.addMessage({ siteId: site.id, name: 'n', email: 'e@x.co', phone: '', body: 'hi', page: '/' })
    await store.deleteSite(b.id, site.id)
    expect(await store.siteForUser(a.id, site.id)).not.toBeNull()
    await store.deleteSite(a.id, site.id)
    expect(await store.siteForUser(a.id, site.id)).toBeNull()
    expect(await store.pagesForSite(site.id)).toEqual([])
    expect(await store.messagesForSite(site.id)).toEqual([])

    const again = buildStarterSite({ name: 'Two', type: 'plumber', city: 'X', region: 'OH', services: [], palette: 'ocean' }, 'org', 'two')
    await store.createSite(a.id, again.site, again.pages)
    await store.deleteUser(a.id)
    expect(await store.userById(a.id)).toBeNull()
    expect(await store.siteBySubdomain('two')).toBeNull()
    expect(await store.userById(b.id)).not.toBeNull()
  })
})

describe('SaySites blog', async () => {
  const { SHOWCASE } = await import('../apps/saysites/lib/showcase')
  const { buildPostPage, postBodyText } = await import('../apps/saysites/lib/posts')
  const { Workspace } = await import('../apps/saysites/lib/sofie')
  const { site, pages } = SHOWCASE['rivertown-plumbing']

  it('lists posts newest first on /blog and links each one', () => {
    const blog = pages.find((p) => p.slug === 'blog')!
    const html = renderPage(site, blog, pages).html
    const a = html.indexOf('5 signs your water heater')
    const b = html.indexOf('What to do in the first ten minutes')
    expect(a).toBeGreaterThan(0)
    expect(b).toBeGreaterThan(a)
    expect(html).toContain('href="/blog/5-signs-your-water-heater-is-about-to-give-out"')
    expect(site.nav.map((n) => n.href)).toContain('/blog')
  })

  it('gives each post one H1, BlogPosting data and passes the gates', () => {
    const post = pages.find((p) => p.slug.startsWith('blog/5-signs'))!
    expect(checkPage(post, pages).filter((i) => i.severity === 'error')).toEqual([])
    expect(checkSpeed(renderPage(site, post, pages)).pass).toBe(true)
    const ld = structuredData(site, post, pages) as { '@type': string; datePublished?: string }[]
    expect(ld.find((d) => d['@type'] === 'BlogPosting')).toMatchObject({ datePublished: '2026-09-10' })
    expect(sitemapXml(site, pages)).toContain('/blog/5-signs-your-water-heater-is-about-to-give-out')
  })

  it('turns "## " lines into subheadings and reads the text back for editing', () => {
    const body = 'First paragraph with enough words to count.\n\n## A subheading\n\nSecond paragraph.'
    const page = buildPostPage(site, { title: 'Hello there', date: '2026-01-02', body })
    expect(postBodyText(page)).toBe(body)
    expect(page.slug).toBe('blog/hello-there')
    expect(page.post!.excerpt).toBe('First paragraph with enough words to count.')
  })

  it('lets Sofie write a post, adding /blog and the menu link the first time', () => {
    const plain = buildStarterSite({ name: 'Blog Co', type: 'plumber', city: 'X', region: 'OH', services: ['Leaks'], palette: 'ocean' }, 'org', 'blog-co')
    const ws = new Workspace(plain)
    ws.writePost({ title: 'Our first post', date: '2026-09-24', body: 'This is our very first post, written to help customers in town.' }, 'Wrote a post')
    const snap = ws.snapshot()
    expect(snap.pages.map((p) => p.slug)).toEqual(expect.arrayContaining(['blog', 'blog/our-first-post']))
    expect(snap.site.nav.map((n) => n.href)).toEqual(['/services', '/blog', '/contact'])
    expect(ws.problems()).toEqual([])
  })
})

describe('SaySites blog subheadings', async () => {
  const { buildPostPage } = await import('../apps/saysites/lib/posts')
  it('keeps a paragraph written right under a subheading as body text', () => {
    const page = buildPostPage(sampleSite, { title: 'T', date: '2026-01-01', body: 'Intro text that is long enough.\n\n## Heading\nBody right under it.' })
    const inner = page.body[0].children[0] as { children: { type: string; text?: string }[] }
    expect(inner.children.filter((c) => c.type === 'heading').map((c) => c.text)).toEqual(['T', 'Heading'])
    expect(inner.children.some((c) => c.type === 'text' && c.text?.includes('Body right under it.'))).toBe(true)
  })
})

describe('SaySites 404', async () => {
  const { SHOWCASE } = await import('../apps/saysites/lib/showcase')
  it('answers unknown paths with a 404 in the site’s own look, never indexed', async () => {
    const { site, pages } = SHOWCASE['salt-and-stone']
    const res = serveSitePath({ site, pages, redirects: [] }, ['nope'], { preview: false })
    expect(res.status).toBe(404)
    expect(res.headers.get('x-robots-tag')).toBe('noindex')
    const html = await res.text()
    expect(html).toContain('Salt &amp; Stone')
    expect(html).toContain('We couldn’t find that page')
    expect(html).toContain('<meta name="robots" content="noindex">')
  })
})

describe('SaySites photos', () => {
  it('stores, lists and deletes a site’s photos, and only that site’s', async () => {
    const store = new MemoryStore()
    const m = await store.addMedia({ siteId: 's1', mime: 'image/webp', width: 800, height: 600, alt: 'Van' }, Buffer.from('abc'))
    expect(m.id).toMatch(/^[a-f0-9]{32}$/)
    expect(await store.mediaForSite('s1')).toMatchObject([{ id: m.id, bytes: 3 }])
    expect((await store.mediaFile(m.id))!.mime).toBe('image/webp')
    await store.deleteMedia('s2', m.id)
    expect(await store.mediaFile(m.id)).not.toBeNull()
    await store.deleteMedia('s1', m.id)
    expect(await store.mediaFile(m.id)).toBeNull()
  })

  it('shows an uploaded logo in the header and keeps the speed gate happy', () => {
    const site = { ...clone(sampleSite), business: { ...sampleSite.business, logo: '/u/0123456789abcdef0123456789abcdef' } }
    const r = renderPage(site, sampleHome, samplePages)
    expect(r.html).toContain('<img class="sh-logo" src="/u/0123456789abcdef0123456789abcdef"')
    expect(checkSpeed(r).pass).toBe(true)
  })
})

describe('SaySites gallery and testimonials', () => {
  function withSection(children: unknown[]) {
    const page = clone(sampleHome)
    page.body.push({ id: 'extra', type: 'container', tag: 'section', layout: 'flex', boxed: true, children } as never)
    return PageSchema.parse(page)
  }
  it('renders a lazy, sized photo grid and quotes with star ratings', () => {
    const page = withSection([
      { id: 'g', type: 'gallery', columns: 2, images: [{ src: '/u/0123456789abcdef0123456789abcdef', alt: 'A new patio', width: 1200, height: 800, caption: 'Patio, 2026' }, { src: 'https://images.unsplash.com/photo-1?w=800', alt: 'A lawn', width: 800, height: 600 }] },
      { id: 't', type: 'testimonials', items: [{ quote: 'They came the same day.', name: 'Pat', detail: 'Rivertown', stars: 5 }] },
    ])
    const r = renderPage(sampleSite, page, samplePages)
    expect(r.html).toContain('<div class="gal gal-2')
    expect(r.html).toContain('alt="A new patio" width="1200" height="800" loading="lazy"')
    expect(r.html).toContain('<figcaption>Patio, 2026</figcaption>')
    expect(r.html).toContain('aria-label="5 out of 5 stars"')
    expect(r.html).toContain('<blockquote>They came the same day.</blockquote>')
    expect(checkSpeed(r).pass).toBe(true)
  })
  it('rejects gallery photos without alt text', () => {
    const page = clone(sampleHome)
    page.body.push({ id: 'x', type: 'container', layout: 'flex', children: [{ id: 'g', type: 'gallery', images: [{ src: '/a.jpg', alt: ' ', width: 10, height: 10 }] }] } as never)
    expect(PageSchema.safeParse(page).success).toBe(false)
  })
})

describe('SaySites search engine verification', () => {
  it('puts the verification tags on the home page only', () => {
    const site = { ...clone(sampleSite), verification: { google: 'abcDEF123_-xyz789', bing: '0123456789ABCDEF' } }
    expect(SiteSchema.safeParse(site).success).toBe(true)
    const home = renderPage(site, sampleHome, samplePages).html
    expect(home).toContain('<meta name="google-site-verification" content="abcDEF123_-xyz789">')
    expect(home).toContain('<meta name="msvalidate.01" content="0123456789ABCDEF">')
    expect(renderPage(site, sampleServices, samplePages).html).not.toContain('google-site-verification')
  })
  it('rejects codes that could break out of the tag', () => {
    const site = { ...clone(sampleSite), verification: { google: 'x"><script>' } }
    expect(SiteSchema.safeParse(site).success).toBe(false)
  })
})

describe('SaySites: visitor counts', async () => {
  const { handleVisit } = await import('../apps/saysites/lib/serve')
  const { summarizeVisits, changeLabel, daysBefore } = await import('../apps/saysites/lib/visits')
  const CHROME = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36'

  async function setup() {
    const store = new MemoryStore()
    const user = await store.createUser({ email: 'v@example.com', name: 'V', passwordHash: 'x' })
    const { site, pages } = buildStarterSite({ name: 'Visit Co', type: 'plumber', city: 'Rivertown', region: 'OH', services: ['Leaks'], palette: 'ocean' }, `org_${user.id}`, 'visit-co')
    await store.createSite(user.id, site, pages)
    return { store, user, bundle: { site, pages, redirects: [] } }
  }
  const hit = (p: string, ua = CHROME) => new Request(`https://visit-co.saysites.com/__v?p=${encodeURIComponent(p)}`, { headers: { 'user-agent': ua } })

  it('puts a counter on live pages only, with no script', async () => {
    const { bundle } = await setup()
    const live = await serveSitePath(bundle, ['contact'], { preview: false }).text()
    expect(live).toContain('url(/__v?p=%2Fcontact)')
    expect(live).not.toMatch(/<script(?! type="application\/ld\+json")/)
    const preview = await serveSitePath(bundle, ['contact'], { preview: true }).text()
    expect(preview).not.toContain('__v')
  })

  it('counts real browsers on real pages and skips bots and junk', async () => {
    const { store, bundle } = await setup()
    const res = await handleVisit(bundle, hit('/contact'), store)
    expect(res.headers.get('content-type')).toBe('image/gif')
    expect(res.headers.get('cache-control')).toBe('no-store')
    await handleVisit(bundle, hit('/contact'), store)
    await handleVisit(bundle, hit('/'), store)
    await handleVisit(bundle, hit('/', 'Mozilla/5.0 (compatible; Googlebot/2.1)'), store)
    await handleVisit(bundle, hit('/wp-admin'), store)
    await handleVisit(bundle, hit('/', ''), store)
    const today = new Date().toISOString().slice(0, 10)
    const rows = await store.visitsSince(bundle.site.id, today)
    expect(rows.sort((a, b) => a.path.localeCompare(b.path))).toEqual([
      { day: today, path: '/', views: 1 },
      { day: today, path: '/contact', views: 2 },
    ])
  })

  it('forgets counts when the site is deleted', async () => {
    const { store, user, bundle } = await setup()
    await handleVisit(bundle, hit('/'), store)
    await store.deleteSite(user.id, bundle.site.id)
    expect(await store.visitsSince(bundle.site.id, '2000-01-01')).toEqual([])
  })

  it('sums up 30 days with empty days filled and a comparison', () => {
    const today = '2026-03-02'
    const s = summarizeVisits(
      [
        { day: '2026-03-02', path: '/', views: 4 },
        { day: '2026-03-01', path: '/about', views: 3 },
        { day: '2026-02-28', path: '/', views: 3 },
        { day: daysBefore(today, 40), path: '/', views: 5 },
        { day: daysBefore(today, 90), path: '/', views: 99 },
      ],
      today
    )
    expect(s.days).toHaveLength(30)
    expect(s.days[29]).toEqual({ day: '2026-03-02', views: 4 })
    expect(s.days[0].day).toBe('2026-02-01')
    expect(s.total).toBe(10)
    expect(s.today).toBe(4)
    expect(s.previous).toBe(5)
    expect(s.pages).toEqual([{ path: '/', views: 7 }, { path: '/about', views: 3 }])
    expect(changeLabel(10, 5)).toBe('Up 100% on the 30 days before')
    expect(changeLabel(4, 5)).toBe('Down 20% on the 30 days before')
    expect(changeLabel(4, 0)).toBe('')
  })
})

describe('SaySites: share images', async () => {
  const { shareImage } = await import('../apps/saysites/lib/render')
  it('uses the owner choice, then the first photo, then a drawn card', () => {
    const { site, pages } = buildStarterSite({ name: 'Share Co', type: 'plumber', city: 'Rivertown', region: 'OH', services: ['Leaks'], palette: 'ocean' }, 'org_x', 'share-co')
    const home = pages.find((p) => p.slug === '')!
    const img = shareImage(site, home)
    expect(img).toMatch(/^https:\/\/images\.unsplash\.com\/.*w=1200.*h=630/)
    const own = { ...home, seo: { ...home.seo, ogImage: '/u/0123456789abcdef0123456789abcdef' } }
    expect(shareImage(site, own)).toBe('https://share-co.saysites.com/u/0123456789abcdef0123456789abcdef')
    const bare = { ...home, slug: 'about', body: [] }
    expect(shareImage(site, bare)).toBe('https://share-co.saysites.com/__og?p=%2Fabout')
    const html = renderPage(site, home, pages).html
    expect(html).toContain('<meta name="twitter:card" content="summary_large_image">')
    expect(html).toContain('<meta property="og:image" content="https://images.unsplash.com/')
  })
})

describe('SaySites: call bar on phones', () => {
  const make = () => buildStarterSite({ name: 'Bar Co', type: 'plumber', city: 'Rivertown', region: 'OH', services: ['Leaks'], palette: 'ocean' }, 'org_x', 'bar-co')
  it('shows Call when there is a phone number, and can be turned off', () => {
    const { site, pages } = make()
    const home = pages.find((p) => p.slug === '')!
    const withPhone = { ...site, business: { ...site.business, phone: '(555) 010-0199' } }
    const html = renderPage(withPhone, home, pages).html
    expect(html).toMatch(/<nav class="scb" aria-label="Quick contact"><a class="scb-call" href="tel:[^"]+">/)
    expect(checkSpeed(renderPage(withPhone, home, pages)).pass).toBe(true)
    expect(renderPage({ ...withPhone, business: { ...withPhone.business, phone: undefined } }, home, pages).html).not.toContain('class="scb"')
    const off = SiteSchema.parse({ ...withPhone, header: { ...withPhone.header, callBar: false } })
    expect(renderPage(off, home, pages).html).not.toContain('class="scb"')
  })
})

describe('SaySites: logos', async () => {
  const { readFileSync } = await import('fs')
  const { sanitizeSvg } = await import('../apps/saysites/lib/svg')
  const { composeLogo } = await import('../apps/saysites/lib/logo-compose')
  const { drawLogoIdeas } = await import('../apps/saysites/lib/logo-ideas')
  const { Workspace, runTool } = await import('../apps/saysites/lib/sofie')
  // Tests use a local font file instead of Google Fonts.
  const dejavu = readFileSync('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf')
  const loader = async () => dejavu.buffer.slice(dejavu.byteOffset, dejavu.byteOffset + dejavu.byteLength) as ArrayBuffer
  const make = () => buildStarterSite({ name: 'Bar Co', type: 'plumber', city: 'Rivertown', region: 'OH', services: ['Leaks'], palette: 'ocean' }, 'org_x', 'bar-co')
  const flat = (over: Record<string, unknown> = {}) => ({
    layout: 'mark-left', name_text: 'Rivertown', name_font: 'Oswald', name_weight: 700, name_case: 'upper', name_tracking: 0.04,
    tagline_text: 'Plumbing', tagline_font: 'Oswald', tagline_weight: 500, tagline_case: 'upper', tagline_tracking: 0.4, rule: true,
    mark_kind: 'monogram', mark_letters: 'R', mark_shape: 'shield', mark_style: 'solid', mark_font: 'Oswald', mark_weight: 700,
    name_color: '#0f2438', tagline_color: '#1a4f86', mark_color: '#1a4f86', mark_ink_color: '#ffffff', ...over,
  })

  it('sanitizer keeps plain shapes and rejects anything that could run code, load files or link away', () => {
    expect(sanitizeSvg('<svg viewBox="0 0 320 80"><circle cx="40" cy="40" r="30" fill="url(#g)"/><text x="84" y="50">A &amp; B</text></svg>').svg).toContain('xmlns="http://www.w3.org/2000/svg"')
    const bad = [
      '<svg viewBox="0 0 10 10"><script>alert(1)</script></svg>',
      '<svg viewBox="0 0 10 10" onload="alert(1)"></svg>',
      '<svg viewBox="0 0 10 10"><style>*{}</style></svg>',
      '<svg viewBox="0 0 10 10"><image href="https://x.co/a.png"/></svg>',
      '<svg viewBox="0 0 10 10"><a href="javascript:alert(1)"><rect/></a></svg>',
      '<svg viewBox="0 0 10 10"><rect fill="url(https://x.co/a)"/></svg>',
      '<svg viewBox="0 0 10 10"><use href="#a"/></svg>',
      '<svg viewBox="0 0 10 10"><foreignObject/></svg>',
      '<!DOCTYPE svg [<!ENTITY x "y">]><svg viewBox="0 0 10 10"></svg>',
      '<svg viewBox="0 0 10 10"><rect style="fill:red"/></svg>',
      '<svg viewBox="0 0 10 10"><rect/></svg><svg viewBox="0 0 1 1"></svg>',
      '<svg><rect/></svg>',
      '<svg viewBox="0 0 10 10"><g><rect/></svg>',
    ]
    for (const b of bad) expect(() => sanitizeSvg(b), b).toThrow()
  })

  it('builds a logo with outlined type, a mark and a square icon, and keeps it within header proportions', async () => {
    const out = await composeLogo({ layout: 'mark-left', name: { text: 'Salt and Stone Studio', font: 'Josefin Sans', weight: 600, case: 'upper', tracking: 0.3 }, mark: { kind: 'monogram', letters: 'S', shape: 'circle', style: 'outline', font: 'Josefin Sans', weight: 600 }, colors: { name: '#2a2622', mark: '#8a6f55', markInk: '#ffffff' } }, loader)
    expect(out.svg).toMatch(/^<svg xmlns="http:\/\/www.w3.org\/2000\/svg" viewBox="[^"]+"><path d="M/)
    expect(out.svg).not.toContain('<text')
    expect(out.svg).not.toContain('NaN')
    expect(out.width / out.height).toBeLessThanOrEqual(6.3)
    expect(out.icon).toContain('viewBox="0 0 64 64"')
    await expect(composeLogo({ layout: 'wordmark', name: { text: 'X', font: 'Comic Sans', weight: 400 }, mark: { kind: 'none' }, colors: { name: '#000000', mark: '#000000', markInk: '#ffffff' } }, loader)).rejects.toThrow(/not one of the logo typefaces/)
  })

  it('draws professional icons in shapes and stacks an over-wide two-weight name', async () => {
    const { specFromInput } = await import('../apps/saysites/lib/logo-compose')
    const out = await composeLogo(specFromInput(flat({ mark_kind: 'icon', mark_icon: 'drop', mark_shape: 'rounded', tagline_text: '', name_accent_text: 'Plumbing and heating', name_accent_weight: 300 })), loader)
    expect(out.width / out.height).toBeLessThanOrEqual(6.3)
    expect(out.icon).toMatch(/<path d="M[^"]+" transform="translate\([^)]+\) scale\([^)]+\)" fill="#ffffff"\/>/)
    await expect(composeLogo(specFromInput(flat({ mark_kind: 'icon', mark_icon: 'nope' })), loader)).rejects.toThrow(/not one of the icons/)
  })

  it('puts the logo and icon on the draft, shows Sofie a render, and reports problems', async () => {
    const { site, pages } = make()
    const ws = new Workspace({ site, pages }, { fontLoader: loader })
    expect(await runTool(ws, 'design_logo', { ...flat(), summary: 'Drew a logo' })).toBe('Done.')
    expect(ws.site.business.logo).toMatch(/^\/u\/[a-f0-9]{32}$/)
    expect(ws.site.business.icon).toMatch(/^\/u\/[a-f0-9]{32}$/)
    expect(ws.media.map((m) => m.mime)).toEqual(['image/svg+xml', 'image/svg+xml'])
    expect(ws.lastLogoPreview && Buffer.from(ws.lastLogoPreview, 'base64').subarray(1, 4).toString()).toBe('PNG')
    const html = renderPage(ws.site, pages.find((p) => p.slug === '')!, pages).html
    expect(html).toContain(`<img class="sh-logo" src="${ws.site.business.logo}"`)
    expect(html).toContain(`<link rel="icon" href="${ws.site.business.icon}">`)
    expect(await runTool(ws, 'design_logo', { ...flat({ mark_kind: 'symbol', symbol_svg: '<svg viewBox="0 0 64 64"><script/></svg>' }), summary: 'x' })).toMatch(/^Error: That logo can't be built/)
  })

  it('logo ideas: designs three, looks at the renders, keeps the refined set', async () => {
    const calls: { messages: { content: unknown }[] }[] = []
    const replies = [
      { ideas: [flat(), flat({ layout: 'wordmark', mark_kind: 'none', name_font: 'Fraunces', name_case: 'as-is' }), flat({ name_font: 'Nope' })] },
      { ideas: [flat({ direction: 'Final A' }), flat({ direction: 'Final B', name_font: 'Manrope' }), flat({ direction: 'Final C', mark_shape: 'circle' })] },
    ]
    const client = { beta: { messages: { create: async (p: never) => { calls.push(p); return { content: [{ type: 'tool_use', id: `t${calls.length}`, name: 'present_logos', input: replies[calls.length - 1] }] } } } } } as never
    const { site } = make()
    const ideas = await drawLogoIdeas(site, 'friendly', client, loader)
    expect(calls).toHaveLength(2)
    // Round two was shown a PNG of round one, plus the idea that failed.
    const shown = JSON.stringify(calls[1].messages.at(-1)!.content)
    expect(shown).toContain('image/png')
    expect(shown).toContain('Idea 3')
    expect(ideas.map((i) => i.name)).toEqual(['Final A', 'Final B', 'Final C'])
    expect(ideas[0].icon.width).toBe(64)
  })

  it('stores ideas per site and forgets them with the site', async () => {
    const store = new MemoryStore()
    const user = await store.createUser({ email: 'l@example.com', name: 'L', passwordHash: 'x' })
    const made = buildStarterSite({ name: 'Idea Co', type: 'plumber', city: 'Rivertown', region: 'OH', services: ['Leaks'], palette: 'ocean' }, `org_${user.id}`, 'idea-co')
    await store.createSite(user.id, made.site, made.pages)
    await store.saveLogoIdeas(made.site.id, { ideas: [{ name: 'A', note: '', logo: '/u/a', icon: '/u/b' }] })
    expect((await store.logoIdeas(made.site.id)).ideas).toHaveLength(1)
    await store.deleteSite(user.id, made.site.id)
    expect((await store.logoIdeas(made.site.id)).ideas).toEqual([])
  })
})

describe('SaySites: milestones', async () => {
  const { milestones } = await import('../apps/saysites/lib/milestones')
  it('marks what a site has earned and points at the next steps', () => {
    const base = '/dashboard/sites/s1'
    const none = milestones({ siteName: 'A', base, hasLogo: false, sofieChanged: false, photos: 0, visits: 0, messages: 0, posts: 0, products: 0, seoClean: false })
    expect(none.filter((m) => m.done).map((m) => m.id)).toEqual(['live'])
    expect(none.find((m) => m.id === 'logo')!.href).toBe(`${base}/photos`)
    const all = milestones({ siteName: 'A', base, hasLogo: true, sofieChanged: true, photos: 2, visits: 5, messages: 1, posts: 1, products: 3, customDomain: 'a.com', seoClean: true })
    expect(all.every((m) => m.done)).toBe(true)
    expect(new Set(all.map((m) => m.id)).size).toBe(10)
  })
})

describe('SaySites: visibility score', async () => {
  const { visibility, questLink } = await import('../apps/saysites/lib/visibility')
  it('scores a fresh site, ranks quests by points, and adds up to 100', () => {
    const { site, pages } = buildStarterSite({ name: 'Vis Co', type: 'plumber', city: 'Rivertown', region: 'OH', services: ['Leaks', 'Heaters', 'Drains'], palette: 'ocean' }, 'org_x', 'vis-co')
    const base = { site, pages, seoErrors: 0, seoTips: 0, fast: true, photos: 0, visits30: 0, visitsPrev30: 0, today: '2026-09-25' }
    const v = visibility(base)
    expect(v.score).toBeGreaterThan(0)
    expect(v.score + v.quests.reduce((n, q) => n + q.points, 0)).toBe(100)
    expect(v.areas.reduce((n, a) => n + a.of, 0)).toBe(100)
    const pts = v.quests.map((q) => q.points)
    expect([...pts].sort((a, b) => b - a)).toEqual(pts)
    expect(v.quests.find((q) => q.id === 'post')!.sofie).toMatch(/Rivertown/)
    expect(questLink(v.quests.find((q) => q.id === 'reviews')!)).toMatch(/\/sofie\?fill=/)
    expect(questLink(v.quests.find((q) => q.id === 'post')!)).toMatch(/\/sofie\?talk=/)
    const better = visibility({ ...base, photos: 5, visits30: 20, visitsPrev30: 5, site: { ...site, business: { ...site.business, phone: '555', logo: '/u/x' }, verification: { google: 'abcdefghijkl' } } })
    expect(better.score).toBeGreaterThan(v.score)
  })
})

describe('SaySites: leagues', async () => {
  const { leagues, leagueFor, momentum, ordinal, pointsToClimb, tradePlural, weekStart, MIN_LEAGUE } = await import('../apps/saysites/lib/league')
  const mk = (n: number, type = 'plumber', schemaType?: string) => {
    const { site } = buildStarterSite({ name: `Biz ${n}`, type, city: 'Rivertown', region: 'OH', services: ['A'], palette: 'ocean' }, 'org_x', `biz-${n}`)
    return { ...site, id: `s${n}`, business: { ...site.business, ...(schemaType ? { schemaType } : {}) } }
  }
  const start = '2026-09-21'

  it('finds the Monday of a week and names trades', () => {
    expect(weekStart('2026-09-25')).toBe('2026-09-21')
    expect(weekStart('2026-09-21')).toBe('2026-09-21')
    expect(weekStart('2026-09-27')).toBe('2026-09-21')
    expect(tradePlural('Plumber')).toBe('plumbers')
    expect(tradePlural('HairSalon')).toBe('hair salons')
    expect(tradePlural('Bakery')).toBe('bakeries')
    expect(ordinal(1) + ordinal(2) + ordinal(3) + ordinal(11) + ordinal(22)).toBe('1st2nd3rd11th22nd')
  })

  it('scores momentum from score gained and traffic growth, not size', () => {
    const s = { site: mk(1), scores: [{ day: '2026-09-18', score: 40 }, { day: '2026-09-24', score: 52 }], visits: [{ day: '2026-09-15', views: 10 }, { day: '2026-09-22', views: 30 }] }
    const m = momentum(s, start, '2026-09-25')
    expect(m.gain).toBe(12)
    expect(m.growth).toBe(Math.round(10 * Math.log2(31 / 11)))
    expect(m.momentum).toBe(24 + m.growth)
    // A site that joins mid-week earns only what it adds afterwards.
    expect(momentum({ site: mk(2), scores: [{ day: '2026-09-23', score: 70 }], visits: [] }, start, '2026-09-25').gain).toBe(0)
  })

  it('groups trades into leagues, falls back to an open league, and keeps names private unless opted in', () => {
    const plumbers = Array.from({ length: MIN_LEAGUE }, (_, i) => ({ site: mk(i), scores: [{ day: '2026-09-14', score: 30 }, { day: '2026-09-24', score: 30 + i * 3 }], visits: [] }))
    const baker = { site: { ...mk(99, 'bakery'), league: { public: true } }, scores: [{ day: '2026-09-22', score: 10 }, { day: '2026-09-23', score: 20 }], visits: [] }
    const all = leagues([...plumbers, baker], start, '2026-09-25')
    const pl = all.find((l) => l.trade === 'Plumber')!
    expect(pl.standings.map((s) => s.siteId)).toEqual(['s4', 's3', 's2', 's1', 's0'])
    expect(pl.standings[0].titles).toContain('gain')
    expect(pl.standings[0].label).toBe('A plumber in Rivertown')
    const open = all.find((l) => l.trade === null)!
    expect(open.standings[0]).toMatchObject({ siteId: 's99', label: 'Biz 99', isPublic: true, gain: 10 })
    const me = leagueFor(all, 's1')!
    expect(me.me.rank).toBe(4)
    // 3 points of score behind 3rd = 6 momentum; 4 more points passes them.
    expect(pointsToClimb(me.league, me.me)).toBe(4)
    expect(pointsToClimb(pl, pl.standings[0])).toBeNull()
  })

  it('stores daily scores for the leagues', async () => {
    const store = new MemoryStore()
    const site = mk(7)
    await store.createUser({ email: 'l@example.com', name: 'L', passwordHash: 'x' })
    await store.createSite('u', site, [])
    await store.recordScore(site.id, '2026-09-22', 40)
    await store.recordScore(site.id, '2026-09-22', 44)
    await store.recordVisit(site.id, '2026-09-22', '/')
    await store.recordVisit(site.id, '2026-09-22', '/about')
    const rows = await store.leagueSites('2026-09-01')
    expect(rows).toHaveLength(1)
    expect(rows[0].scores).toEqual([{ day: '2026-09-22', score: 44 }])
    expect(rows[0].visits).toEqual([{ day: '2026-09-22', views: 2 }])
  })
})

describe('SaySites: showcase logos', async () => {
  const { existsSync } = await import('fs')
  const { join } = await import('path')
  const { SHOWCASE } = await import('../apps/saysites/lib/showcase')
  const { structuredData } = await import('../apps/saysites/lib/seo')
  it('gives every example site a logo file and publishes it to Google as an absolute URL', () => {
    for (const [sub, demo] of Object.entries(SHOWCASE)) {
      expect(demo.site.business.logo).toBe(`/media/logos/${sub}.svg`)
      expect(existsSync(join(__dirname, '../apps/saysites/public/media/logos', `${sub}.svg`))).toBe(true)
      expect(existsSync(join(__dirname, '../apps/saysites/public/media/logos', `${sub}-icon.svg`))).toBe(true)
    }
    const { site, pages } = SHOWCASE['rivertown-plumbing']
    const home = pages.find((p) => p.slug === '')!
    const json = JSON.stringify(structuredData(site, home, pages))
    expect(json).toContain('"logo":"https://rivertown-plumbing.saysites.com/media/logos/rivertown-plumbing.svg"')
  })
})

describe('SaySites: law firm starter', () => {
  it('builds practice areas, a consultation request and the attorney advertising notice', () => {
    const { site, pages } = buildStarterSite({ name: 'Hale & Porter Law', type: 'lawyer', city: 'Columbus', region: 'OH', phone: '(555) 614-2290', services: ['Estate planning', 'Family law', 'Real estate closings'], palette: 'slate' }, 'org_x', 'hale-test')
    expect(pages.map((p) => p.slug)).toEqual(['', 'practice-areas', 'contact'])
    expect(site.nav[0]).toEqual({ label: 'Practice Areas', href: '/practice-areas' })
    expect(site.footerNote).toMatch(/Attorney advertising.*not legal advice.*attorney-client relationship.*Prior results/)
    const home = pages[0]
    const h1 = [...walk(home.body)].find((e) => e.type === 'heading' && e.level === 1)
    expect(h1 && 'text' in h1 && h1.text).toBe('Estate planning and family law attorneys in Columbus.')
    expect(home.seo.title.length).toBeLessThanOrEqual(60)
    expect(home.seo.title).toContain('Attorneys in Columbus, OH')
    expect(renderPage(site, home, pages).html).toContain('Attorney advertising.')
    for (const p of pages) expect(checkPage(p, pages).filter((i) => i.severity === 'error')).toEqual([])
    // Other trades are unchanged.
    const plumber = buildStarterSite({ name: 'P', type: 'plumber', city: 'X', region: 'OH', services: [], palette: 'ocean' }, 'o', 'p')
    expect(plumber.site.footerNote).toBeUndefined()
    expect(plumber.pages.map((p) => p.slug)).toEqual(['', 'services', 'contact'])
  })
})

describe('SaySites: Spanish sites', async () => {
  const { buildBlogIndex } = await import('../apps/saysites/lib/posts')
  it('puts SaySites’ own words on the page in the site’s language', () => {
    const { site, pages } = buildStarterSite({ name: 'Panadería Sol', type: 'bakery', city: 'San José', region: 'SJ', phone: '+506 2222 3333', services: ['Pan'], palette: 'sunset', hours: ['Mo-Fr 07:00-18:00'], language: 'es' }, 'org_x', 'sol')
    expect(site.language).toBe('es')
    const contact = pages.find((p) => p.slug === 'contact')!
    const html = renderPage(site, contact, pages).html
    expect(html).toContain('<html lang="es">')
    expect(html).toContain('Tu nombre')
    expect(html).toContain('Correo electrónico')
    expect(html).toContain('Horario')
    expect(html).toContain('Lun–Vie 7:00–18:00')
    expect(html).toContain('>Llamar<')
    expect(buildBlogIndex(site).seo.title).toBe('Noticias y consejos de Panadería Sol')
    // English sites are unchanged.
    const en = buildStarterSite({ name: 'Sun Bakery', type: 'bakery', city: 'Austin', region: 'TX', services: [], palette: 'sunset', hours: ['Mo-Fr 07:00-18:00'] }, 'o', 'sun')
    const enHtml = renderPage(en.site, en.pages.find((p) => p.slug === 'contact')!, en.pages).html
    expect(enHtml).toContain('Your name')
    expect(enHtml).toContain('Mon–Fri 7am–6pm')
  })
})

describe('SaySites: standings styles', async () => {
  const { LEAGUE_STYLES, leagueTerms } = await import('../apps/saysites/lib/league-style')
  it('words the same standings three ways, defaulting to professional', () => {
    expect(LEAGUE_STYLES).toEqual(['classic', 'market', 'arena'])
    expect(leagueTerms(undefined).titles.gain).toBe('Greatest gain')
    expect(leagueTerms('market').titles.gain).toBe('Top mover')
    expect(leagueTerms('market').move(12)).toBe('▲ 12')
    expect(leagueTerms('arena').position(3)).toBe('#3')
    expect(leagueTerms('arena').streak(4)).toContain('4-week streak')
    expect(leagueTerms('nonsense').name).toBe('Professional')
    expect(SiteSchema.safeParse({ ...buildStarterSite({ name: 'A', type: 'plumber', city: 'X', region: 'OH', services: [], palette: 'ocean' }, 'o', 'a').site, league: { public: true, style: 'arena' } }).success).toBe(true)
  })
})

describe('SaySites: moving an existing website', async () => {
  const { extract, slugForPath, planImport, discover, importSite, safeFetch, ImportError } = await import('../apps/saysites/lib/importer')
  const html = (title: string, h1: string, body: string) => `<html><head><title>${title}</title><meta name="description" content="About ${h1}"></head><body><header><nav><a href="/a">A</a></nav></header><main><h1>${h1}</h1>${body}</main><footer><p>© 2026 All rights reserved. Privacy policy.</p></footer><script>var x = 1</script></body></html>`
  const long = (n: number) => `<p>${'Clear words about this topic for real clients. '.repeat(n)}</p>`

  it('reads the main content, not the menus, scripts or footer', () => {
    const e = extract(html('Car Accident Lawyers | Firm', 'Car Accident Lawyers in Jackson, MS', `<h3>Early h3</h3>${long(4)}<h2>What to do</h2><ul><li>Call the police</li><li>Get medical care</li></ul><h4>Deep</h4><p>short</p>`))
    expect(e.title).toBe('Car Accident Lawyers | Firm')
    expect(e.description).toBe('About Car Accident Lawyers in Jackson, MS')
    expect(e.h1).toBe('Car Accident Lawyers in Jackson, MS')
    expect(e.blocks.map((b) => b.kind)).toEqual(['h3', 'p', 'h2', 'li', 'li', 'h3'])
    expect(JSON.stringify(e)).not.toContain('All rights reserved')
    expect(JSON.stringify(e)).not.toContain('var x')
  })

  it('keeps old addresses where it can and redirects the rest', () => {
    expect(slugForPath('/Personal-Injury/Car_Accidents.html/')).toBe('personal-injury/car-accidents')
    const { site, pages } = buildStarterSite({ name: 'W Law', type: 'lawyer', city: 'Jackson', region: 'MS', services: ['Injury'], palette: 'slate' }, 'o', 'w-law')
    const page = (from: string, h1: string, words = 12): { from: string; url: string; extracted: ReturnType<typeof extract> } => ({ from, url: `https://old.example${from}`, extracted: extract(html(h1, h1, long(words))) })
    const plan = planImport(site, pages, [
      page('/', 'Home'),
      page('/contact-us/', 'Contact us'),
      page('/personal-injury/car-accidents/', 'Car accidents'),
      page('/About_Us.html', 'About us'),
      page('/thin', 'Thin', 1),
    ])
    expect(plan.pages.map((p) => [p.slug, p.status])).toEqual([['personal-injury/car-accidents', 'draft'], ['about-us', 'draft']])
    expect(plan.pages[0].source).toBe('https://old.example/personal-injury/car-accidents/')
    // The old brand in titles becomes the new firm's name.
    const re = planImport(site, pages, [page('/a', 'Wills - Old Firm LLP'), page('/b', 'Trusts - Old Firm LLP'), page('/c', 'Probate - Old Firm LLP')])
    expect(re.pages.map((p) => p.seo.title)).toEqual(['Wills - W Law', 'Trusts - W Law', 'Probate - W Law'])
    expect(plan.redirects).toEqual([
      { from: '/contact-us', to: '/contact', status: 301 },
      { from: '/About_Us.html', to: '/about-us', status: 301 },
    ])
    expect(plan.skipped.map((s) => s.from)).toEqual(['/thin'])
    // Imported pages pass the same checks as every other page.
    for (const p of plan.pages) expect(checkPage(p, [...pages, ...plan.pages]).filter((i) => i.severity === 'error')).toEqual([])
    expect(plan.pages[0].body[0].children.filter((c) => c.type === 'heading' && c.level === 1)).toHaveLength(1)
    // Headings right after the H1 never reuse its id.
    const withH2 = planImport(site, pages, [{ from: '/x', url: 'https://old.example/x', extracted: extract(html('X', 'X page', `<h2>First</h2>${long(10)}`)) }])
    expect(checkPage(withH2.pages[0], [...pages, ...withH2.pages]).filter((i) => i.severity === 'error')).toEqual([])
  })

  it('finds pages from the sitemap and reads them', async () => {
    const site = buildStarterSite({ name: 'W', type: 'lawyer', city: 'J', region: 'MS', services: [], palette: 'slate' }, 'o', 'w').site
    const files: Record<string, { type: string; body: string }> = {
      'https://old.example/sitemap.xml': { type: 'application/xml', body: '<sitemapindex><sitemap><loc>https://old.example/page-sitemap.xml</loc></sitemap><sitemap><loc>https://old.example/tag-sitemap.xml</loc></sitemap></sitemapindex>' },
      'https://old.example/page-sitemap.xml': { type: 'application/xml', body: '<urlset><url><loc>https://old.example/</loc></url><url><loc>https://www.old.example/wills/</loc></url><url><loc>https://other.example/x/</loc></url><url><loc>https://old.example/wp-content/a.pdf</loc></url></urlset>' },
      'https://old.example/': { type: 'text/html', body: html('Home', 'Home', long(10)) },
      'https://www.old.example/wills/': { type: 'text/html; charset=utf-8', body: html('Wills', 'Wills and trusts', long(12)) },
    }
    const get = async (u: string) => (files[u] ? { url: u, status: 200, ...files[u] } : { url: u, status: 404, type: 'text/html', body: '' })
    const urls = await discover(new URL('https://old.example/'), get)
    expect(urls.map((u) => u.href)).toEqual(['https://old.example/', 'https://www.old.example/wills/'])
    const res = await importSite(site, [], 'old.example', get)
    expect(res.pages.map((p) => p.slug)).toEqual(['wills'])
    await expect(importSite(site, [], 'nothing.example', async () => null)).rejects.toBeInstanceOf(ImportError)
  })

  it('refuses private and local addresses', async () => {
    await expect(safeFetch('http://127.0.0.1/admin')).rejects.toBeInstanceOf(ImportError)
    await expect(safeFetch('http://localhost:3000/')).rejects.toBeInstanceOf(ImportError)
    await expect(safeFetch('http://169.254.169.254/latest/meta-data')).rejects.toBeInstanceOf(ImportError)
    await expect(safeFetch('file:///etc/passwd')).rejects.toBeInstanceOf(ImportError)
  })

  it('stores redirects and serves them', async () => {
    const store = new MemoryStore()
    await store.saveRedirects('s1', [{ from: '/old', to: '/new', status: 301 }])
    expect(await store.redirectsForSite('s1')).toEqual([{ from: '/old', to: '/new', status: 301 }])
  })
})

describe('SaySites: import skips archives and listings', async () => {
  const { discover } = await import('../apps/saysites/lib/importer')
  it('keeps real pages and posts only', async () => {
    const urls = ['/', '/category/injury/', '/tag/x', '/blog/', '/blog/my-post/', '/cities-pages-sitemap/', '/thank-you/', '/wp-content/uploads/a.jpg', '/page/2/', '/wills/']
    const body = `<urlset>${urls.map((u) => `<url><loc>https://old.example${u}</loc></url>`).join('')}</urlset>`
    const got = await discover(new URL('https://old.example/'), async (u) => (u.endsWith('/sitemap.xml') ? { url: u, status: 200, type: 'application/xml', body } : null))
    expect(got.map((u) => u.pathname)).toEqual(['/', '/blog/my-post/', '/wills/'])
  })
})

describe('SaySites: free redesign preview', async () => {
  const { detectBusiness, guessType, nearestPalette } = await import('../apps/saysites/lib/detect')
  const { buildPreview, claimFromPreview } = await import('../apps/saysites/lib/redesign')
  const ld = JSON.stringify({ '@context': 'https://schema.org', '@graph': [{ '@type': 'WebSite', name: 'x' }, { '@type': 'LegalService', name: 'Smith & Lee Law', telephone: '(555) 010-2000', address: { '@type': 'PostalAddress', streetAddress: '1 Main St', addressLocality: 'Dayton', addressRegion: 'OH', postalCode: '45402' } }] })
  const home = `<html><head><title>Injury Lawyers in Dayton | Smith & Lee Law</title><meta name="theme-color" content="#1b4d7a"><script type="application/ld+json">${ld}</script></head><body><header><nav><a href="/car-accidents/">Car accidents</a><a href="/contact-us/">Contact</a></nav></header><main><h1>Injury Lawyers in Dayton, OH</h1><p>${'We help injured people in Dayton get the answers they need. '.repeat(6)}</p></main><script src="/a.js"></script><script src="/b.js"></script></body></html>`
  const car = `<html><head><title>CAR ACCIDENT LAWYERS | Smith & Lee Law</title></head><body><main><h1>CAR ACCIDENT LAWYERS</h1><h2>After a crash</h2><p>${'What to do after a car accident in Ohio, step by step, in plain English. '.repeat(8)}</p></main></body></html>`
  const files: Record<string, string> = { 'https://smithlee.example/': home, 'https://smithlee.example/car-accidents/': car }
  const get = async (u: string) => (files[u] ? { url: u, status: 200, type: 'text/html', body: files[u] } : null)

  it('reads who the business is from its own site', () => {
    const d = detectBusiness(home, 'https://smithlee.example/')
    expect(d).toMatchObject({ name: 'Smith & Lee Law', type: 'lawyer', phone: '(555) 010-2000', street: '1 Main St', city: 'Dayton', region: 'OH', postalCode: '45402', color: '#1b4d7a', palette: 'ocean' })
    expect(guessType('Rivertown Plumbing | Drain cleaning')).toBe('plumber')
    expect(guessType('Joe’s Place')).toBe('other')
    expect(nearestPalette('#2f6b40')).toBe('forest')
    expect(nearestPalette('#777777')).toBe('slate')
  })

  it('rebuilds the site without AI, keeps addresses, and reports before and after', async () => {
    const p = await buildPreview('smithlee.example', get, '0123456789abcdef')
    expect(p.site.business.name).toBe('Smith & Lee Law')
    const h1 = [...walk(p.pages.find((x) => x.slug === '')!.body)].find((e) => e.type === 'heading' && e.level === 1)
    expect(h1 && 'text' in h1 && h1.text).toBe('Injury Lawyers in Dayton, OH')
    const imported = p.pages.find((x) => x.slug === 'car-accidents')!
    expect(imported.status).toBe('published')
    // /contact-us didn't load, so nothing points at it.
    expect(p.redirects).toEqual([])
    expect(p.before.scripts).toBe(2)
    expect(p.after.scripts).toBe(0)
    expect(p.after.speedPass).toBe(true)
    expect(p.after.seoErrors).toBe(0)
    // Claiming makes it the owner's, with imported pages as drafts.
    const c = claimFromPreview(p, 'user_1', 'smith-lee-law')
    expect(c.site.orgId).toBe('user_1')
    expect(c.pages.find((x) => x.slug === 'car-accidents')!.status).toBe('draft')
    expect(new Set(c.pages.map((x) => x.id)).size).toBe(c.pages.length)
    const store = new MemoryStore()
    await store.savePreview(p, 'who')
    expect(await store.previewCount(new Date(Date.now() - 1000), 'who')).toBe(1)
    expect(await store.claimPreview(p.id, 'user_1', c.site.id)).toBe(true)
    expect(await store.claimPreview(p.id, 'user_2', 'other')).toBe(false)
  })
})

describe('SaySites: reviews', async () => {
  const { reviewMessages, checkReviewUrl, googleReviewUrl, reviewLink } = await import('../apps/saysites/lib/reviews')
  const { visibility } = await import('../apps/saysites/lib/visibility')
  it('gives every site a /review address, a footer link and honest request messages', () => {
    const { site, pages } = buildStarterSite({ name: 'Rivertown Plumbing', type: 'plumber', city: 'Rivertown', region: 'OH', services: [], palette: 'ocean' }, 'o', 'rivertown-p')
    const withLink = { ...site, business: { ...site.business, reviewUrl: googleReviewUrl('ChIJabc123') } }
    expect(withLink.business.reviewUrl).toBe('https://search.google.com/local/writereview?placeid=ChIJabc123')
    expect(SiteSchema.safeParse(withLink).success).toBe(true)
    const res = serveSitePath({ site: withLink, pages, redirects: [] }, ['review'], {})
    expect(res.status).toBe(302)
    expect(res.headers.get('location')).toBe(withLink.business.reviewUrl)
    expect(serveSitePath({ site, pages, redirects: [] }, ['review'], {}).status).toBe(404)
    expect(renderPage(withLink, pages[0], pages).html).toContain('<a href="/review" rel="nofollow">Leave us a review</a>')
    const msgs = reviewMessages(withLink)
    expect(msgs.map((m) => m.id)).toEqual(['text', 'email', 'person'])
    expect(msgs[0].body).toContain(reviewLink(withLink))
    // Nothing offered in return, nothing that filters for happy customers.
    for (const m of msgs) expect(m.body).not.toMatch(/discount|free|gift|5 stars|five stars|if you were happy/i)
    expect(reviewMessages({ ...withLink, language: 'es' })[0].body).toMatch(/^Hola/)
    expect(checkReviewUrl('g.page/r/abc/review')).toEqual({ url: 'https://g.page/r/abc/review' })
    expect(checkReviewUrl('http://x.com').error).toBeTruthy()
    // The review link is an opportunity, and the score still adds up to 100.
    const v = visibility({ site, pages, seoErrors: 0, seoTips: 0, fast: true, photos: 0, visits30: 0, visitsPrev30: 0, today: '2026-09-25' })
    expect(v.quests.find((q) => q.id === 'review-link')?.href).toMatch(/\/reviews$/)
    expect(v.score + v.quests.reduce((n, q) => n + q.points, 0)).toBe(100)
  })
})

describe('SaySites: originality check', async () => {
  const { vibeCheck, vibeForSite, isTemplate, stuffing, similarity } = await import('../apps/saysites/lib/vibe')
  const own = (id: string, slug: string, text: string): Page => ({ id, siteId: 's', slug, name: slug || 'Home', status: 'published', seo: { title: `${slug} page title for the site`, description: 'A description long enough to be a proper description for Google.' }, body: [{ id: `${id}-s`, type: 'container', tag: 'section', layout: 'flex', children: [{ id: `${id}-h`, type: 'heading', level: 1, text: slug || 'Home' }, { id: `${id}-t`, type: 'text', text }] }], updatedAt: '2026-09-25T00:00:00.000Z' })

  it('holds starter wording out of Google until it is made original', () => {
    const { site, pages } = buildStarterSite({ name: 'Keel & Sons', type: 'plumber', city: 'Dayton', region: 'OH', services: ['Leak repair', 'Water heaters', 'Drains'], palette: 'ocean' }, 'o', 'keel')
    const v = vibeForSite(site, pages)
    const home = v.get(pages[0].id)!
    expect(home.originality).toBeLessThan(20)
    expect(home.indexable).toBe(false)
    expect(renderPage(site, pages[0], pages).html).toContain('<meta name="robots" content="noindex">')
    expect(sitemapXml(site, pages)).not.toContain('<loc>https://keel.saysites.com/</loc>')
    // The contact page is a utility page and isn't held back.
    expect(v.get(pages.find((p) => p.slug === 'contact')!.id)!.indexable).toBe(true)
    expect(isTemplate(`Tell us what you need and we'll take it from there.`)).toBe(true)
    expect(isTemplate('Dave and his two sons still answer the phone themselves.')).toBe(false)
    // The owner's own words pass.
    const written = own('h2', '', 'Keel & Sons has fixed leaks in Dayton since 1994. Dave and his two sons still answer the phone themselves. Most jobs start with a free look at the problem and a written price before any work begins. We carry parts for older homes in the Oregon District, where cast iron drains are common, so repairs rarely need a second visit. Emergency calls after 6pm are answered by whichever of us is on call that week.')
    const ok = vibeCheck(site, written, [written])
    expect(ok.originality).toBe(100)
    expect(ok.indexable).toBe(true)
    expect(renderPage(site, written, [written]).html).not.toContain('noindex')
  })

  it('blocks keyword stuffing and near-copy pages, and flags stock phrases', () => {
    const site = { ...buildStarterSite({ name: 'X', type: 'plumber', city: 'Dayton', region: 'OH', services: [], palette: 'ocean' }, 'o', 'x').site }
    const stuffed = 'Our Dayton plumber team is the Dayton plumber you need. Call a Dayton plumber today. ' .repeat(4) + 'We fix leaks and install heaters for homes and shops across the area every single week of the year.'
    expect(stuffing(stuffed, ['Dayton'])).toBe('dayton plumber')
    expect(vibeCheck(site, own('a', 'a', stuffed), []).blockers[0]).toMatch(/keyword stuffing/)
    // A guide that naturally repeats its topic is fine.
    expect(stuffing('The tank holds water. '.repeat(12) + 'Check the tank each year.', ['Dayton'])).toBeNull()
    const town = (t: string) => `Our ${t} plumbers fix leaks, clear drains and replace water heaters for homes and businesses. We answer the phone ourselves, give a written price first and clean up after every job. Most repairs are finished the same day, and we carry parts for older homes so a second visit is rare. Call us any time for help.`
    const a = own('a', 'dayton', town('Dayton'))
    const b = own('b', 'kettering', town('Kettering'))
    expect(similarity(town('Dayton'), town('Kettering'))).toBeGreaterThan(0.7)
    expect(vibeCheck(site, b, [a, b]).blockers[0]).toMatch(/nearly the same as \/dayton/)
    const fluffy = own('f', 'f', 'Look no further for top-notch service. We pride ourselves on being second to none. Our state-of-the-art tools are tailored to your needs. Don’t hesitate to contact our friendly team for anything at all around the house.')
    const fv = vibeCheck(site, fluffy, [fluffy])
    expect(fv.filler.length).toBeGreaterThanOrEqual(3)
    expect(fv.indexable).toBe(false)
  })
})

describe('Google guidelines list', () => {
  it('has a reviewed date and a Google source for every entry', () => {
    expect(GUIDELINES_REVIEWED).toMatch(/^[A-Z][a-z]+ \d{4}$/)
    const ids = new Set<string>()
    for (const g of GUIDELINES) {
      expect(ids.has(g.id)).toBe(false)
      ids.add(g.id)
      expect(g.source.url).toMatch(/^https:\/\/(developers\.google\.com|support\.google\.com|blog\.google)\//)
      expect(g.how.length).toBeGreaterThan(30)
    }
    expect(GUIDELINES.length).toBeGreaterThanOrEqual(8)
  })
})

describe('new site details', () => {
  it('tidies places and drops services that say nothing', () => {
    expect(tidyPlace('jupiter')).toBe('Jupiter')
    expect(tidyPlace('port st. lucie')).toBe('Port St. Lucie')
    expect(tidyPlace('McKinney')).toBe('McKinney')
    expect(tidyRegion('fl')).toBe('FL')
    expect(tidyServices(['everything', ' ', 'drain cleaning', 'All'])).toEqual(['Drain cleaning'])
  })

  it('reads the kind of business from its name', () => {
    expect(typeFromName("McGrath Law Firm")).toBe('lawyer')
    expect(typeFromName('Rivera Roofing')).toBe('roofer')
    expect(typeFromName('Blue Door')).toBeNull()
  })

  it('lets Sofie rebuild a site made for the wrong kind of business', async () => {
    const { site, pages } = buildStarterSite({ name: "T's Law Firm", type: 'electrician', city: 'jupiter', region: 'fl', services: ['everything'], palette: 'forest', phone: '(561) 555-0142' }, 'org_x', 'ts-law-firm')
    expect(site.business.area).toBe('Jupiter, FL')
    expect(JSON.stringify(pages)).not.toMatch(/everything/)
    const ws = new Workspace({ site, pages })
    const out = await runTool(ws, 'rebuild_site', { type: 'lawyer', services: ['Estate planning', 'Family law'], city: '', region: '', headline: '', summary: 'Rebuilt as a law firm' })
    expect(out).toBe('Done.')
    expect(ws.site.business.schemaType).toBe('LegalService')
    expect(ws.site.business.name).toBe("T's Law Firm")
    expect(ws.site.business.phone).toBe('(561) 555-0142')
    expect(ws.site.globals.colors).toEqual(site.globals.colors)
    expect(ws.site.footerNote).toMatch(/Attorney advertising/)
    const live = ws.pages.filter((p) => p.status === 'published')
    expect(live.map((p) => p.slug).sort()).toContain('practice-areas')
    expect(live.some((p) => p.slug === 'services')).toBe(false)
    // Same address keeps its page id, so publishing replaces it.
    expect(ws.pages.find((p) => p.slug === '')!.id).toBe(pages.find((p) => p.slug === '')!.id)
    expect(JSON.stringify(live)).not.toMatch(/[Ee]lectric/)
    expect(await runTool(ws, 'rebuild_site', { type: 'wizard', services: [], city: '', region: '', headline: '', summary: 'x' })).toMatch(/^Error: Unknown business type/)
  })
})

describe('photo rules', () => {
  it('never repeats a photo within a starter site', () => {
    for (const type of Object.keys(BUSINESS_TYPES)) {
      const { pages } = buildStarterSite({ name: 'X', type: type as never, city: 'A', region: 'B', services: ['One', 'Two', 'Three'], palette: 'ocean' }, 'o', 's')
      expect(repeatedPhotos(pages)).toEqual([])
      expect(photoUses(pages).length).toBeGreaterThan(0)
    }
  })

  it('leaves out stock photos another customer uses, and keeps pages valid', () => {
    const first = buildStarterSite({ name: 'A Law', type: 'lawyer', city: 'A', region: 'B', services: ['Wills'], palette: 'ocean' }, 'o', 'a')
    const taken = new Set(photoUses(first.pages).map((u) => u.key))
    const second = buildStarterSite({ name: 'B Law', type: 'lawyer', city: 'A', region: 'B', services: ['Wills'], palette: 'ocean' }, 'o', 'b', { taken })
    expect(photoUses(second.pages).filter((u) => taken.has(u.key))).toEqual([])
    for (const p of second.pages) expect(PageSchema.safeParse(p).success).toBe(true)
  })

  it('gives each stock photo to one site in the store', async () => {
    const store = new MemoryStore()
    await store.setSitePhotos('s1', ['photo-1', 'photo-2'])
    await store.setSitePhotos('s2', ['photo-2', 'photo-3'])
    expect([...(await store.photosTaken('s2'))].sort()).toEqual(['photo-1', 'photo-2'])
    await store.setSitePhotos('s1', ['photo-1'])
    expect([...(await store.photosTaken('s1'))]).toEqual(['photo-3'])
  })

  it('flags a stock photo from another site in Sofie\'s check', () => {
    const { site, pages } = buildStarterSite({ name: 'X', type: 'plumber', city: 'A', region: 'B', services: [], palette: 'ocean' }, 'o', 's')
    const key = photoUses(pages)[0].key
    const ws = new Workspace({ site, pages }, { taken: new Set([key]) })
    expect(ws.problems().some((p) => p.includes(key))).toBe(true)
  })
})

describe('Unsplash photos', () => {
  const api = (id: string, n: number) => ({ id, width: 3000, height: 2000, alt_description: `photo ${n}`, description: null, urls: { raw: `https://images.unsplash.com/photo-${id}?ixid=abc` }, links: { download_location: `https://api.unsplash.com/photos/${id}/download?ixid=abc` }, user: { name: `Person ${n}`, links: { html: `https://unsplash.com/@p${n}` } } })

  it('builds a set of unique photos with credits, skipping taken ones, from the cache', async () => {
    const store = new MemoryStore()
    const prev = process.env.UNSPLASH_ACCESS_KEY
    process.env.UNSPLASH_ACCESS_KEY = 'test'
    try {
      const queries = ['lawyer meeting client', 'law office', 'attorney desk documents', 'signing legal documents', 'courthouse']
      queries.forEach((q, qi) => store.cacheSet(`unsplash:${q}:1`, Array.from({ length: 6 }, (_, i) => api(`${qi}${i}000-abc`, qi * 10 + i))))
      const taken = new Set(['photo-00000-abc'])
      const set = await photoSetFor(store, 'lawyer', taken)
      expect(set).not.toBeNull()
      const keys = [set!.hero, ...set!.cards, ...(set!.extra ?? [])].map((p) => photoKey(p.src))
      expect(new Set(keys).size).toBe(keys.length)
      expect(keys).not.toContain('photo-00000-abc')
      const { site, pages } = buildStarterSite({ name: 'A Law', type: 'lawyer', city: 'A', region: 'B', services: ['Wills', 'Trusts', 'Probate'], palette: 'ocean', photos: set! }, 'o', 'a')
      expect(repeatedPhotos(pages)).toEqual([])
      const credits = creditsInUse(pages, set!.credits)
      expect(credits.length).toBe(photoUses(pages).length)
      const html = renderPage({ ...site, credits }, pages[0], pages).html
      expect(html).toContain('Photos by')
      expect(html).toContain('utm_source=saysites')
    } finally {
      process.env.UNSPLASH_ACCESS_KEY = prev
    }
  })

  it('falls back to built-in photos without a key', async () => {
    const prev = process.env.UNSPLASH_ACCESS_KEY
    delete process.env.UNSPLASH_ACCESS_KEY
    try {
      expect(await photoSetFor(new MemoryStore(), 'lawyer', new Set())).toBeNull()
    } finally {
      if (prev) process.env.UNSPLASH_ACCESS_KEY = prev
    }
  })
})

describe('trial, caps and feedback', () => {
  const user = { id: 'u1', email: 'a@b.com', name: 'A', passwordHash: 'x', createdAt: '2026-09-01T00:00:00.000Z' }

  it('never locks anyone out until Stripe is connected', () => {
    const prev = { k: process.env.STRIPE_SECRET_KEY, p: process.env.STRIPE_PRICE_ID }
    delete process.env.STRIPE_SECRET_KEY
    delete process.env.STRIPE_PRICE_ID
    const old = accessFor(user, null, Date.parse('2026-10-01'))
    expect(old.locked).toBe(false)
    process.env.STRIPE_SECRET_KEY = 'sk'
    process.env.STRIPE_PRICE_ID = 'price'
    expect(accessFor(user, null, Date.parse('2026-10-01')).locked).toBe(true)
    expect(accessFor(user, newBilling(Date.parse('2026-09-30')), Date.parse('2026-10-01')).daysLeft).toBe(6)
    expect(accessFor(user, { ...newBilling(0), status: 'active' }, Date.parse('2026-10-01')).ok).toBe(true)
    process.env.STRIPE_SECRET_KEY = prev.k
    process.env.STRIPE_PRICE_ID = prev.p
    if (!prev.k) delete process.env.STRIPE_SECRET_KEY
    if (!prev.p) delete process.env.STRIPE_PRICE_ID
    expect(cleanPromo(' family ')).toBe('FAMILY')
    expect(cleanPromo('no spaces!')).toBeUndefined()
  })

  it('prices tokens and stops at the caps', () => {
    expect(costMicros({ input_tokens: 1_000_000, output_tokens: 0 })).toBe(5_000_000)
    expect(costMicros({ output_tokens: 1000, cache_read_input_tokens: 10_000 })).toBe(25_000 + 5_000)
    const none = { siteTotal: 0, siteToday: 0, siteTrial: 0, siteMonth: 0, allToday: 0 }
    const trial = { status: 'trial' as const }
    expect(overCap(none, trial)).toBeNull()
    expect(overCap({ ...none, siteTotal: 10e6 }, trial)?.kind).toBe('site-total')
    expect(overCap({ ...none, siteToday: 11e6, siteTotal: 5e6 }, trial)?.message).toMatch(/tomorrow/)
    expect(overCap({ ...none, siteTrial: 11e6, siteTotal: 5e6, siteToday: 5e6 }, trial)?.kind).toBe('trial')
    expect(overCap({ ...none, allToday: 160e6 }, trial)?.kind).toBe('all')
    expect(siteBudget({ ...none, siteTotal: 7e6 }, trial)).toBe(3e6)
    expect(siteBudget({ ...none, siteTotal: 12e6 }, trial)).toBe(0)
  })

  it('gives paying accounts a monthly Sofie allowance by plan', () => {
    const none = { siteTotal: 0, siteToday: 0, siteTrial: 0, siteMonth: 0, allToday: 0 }
    const site = { status: 'active' as const, plan: 'site' as const }
    const shop = { status: 'active' as const, plan: 'store' as const }
    // The lifetime trial cap no longer applies once they pay.
    expect(overCap({ ...none, siteTotal: 40e6, siteMonth: 1e6 }, site)).toBeNull()
    const used = overCap({ ...none, siteMonth: 5e6 }, site, new Date('2026-10-14T12:00:00Z'))
    expect(used?.kind).toBe('month')
    expect(used?.message).toMatch(/refills on November 1/)
    expect(used?.message).toMatch(/Store plan/)
    // Store gets more.
    expect(overCap({ ...none, siteMonth: 5e6 }, shop)).toBeNull()
    expect(overCap({ ...none, siteMonth: 8e6 }, shop)?.message).not.toMatch(/Store plan/)
    expect(siteBudget({ ...none, siteMonth: 2e6 }, site)).toBe(3e6)
    expect(siteBudget({ ...none, siteMonth: 2e6, siteToday: 9e6 }, site)).toBe(1e6)
    expect(monthShare({ ...none, siteMonth: 2.5e6 }, site)).toBe(0.5)
    expect(monthShare(none, { status: 'trial' })).toBeNull()
  })

  it('maps plans to Stripe prices and only lets the Store plan sell', () => {
    const keys = ['STRIPE_SECRET_KEY', 'STRIPE_PRICE_ID', 'STRIPE_PRICE_STORE', 'STRIPE_PRICE_SITE_YEARLY', 'STRIPE_PRICE_STORE_YEARLY'] as const
    const prev = Object.fromEntries(keys.map((k) => [k, process.env[k]]))
    Object.assign(process.env, { STRIPE_SECRET_KEY: 'sk_test', STRIPE_PRICE_ID: 'price_site', STRIPE_PRICE_STORE: 'price_store', STRIPE_PRICE_SITE_YEARLY: 'price_site_y', STRIPE_PRICE_STORE_YEARLY: 'price_store_y' })
    try {
      expect(priceId('store', 'year')).toBe('price_store_y')
      expect(planForPrice('price_store')).toEqual({ plan: 'store', interval: 'month' })
      expect(planForPrice('price_other')).toBeNull()
      const a = (status: 'trial' | 'active' | 'comp', plan?: 'site' | 'store') => ({ ok: true, status, trial: status === 'trial', daysLeft: 3, locked: false, billing: { status, trialEndsAt: '2030-01-01T00:00:00Z', ...(plan ? { plan } : {}) } })
      expect(canSell(a('trial'))).toBe(true)
      expect(canSell(a('active', 'site'))).toBe(false)
      expect(canSell(a('active', 'store'))).toBe(true)
      expect(canSell(a('comp'))).toBe(true)
    } finally {
      for (const k of keys) { if (prev[k] === undefined) delete process.env[k]; else process.env[k] = prev[k] }
    }
  })

  it('keeps one moving cache marker on the newest message', () => {
    const messages: any[] = [{ role: 'user', content: 'hi' }, { role: 'assistant', content: [{ type: 'text', text: 'x' }] }, { role: 'user', content: [{ type: 'tool_result', tool_use_id: 't', content: 'Done.' }] }]
    cacheLatest(messages)
    cacheLatest(messages)
    const marked = messages.flatMap((m) => (Array.isArray(m.content) ? m.content : [])).filter((b: any) => b.cache_control)
    expect(marked).toHaveLength(1)
    expect(messages[2].content[0].cache_control).toEqual({ type: 'ephemeral' })
  })

  it('checks Stripe signatures and encodes forms', () => {
    const body = '{"type":"x"}'
    const t = Math.floor(Date.now() / 1000)
    const sig = createHmac('sha256', 'whsec').update(`${t}.${body}`).digest('hex')
    expect(verifySignature(body, `t=${t},v1=${sig}`, 'whsec')).toBe(true)
    expect(verifySignature(body, `t=${t},v1=${sig}`, 'other')).toBe(false)
    expect(verifySignature(body, `t=${t - 1000},v1=${sig}`, 'whsec')).toBe(false)
    expect(formEncode({ line_items: [{ price: 'p', quantity: 1 }], metadata: { user_id: 'u' } }).join('&')).toBe('line_items%5B0%5D%5Bprice%5D=p&line_items%5B0%5D%5Bquantity%5D=1&metadata%5Buser_id%5D=u')
  })

  it('stores feedback newest first and records usage per site', async () => {
    const store = new MemoryStore()
    await store.addFeedback({ id: '1', userId: null, name: 'A', email: '', text: 'first', page: '/birthday', at: '2026-09-28T00:00:00Z' })
    await store.addFeedback({ id: '2', userId: null, name: 'B', email: '', text: 'second', page: '/dashboard', at: '2026-09-28T01:00:00Z' })
    expect((await store.feedback(10)).map((f) => f.text)).toEqual(['second', 'first'])
    await store.recordUsage('s1', '2026-09-28', 1000)
    await store.recordUsage('s1', '2026-09-28', 500)
    await store.recordUsage('s2', '2026-09-28', 7)
    expect(await store.siteUsage('s1', '2026-09-28')).toEqual({ micros: 1500, messages: 2 })
    expect((await store.dayUsage('2026-09-28')).micros).toBe(1507)
  })
})

describe('calls from the website', () => {
  it('counts phone taps separately from page views', async () => {
    const store = new MemoryStore()
    const { site, pages } = buildStarterSite({ name: 'Bloom', type: 'salon', city: 'Austin', region: 'TX', services: [], palette: 'ocean', phone: '(512) 555-0100' }, 'o', 'bloom')
    const bundle = { site, pages, redirects: [] }
    const html = await serveSitePath(bundle, [], { preview: false }).text()
    expect(html).toContain('a[href^="tel:"]:active{background-image:url(/__c?p=%2F)}')
    expect(html).toContain('<body ontouchstart=""')
    const req = new Request('https://bloom.saysites.com/__c?p=%2F', { headers: { 'user-agent': 'Mozilla/5.0 (iPhone)' } })
    await handleCall(bundle, req, store)
    await handleCall(bundle, req, store)
    await handleCall(bundle, new Request('https://bloom.saysites.com/__c', { headers: { 'user-agent': 'Googlebot' } }), store)
    await store.recordVisit(site.id, '2026-09-28', '/')
    const day = new Date().toISOString().slice(0, 10)
    expect(await store.callsSince(site.id, day)).toBe(2)
    expect((await store.visitsSince(site.id, '2000-01-01')).every((v) => v.path !== '#call')).toBe(true)
    expect(await serveSitePath(bundle, [], { preview: true }).text()).not.toContain('__c?p=')
  })
})

describe('no AI look', () => {
  it('flags phrases that give away AI-written copy, and not plain ones', async () => {
    const { fillerIn } = await import('../apps/saysites/lib/vibe')
    for (const s of ['Elevate your smile with our expert team.', 'We make it seamless from start to finish.', 'Nestled in downtown Dayton, we fix pipes.', 'Whether you’re a homeowner or a landlord, we can help.'])
      expect(fillerIn(s)).toBe(true)
    for (const s of ['We fix leaks the same day in Dayton.', 'Call Mike for a free quote.'])
      expect(fillerIn(s)).toBe(false)
  })
  it('Sofie is told never to make a site look AI-made', async () => {
    const { SOFIE_SYSTEM } = await import('../apps/saysites/lib/sofie')
    expect(SOFIE_SYSTEM).toMatch(/Never let a site look or read AI-made/)
  })
})

describe('feedback earns three months free', () => {
  it('extends a trial to 90 days, once, and only while on the trial', async () => {
    const { newBilling, withFeedbackReward, FEEDBACK_FREE_DAYS } = await import('../apps/saysites/lib/billing')
    const now = Date.parse('2026-09-28T12:00:00Z')
    const trial = newBilling(now)
    const earned = withFeedbackReward(trial, now)!
    expect(Date.parse(earned.trialEndsAt) - now).toBe(FEEDBACK_FREE_DAYS * 24 * 3600 * 1000)
    expect(earned.feedbackReward).toBe(new Date(now).toISOString())
    expect(withFeedbackReward(earned, now + 1000)).toBeNull()
    expect(withFeedbackReward({ ...trial, status: 'active' }, now)).toBeNull()
    // A longer trial is never shortened.
    const long = { ...trial, trialEndsAt: new Date(now + 200 * 24 * 3600 * 1000).toISOString() }
    expect(withFeedbackReward(long, now)!.trialEndsAt).toBe(long.trialEndsAt)
  })
})

describe('preview base path', () => {
  it('moves page links under the preview but leaves uploads and media alone', async () => {
    const { withBasePath } = await import('../apps/saysites/lib/render')
    const out = withBasePath('<a href="/services">x</a><link rel="icon" href="/u/abc"><img src="/u/abc"><link href="/media/logos/x.svg"><form action="/__form">', '/preview/joes')
    expect(out).toContain('href="/preview/joes/services"')
    expect(out).toContain('href="/u/abc"')
    expect(out).toContain('href="/media/logos/x.svg"')
    expect(out).toContain('action="/preview/joes/__form"')
  })
})

describe('dates', () => {
  it('formats both days and full timestamps', async () => {
    const { formatDate } = await import('../apps/saysites/lib/render')
    expect(formatDate('2026-12-24')).toBe('December 24, 2026')
    expect(formatDate('2026-12-24T07:41:00.000Z')).toBe('December 24, 2026')
  })
})

describe('SaySites launch stats', () => {
  it('counts signups, birthday codes, sites and feedback', async () => {
    const store = new MemoryStore()
    const a = await store.createUser({ email: 'a@x.com', name: 'A', passwordHash: 'h' })
    const b = await store.createUser({ email: 'b@x.com', name: 'B', passwordHash: 'h' })
    await store.saveBilling(a.id, newBilling(Date.now(), 'BIRTHDAY'))
    await store.saveBilling(b.id, { ...newBilling(), status: 'active' })
    const { site, pages } = buildStarterSite({ name: 'A Co', type: 'plumber', city: 'C', region: 'D', services: [], palette: 'ocean' }, a.id, 'launch-one')
    await store.createSite(a.id, site, pages)
    await store.addFeedback({ id: 'f1', userId: a.id, name: 'A', email: 'a@x.com', text: 'love it', at: new Date().toISOString() } as never)
    const today = new Date().toISOString().slice(0, 10)
    const s = await store.launchStats(today)
    expect(s).toMatchObject({ users: 2, usersSince: 2, birthday: 1, paying: 1, sites: 1, sitesSince: 1, feedback: 1, feedbackSince: 1 })
    expect(s.recent.find((u) => u.email === 'a@x.com')).toMatchObject({ sites: 1, promo: 'BIRTHDAY' })
    expect((await store.launchStats('2999-01-01')).usersSince).toBe(0)
  })
})

describe('SaySites database URL', () => {
  it('asks for verify-full, which pg already uses for require', async () => {
    const { pgUrl } = await import('../apps/saysites/lib/store')
    expect(pgUrl('postgres://u:p@h/db?sslmode=require')).toBe('postgres://u:p@h/db?sslmode=verify-full')
    expect(pgUrl('postgres://u:p@h/db?channel_binding=require&sslmode=require')).toBe('postgres://u:p@h/db?channel_binding=require&sslmode=verify-full')
    expect(pgUrl('postgres://u:p@h/db?sslmode=disable')).toBe('postgres://u:p@h/db?sslmode=disable')
  })
})
