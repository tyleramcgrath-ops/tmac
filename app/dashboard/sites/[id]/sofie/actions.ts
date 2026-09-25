'use server'

import { after } from 'next/server'
import { askSofie, type ChatTurn } from '@/lib/sofie'
import { requireUser } from '@/lib/session'
import { getStore, type SofieState } from '@/lib/store'
import { syncSitePhotos } from '@/lib/sites'
import { loadAccess } from '@/lib/billing'
import { costMicros, loadSpend, overCap, siteBudget } from '@/lib/usage'
import { dayString } from '@/lib/visits'
import { photoSetFor, reportUse, searchPhotos, unsplashReady } from '@/lib/unsplash'
import type { Page, Site } from '@/lib/schema'

export interface StudioState {
  chat: ChatTurn[]
  hasDraft: boolean
  canUndo: boolean
  // Sofie is still working on the last message.
  working: boolean
  // Page tabs for the preview, in menu order.
  pages: { slug: string; name: string }[]
  error?: string
  // This site has used its Sofie allowance (shown as a note from Tyler).
  limit?: boolean
}

const MAX_MESSAGE = 2000
const MAX_UNDO = 15
// A message still marked as in progress after this long has died with its
// server; let the owner send again.
const STALE_MS = 6 * 60 * 1000

async function load(siteId: string) {
  const user = await requireUser()
  const store = getStore()
  const site = await store.siteForUser(user.id, siteId)
  if (!site) throw new Error('Site not found')
  const [pages, state] = await Promise.all([store.pagesForSite(site.id), store.sofieState(site.id)])
  return { user, store, site, pages, state }
}

function isWorking(state: SofieState): boolean {
  return Boolean(state.pending && Date.now() - Date.parse(state.pending.at) < STALE_MS)
}

function tabs(site: Site, pages: Page[]): { slug: string; name: string }[] {
  const nav = site.nav.map((n) => n.href)
  const rank = (slug: string) => (slug === '' ? -1 : nav.indexOf(`/${slug}`) === -1 ? 99 : nav.indexOf(`/${slug}`))
  return [...pages].sort((a, b) => rank(a.slug) - rank(b.slug)).map((p) => ({ slug: p.slug, name: p.name }))
}

function view(state: SofieState, live: { site: Site; pages: Page[] }, error?: string): StudioState {
  const current = state.draft ?? live
  const message = error ?? state.error ?? undefined
  return {
    chat: state.chat,
    hasDraft: state.draft !== null,
    canUndo: state.history.length > 0,
    working: isWorking(state),
    pages: tabs(current.site, current.pages),
    ...(message ? { error: message } : {}),
  }
}

export async function getStudioState(siteId: string): Promise<StudioState> {
  const { site, pages, state } = await load(siteId)
  return view(state, { site, pages })
}

// Sofie runs after the response is sent, so a dropped connection (a phone
// switching networks, a proxy timing out) never loses her work. The studio
// polls getStudioState until she is done.
export async function sendToSofie(siteId: string, message: string): Promise<StudioState> {
  const { user, store, site, pages, state } = await load(siteId)
  const live = { site, pages }
  const text = message.trim().slice(0, MAX_MESSAGE)
  if (!text || isWorking(state)) return view(state, live)
  if (!process.env.ANTHROPIC_API_KEY) {
    return view(state, live, 'Sofie isn’t switched on yet: this server has no Anthropic API key. Add ANTHROPIC_API_KEY in the Vercel project settings, then try again.')
  }
  const access = await loadAccess(store, user)
  if (access.locked) return view(state, live, 'Your free trial has ended. Start your plan on the Account page and Sofie will pick up right where you left off.')
  // Spend caps (lib/usage), so one site or a bug can never run up a bill.
  const today = dayString(new Date())
  const spend = await loadSpend(store, site.id, user.createdAt)
  const payer = { status: access.status, plan: access.billing?.plan }
  const capped = overCap(spend, payer)
  if (capped) return { ...view(state, live, capped.message), ...(capped.kind === 'site-total' ? { limit: true } : {}) }
  const budgetMicros = siteBudget(spend, payer)

  const owner: ChatTurn = { role: 'owner', text, at: new Date().toISOString() }
  const started: SofieState = { ...state, chat: [...state.chat, owner].slice(-60), pending: { at: owner.at }, error: null }
  await store.saveSofieState(site.id, started)

  after(async () => {
    const current = state.draft ?? live
    try {
      const photos = (await store.mediaForSite(site.id)).filter((m) => m.mime !== 'image/svg+xml').map((m) => ({ src: `/u/${m.id}`, alt: m.alt, width: m.width, height: m.height }))
      const result = await askSofie({ snapshot: current, history: state.chat, message: text, photos, taken: await store.photosTaken(site.id), budgetMicros, ...(unsplashReady() ? { finder: { search: (q: string) => searchPhotos(store, q), set: (type: string, taken: Set<string>) => photoSetFor(store, type, taken) } } : {}) })
      await store.recordUsage(site.id, today, costMicros(result.usage))
      for (const m of result.media) {
        await store.addMedia({ id: m.id, siteId: site.id, mime: m.mime, width: m.width, height: m.height, alt: m.alt }, Buffer.from(m.data, 'utf8'))
      }
      const sofie: ChatTurn = { role: 'sofie', text: result.reply, ...(result.changes.length ? { changes: result.changes } : {}), at: new Date().toISOString() }
      await store.saveSofieState(site.id, {
        chat: [...started.chat, sofie].slice(-60),
        draft: result.changes.length ? result.snapshot : state.draft,
        history: result.changes.length ? [...state.history, current].slice(-MAX_UNDO) : state.history,
        pending: null,
        error: null,
      })
    } catch (e) {
      console.error('Sofie failed', e)
      await store.saveSofieState(site.id, { ...started, pending: null, error: 'Sofie couldn’t finish that just now. Please try again in a moment.' })
    }
  })

  return view(started, live)
}

