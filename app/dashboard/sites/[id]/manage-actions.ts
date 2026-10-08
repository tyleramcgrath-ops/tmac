'use server'

import { revalidatePath } from 'next/cache'
import { after } from 'next/server'
import { redirect } from 'next/navigation'
import { DAYS, fromWeek, type WeekHours } from '@/lib/hours'
import { buildBlogIndex, buildPostPage } from '@/lib/posts'
import { randomBytes, randomUUID } from 'crypto'
import { FLAIRS, PageSeo, SiteSchema, type Flair, type Page, type Product, type Site } from '@/lib/schema'
import { requireUser } from '@/lib/session'
import { isAdmin } from '@/lib/admin'
import { DESIGN_GLOBALS, PALETTES, type Design } from '@/lib/starter'
import { drawLogoIdeas } from '@/lib/logo-ideas'
import { ImportError, importSite } from '@/lib/importer'
import { checkReviewUrl, googleReviewUrl } from '@/lib/reviews'
import { BOOKING_LABELS, BOOKING_LABELS_ES, checkBookingUrl, checkPromoLink } from '@/lib/promote'
import { checkEvent, upcomingEvents } from '@/lib/events'
import { vibeCheck } from '@/lib/vibe'
import { LEAGUE_STYLES } from '@/lib/league-style'
import { getStore, type LogoIdeasState } from '@/lib/store'
import { syncSitePhotos } from '@/lib/sites'
import { canSell, cleanPlan, loadAccess } from '@/lib/billing'
import { LIMIT_NOTE, costMicros, loadSpend, overCap, siteBudget } from '@/lib/usage'
import { dayString } from '@/lib/visits'
import { DOMAIN_CHECK_PATH, DOMAIN_CHECK_REPLY, cleanDomain } from '@/lib/hosts'
import { verified } from '@/lib/ownership'

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
  const flairPick = str(form, 'flair', 20) as Flair
  const flair = (FLAIRS as readonly string[]).includes(flairPick) ? flairPick : undefined
  // The form always sends its own fields; an older form without the
  // personality section leaves motion as it was.
  const motion = form.has('flair') ? !!form.get('motion') : undefined

  // Social pages: one https link per line; anything else is left out.
  const socials = String(form.get('socials') ?? '')
    .split(/\s+/)
    .map((u) => u.trim())
    .filter((u) => /^https:\/\/[^\s]+\.[^\s]+$/.test(u))
    .slice(0, 8)
  const chatKind = str(form, 'chatKind', 20)
  const chatTo = str(form, 'chatTo', 80)
  if (chatKind && !chatTo) return { error: 'Add the number or page name the chat button should go to.' }
  const chat = chatKind === 'sms' || chatKind === 'whatsapp' || chatKind === 'messenger' ? { kind: chatKind, to: chatTo } as const : undefined

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
        ...(form.has('socials') ? { sameAs: socials.length ? socials : undefined } : {}),
      },
      ...(form.has('chatKind') ? { chat } : {}),
      globals: { ...s.globals, ...(looks ?? {}), colors, ...(flair ? { flair } : {}), ...(motion === undefined ? {} : { motion }) },
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
// Built for a client: send it for their approval
// ---------------------------------------------------------------------------

export interface HandoffState {
  error?: string
  saved?: string
}

// The SaySites team builds a site, then sends the client a private link to
// look it over and approve it (app/approve). A new link replaces the old.
export async function sendForApproval(siteId: string, _prev: HandoffState, form: FormData): Promise<HandoffState> {
  const { user, store, site } = await ownSite(siteId)
  if (!isAdmin(user.email)) return { error: 'Only the SaySites team can send sites for approval.' }
  const plan = cleanPlan(form.get('plan'))
  const code = randomBytes(12).toString('hex')
  await store.updateSite({ ...site, handoff: { code, plan, sentAt: new Date().toISOString() }, updatedAt: new Date().toISOString() })
  revalidatePath(`/dashboard/sites/${site.id}`, 'layout')
  return { saved: 'Link ready. Copy it below and send it to your client.' }
}

export async function cancelApproval(siteId: string, _prev: HandoffState, _form: FormData): Promise<HandoffState> {
  const { user, store, site } = await ownSite(siteId)
  if (!isAdmin(user.email)) return { error: 'Only the SaySites team can do this.' }
  const { handoff: _old, ...rest } = site
  await store.updateSite({ ...rest, updatedAt: new Date().toISOString() })
  revalidatePath(`/dashboard/sites/${site.id}`, 'layout')
  return { saved: 'The link no longer works.' }
}

