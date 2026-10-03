'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { isAdmin } from '@/lib/admin'
import { loadAccess } from '@/lib/billing'
import { tradeLabel } from '@/lib/league'
import { requireUser } from '@/lib/session'
import { LIMITS, auditCompetitor, auditSite, checkAiQuery, checkKeyword, checkLinks, checkedToday, loadSeoState, type SeoState } from '@/lib/seo-intel'
import { bundleFor } from '@/lib/sites'
import { getStore } from '@/lib/store'
import { liveUrl } from '@/lib/urls'

async function owned(siteId: string) {
  const user = await requireUser()
  const store = getStore()
  const site = await store.siteForUser(user.id, siteId)
  if (!site) redirect('/dashboard')
  return { user, store, site, state: await loadSeoState(store, site.id) }
}

const back = (siteId: string, note = '') => {
  revalidatePath(`/dashboard/sites/${siteId}/seo`)
  redirect(`/dashboard/sites/${siteId}/seo${note ? `?note=${note}` : ''}`)
}

// Rank, AI-answer and backlink lookups cost money per call (pricing rule):
// they're part of the premium plans, and capped per site per day.
export async function paidLookupsAllowed(siteId: string): Promise<boolean> {
  const { user, store } = await owned(siteId)
  if (isAdmin(user.email)) return true
  const a = await loadAccess(store, user)
  return a.status === 'comp' || ((a.status === 'active' || a.status === 'past_due') && (a.billing?.plan === 'law' || a.billing?.plan === 'lawpro'))
}

export async function runAudit(siteId: string): Promise<void> {
  const { store, site, state } = await owned(siteId)
  const bundle = await bundleFor(site, store)
  if (!bundle) back(siteId, 'error')
  const audit = await auditSite(bundle!, liveUrl(site), tradeLabel(bundle!.site.business.schemaType))
  await store.saveSeoState(site.id, { ...state, audit } satisfies SeoState)
  back(siteId)
}

export async function addCompetitor(siteId: string, form: FormData): Promise<void> {
  const { store, site, state } = await owned(siteId)
  const raw = String(form.get('url') ?? '').trim().slice(0, 200)
  if (!raw) back(siteId)
  if (state.competitors.length >= LIMITS.competitors) back(siteId, 'competitors')
  const result = await auditCompetitor(raw)
  await store.saveSeoState(site.id, { ...state, competitors: [...state.competitors.filter((c) => c.url !== raw), result] })
  back(siteId, result.error ? 'unreachable' : '')
}

export async function removeCompetitor(siteId: string, url: string): Promise<void> {
  const { store, site, state } = await owned(siteId)
  await store.saveSeoState(site.id, { ...state, competitors: state.competitors.filter((c) => c.url !== url) })
  back(siteId)
}

export async function addKeyword(siteId: string, form: FormData): Promise<void> {
  const { store, site, state } = await owned(siteId)
  const keyword = String(form.get('keyword') ?? '').trim().replace(/\s+/g, ' ').slice(0, 80)
  if (!keyword || state.keywords.some((k) => k.keyword.toLowerCase() === keyword.toLowerCase())) back(siteId)
  if (state.keywords.length >= LIMITS.keywords) back(siteId, 'keywords')
  await store.saveSeoState(site.id, { ...state, keywords: [...state.keywords, { keyword, checks: [] }] })
  back(siteId)
}

export async function removeKeyword(siteId: string, keyword: string): Promise<void> {
  const { store, site, state } = await owned(siteId)
  await store.saveSeoState(site.id, { ...state, keywords: state.keywords.filter((k) => k.keyword !== keyword) })
  back(siteId)
}

export async function addAiQuery(siteId: string, form: FormData): Promise<void> {
  const { store, site, state } = await owned(siteId)
  const query = String(form.get('query') ?? '').trim().replace(/\s+/g, ' ').slice(0, 160)
  if (!query || state.aiQueries.some((q) => q.query.toLowerCase() === query.toLowerCase())) back(siteId)
  if (state.aiQueries.length >= LIMITS.aiQueries) back(siteId, 'queries')
  await store.saveSeoState(site.id, { ...state, aiQueries: [...state.aiQueries, { query, checks: [] }] })
  back(siteId)
}

export async function removeAiQuery(siteId: string, query: string): Promise<void> {
  const { store, site, state } = await owned(siteId)
  await store.saveSeoState(site.id, { ...state, aiQueries: state.aiQueries.filter((q) => q.query !== query) })
  back(siteId)
}

// Checks every keyword and AI question not already checked today, and the
// backlink profile once a day.
export async function checkNow(siteId: string): Promise<void> {
  if (!(await paidLookupsAllowed(siteId))) back(siteId, 'plan')
  const { store, site, state } = await owned(siteId)
  const host = new URL(liveUrl(site)).host
  const keywords = await Promise.all(
    state.keywords.map(async (k) => {
      if (checkedToday(k.checks)) return k
      const c = await checkKeyword(host, k.keyword)
      return c ? { ...k, checks: [...k.checks, c].slice(-60) } : k
    })
  )
  const aiQueries = await Promise.all(
    state.aiQueries.map(async (q) => {
      if (checkedToday(q.checks)) return q
      const c = await checkAiQuery(host, q.query)
      return c ? { ...q, checks: [...q.checks, c].slice(-60) } : q
    })
  )
  const backlinks = state.backlinks && checkedToday([state.backlinks]) ? state.backlinks : ((await checkLinks(host)) ?? state.backlinks)
  await store.saveSeoState(site.id, { ...state, keywords, aiQueries, ...(backlinks ? { backlinks } : {}) })
  back(siteId)
}
