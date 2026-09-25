'use server'

import { revalidatePath } from 'next/cache'
import { after } from 'next/server'
import { redirect } from 'next/navigation'
import { DAYS, fromWeek, type WeekHours } from '@/lib/hours'
import { buildBlogIndex, buildPostPage } from '@/lib/posts'
import { randomUUID } from 'crypto'
import { PageSeo, SiteSchema, type Page, type Product, type Site } from '@/lib/schema'
import { requireUser } from '@/lib/session'
import { DESIGN_GLOBALS, PALETTES, type Design } from '@/lib/starter'
import { drawLogoIdeas } from '@/lib/logo-ideas'
import { ImportError, importSite } from '@/lib/importer'
import { LEAGUE_STYLES } from '@/lib/league-style'
import { getStore, type LogoIdeasState } from '@/lib/store'

async function ownSite(siteId: string) {
  const user = await requireUser()
  const store = getStore()
  const site = await store.siteForUser(user.id, siteId)
  if (!site) throw new Error('Site not found')
  return { user, store, site }
}

const str = (f: FormData, k: string, max = 200) => String(f.get(k) ?? '').trim().slice(0, max)

// ---------------------------------------------------------------------------
// Messages
// ---------------------------------------------------------------------------

export async function setRead(siteId: string, messageId: string, read: boolean) {
  const { store, site } = await ownSite(siteId)
  await store.setMessageRead(site.id, messageId, read)
  revalidatePath(`/dashboard/sites/${site.id}`, 'layout')
}

export async function removeMessage(siteId: string, messageId: string) {
  const { store, site } = await ownSite(siteId)
  await store.deleteMessage(site.id, messageId)
  revalidatePath(`/dashboard/sites/${site.id}`, 'layout')
}

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

export interface SettingsState {
  error?: string
  saved?: boolean
}

export async function saveSettings(siteId: string, _prev: SettingsState, form: FormData): Promise<SettingsState> {
  const { store, site } = await ownSite(siteId)

  const name = str(form, 'name', 120)
  if (!name) return { error: 'Your business needs a name.' }
  const email = str(form, 'email')
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: 'That email address doesn’t look right.' }
  const street = str(form, 'street'), city = str(form, 'city', 80), region = str(form, 'region', 40), postalCode = str(form, 'postalCode', 20)
  const anyAddress = street || postalCode
  if (anyAddress && !(street && city && region && postalCode)) return { error: 'To show your address, fill in the street, city, state and ZIP code.' }

  const week = Object.fromEntries(
    DAYS.map((d) => [d, form.get(`open-${d}`) ? { open: str(form, `from-${d}`, 5), close: str(form, `to-${d}`, 5) } : null])
  ) as WeekHours
  for (const d of DAYS) {
    const h = week[d]
    if (h && !(h.open < h.close)) return { error: 'Each open day needs a closing time after its opening time.' }
  }
  const hours = fromWeek(week)

  const palette = str(form, 'palette', 20)
  const design = str(form, 'design', 20) as Design
  const colors = palette && PALETTES[palette] ? PALETTES[palette].colors : site.globals.colors
  const looks = design in DESIGN_GLOBALS ? DESIGN_GLOBALS[design] : null

  const topbar = str(form, 'topbar', 120)
  const ctaLabel = str(form, 'ctaLabel', 40)
  const tagline = str(form, 'tagline', 200)

  const apply = (s: Site): Site => {
    const next: Site = {
      ...s,
      business: {
        ...s.business,
        name,
        phone: str(form, 'phone', 30) || undefined,
        email: email || undefined,
        address: anyAddress ? { street, city, region, postalCode, country: s.business.address?.country ?? 'US' } : undefined,
        hours: hours.length ? hours : undefined,
      },
      globals: { ...s.globals, ...(looks ?? {}), colors },
      header: {
        ...(topbar ? { topbar } : {}),
        ...(ctaLabel && s.header?.cta ? { cta: { ...s.header.cta, label: ctaLabel } } : s.header?.cta ? { cta: s.header.cta } : {}),
        ...(form.get('callBar') ? {} : { callBar: false }),
      },
      tagline: tagline || undefined,
      updatedAt: new Date().toISOString(),
    }
    return SiteSchema.parse(JSON.parse(JSON.stringify(next)))
  }

  let next: Site
  try {
    next = apply(site)
  } catch {
    return { error: 'Some of those details aren’t valid. Please check them and try again.' }
  }
  await store.updateSite(next)
  // Keep Sofie's unpublished draft in step, so publishing it later doesn't
  // undo these settings.
  const state = await store.sofieState(site.id)
  if (state.draft) {
    try {
      await store.saveSofieState(site.id, { ...state, draft: { ...state.draft, site: apply(state.draft.site) } })
    } catch {
      // A draft that can't take the change keeps its own values.
    }
  }
  revalidatePath(`/dashboard/sites/${site.id}`, 'layout')
  return { saved: true }
}

