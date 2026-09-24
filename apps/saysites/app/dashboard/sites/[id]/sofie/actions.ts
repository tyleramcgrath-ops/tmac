'use server'

import { askSofie, type ChatTurn } from '@/lib/sofie'
import { requireUser } from '@/lib/session'
import { getStore } from '@/lib/store'

export interface StudioState {
  chat: ChatTurn[]
  hasDraft: boolean
  canUndo: boolean
  error?: string
}

const MAX_MESSAGE = 2000
const MAX_UNDO = 15

async function load(siteId: string) {
  const user = await requireUser()
  const store = getStore()
  const site = await store.siteForUser(user.id, siteId)
  if (!site) throw new Error('Site not found')
  const [pages, state] = await Promise.all([store.pagesForSite(site.id), store.sofieState(site.id)])
  return { user, store, site, pages, state }
}

function view(state: { chat: ChatTurn[]; draft: unknown; history: unknown[] }, error?: string): StudioState {
  return { chat: state.chat, hasDraft: state.draft !== null, canUndo: state.history.length > 0, ...(error ? { error } : {}) }
}

export async function sendToSofie(siteId: string, message: string): Promise<StudioState> {
  const { store, site, pages, state } = await load(siteId)
  const text = message.trim().slice(0, MAX_MESSAGE)
  if (!text) return view(state)
  if (!process.env.ANTHROPIC_API_KEY) {
    return view(state, 'Sofie isn’t switched on yet: this server has no Anthropic API key. Add ANTHROPIC_API_KEY in the Vercel project settings, then try again.')
  }

  const current = state.draft ?? { site, pages }
  const owner: ChatTurn = { role: 'owner', text, at: new Date().toISOString() }
  try {
    const result = await askSofie({ snapshot: current, history: state.chat, message: text })
    const sofie: ChatTurn = { role: 'sofie', text: result.reply, ...(result.changes.length ? { changes: result.changes } : {}), at: new Date().toISOString() }
    const next = {
      chat: [...state.chat, owner, sofie].slice(-60),
      draft: result.changes.length ? result.snapshot : state.draft,
      history: result.changes.length ? [...state.history, current].slice(-MAX_UNDO) : state.history,
    }
    await store.saveSofieState(site.id, next)
    return view(next)
  } catch (e) {
    console.error('Sofie failed', e)
    return view(state, 'Sofie couldn’t finish that just now. Please try again in a moment.')
  }
}

// Step back one Sofie change. The first undo after publishing is not
// possible here; published versions live in the page revision history.
export async function undoSofie(siteId: string): Promise<StudioState> {
  const { store, site, state } = await load(siteId)
  if (!state.history.length) return view(state)
  const previous = state.history[state.history.length - 1]
  const history = state.history.slice(0, -1)
  // Undoing back to the live version leaves no draft at all.
  const next = { chat: [...state.chat, { role: 'sofie' as const, text: 'Undone. The preview shows the version before my last change.', at: new Date().toISOString() }], draft: history.length ? previous : null, history }
  await store.saveSofieState(site.id, next)
  return view(next)
}

export async function discardDraft(siteId: string): Promise<StudioState> {
  const { store, site, state } = await load(siteId)
  const next = { chat: [...state.chat, { role: 'sofie' as const, text: 'I’ve thrown away the unpublished changes. Your live site is unchanged.', at: new Date().toISOString() }], draft: null, history: [] }
  await store.saveSofieState(site.id, next)
  return view(next)
}

export async function publishDraft(siteId: string): Promise<StudioState> {
  const { user, store, site, pages, state } = await load(siteId)
  if (!state.draft) return view(state)
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
  const next = { chat: [...state.chat, { role: 'sofie' as const, text: 'Published. Your changes are live.', at: new Date().toISOString() }], draft: null, history: [] }
  await store.saveSofieState(site.id, next)
  return view(next)
}
