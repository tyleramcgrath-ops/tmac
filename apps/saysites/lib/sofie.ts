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
import { checkSpeed } from './speed'
import { renderPage } from './render'
import { PHOTOS } from './photos'

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

export class Workspace {
  site: Site
  pages: Page[]
  readonly changes: string[] = []

  constructor(snapshot: Snapshot) {
    this.site = structuredClone(snapshot.site)
    this.pages = structuredClone(snapshot.pages)
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
    }
    return out
  }
}

export class ToolError extends Error {}

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
      'Change site-wide settings as a JSON object string. Allowed keys: business (name, phone, email, address, hours, priceRange; merged), globals (colors, fonts, radius, headingWeight, headingTracking, headingCase, buttonShape, buttonCase, baseFontSize, typeScale; merged), header (topbar, cta; merged), nav (replaced), tagline. Set a key to null to remove it.',
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

export function runTool(ws: Workspace, name: string, input: Record<string, unknown>): string {
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

const PHOTO_LIST = Object.entries(PHOTOS)
  .map(([k, set]) => `- ${k}: ${[set.hero, ...set.cards].map((p) => `${p.src} (${p.width}x${p.height}, "${p.alt}")`).join('; ')}`)
  .join('\n')

export const SOFIE_SYSTEM = `You are Sofie, the website assistant inside SaySites, a website builder for small local businesses. The person you are talking to owns the business and is usually not technical. You change their website by calling tools; you never write HTML.

How to work:
- Do what they ask, fully, in as few tool calls as makes sense. If a request is ambiguous in a way that matters (which page, what the new wording should say, a fact you don't know), ask one short question instead of guessing.
- Never invent facts about the business: prices, licenses, certifications, awards, reviews, years in business, guarantees. Use only what the owner told you or what is already on the site. If they ask for something that needs a fact you don't have, ask for it.
- Keep the site's existing look: reuse its color tokens, spacing and patterns (copy the structure of a similar section on the same page when adding one). Write copy that is warm, plain and specific to this business, short sentences, no hype words.
- When the owner describes a whole website (a Talk & Design prompt) and the site already follows that layout, don't rebuild it from scratch: go through it and make every headline, paragraph, card, question and Google title specific to their business and their words, and add anything they described that is missing.
- After changing things, reply in one to three short sentences saying what you did in plain English, and offer one sensible next step only if it is genuinely useful. Don't list ids or technical details.

The content model (enforced; invalid changes are rejected with a reason, then fix and retry):
- A page body is an array of top-level containers (sections). Container: {"id","type":"container","tag"?: "section"|"div"|..., "layout":"flex"|"grid", "direction"?: {"desktop":"row"|"column", "mobile"?}, "columns"?: {"desktop":n,"tablet"?:n,"mobile"?:n} (grid), "align"?: "start"|"center"|"end"|"stretch", "justify"?: "start"|"center"|"end"|"between", "boxed"?: true (full-width background, content capped to site width), "backgroundImage"?: {"src","width","height","overlay":0-0.95,"overlayStyle"?:"full"|"side","priority"?:bool}, "style"?, "children":[...] }.
- Widgets: heading {"id","type":"heading","level":1-6,"text"}; text {"id","type":"text","text"} (blank line = new paragraph); image {"id","type":"image","src","alt" (required, descriptive),"width","height","aspect"?: ratio like 1.5,"priority"?: bool}; button {"id","type":"button","label","href","variant":"primary"|"secondary"|"outline"}; faq {"id","type":"faq","items":[{"question","answer"}]}; form (a contact form whose messages go to the owner's inbox) {"id","type":"form","fields":["name","email","phone","message"] (any of these, in order),"submitLabel","thanks"?: note shown after sending}.
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
  snapshot: Snapshot
  problems: string[]
}

const MAX_STEPS = 16

// The request goes through this one typed seam so the file also compiles
// where an older SDK (without the newest request fields) is installed, such
// as the repository root that type-checks the tests.
type CreateParams = Record<string, unknown> & { messages: Anthropic.Beta.BetaMessageParam[] }
function createMessage(client: Anthropic, params: CreateParams): Promise<Anthropic.Beta.BetaMessage> {
  const create = client.beta.messages.create as unknown as (p: CreateParams) => Promise<Anthropic.Beta.BetaMessage>
  return create.call(client.beta.messages, params)
}

export async function askSofie(input: { snapshot: Snapshot; history: ChatTurn[]; message: string; client?: Anthropic }): Promise<SofieResult> {
  const client = input.client ?? new Anthropic()
  const ws = new Workspace(input.snapshot)

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
      { type: 'text', text: `The website as it is right now (JSON):\n${JSON.stringify({ site: ws.site, pages: ws.pages })}` },
      { type: 'text', text: input.message },
    ],
  })

  let reply = ''
  let gateRounds = 0
  for (let step = 0; step < MAX_STEPS; step++) {
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

    if (response.stop_reason === 'refusal') {
      reply = 'Sorry, I can’t help with that one. Could you put it another way?'
      break
    }
    messages.push({ role: 'assistant', content: response.content })
    const text = response.content.flatMap((b) => (b.type === 'text' ? [b.text] : [])).join('\n').trim()
    const calls = response.content.filter((b): b is Anthropic.Beta.BetaToolUseBlock => b.type === 'tool_use')

    if (calls.length) {
      const results: Anthropic.Beta.BetaToolResultBlockParam[] = calls.map((c) => {
        const out = runTool(ws, c.name, c.input as Record<string, unknown>)
        return { type: 'tool_result', tool_use_id: c.id, content: out, ...(out.startsWith('Error:') ? { is_error: true } : {}) }
      })
      messages.push({ role: 'user', content: results })
      continue
    }
    if (response.stop_reason === 'pause_turn') continue

    // Sofie is done. Hold her to the same gate as a publish.
    const problems = ws.changes.length ? ws.problems() : []
    if (problems.length && gateRounds < 2) {
      gateRounds++
      messages.push({ role: 'user', content: `Before you finish: the site now fails these checks. Fix them with tools, then reply to me again.\n- ${problems.join('\n- ')}` })
      continue
    }
    reply = text || (ws.changes.length ? 'Done.' : '')
    break
  }

  if (!reply) reply = ws.changes.length ? 'I made those changes. Take a look at the preview.' : 'Sorry, I got stuck on that one. Could you try asking another way?'
  return { reply, changes: ws.changes, snapshot: ws.snapshot(), problems: ws.problems() }
}