// ---------------------------------------------------------------------------
// Pages & SEO
// ---------------------------------------------------------------------------

export async function savePageSeo(siteId: string, pageId: string, _prev: SettingsState, form: FormData): Promise<SettingsState> {
  const { user, store, site } = await ownSite(siteId)
  const pages = await store.pagesForSite(site.id)
  const page = pages.find((p) => p.id === pageId)
  if (!page) return { error: 'That page no longer exists.' }
  const seo = PageSeo.safeParse({
    ...page.seo,
    title: str(form, 'title', 70),
    description: str(form, 'description', 170),
    noindex: form.get('noindex') ? true : undefined,
  })
  if (!seo.success) return { error: 'Give the page a Google title (up to 70 characters) and a description (up to 170).' }
  const clean = JSON.parse(JSON.stringify(seo.data)) as Page['seo']
  await store.savePage({ ...page, seo: clean, updatedAt: new Date().toISOString() }, 'owner', user.id, 'Updated Google listing')
  const state = await store.sofieState(site.id)
  if (state.draft) {
    const draft = { ...state.draft, pages: state.draft.pages.map((p) => (p.id === page.id ? { ...p, seo: clean } : p)) }
    await store.saveSofieState(site.id, { ...state, draft })
  }
  revalidatePath(`/dashboard/sites/${site.id}`, 'layout')
  return { saved: true }
}

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------

// Applies a change to the live site and to Sofie's draft (if any), so the two
// never drift apart.
async function changeSite(siteId: string, fn: (s: Site) => Site) {
  const { store, site } = await ownSite(siteId)
  const next = SiteSchema.parse(JSON.parse(JSON.stringify({ ...fn(site), updatedAt: new Date().toISOString() })))
  await store.updateSite(next)
  const state = await store.sofieState(site.id)
  if (state.draft) {
    try {
      const d = SiteSchema.parse(JSON.parse(JSON.stringify(fn(state.draft.site))))
      await store.saveSofieState(site.id, { ...state, draft: { ...state.draft, site: d } })
    } catch {
      // Leave a draft that can't take the change as it is.
    }
  }
  revalidatePath(`/dashboard/sites/${site.id}`, 'layout')
  return next
}

