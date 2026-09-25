// Sofie: the chat assistant that edits a SaySites website.
//
// Sofie never writes HTML. She works on the same validated content model as
// every other editor, through a small set of tools (change an element, add
// or remove sections, restyle the site, update SEO). Every tool call is
// validated against the schema before it is applied; an invalid change is
// rejected and Sofie is told why, so she can correct herself. When she is
// done, each page must still pass the SEO checks and the speed gate.
//
// Her edits go into a draft. The owner previews the draft and publishes it,
// or undoes it; nothing reaches the live site without that step.

import Anthropic from '@anthropic-ai/sdk'
import { ContainerSchema, ElementSchema, PageSchema, SiteSchema, pagePath, type Container, type Element, type Page, type Site } from './schema'
import { checkPage } from './seo'
import { vibeCheck } from './vibe'
import { checkSpeed } from './speed'
import { renderPage } from './render'
import { PHOTOS } from './photos'
import { buildBlogIndex, buildPostPage } from './posts'
import { SvgError } from './svg'
import { LOGO_CRAFT, LOGO_FONTS, LOGO_ICONS, LOGO_SPEC_PROPERTIES, LOGO_SPEC_REQUIRED, composeLogo, googleFontLoader, specFromInput, type FontLoader } from './logo-compose'
import { renderSheet } from './logo-render'
import { BUSINESS_TYPES, buildStarterSite, type BusinessTypeKey } from './starter'
import { isStock, photoKey, photoUses, repeatedPhotos } from './photo-rules'
import type { Credit, FoundPhoto } from './unsplash'
import type { PhotoSet } from './photos'
import type { Tokens } from './usage'

export const SOFIE_MODEL = 'claude-opus-5'

export interface ChatTurn {
  role: 'owner' | 'sofie'
  text: string
  // Plain-English list of what Sofie changed in this turn.
  changes?: string[]
  at: string
}

export interface Snapshot {
  site: Site
  pages: Page[]
}

// ---------------------------------------------------------------------------
// Workspace: a mutable copy of the site that tools edit, one validated step
// at a time.
// ---------------------------------------------------------------------------

type Json = Record<string, unknown>

const LOCKED_SITE_KEYS = ['id', 'orgId', 'subdomain', 'customDomain', 'updatedAt'] as const
const LOCKED_ELEMENT_KEYS = ['id', 'type', 'children'] as const

// A file Sofie made (a logo) that is saved with the owner's photos.
export interface NewMedia {
  id: string
  mime: 'image/svg+xml'
  width: number
  height: number
  alt: string
  data: string
}

export class Workspace {
  site: Site
  pages: Page[]
  readonly changes: string[] = []
  readonly media: NewMedia[] = []
  // A PNG of the last logo drawn, shown back to Sofie so she can judge it.
  lastLogoPreview: string | null = null
  private fontLoader: FontLoader

  // Stock photos other customers' sites use; never allowed here.
  readonly taken: Set<string>
  // Photo search (lib/unsplash), when it's switched on.
  private finder?: PhotoFinder
  // Credits for photos found this session, kept if the photo gets used.
  private found = new Map<string, Credit>()

  constructor(snapshot: Snapshot, opts: { fontLoader?: FontLoader; taken?: Set<string>; finder?: PhotoFinder } = {}) {
    this.site = structuredClone(snapshot.site)
    this.pages = structuredClone(snapshot.pages)
    this.fontLoader = opts.fontLoader ?? googleFontLoader
    this.taken = opts.taken ?? new Set()
    this.finder = opts.finder
  }

  // Fresh stock photos for a search, none already on this site or another's.
  async findPhotos(query: string): Promise<string> {
    if (!this.finder) throw new ToolError('Photo search is not switched on. Use the photo list you were given.')
    const onSite = new Set(photoUses(this.pages).map((u) => u.key))
    const hits = (await this.finder.search(query)).filter((p) => !onSite.has(p.credit.photo) && !this.taken.has(p.credit.photo)).slice(0, 10)
    if (!hits.length) return 'No new photos for that search. Try other words.'
    for (const h of hits) this.found.set(h.credit.photo, h.credit)
    return JSON.stringify(hits.map((h) => ({ src: h.src, alt: h.alt, width: h.width, height: h.height })))
  }

  // Credits follow the photos: kept for stock photos still on the site.
  syncCredits() {
    const used = new Set(photoUses(this.pages).map((u) => u.key))
    const known = new Map<string, Credit>([...(this.site.credits ?? []).map((c) => [c.photo, c] as const), ...this.found])
    const credits = [...known.values()].filter((c) => used.has(c.photo)).slice(0, 80)
    const next = { ...this.site, credits }
    if (!credits.length) delete (next as { credits?: Credit[] }).credits
    const parsed = SiteSchema.safeParse(next)
    if (parsed.success) this.site = parsed.data
  }

  snapshot(): Snapshot {
    return { site: structuredClone(this.site), pages: structuredClone(this.pages) }
  }

  private page(slugOrName: string): Page {
    const slug = slugOrName === 'home' || slugOrName === '/' ? '' : slugOrName.replace(/^\/+|\/+$/g, '')
    const page = this.pages.find((p) => p.slug === slug)
    if (!page) throw new ToolError(`There is no page "${slugOrName}". Pages: ${this.pages.map((p) => (p.slug === '' ? 'home' : p.slug)).join(', ')}.`)
    return page
  }