// Step back one Sofie change. The first undo after publishing is not
// possible here; published versions live in the page revision history.
export async function undoSofie(siteId: string): Promise<StudioState> {
  const { store, site, pages, state } = await load(siteId)
  if (!state.history.length || isWorking(state)) return view(state, { site, pages })
  const previous = state.history[state.history.length - 1]
  const history = state.history.slice(0, -1)
  // Undoing back to the live version leaves no draft at all.
  const next = { chat: [...state.chat, { role: 'sofie' as const, text: 'Undone. The preview shows the version before my last change.', at: new Date().toISOString() }], draft: history.length ? previous : null, history }
  await store.saveSofieState(site.id, next)
  return view(next, { site, pages })
}

export async function discardDraft(siteId: string): Promise<StudioState> {
  const { store, site, pages, state } = await load(siteId)
  if (isWorking(state)) return view(state, { site, pages })
  const next = { chat: [...state.chat, { role: 'sofie' as const, text: 'I’ve thrown away the unpublished changes. Your live site is unchanged.', at: new Date().toISOString() }], draft: null, history: [] }
  await store.saveSofieState(site.id, next)
  return view(next, { site, pages })
}

export async function publishDraft(siteId: string): Promise<StudioState> {
  const { user, store, site, pages, state } = await load(siteId)
  if (!state.draft || isWorking(state)) return view(state, { site, pages })
  if ((await loadAccess(store, user)).locked) return view(state, { site, pages }, 'Your free trial has ended. Start your plan on the Account page to publish these changes; they’re saved.')
  const draft = state.draft
  // Only the owner's own site; ids that could point elsewhere are pinned.
  const nextSite = { ...draft.site, id: site.id, orgId: site.orgId, subdomain: site.subdomain, ...(site.customDomain ? { customDomain: site.customDomain } : {}), updatedAt: new Date().toISOString() }
  await store.updateSite(nextSite)
  // Pages Sofie added get fresh ids here, so a draft can never write over a
  // page that belongs to another site.
  const known = new Set(pages.map((p) => p.id))
  for (const p of draft.pages) {
    const id = known.has(p.id) ? p.id : `page_${crypto.randomUUID()}`
    await store.savePage({ ...p, id, siteId: site.id, updatedAt: new Date().toISOString() }, 'sofie', user.id, 'Published from Sofie')
  }
  await syncSitePhotos(site.id, store)
  // Tell Unsplash about photos that just went live.
  const before = new Set((site.credits ?? []).map((c) => c.photo))
  const fresh = (nextSite.credits ?? []).filter((c) => !before.has(c.photo))
  if (fresh.length) after(() => reportUse(fresh))
  const next = { chat: [...state.chat, { role: 'sofie' as const, text: 'Published. Your changes are live. Tap “View live site” at the top to see them.', at: new Date().toISOString() }], draft: null, history: [] }
  await store.saveSofieState(site.id, next)
  return view(next, { site: nextSite, pages: await store.pagesForSite(site.id) })
}