export async function saveProduct(siteId: string, productId: string, _prev: SettingsState, form: FormData): Promise<SettingsState> {
  const name = str(form, 'name', 120)
  if (!name) return { error: 'Give the product a name.' }
  const priceText = str(form, 'price', 20).replace(/[$,£€\s]/g, '')
  if (!/^\d+(\.\d{1,2})?$/.test(priceText)) return { error: 'Enter a price like 24 or 24.50.' }
  const price = Math.round(Number(priceText) * 100)
  const buyUrl = str(form, 'buyUrl', 300)
  if (buyUrl && !/^https:\/\/(buy|checkout)\.stripe\.com\/[\w/-]+$/.test(buyUrl)) return { error: 'The buy link should be a Stripe payment link, like https://buy.stripe.com/abc123.' }
  const imageSrc = str(form, 'imageSrc', 500)
  if (imageSrc && !/^(https:\/\/[^\s]+|\/u\/[a-f0-9]{32})$/.test(imageSrc)) return { error: 'The photo needs to be one of your photos or a link starting with https://.' }
  const description = str(form, 'description', 600)
  const product: Product = {
    id: productId === 'new' ? `p-${randomUUID().slice(0, 8)}` : productId,
    name,
    price,
    ...(description ? { description } : {}),
    ...(imageSrc ? { image: { src: imageSrc, alt: str(form, 'imageAlt', 250) || name } } : {}),
    ...(buyUrl ? { buyUrl } : {}),
    ...(form.get('soldOut') ? { soldOut: true } : {}),
  }
  try {
    await changeSite(siteId, (s) => {
      const list = s.store?.products ?? []
      const products = productId === 'new' ? [...list, product] : list.map((p) => (p.id === productId ? product : p))
      return { ...s, store: { currency: s.store?.currency ?? 'USD', products } }
    })
  } catch {
    return { error: 'That product couldn’t be saved. Check the details and try again.' }
  }
  return { saved: true }
}

export async function deleteProduct(siteId: string, productId: string) {
  await changeSite(siteId, (s) => ({ ...s, store: { currency: s.store?.currency ?? 'USD', products: (s.store?.products ?? []).filter((p) => p.id !== productId) } }))
}

export async function setCurrency(siteId: string, form: FormData) {
  const currency = str(form, 'currency', 3) as 'USD'
  await changeSite(siteId, (s) => ({ ...s, store: { currency, products: s.store?.products ?? [] } }))
}

// Adds a "Shop" page with every product and puts it in the menu.
export async function addShopPage(siteId: string) {
  const { user, store, site } = await ownSite(siteId)
  const pages = await store.pagesForSite(site.id)
  if (!pages.some((p) => p.slug === 'shop')) {
    const page: Page = {
      id: `page_${randomUUID()}`,
      siteId: site.id,
      slug: 'shop',
      name: 'Shop',
      status: 'published',
      seo: {
        title: `Shop ${site.business.name}`.slice(0, 60),
        description: `Buy from ${site.business.name} online. Prices, photos and secure checkout.`.slice(0, 160),
      },
      body: [
        {
          id: 'shop',
          type: 'container',
          tag: 'section',
          layout: 'flex',
          boxed: true,
          style: { padding: { desktop: { top: 88, right: 24, bottom: 96, left: 24 }, mobile: { top: 48, right: 20, bottom: 56, left: 20 } }, gap: { desktop: 14 } },
          children: [
            { id: 'shop-h', type: 'heading', level: 1, text: 'Shop', style: { fontSize: { desktop: 52, mobile: 36 } } },
            { id: 'shop-t', type: 'text', text: `Order online from ${site.business.name}. Payments go securely through Stripe.`, style: { color: 'muted', fontSize: { desktop: 18 }, maxWidth: 560 } },
            { id: 'shop-products', type: 'products', style: { margin: { desktop: { top: 28, right: 0, bottom: 0, left: 0 } } } },
          ],
        },
      ],
      updatedAt: new Date().toISOString(),
    }
    await store.savePage(page, 'owner', user.id, 'Added the Shop page')
    const state = await store.sofieState(site.id)
    if (state.draft && !state.draft.pages.some((p) => p.slug === 'shop')) {
      await store.saveSofieState(site.id, { ...state, draft: { ...state.draft, pages: [...state.draft.pages, page] } })
    }
  }
  await changeSite(siteId, (s) => (s.nav.some((n) => n.href === '/shop') ? s : { ...s, nav: [{ label: 'Shop', href: '/shop' }, ...s.nav].slice(0, 12) }))
}

// ---------------------------------------------------------------------------
// Delete
// ---------------------------------------------------------------------------

export async function deleteWebsite(siteId: string, _prev: SettingsState, form: FormData): Promise<SettingsState> {
  const { user, store, site } = await ownSite(siteId)
  if (str(form, 'confirm', 200).toLowerCase() !== site.business.name.trim().toLowerCase()) {
    return { error: `Type “${site.business.name}” exactly to confirm.` }
  }
  await store.deleteSite(user.id, site.id)
  redirect('/dashboard?deleted=1')
}