  // Runs one edit against a copy of a page, keeps it only if the page still
  // validates.
  private editPage(slug: string, summary: string, edit: (page: Page) => void) {
    const current = this.page(slug)
    const draft = structuredClone(current)
    edit(draft)
    const parsed = PageSchema.safeParse(draft)
    if (!parsed.success) throw new ToolError(`That change is not valid: ${formatZod(parsed.error)}`)
    const dupes = duplicateIds(parsed.data.body)
    if (dupes.length) throw new ToolError(`Element ids must be unique on a page; these repeat: ${dupes.join(', ')}.`)
    this.pages = this.pages.map((p) => (p.id === current.id ? parsed.data : p))
    this.changes.push(summary)
  }

  updateElement(slug: string, id: string, fields: Json, summary: string) {
    for (const k of LOCKED_ELEMENT_KEYS) if (k in fields) throw new ToolError(`"${k}" cannot be changed this way.`)
    this.editPage(slug, summary, (page) => {
      const found = findElement(page.body, id)
      if (!found) throw new ToolError(`No element with id "${id}" on that page.`)
      const el = found.element as unknown as Json
      for (const [k, v] of Object.entries(fields)) {
        if (v === null) delete el[k]
        else if (k === 'style' && isObject(v)) el.style = mergeStyle(isObject(el.style) ? el.style : {}, v)
        else el[k] = v
      }
    })
  }

  insertElements(slug: string, parentId: string, index: number, elements: unknown[], summary: string) {
    this.editPage(slug, summary, (page) => {
      if (!parentId) {
        const sections = elements.map((e) => parseOrThrow(ContainerSchema, e, 'Top-level sections must be containers'))
        page.body.splice(clampIndex(index, page.body.length), 0, ...sections)
        return
      }
      const found = findElement(page.body, parentId)
      if (!found || found.element.type !== 'container') throw new ToolError(`"${parentId}" is not a container on that page.`)
      const items = elements.map((e) => parseOrThrow(ElementSchema, e, 'Invalid element'))
      found.element.children.splice(clampIndex(index, found.element.children.length), 0, ...items)
    })
  }

  removeElement(slug: string, id: string, summary: string) {
    this.editPage(slug, summary, (page) => {
      const found = findElement(page.body, id)
      if (!found) throw new ToolError(`No element with id "${id}" on that page.`)
      found.siblings.splice(found.index, 1)
    })
  }

  moveElement(slug: string, id: string, direction: 'up' | 'down', summary: string) {
    this.editPage(slug, summary, (page) => {
      const found = findElement(page.body, id)
      if (!found) throw new ToolError(`No element with id "${id}" on that page.`)
      const to = found.index + (direction === 'up' ? -1 : 1)
      if (to < 0 || to >= found.siblings.length) throw new ToolError(`It is already at the ${direction === 'up' ? 'top' : 'bottom'}.`)
      const [el] = found.siblings.splice(found.index, 1)
      found.siblings.splice(to, 0, el)
    })
  }

  updateSeo(slug: string, title: string, description: string, summary: string) {
    this.editPage(slug, summary, (page) => {
      if (title) page.seo.title = title
      if (description) page.seo.description = description
    })
  }

  addPage(input: { slug: string; name: string; title: string; description: string; body: unknown[]; addToNav: boolean }, summary: string) {
    if (this.pages.some((p) => p.slug === input.slug)) throw new ToolError(`A page at /${input.slug} already exists.`)
    const page = PageSchema.safeParse({
      id: `page_${cryptoRandom()}`,
      siteId: this.site.id,
      slug: input.slug,
      name: input.name,
      status: 'published',
      seo: { title: input.title, description: input.description },
      body: input.body,
      updatedAt: new Date().toISOString(),
    })
    if (!page.success) throw new ToolError(`That page is not valid: ${formatZod(page.error)}`)
    const dupes = duplicateIds(page.data.body)
    if (dupes.length) throw new ToolError(`Element ids must be unique on a page; these repeat: ${dupes.join(', ')}.`)
    const site = input.addToNav ? { ...this.site, nav: [...this.site.nav, { label: input.name, href: pagePath(page.data) }] } : this.site
    const siteOk = SiteSchema.safeParse(site)
    if (!siteOk.success) throw new ToolError(`The menu could not take another link: ${formatZod(siteOk.error)}`)
    this.pages.push(page.data)
    this.site = siteOk.data
    this.changes.push(summary)
  }

