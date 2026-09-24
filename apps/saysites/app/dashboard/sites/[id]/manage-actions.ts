'use server'

import { revalidatePath } from 'next/cache'
import { DAYS, fromWeek, type WeekHours } from '@/lib/hours'
import { PageSeo, SiteSchema, type Page, type Site } from '@/lib/schema'
import { requireUser } from '@/lib/session'
import { DESIGN_GLOBALS, PALETTES, type Design } from '@/lib/starter'
import { getStore } from '@/lib/store'

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