// ---------------------------------------------------------------------------
// Blog posts
// ---------------------------------------------------------------------------

// Saves a post (new, or an existing one by page id) and makes sure the site
// has a /blog page in its menu to list it.
export async function savePost(siteId: string, pageId: string, _prev: SettingsState, form: FormData): Promise<SettingsState> {
  const { user, store, site } = await ownSite(siteId)
  const title = str(form, 'title', 140)
  const body = String(form.get('body') ?? '').trim().slice(0, 20_000)
  const date = str(form, 'date', 10)
  if (!title) return { error: 'Give the post a title.' }
  if (body.length < 40) return { error: 'Write a little more: a post needs at least a couple of sentences.' }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { error: 'Pick a date for the post.' }
  const imageSrc = str(form, 'imageSrc', 500)
  if (imageSrc && !/^(https:\/\/[^\s]+|\/u\/[a-f0-9]{32})$/.test(imageSrc)) return { error: 'The photo needs to be one of your photos or a link starting with https://.' }

  const pages = await store.pagesForSite(site.id)
  const existing = pageId === 'new' ? undefined : pages.find((p) => p.id === pageId && p.post)
  if (pageId !== 'new' && !existing) return { error: 'That post no longer exists.' }
  let page = buildPostPage(site, { title, date, body, ...(imageSrc ? { image: { src: imageSrc, alt: str(form, 'imageAlt', 250) || title } } : {}) }, existing)
  // A new post never takes over an existing page's address.
  if (!existing) {
    let slug = page.slug
    for (let n = 2; pages.some((p) => p.slug === slug); n++) slug = `${page.slug}-${n}`
    page = { ...page, slug }
  }
  await store.savePage(page, 'owner', user.id, existing ? 'Edited a blog post' : 'Wrote a blog post')
  if (!pages.some((p) => p.slug === 'blog')) await store.savePage(buildBlogIndex(site), 'owner', user.id, 'Added the blog')

  const state = await store.sofieState(site.id)
  if (state.draft) {
    const others = state.draft.pages.filter((p) => p.id !== page.id)
    const withBlog = others.some((p) => p.slug === 'blog') ? others : [...others, buildBlogIndex(site)]
    await store.saveSofieState(site.id, { ...state, draft: { ...state.draft, pages: [...withBlog, page] } })
  }
  await changeSite(siteId, (s) => (s.nav.some((n) => n.href === '/blog') ? s : { ...s, nav: [...s.nav.filter((n) => n.href !== '/contact'), { label: 'Blog', href: '/blog' }, ...s.nav.filter((n) => n.href === '/contact')].slice(0, 12) }))
  return { saved: true }
}

export async function deletePost(siteId: string, pageId: string) {
  const { user, store, site } = await ownSite(siteId)
  const pages = await store.pagesForSite(site.id)
  const page = pages.find((p) => p.id === pageId && p.post)
  if (!page) return
  // Unpublished rather than erased, so it stays in the page history.
  await store.savePage({ ...page, status: 'draft', updatedAt: new Date().toISOString() }, 'owner', user.id, 'Removed a blog post')
  const state = await store.sofieState(site.id)
  if (state.draft) await store.saveSofieState(site.id, { ...state, draft: { ...state.draft, pages: state.draft.pages.filter((p) => p.id !== page.id) } })
  revalidatePath(`/dashboard/sites/${site.id}`, 'layout')
}

// ---------------------------------------------------------------------------
// Photos
// ---------------------------------------------------------------------------

const MAX_PHOTO_BYTES = 3 * 1024 * 1024
const MAX_PHOTOS = 80
const IMAGE_TYPES = ['image/webp', 'image/jpeg', 'image/png']

export interface UploadState {
  error?: string
  saved?: boolean
}