  // A blog post at /blog/<slug>, plus the /blog list page and menu link the
  // first time.
  writePost(input: { title: string; date: string; body: string }, summary: string) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date)) throw new ToolError('date must be YYYY-MM-DD.')
    if (input.body.trim().length < 40) throw new ToolError('The post body is too short.')
    let page = buildPostPage(this.site, { title: input.title, date: input.date, body: input.body })
    let slug = page.slug
    for (let n = 2; this.pages.some((p) => p.slug === slug); n++) slug = `${page.slug}-${n}`
    page = { ...page, slug }
    const parsed = PageSchema.safeParse(page)
    if (!parsed.success) throw new ToolError(`That post is not valid: ${formatZod(parsed.error)}`)
    this.pages.push(parsed.data)
    if (!this.pages.some((p) => p.slug === 'blog')) this.pages.push(buildBlogIndex(this.site))
    if (!this.site.nav.some((n) => n.href === '/blog')) {
      const nav = [...this.site.nav.filter((n) => n.href !== '/contact'), { label: 'Blog', href: '/blog' }, ...this.site.nav.filter((n) => n.href === '/contact')]
      const ok = SiteSchema.safeParse({ ...this.site, nav })
      if (ok.success) this.site = ok.data
    }
    this.changes.push(summary)
  }

  // A logo built from Sofie's spec with real typefaces (lib/logo-compose),
  // saved as the owner's files and used in the header and browser tab.
  async designLogo(input: Record<string, unknown>, summary: string) {
    let out
    try {
      out = await composeLogo(specFromInput(input), this.fontLoader)
    } catch (e) {
      if (e instanceof SvgError) throw new ToolError(`That logo can't be built: ${e.message}`)
      throw e
    }
    const save = (svg: string, width: number, height: number, alt: string) => {
      const id = cryptoRandom().replace(/-/g, '')
      this.media.push({ id, mime: 'image/svg+xml', width, height, alt, data: svg })
      return `/u/${id}`
    }
    const alt = `${this.site.business.name} logo`
    const business = { ...this.site.business, logo: save(out.svg, out.width, out.height, alt), icon: save(out.icon, 64, 64, `${alt} (icon)`) }
    const parsed = SiteSchema.safeParse({ ...this.site, business })
    if (!parsed.success) throw new ToolError(`That change is not valid: ${formatZod(parsed.error)}`)
    this.site = parsed.data
    this.changes.push(summary)
    try {
      this.lastLogoPreview = renderSheet([{ logo: out.svg, icon: out.icon }], this.site.globals.colors.background).toString('base64')
    } catch {
      this.lastLogoPreview = null
    }
  }

  // Starts the site over as a different kind of business (an electrician's
  // site that is really a law firm): new layout, pages, photos and wording,
  // keeping the name, contact details, address, hours, logo, colours, blog
  // and shop. Pages that no longer fit are hidden, not deleted.
  async rebuildSite(input: { type: string; services: string[]; city: string; region: string; headline: string }, summary: string) {
    if (!(input.type in BUSINESS_TYPES)) throw new ToolError(`Unknown business type "${input.type}". Use one of: ${Object.keys(BUSINESS_TYPES).join(', ')}.`)
    const b = this.site.business
    const [areaCity, areaRegion] = (b.area ?? '').split(',').map((x) => x.trim())
    const city = input.city.trim() || b.address?.city || areaCity || ''
    const region = input.region.trim() || b.address?.region || areaRegion || ''
    if (!city) throw new ToolError('I need the town or city the business serves. Ask the owner.')
    const set = this.finder ? await this.finder.set(input.type, this.taken) : null
    if (set) for (const c of set.credits) this.found.set(c.photo, c)
    const built = buildStarterSite(
      {
        name: b.name,
        type: input.type as BusinessTypeKey,
        city,
        region,
        ...(b.phone ? { phone: b.phone } : {}),
        ...(b.email ? { email: b.email } : {}),
        services: input.services,
        palette: 'ocean',
        language: this.site.language,
        ...(b.address ? { street: b.address.street, postalCode: b.address.postalCode } : {}),
        ...(b.hours?.length ? { hours: b.hours } : {}),
        ...(input.headline.trim() ? { headline: input.headline } : {}),
        ...(set ? { photos: set } : {}),
      },
      this.site.orgId,
      this.site.subdomain,
      { taken: this.taken }
    )
    const keep = (slug: string) => slug === 'blog' || slug.startsWith('blog/') || slug === 'shop' || slug === 'privacy' || slug === 'privacy-policy' || slug === 'terms'
    const extraNav = this.site.nav.filter((n) => ['/blog', '/shop'].includes(n.href))
    const nav = [...built.site.nav.filter((n) => n.href !== '/contact'), ...extraNav, ...built.site.nav.filter((n) => n.href === '/contact')]
    const next: Json = {
      ...structuredClone(this.site),
      business: { ...b, schemaType: built.site.business.schemaType, ...(built.site.business.area ? { area: built.site.business.area } : {}) },
      globals: { ...built.site.globals, colors: this.site.globals.colors },
      nav,
      header: built.site.header,
      tagline: built.site.tagline,
    }
    if (built.site.footerNote) next.footerNote = built.site.footerNote
    else delete next.footerNote
    const parsed = SiteSchema.safeParse(next)
    if (!parsed.success) throw new ToolError(`That change is not valid: ${formatZod(parsed.error)}`)
    // Same address, same page: reuse the old page's id so publishing replaces it.
    const bySlug = new Map(this.pages.map((p) => [p.slug, p]))
    const fresh = built.pages.map((p) => ({ ...p, id: bySlug.get(p.slug)?.id ?? p.id, siteId: this.site.id }))
    const freshSlugs = new Set(fresh.map((p) => p.slug))
    const rest = this.pages.filter((p) => !freshSlugs.has(p.slug)).map((p) => (keep(p.slug) ? p : { ...p, status: 'draft' as const }))
    this.site = parsed.data
    this.pages = [...fresh, ...rest]
    this.changes.push(summary)
  }

  updateSite(changes: Json, summary: string) {
    for (const k of LOCKED_SITE_KEYS) if (k in changes) throw new ToolError(`"${k}" cannot be changed by Sofie.`)
    const next = structuredClone(this.site) as unknown as Json
    for (const [k, v] of Object.entries(changes)) {
      if (v === null) delete next[k]
      else if ((k === 'business' || k === 'globals' || k === 'header') && isObject(v)) next[k] = deepMerge(isObject(next[k]) ? next[k] : {}, v)
      else next[k] = v
    }
    const parsed = SiteSchema.safeParse(next)
    if (!parsed.success) throw new ToolError(`That change is not valid: ${formatZod(parsed.error)}`)
    this.site = parsed.data
    this.changes.push(summary)
  }

  // The publish gate, run after Sofie finishes: returns problems to fix.
  problems(): string[] {
    const out: string[] = []
    for (const p of this.pages) {
      const name = p.slug === '' ? 'home' : p.slug
      for (const i of checkPage(p, this.pages)) if (i.severity === 'error') out.push(`${name}: ${i.message}`)
      const speed = checkSpeed(renderPage(this.site, p, this.pages))
      for (const i of speed.issues) out.push(`${name}: ${i.message}`)
      // Keyword stuffing and near-duplicate pages can't be published.
      if (p.status === 'published') for (const b of vibeCheck(this.site, p, this.pages.filter((x) => x.status === 'published')).blockers) out.push(`${name}: ${b}`)
    }
    for (const u of photoUses(this.pages)) if (isStock(u.src) && this.taken.has(u.key)) out.push(`${u.page}: that stock photo (${u.key}) is already on another SaySites customer's site. Use a different photo or the owner's own.`)
    return out
  }

  // Photos used twice on this site. Allowed only when the owner asked.
  repeats(): string[] {
    return repeatedPhotos(this.pages).map((r) => `The photo ${r.key} appears on ${r.pages.join(' and ')}.`)
  }
}