// ---------------------------------------------------------------------------
// Own domain
// ---------------------------------------------------------------------------

export interface DomainState {
  error?: string
  saved?: string
}

// The owner names their domain; we hold it as pending, and let the team
// know so SiteGround can add it and its certificate.
export async function requestDomain(siteId: string, _prev: DomainState, form: FormData): Promise<DomainState> {
  const { user, store, site } = await ownSite(siteId)
  const domain = cleanDomain(str(form, 'domain', 255))
  if (!domain) return { error: 'Type just the domain, like smithlaw.com.' }
  const taken = await store.siteByDomain(domain)
  if (taken && taken.id !== site.id) return { error: 'That domain is already connected to another SaySites website.' }
  await store.updateSite({ ...site, pendingDomain: domain, updatedAt: new Date().toISOString() })
  await store.addFeedback({
    id: randomUUID(),
    userId: user.id,
    name: user.name,
    email: user.email,
    text: `Domain to connect: ${domain} (and www.${domain}) for ${site.business.name}, ${site.subdomain}.saysites.com. In SiteGround: Domain > Parked Domains, add both; then Security > SSL Manager, Let's Encrypt for both.`,
    page: 'domain-request',
    at: new Date().toISOString(),
  })
  revalidatePath(`/dashboard/sites/${site.id}`, 'layout')
  return { saved: 'Saved. Now add the two records below at your domain company.' }
}