export async function uploadPhoto(siteId: string, _prev: UploadState, form: FormData): Promise<UploadState> {
  const { store, site } = await ownSite(siteId)
  const file = form.get('file')
  if (!(file instanceof File) || file.size === 0) return { error: 'Choose a photo first.' }
  if (!IMAGE_TYPES.includes(file.type)) return { error: 'Use a JPEG, PNG or WebP photo.' }
  if (file.size > MAX_PHOTO_BYTES) return { error: 'That photo is too large. Try a smaller one.' }
  const width = Math.round(Number(form.get('width')))
  const height = Math.round(Number(form.get('height')))
  if (!(width > 0 && height > 0 && width <= 4000 && height <= 4000)) return { error: 'That photo couldn’t be read. Try another one.' }
  if ((await store.mediaForSite(site.id)).filter((m) => m.mime !== 'image/svg+xml').length >= MAX_PHOTOS) return { error: `You can keep up to ${MAX_PHOTOS} photos. Delete some to add more.` }
  const alt = str(form, 'alt', 200) || `Photo from ${site.business.name}`
  const data = Buffer.from(await file.arrayBuffer())
  const media = await store.addMedia({ siteId: site.id, mime: file.type, width, height, alt }, data)
  if (form.get('asLogo')) {
    await changeSite(siteId, (s) => ({ ...s, business: { ...s.business, logo: `/u/${media.id}`, icon: undefined } }))
  }
  revalidatePath(`/dashboard/sites/${site.id}`, 'layout')
  return { saved: true }
}

export async function removePhoto(siteId: string, mediaId: string) {
  const { store, site } = await ownSite(siteId)
  await store.deleteMedia(site.id, mediaId)
  if (site.business.logo === `/u/${mediaId}` || site.business.icon === `/u/${mediaId}`)
    await changeSite(siteId, (s) => ({ ...s, business: { ...s.business, logo: s.business.logo === `/u/${mediaId}` ? undefined : s.business.logo, icon: s.business.icon === `/u/${mediaId}` ? undefined : s.business.icon } }))
  revalidatePath(`/dashboard/sites/${site.id}`, 'layout')
}

export async function setLogo(siteId: string, mediaId: string | null) {
  const { store, site } = await ownSite(siteId)
  if (mediaId && !(await store.mediaForSite(site.id)).some((m) => m.id === mediaId)) return
  await changeSite(siteId, (s) => ({ ...s, business: { ...s.business, logo: mediaId ? `/u/${mediaId}` : undefined, icon: undefined } }))
}

// Puts the latest photos on the home page as an "Our work" gallery (or
// refreshes the one already there), just above the questions section.
export async function addGalleryToHome(siteId: string) {
  const { user, store, site } = await ownSite(siteId)
  const photos = (await store.mediaForSite(site.id)).filter((m) => m.mime !== 'image/svg+xml').slice(0, 9)
  if (!photos.length) return
  const section: Page['body'][number] = {
    id: 'our-work',
    type: 'container',
    tag: 'section',
    layout: 'flex',
    boxed: true,
    style: { padding: { desktop: { top: 88, right: 24, bottom: 88, left: 24 }, mobile: { top: 52, right: 20, bottom: 52, left: 20 } }, gap: { desktop: 28 } },
    children: [
      { id: 'our-work-h', type: 'heading', level: 2, text: 'Our work', style: { fontSize: { desktop: 42, mobile: 30 } } },
      { id: 'our-work-g', type: 'gallery', columns: photos.length % 2 === 0 && photos.length < 6 ? 2 : 3, images: photos.map((m) => ({ src: `/u/${m.id}`, alt: m.alt, width: m.width, height: m.height })) },
    ],
  }
  const place = (body: Page['body']): Page['body'] => {
    const rest = body.filter((c) => c.id !== 'our-work')
    const faq = rest.findIndex((c) => c.id === 'faq')
    const at = faq === -1 ? rest.length : faq
    return [...rest.slice(0, at), section, ...rest.slice(at)]
  }
  const pages = await store.pagesForSite(site.id)
  const home = pages.find((p) => p.slug === '')
  if (!home) return
  await store.savePage({ ...home, body: place(home.body), updatedAt: new Date().toISOString() }, 'owner', user.id, 'Added an Our work gallery')
  const state = await store.sofieState(site.id)
  if (state.draft) {
    await store.saveSofieState(site.id, { ...state, draft: { ...state.draft, pages: state.draft.pages.map((p) => (p.slug === '' ? { ...p, body: place(p.body) } : p)) } })
  }
  revalidatePath(`/dashboard/sites/${site.id}`, 'layout')
}