export class ToolError extends Error {}

export interface PhotoFinder {
  search(query: string): Promise<FoundPhoto[]>
  set(type: string, taken: Set<string>): Promise<(PhotoSet & { credits: Credit[] }) | null>
}

function findElement(body: Element[], id: string): { element: Element; siblings: Element[]; index: number } | null {
  for (let i = 0; i < body.length; i++) {
    const el = body[i]
    if (el.id === id) return { element: el, siblings: body, index: i }
    if (el.type === 'container') {
      const inner = findElement(el.children, id)
      if (inner) return inner
    }
  }
  return null
}

function duplicateIds(body: Element[]): string[] {
  const seen = new Set<string>()
  const dupes = new Set<string>()
  const visit = (els: Element[]) => {
    for (const el of els) {
      if (seen.has(el.id)) dupes.add(el.id)
      seen.add(el.id)
      if (el.type === 'container') visit(el.children)
    }
  }
  visit(body)
  return [...dupes]
}

function parseOrThrow<T>(schema: { safeParse(v: unknown): { success: true; data: T } | { success: false; error: ZodLike } }, value: unknown, label: string): T {
  const r = schema.safeParse(value)
  if (!r.success) throw new ToolError(`${label}: ${formatZod(r.error)}`)
  return r.data
}

interface ZodLike {
  issues: { path: (string | number)[]; message: string }[]
}