// Switches the site to its domain once https://domain/ reaches us.
export async function checkDomain(siteId: string, _prev: DomainState, _form: FormData): Promise<DomainState> {
  const { store, site } = await ownSite(siteId)
  const domain = site.pendingDomain
  if (!domain) return { error: 'Add your domain first.' }
  const reaches = async (host: string) => {
    try {
      const res = await fetch(`https://${host}${DOMAIN_CHECK_PATH}`, { cache: 'no-store', redirect: 'manual', signal: AbortSignal.timeout(8000) })
      return res.ok && (await res.text()).trim() === DOMAIN_CHECK_REPLY
    } catch {
      return false
    }
  }
  if (!(await reaches(domain))) {
    return { error: `${domain} doesn’t reach SaySites securely yet. Records can take a few hours to spread, and we add the security certificate within one working day. Try again later.` }
  }
  const www = await reaches(`www.${domain}`)
  const { pendingDomain: _done, ...rest } = site
  // Pointing the business's own domain here proves the site is theirs.
  const owned = rest.ownership && !rest.ownership.verified && rest.ownership.domain === domain ? { ownership: verified('domain', domain) } : {}
  await store.updateSite({ ...rest, customDomain: domain, ...owned, updatedAt: new Date().toISOString() })
  revalidatePath(`/dashboard/sites/${site.id}`, 'layout')
  return { saved: `Connected. Your site now lives at ${domain}.${www ? '' : ` (www.${domain} isn’t ready yet; it will follow.)`}` }
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
  const owner = await ownSite(siteId)
  if (!canSell(await loadAccess(owner.store, owner.user))) return { error: 'Selling online is on the Store plan. Switch plans on your Account page to add products.' }
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
  const access = await loadAccess(store, user)
  if (access.locked) return { ...logoView(state), error: 'Your free trial has ended. Start your plan on the Account page to keep designing.' }
  const today = dayString(new Date())
  const spend = await loadSpend(store, site.id, user.createdAt)
  const payer = { status: access.status, plan: access.billing?.plan }
  const capped = overCap(spend, payer)
  if (capped) return { ...logoView(state), error: capped.message }
  // A round of logo ideas costs about a dollar; keep room so the site stays under its limit.
  if (siteBudget(spend, payer) < 1.5e6) return { ...logoView(state), error: LIMIT_NOTE }
  const brief = ask.trim().slice(0, 500)
  const started: LogoIdeasState = { ...state, brief, pending: { at: new Date().toISOString() }, error: null }
  await store.saveLogoIdeas(site.id, started)
  after(async () => {
    try {
      let micros = 0
      const drawn = await drawLogoIdeas(site, brief, undefined, undefined, (u) => (micros += costMicros(u))).finally(() => store.recordUsage(site.id, today, micros))
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
  const live = pages.filter((p) => p.status === 'published')
  for (const p of pages.filter((x) => x.source && x.status === 'draft')) {
    const next = { ...p, status: 'published' as const, updatedAt: new Date().toISOString() }
    // Near-copies and keyword stuffing stay as drafts until they're fixed.
    if (vibeCheck(site, next, [...live, next]).blockers.length) continue
    await store.savePage(next, 'owner', user.id, 'Published imported page')
    live.push(next)
  }
  await syncSitePhotos(site.id, store)
  revalidatePath(`/dashboard/sites/${site.id}`, 'layout')
}

// ---------------------------------------------------------------------------
// Reviews
// ---------------------------------------------------------------------------

export async function saveReviewUrl(siteId: string, _prev: SettingsState, form: FormData): Promise<SettingsState> {
  const placeId = str(form, 'placeId', 200)
  const checked = placeId ? { url: googleReviewUrl(placeId) } : checkReviewUrl(str(form, 'reviewUrl', 500))
  if (checked.error) return { error: checked.error }
  await changeSite(siteId, (s) => ({ ...s, business: { ...s.business, reviewUrl: checked.url } }))
  return { saved: true }
}

// ---------------------------------------------------------------------------
// Promote: promotion bar and booking button
// ---------------------------------------------------------------------------

export async function savePromo(siteId: string, _prev: SettingsState, form: FormData): Promise<SettingsState> {
  const text = str(form, 'text', 100)
  if (!text) return { error: 'Write the promotion, like “10% off your first visit this month”.' }
  const link = checkPromoLink(str(form, 'href', 300))
  if (link.error) return { error: link.error }
  const until = str(form, 'until', 10)
  if (until && !/^\d{4}-\d{2}-\d{2}$/.test(until)) return { error: 'Pick the last day from the calendar, or leave it empty.' }
  if (until && until < new Date().toISOString().slice(0, 10)) return { error: 'That last day has already passed. Pick a later one, or leave it empty.' }
  await changeSite(siteId, (s) => ({ ...s, promo: { text, ...(link.href ? { href: link.href } : {}), ...(until ? { until } : {}) } }))
  return { saved: true }
}

export async function removePromo(siteId: string) {
  await changeSite(siteId, (s) => ({ ...s, promo: undefined }))
}

export async function saveBooking(siteId: string, _prev: SettingsState, form: FormData): Promise<SettingsState> {
  const checked = checkBookingUrl(str(form, 'url', 300))
  if (checked.error || !checked.url) return { error: checked.error }
  const label = str(form, 'label', 40)
  const labels: readonly string[] = [...BOOKING_LABELS, ...BOOKING_LABELS_ES]
  if (!labels.includes(label)) return { error: 'Pick what the button says.' }
  await changeSite(siteId, (s) => ({ ...s, header: { ...s.header, cta: { label, href: checked.url! } } }))
  return { saved: true }
}

// Back to the usual "get in touch" button when the site has a contact page.
export async function removeBooking(siteId: string) {
  const { store, site } = await ownSite(siteId)
  const pages = await store.pagesForSite(site.id)
  const contact = pages.find((p) => p.status === 'published' && /^(contact|contacto)$/.test(p.slug))
  const es = site.language.startsWith('es')
  await changeSite(siteId, (s) => {
    const { cta: _drop, ...rest } = s.header ?? {}
    return { ...s, header: contact ? { ...rest, cta: { label: es ? 'Contáctanos' : 'Get in touch', href: '/' + contact.slug } } : rest }
  })
}

// Events: added one at a time; past ones are tidied away whenever the list
// changes.
export async function addEvent(siteId: string, _prev: SettingsState, form: FormData): Promise<SettingsState> {
  const checked = checkEvent({ title: str(form, 'title', 100), date: str(form, 'date', 10), time: str(form, 'time', 5), place: str(form, 'place', 120), note: str(form, 'note', 300), href: str(form, 'href', 300) })
  if (checked.error || !checked.event) return { error: checked.error }
  const { site } = await ownSite(siteId)
  if (upcomingEvents(site).length >= 30) return { error: 'You have 30 events coming up, the most a site can list. Remove one to add another.' }
  const id = randomUUID().replace(/-/g, '').slice(0, 12)
  await changeSite(siteId, (s) => ({ ...s, events: [...upcomingEvents(s), { id, ...checked.event! }] }))
  return { saved: true }
}

export async function removeEvent(siteId: string, eventId: string) {
  await changeSite(siteId, (s) => {
    const left = upcomingEvents(s).filter((e) => e.id !== eventId)
    return { ...s, events: left.length ? left : undefined }
  })
}