// Search engine verification codes. Accepts the bare code or the whole
// <meta> tag Search Console shows, and keeps just the code.
export async function saveVerification(siteId: string, _prev: SettingsState, form: FormData): Promise<SettingsState> {
  const pick = (k: string) => {
    const raw = str(form, k, 300)
    const m = raw.match(/content=["']([^"']+)["']/)
    return (m ? m[1] : raw).trim()
  }
  const google = pick('google')
  const bing = pick('bing')
  const ok = (v: string) => !v || /^[\w-]{10,100}$/.test(v)
  if (!ok(google) || !ok(bing)) return { error: 'That doesn’t look like a verification code. Paste the code, or the whole meta tag.' }
  await changeSite(siteId, (s) => ({ ...s, verification: google || bing ? { ...(google ? { google } : {}), ...(bing ? { bing } : {}) } : undefined }))
  return { saved: true }
}

// ---------------------------------------------------------------------------
// Logo ideas: Sofie sketches three directions in the background; the owner
// picks one. The Photos page polls getLogoIdeas while she works.
// ---------------------------------------------------------------------------

// Drawing three logos takes Sofie up to a couple of minutes; after that an
// unfinished request has died with its server and can be asked again.
const LOGO_STALE_MS = 5 * 60 * 1000

export interface LogoIdeasView {
  working: boolean
  error?: string
  ideas: { name: string; note: string; logo: string; icon: string }[]
  brief: string
}

function logoView(state: LogoIdeasState): LogoIdeasView {
  const working = Boolean(state.pending && Date.now() - Date.parse(state.pending.at) < LOGO_STALE_MS)
  return { working, ideas: state.ideas, brief: state.brief ?? '', ...(state.error && !working ? { error: state.error } : {}) }
}

export async function getLogoIdeas(siteId: string): Promise<LogoIdeasView> {
  const { store, site } = await ownSite(siteId)
  return logoView(await store.logoIdeas(site.id))
}

export async function requestLogoIdeas(siteId: string, ask: string): Promise<LogoIdeasView> {
  const { user, store, site } = await ownSite(siteId)
  const state = await store.logoIdeas(site.id)
  if (logoView(state).working) return logoView(state)
  if (!process.env.ANTHROPIC_API_KEY) return { ...logoView(state), error: 'Sofie isn’t switched on yet: this server has no Anthropic API key.' }
  const brief = ask.trim().slice(0, 500)
  const started: LogoIdeasState = { ...state, brief, pending: { at: new Date().toISOString() }, error: null }
  await store.saveLogoIdeas(site.id, started)
  after(async () => {
    try {
      const drawn = await drawLogoIdeas(site, brief)
      if (!drawn.length) throw new Error('no usable ideas')
      const ideas = []
      for (const d of drawn) {
        const save = async (svg: { svg: string; width: number; height: number }, alt: string) => {
          const m = await store.addMedia({ siteId: site.id, mime: 'image/svg+xml', width: svg.width, height: svg.height, alt }, Buffer.from(svg.svg, 'utf8'))
          return `/u/${m.id}`
        }
        ideas.push({ name: d.name, note: d.note, logo: await save(d.logo, `${site.business.name} logo`), icon: await save(d.icon, `${site.business.name} icon`) })
      }
      // Clear out the last round's files, except any the site now uses.
      const now = await store.siteForUser(user.id, site.id)
      const inUse = new Set([now?.business.logo, now?.business.icon, site.business.logo, site.business.icon])
      for (const old of state.ideas) for (const src of [old.logo, old.icon]) if (!inUse.has(src)) await store.deleteMedia(site.id, src.slice(3))
      await store.saveLogoIdeas(site.id, { brief, ideas, pending: null, error: null })
    } catch (e) {
      console.error('Logo ideas failed', e)
      await store.saveLogoIdeas(site.id, { ...started, pending: null, error: 'Sofie couldn’t finish those logos just now. Please try again.' })
    }
  })
  return logoView(started)
}