function formatZod(e: ZodLike): string {
  return e.issues
    .slice(0, 6)
    .map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`)
    .join('; ')
}

function isObject(v: unknown): v is Json {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function deepMerge(a: Json, b: Json): Json {
  const out: Json = { ...a }
  for (const [k, v] of Object.entries(b)) {
    if (v === null) delete out[k]
    else out[k] = isObject(v) && isObject(out[k]) ? deepMerge(out[k] as Json, v) : v
  }
  return out
}

function mergeStyle(a: Json, b: Json): Json {
  return deepMerge(a, b)
}

function clampIndex(index: number, length: number): number {
  return index < 0 || index > length ? length : index
}

function cryptoRandom(): string {
  return globalThis.crypto.randomUUID()
}

// ---------------------------------------------------------------------------
// Tools
// ---------------------------------------------------------------------------

const summary = { type: 'string', description: 'One short sentence for the owner describing this change, e.g. "Added weekend hours to the header".' } as const
const pageParam = { type: 'string', description: 'Page slug: "home" for the home page, otherwise e.g. "services".' } as const

// Not strict: the API rejects strict mode for this tool set as "Schema is too
// complex". runTool coerces every input and reports bad JSON back to Sofie.
export const SOFIE_TOOLS: Anthropic.Beta.BetaTool[] = [
  {
    name: 'update_element',
    description:
      'Change fields of one element (widget or container) found by id. Pass only the fields to change as a JSON object string. "style" is merged into the existing style; set a field to null to remove it. Cannot change id, type or children.',
    input_schema: {
      type: 'object',
      additionalProperties: false,
      properties: { page: pageParam, id: { type: 'string' }, fields_json: { type: 'string', description: 'JSON object of fields to set, e.g. {"text":"New words"} or {"style":{"background":"secondary"}}' }, summary },
      required: ['page', 'id', 'fields_json', 'summary'],
    },
  },
  {
    name: 'insert_elements',
    description:
      'Insert new elements. With parent_id "" the elements are new top-level sections (each must be a container, usually tag "section" and boxed). Otherwise they go inside the container with that id. index -1 appends at the end. New ids must be unique on the page.',
    input_schema: {
      type: 'object',
      additionalProperties: false,
      properties: { page: pageParam, parent_id: { type: 'string' }, index: { type: 'integer' }, elements_json: { type: 'string', description: 'JSON array of elements following the content model.' }, summary },
      required: ['page', 'parent_id', 'index', 'elements_json', 'summary'],
    },
  },
  {
    name: 'remove_element',
    description: 'Remove one element (and everything inside it) by id.',
    input_schema: { type: 'object', additionalProperties: false, properties: { page: pageParam, id: { type: 'string' }, summary }, required: ['page', 'id', 'summary'] },
  },
  {
    name: 'move_element',
    description: 'Move an element one place up or down among its siblings (for sections, that is up or down the page).',
    input_schema: {
      type: 'object',
      additionalProperties: false,
      properties: { page: pageParam, id: { type: 'string' }, direction: { type: 'string', enum: ['up', 'down'] }, summary },
      required: ['page', 'id', 'direction', 'summary'],
    },
  },
  {
    name: 'update_site',
    description:
      'Change site-wide settings as a JSON object string. Allowed keys: business (name, phone, email, address, hours, priceRange; merged), globals (colors, fonts, radius, headingWeight, headingTracking, headingCase, buttonShape, buttonCase, baseFontSize, typeScale; merged), header (topbar, cta; merged), nav (replaced), tagline, footerNote (small print at the foot of every page, e.g. a law firm’s attorney advertising disclaimer). Set a key to null to remove it.',
    input_schema: { type: 'object', additionalProperties: false, properties: { changes_json: { type: 'string' }, summary }, required: ['changes_json', 'summary'] },
  },
  {
    name: 'update_seo',
    description: 'Set a page’s Google title (max 60 characters recommended, 70 hard limit) and description (max 160). Pass "" to leave one unchanged.',
    input_schema: {
      type: 'object',
      additionalProperties: false,
      properties: { page: pageParam, title: { type: 'string' }, description: { type: 'string' }, summary },
      required: ['page', 'title', 'description', 'summary'],
    },
  },
  {
    name: 'add_page',
    description: 'Create a new page. body_json is a JSON array of top-level section containers; the page needs exactly one level-1 heading.',
    input_schema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        slug: { type: 'string', description: 'Lowercase words joined by dashes, e.g. "about" or "emergency-plumbing".' },
        name: { type: 'string', description: 'Menu label, e.g. "About".' },
        title: { type: 'string' },
        description: { type: 'string' },
        body_json: { type: 'string' },
        add_to_nav: { type: 'boolean' },
        summary,
      },
      required: ['slug', 'name', 'title', 'description', 'body_json', 'add_to_nav', 'summary'],
    },
  },
]

SOFIE_TOOLS.push({
  name: 'rebuild_site',
  description:
    'Start the site over as a different kind of business, when the site was made for the wrong one (e.g. it shows an electrician but they are a law firm). Replaces the layout, pages, photos, menu and starter wording with the right ones for that business; keeps the name, phone, email, address, hours, logo, colours, blog and shop. Afterwards rewrite the new pages in the owner\'s words in the same turn.',
  input_schema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      type: { type: 'string', enum: Object.keys(BUSINESS_TYPES) },
      services: { type: 'array', items: { type: 'string' }, description: 'The services or practice areas the owner told you, in their words. Empty if you don\'t know them yet.' },
      city: { type: 'string', description: 'Town or city served, or "" to keep the current one.' },
      region: { type: 'string', description: 'State or province, or "" to keep the current one.' },
      headline: { type: 'string', description: 'A main headline, or "" for the default.' },
      summary,
    },
    required: ['type', 'services', 'city', 'region', 'headline', 'summary'],
  },
})

SOFIE_TOOLS.push({
  name: 'find_photos',
  description:
    'Search free professional stock photos (Unsplash) when the photo list doesn\'t have a good fit. Returns up to 10 photos with src, alt, width and height; use them exactly. Search in plain English for what the photo shows, e.g. "attorney meeting client". Photos already on this site or another customer\'s site are left out. Each photographer is credited in the site footer automatically.',
  input_schema: { type: 'object', additionalProperties: false, properties: { query: { type: 'string' } }, required: ['query'] },
})

SOFIE_TOOLS.push({
  name: 'write_post',
  description:
    'Publish a blog post to the site (at /blog/<title-slug>, listed on /blog; the /blog page and its menu link are created the first time). Write helpful, specific, honest content for this business\'s customers, 300-700 words. Never invent prices, awards, reviews or facts about the business.',
  input_schema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      title: { type: 'string', description: 'The post title, like a helpful headline.' },
      date: { type: 'string', description: "YYYY-MM-DD, usually today's date." },
      body: { type: 'string', description: 'Plain text. Blank line between paragraphs; a line starting with "## " is a subheading.' },
      summary,
    },
    required: ['title', 'date', 'body', 'summary'],
  },
})

SOFIE_TOOLS.push({
  name: 'design_logo',
  description: `Design a logo and put it in the site header (and its mark or first letter in the browser tab). You art-direct; SaySites builds it exactly with the real typeface and shows you the result so you can refine it (call again with changes if anything is off). Typefaces: ${Object.entries(LOGO_FONTS).map(([n, f]) => `${n} (${f.style})`).join('; ')}. Icons: ${LOGO_ICONS.join(', ')}.\n\n${LOGO_CRAFT}`,
  input_schema: {
    type: 'object',
    additionalProperties: false,
    properties: { ...LOGO_SPEC_PROPERTIES, summary },
    required: [...LOGO_SPEC_REQUIRED, 'summary'],
  },
})

export async function runTool(ws: Workspace, name: string, input: Record<string, unknown>): Promise<string> {
  const s = String(input.summary ?? 'Updated the site')
  const str = (k: string) => String(input[k] ?? '')
  try {
    switch (name) {
      case 'update_element':
        ws.updateElement(str('page'), str('id'), parseJson(str('fields_json'), 'object') as Json, s)
        break
      case 'insert_elements':
        ws.insertElements(str('page'), str('parent_id'), Number(input.index ?? -1), parseJson(str('elements_json'), 'array') as unknown[], s)
        break
      case 'remove_element':
        ws.removeElement(str('page'), str('id'), s)
        break
      case 'move_element':
        ws.moveElement(str('page'), str('id'), input.direction === 'up' ? 'up' : 'down', s)
        break
      case 'update_site':
        ws.updateSite(parseJson(str('changes_json'), 'object') as Json, s)
        break
      case 'update_seo':
        ws.updateSeo(str('page'), str('title'), str('description'), s)
        break
      case 'write_post':
        ws.writePost({ title: str('title'), date: str('date'), body: str('body') }, s)
        break
      case 'design_logo':
        await ws.designLogo(input, s)
        break
      case 'rebuild_site':
        await ws.rebuildSite({ type: str('type'), services: Array.isArray(input.services) ? input.services.map(String) : [], city: str('city'), region: str('region'), headline: str('headline') }, s)
        break
      case 'find_photos':
        return await ws.findPhotos(str('query'))
      case 'add_page':
        ws.addPage({ slug: str('slug'), name: str('name'), title: str('title'), description: str('description'), body: parseJson(str('body_json'), 'array') as unknown[], addToNav: input.add_to_nav === true }, s)
        break
      default:
        return `Error: unknown tool ${name}.`
    }
    return 'Done.'
  } catch (e) {
    if (e instanceof ToolError) return `Error: ${e.message}`
    throw e
  }
}

function parseJson(text: string, want: 'object' | 'array'): unknown {
  let v: unknown
  try {
    v = JSON.parse(text)
  } catch {
    throw new ToolError(`That was not valid JSON.`)
  }
  if (want === 'array' ? !Array.isArray(v) : !isObject(v)) throw new ToolError(`Expected a JSON ${want}.`)
  return v
}

// ---------------------------------------------------------------------------
// Prompt
// ---------------------------------------------------------------------------

const PHOTO_KEYS = Object.values(PHOTOS).flatMap((set) => [set.hero, ...set.cards].map((p) => photoKey(p.src)))

const PHOTO_LIST = Object.entries(PHOTOS)
  .map(([k, set]) => `- ${k}: ${[set.hero, ...set.cards].map((p) => `${p.src} (${p.width}x${p.height}, "${p.alt}")`).join('; ')}`)
  .join('\n')

export const SOFIE_SYSTEM = `You are Sofie, the website assistant inside SaySites, a website builder for small local businesses. The person you are talking to owns the business and is usually not technical. You change their website by calling tools; you never write HTML.

How owners talk: most are busy American small-business owners. They write fast and blunt, skip punctuation, make typos, swear, vent and say things like "this looks like shit, fix it" or "just do it". That is normal, not rudeness: never lecture, never comment on their language, never get formal or defensive. Read it as "I want this, now" and do it right away. Keep replies short and plain, like a sharp friend who handles it: what you did, in a sentence or two. Swearing never goes onto their website; the site always reads professional for their customers.

How to work:
- Do what they ask, fully, in as few tool calls as makes sense. If a request is ambiguous in a way that matters (which page, what the new wording should say, a fact you don't know), ask one short question instead of guessing.
- Never invent facts about the business: prices, licenses, certifications, awards, reviews, years in business, guarantees. Use only what the owner told you or what is already on the site. If they ask for something that needs a fact you don't have, ask for it.
- Language: always reply in the language the owner writes to you in (for example, Spanish if they write in Spanish). Write website content in the site's language (site.language: "en" English, "es" Spanish), whatever language the owner chats in. If the owner asks for the website in another language, set language with update_site ("es" or "en") and rewrite every page fully in that language: headings, text, buttons, form submit labels and thank-you notes, FAQs, the nav labels, header topbar and button, tagline, footerNote, and each page's SEO title and description. Keep names, addresses, phone numbers and prices as they are.
- Originality: every page must read as written for this business, never as a template. Use the owner's own facts, words and details (what they do differently, their process, their area, real examples they gave you). Avoid stock phrases: "look no further", "one-stop shop", "second to none", "top-notch", "state-of-the-art", "we pride ourselves", "committed to providing the highest quality", "your satisfaction is our priority", "tailored to your needs", "don't hesitate to contact us". Never create near-identical pages that only swap a town or service name; one genuinely useful page beats ten copies. Pages that are mostly SaySites' starter wording stay out of Google until they're rewritten in the owner's words, so when you rewrite a starter page, replace its sentences completely rather than tweaking them. If you don't know what makes the business different, ask one short question.
- Every site must follow Google Search Essentials and Google's spam policies. We win organic search by being genuinely the best result, never by tricks: no keyword stuffing, no hidden text, no doorway or near-duplicate location pages, no fake or incentivized reviews, no invented claims, no misleading titles. If the owner asks for something that breaks these rules, say plainly that it risks a Google penalty and offer the honest version that works.
- Asked for a logo (or a new one)? Use design_logo: pick the typeface and structure that fit the business, look at the render you get back and refine it once if it can be better. Afterwards say in a sentence what you made, offer another direction, and mention that Photos > Your logo shows three ideas side by side.
- Act, don't stall. If the site was built for the wrong kind of business, call rebuild_site straight away (never patch one photo at a time), then in the same turn rewrite the new pages with every fact you have. If the owner says the site is bland, wrong or not impressive, do a real redesign pass in that turn: a strong hero with a fitting photo, a specific headline, well-spaced sections, and pages that read as theirs. Missing facts (practice areas, years, team) never block the work: make it excellent with what you know, without inventing anything, then ask for the missing details in one short message at the end.
- Photos: every photo appears once on the whole site. Never reuse a photo on another page or section (for example the home page's top photo as another page's header) unless the owner asks for that exact photo again; if you run out of fitting photos, use a solid colour header or ask for their own photos. Never use a stock photo that another SaySites customer already uses (you'll be told which). The owner's own uploaded photos are always theirs to use.
- Keep the site's existing look: reuse its color tokens, spacing and patterns (copy the structure of a similar section on the same page when adding one). Write copy that is warm, plain and specific to this business, short sentences, no hype words.
- When the owner describes a whole website (a Talk & Design prompt) and the site already follows that layout, don't rebuild it from scratch: go through it and make every headline, paragraph, card, question and Google title specific to their business and their words, and add anything they described that is missing.
- After changing things, reply in one to three short sentences saying what you did in plain English, and offer one sensible next step only if it is genuinely useful. Don't list ids or technical details.

The content model (enforced; invalid changes are rejected with a reason, then fix and retry):
- A page body is an array of top-level containers (sections). Container: {"id","type":"container","tag"?: "section"|"div"|..., "layout":"flex"|"grid", "direction"?: {"desktop":"row"|"column", "mobile"?}, "columns"?: {"desktop":n,"tablet"?:n,"mobile"?:n} (grid), "align"?: "start"|"center"|"end"|"stretch", "justify"?: "start"|"center"|"end"|"between", "boxed"?: true (full-width background, content capped to site width), "backgroundImage"?: {"src","width","height","overlay":0-0.95,"overlayStyle"?:"full"|"side","priority"?:bool}, "style"?, "children":[...] }.
- Widgets: heading {"id","type":"heading","level":1-6,"text"}; text {"id","type":"text","text"} (blank line = new paragraph); image {"id","type":"image","src","alt" (required, descriptive),"width","height","aspect"?: ratio like 1.5,"priority"?: bool}; button {"id","type":"button","label","href","variant":"primary"|"secondary"|"outline"}; faq {"id","type":"faq","items":[{"question","answer"}]}; posts (a list of the site's blog posts, newest first; use write_post to add posts) {"id","type":"posts","limit"?: number}; products (the site's products from the owner's Products tab, as cards with prices and buy buttons; you cannot add or change products themselves) {"id","type":"products","limit"?: number}; gallery (a grid of photos, e.g. "Our work"; prefer the owner's uploaded photos) {"id","type":"gallery","columns"?: 2-4,"images":[{"src","alt","width","height","caption"?}]}; testimonials (ONLY real quotes the owner gave you, word for word; never invent or paraphrase reviews) {"id","type":"testimonials","items":[{"quote","name","detail"?: e.g. town or service,"stars"?: 1-5}]}; form (a contact form whose messages go to the owner's inbox) {"id","type":"form","fields":["name","email","phone","message"] (any of these, in order),"submitLabel","thanks"?: note shown after sending}.
- style (all optional): padding/margin {"desktop":{"top","right","bottom","left"},"mobile"?:{...}}; gap {"desktop":n,"mobile"?:n}; fontSize {"desktop":n,"tablet"?:n,"mobile"?:n}; textAlign {"desktop":"left"|"center"|"right"}; background, color, border: a color token (primary, secondary, accent, text, muted, background, surface) or a hex like "#ffffff"; fontWeight 300-900; borderRadius; maxWidth; letterSpacing (em); textTransform "uppercase"|"none"; fontFamily "heading"|"body".
- Links (href): "/page-slug", "https://...", "tel:+15551234567", "mailto:...", or "#anchor". Ids: lowercase letters, digits and dashes, unique on the page.
- Rules the publish gate checks: exactly one level-1 heading per page, headings don't skip levels, every image has alt text, at most one image per page loads eagerly (priority: true, only the first image near the top), titles under 70 characters, descriptions under 170.
- Opening hours use schema.org format in business.hours, e.g. ["Mo-Fr 08:00-17:00","Sa 09:00-13:00"].

Photos you can use (free license; pick ones that fit, use their width/height and write your own alt):
${PHOTO_LIST}`

// ---------------------------------------------------------------------------
// The conversation
// ---------------------------------------------------------------------------

export interface SofieResult {
  reply: string
  changes: string[]
  // Logos she drew, to save with the owner's files before the draft is shown.
  media: NewMedia[]
  snapshot: Snapshot
  problems: string[]
  // Tokens used across every step, for costing (lib/usage).
  usage: Required<Tokens>
}

const MAX_STEPS = 16

// The request goes through this one typed seam so the file also compiles
// where an older SDK (without the newest request fields) is installed, such
// as the repository root that type-checks the tests.
type CreateParams = Record<string, unknown> & { messages: Anthropic.Beta.BetaMessageParam[] }
export function createMessage(client: Anthropic, params: CreateParams): Promise<Anthropic.Beta.BetaMessage> {
  const create = client.beta.messages.create as unknown as (p: CreateParams) => Promise<Anthropic.Beta.BetaMessage>
  return create.call(client.beta.messages, params)
}

export async function askSofie(input: { snapshot: Snapshot; history: ChatTurn[]; message: string; client?: Anthropic; photos?: { src: string; alt: string; width: number; height: number }[]; taken?: Set<string>; finder?: PhotoFinder }): Promise<SofieResult> {
  const client = input.client ?? new Anthropic()
  const ws = new Workspace(input.snapshot, { taken: input.taken, finder: input.finder })
  const takenHere = PHOTO_KEYS.filter((k) => ws.taken.has(k))

  // Earlier turns as plain text; the current state of the site is sent fresh
  // with each new request, so Sofie always edits what is actually there.
  const messages: Anthropic.Beta.BetaMessageParam[] = []
  for (const t of input.history.slice(-12)) {
    const text = t.role === 'sofie' && t.changes?.length ? `${t.text}\n\n(Changes made: ${t.changes.join('; ')})` : t.text
    messages.push({ role: t.role === 'owner' ? 'user' : 'assistant', content: text })
  }
  messages.push({
    role: 'user',
    content: [
      { type: 'text', text: `Today is ${new Date().toISOString().slice(0, 10)}. The website as it is right now (JSON):\n${JSON.stringify({ site: ws.site, pages: ws.pages })}` },
      ...(input.photos?.length
        ? [{ type: 'text' as const, text: `The owner's own uploaded photos. Prefer these over stock photos when they fit (use src, alt, width and height exactly):\n${JSON.stringify(input.photos.slice(0, 40))}` }]
        : []),
      ...(takenHere.length ? [{ type: 'text' as const, text: `Stock photos from the list that other SaySites customers already use. Never use these: ${takenHere.join(', ')}` }] : []),
      { type: 'text', text: input.message },
    ],
  })
  const repeatsBefore = new Set(ws.repeats())

  let reply = ''
  let gateRounds = 0
  const usage = { input_tokens: 0, output_tokens: 0, cache_creation_input_tokens: 0, cache_read_input_tokens: 0 }
  for (let step = 0; step < MAX_STEPS; step++) {
    cacheLatest(messages)
    const response = await createMessage(client, {
      model: SOFIE_MODEL,
      max_tokens: 16000,
      // Opt into Anthropic's server-side fallback, so a declined request is
      // retried on a suitable model instead of failing.
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      thinking: { type: 'adaptive' },
      output_config: { effort: 'medium' },
      system: [{ type: 'text', text: SOFIE_SYSTEM, cache_control: { type: 'ephemeral' } }],
      tools: SOFIE_TOOLS,
      messages,
    })

    const u = response.usage as Tokens | undefined
    if (u) for (const k of Object.keys(usage) as (keyof typeof usage)[]) usage[k] += u[k] ?? 0
    if (response.stop_reason === 'refusal') {
      reply = 'Sorry, I can’t help with that one. Could you put it another way?'
      break
    }
    messages.push({ role: 'assistant', content: response.content })
    const text = response.content.flatMap((b) => (b.type === 'text' ? [b.text] : [])).join('\n').trim()
    const calls = response.content.filter((b): b is Anthropic.Beta.BetaToolUseBlock => b.type === 'tool_use')

    if (calls.length) {
      const results: Anthropic.Beta.BetaToolResultBlockParam[] = []
      for (const c of calls) {
        ws.lastLogoPreview = null
        const out = await runTool(ws, c.name, c.input as Record<string, unknown>)
        const preview = !out.startsWith('Error:') && ws.lastLogoPreview
        results.push({
          type: 'tool_result',
          tool_use_id: c.id,
          content: preview
            ? [
                { type: 'text', text: 'Done. This is exactly how it renders: the logo at twice header size, then the icon large and at tab size. Judge it honestly; if the spacing, weight, size balance or colours could be better, call design_logo again with the fixes before you reply.' },
                { type: 'image', source: { type: 'base64', media_type: 'image/png', data: preview } },
              ]
            : out,
          ...(out.startsWith('Error:') ? { is_error: true } : {}),
        })
      }
      messages.push({ role: 'user', content: results })
      continue
    }
    if (response.stop_reason === 'pause_turn') continue

    // Sofie is done. Hold her to the same gate as a publish.
    const problems = ws.changes.length ? ws.problems() : []
    // New repeats of a photo: fine only when the owner asked for it.
    const repeats = ws.changes.length ? ws.repeats().filter((r) => !repeatsBefore.has(r)) : []
    if ((problems.length || repeats.length) && gateRounds < 2) {
      gateRounds++
      const parts = [
        problems.length ? `The site now fails these checks. Fix them with tools.\n- ${problems.join('\n- ')}` : '',
        repeats.length ? `Each photo is used once per site. If the owner did not ask for the same photo twice, swap the repeat for a different one (or their own). If they did ask, leave it.\n- ${repeats.join('\n- ')}` : '',
      ]
      messages.push({ role: 'user', content: `Before you finish:\n${parts.filter(Boolean).join('\n\n')}\nThen reply to me again.` })
      continue
    }
    reply = text || (ws.changes.length ? 'Done.' : '')
    break
  }

  if (!reply) reply = ws.changes.length ? 'I made those changes. Take a look at the preview.' : 'Sorry, I got stuck on that one. Could you try asking another way?'
  ws.syncCredits()
  // Only files the final draft still uses (she may have drawn a few versions).
  const used = JSON.stringify(ws.site.business)
  const media = ws.media.filter((m) => used.includes(`/u/${m.id}`))
  return { reply, changes: ws.changes, media, snapshot: ws.snapshot(), problems: ws.problems(), usage }
}

// Each step re-sends the whole conversation (the site, then every tool call
// and result). Marking the newest message lets the next step read all of
// that from the prompt cache at a tenth of the price. One moving marker plus
// the system prompt's stays within the API's four.
export function cacheLatest(messages: Anthropic.Beta.BetaMessageParam[]): void {
  for (const m of messages) {
    if (Array.isArray(m.content)) for (const b of m.content) delete (b as { cache_control?: unknown }).cache_control
  }
  const last = messages[messages.length - 1]
  if (!last) return
  if (typeof last.content === 'string') last.content = [{ type: 'text', text: last.content }]
  const blocks = last.content as { type: string; cache_control?: { type: 'ephemeral' } }[]
  const target = [...blocks].reverse().find((b) => b.type === 'text' || b.type === 'tool_result' || b.type === 'image')
  if (target) target.cache_control = { type: 'ephemeral' }
}