export async function chooseLogoIdea(siteId: string, index: number) {
  const { store, site } = await ownSite(siteId)
  const idea = (await store.logoIdeas(site.id)).ideas[index]
  if (!idea) return
  await changeSite(siteId, (s) => ({ ...s, business: { ...s.business, logo: idea.logo, icon: idea.icon } }))
}

// ---------------------------------------------------------------------------
// Leagues
// ---------------------------------------------------------------------------

export async function setLeaguePublic(siteId: string, form: FormData) {
  const { store, site } = await ownSite(siteId)
  await store.updateSite(SiteSchema.parse({ ...site, league: { ...site.league, public: form.get('public') === 'on' }, updatedAt: new Date().toISOString() }))
  revalidatePath(`/dashboard/sites/${site.id}`, 'layout')
  revalidatePath('/visibility-index')
}

export async function setLeagueStyle(siteId: string, form: FormData) {
  const { store, site } = await ownSite(siteId)
  const style = String(form.get('style') ?? '')
  if (!(LEAGUE_STYLES as readonly string[]).includes(style)) return
  await store.updateSite(SiteSchema.parse({ ...site, league: { public: site.league?.public ?? false, style }, updatedAt: new Date().toISOString() }))
  revalidatePath(`/dashboard/sites/${site.id}`, 'layout')
}

// ---------------------------------------------------------------------------
// Moving from another website
// ---------------------------------------------------------------------------

export interface MoveResult {
  error?: string
  start?: string
  imported?: { from: string; to: string; title: string }[]
  mapped?: { from: string; to: string }[]
  redirects?: number
  skipped?: { from: string; reason: string }[]
}

export async function importFromSite(siteId: string, _prev: MoveResult, form: FormData): Promise<MoveResult> {
  const { user, store, site } = await ownSite(siteId)
  const pages = await store.pagesForSite(site.id)
  try {
    const plan = await importSite(site, pages, String(form.get('url') ?? '').slice(0, 300))
    for (const p of plan.pages) await store.savePage(p, 'import', user.id, `Imported from ${p.source}`)
    // New redirects join the existing ones; an old address already redirected keeps its first target.
    const existing = await store.redirectsForSite(site.id)
    const known = new Set(existing.map((r) => r.from))
    const live = new Set(pages.filter((p) => p.status === 'published').map((p) => (p.slug ? `/${p.slug}` : '/')))
    const added = plan.redirects.filter((r) => !known.has(r.from) && !live.has(r.from))
    await store.saveRedirects(site.id, [...existing, ...added])
    revalidatePath(`/dashboard/sites/${site.id}`, 'layout')
    return {
      start: plan.start,
      imported: plan.pages.map((p) => ({ from: new URL(p.source!).pathname, to: `/${p.slug}`, title: p.name })),
      mapped: plan.mapped,
      redirects: added.length,
      skipped: plan.skipped,
    }
  } catch (e) {
    if (e instanceof ImportError) return { error: e.message }
    console.error('import failed', e)
    return { error: 'Something went wrong reading that site. Please try again.' }
  }
}

// Imported pages wait as drafts; this puts them live, e.g. once the domain points here.
export async function publishImported(siteId: string) {
  const { user, store, site } = await ownSite(siteId)
  const pages = await store.pagesForSite(site.id)
  for (const p of pages.filter((x) => x.source && x.status === 'draft')) {
    await store.savePage({ ...p, status: 'published', updatedAt: new Date().toISOString() }, 'owner', user.id, 'Published imported page')
  }
  revalidatePath(`/dashboard/sites/${site.id}`, 'layout')
}
