'use server'

import { redirect } from 'next/navigation'
import { after } from 'next/server'
import { revalidatePath } from 'next/cache'
import { isAdmin } from '@/lib/admin'
import { addProspects, runOutreach, startCampaign } from '@/lib/outreach'
import { buildReport, parseProspectLines } from '@/lib/prospects'
import { requireUser } from '@/lib/session'
import { getStore } from '@/lib/store'

async function admin() {
  const user = await requireUser()
  if (!isAdmin(user.email)) redirect('/dashboard')
  return getStore()
}

const str = (f: FormData, k: string, max: number) => String(f.get(k) ?? '').trim().slice(0, max)

// A trade and a city (found by search), a pasted list, or both.
export async function newCampaign(form: FormData) {
  const store = await admin()
  const trade = str(form, 'trade', 60)
  const city = str(form, 'city', 60)
  const { lines } = parseProspectLines(str(form, 'list', 200_000))
  if (!lines.length && !(trade && city)) redirect('/dashboard/outreach?note=empty')
  const { campaign, added } = await startCampaign(store, { trade, city, lines })
  redirect(`/dashboard/outreach/${campaign.slug}?note=started&added=${added}`)
}

export async function addToCampaign(slug: string, form: FormData) {
  const store = await admin()
  const { lines } = parseProspectLines(str(form, 'list', 200_000))
  const added = await addProspects(store, slug, lines)
  redirect(`/dashboard/outreach/${slug}?note=added&added=${added}`)
}

export async function togglePause(slug: string) {
  const store = await admin()
  const c = (await store.campaigns()).find((x) => x.slug === slug)
  if (c) await store.saveCampaign({ ...c, paused: !c.paused })
  revalidatePath(`/dashboard/outreach/${slug}`)
}

// Publishing the drafted city report (or refreshing it with newer numbers).
export async function publishReport(slug: string, form: FormData) {
  const store = await admin()
  const c = (await store.campaigns()).find((x) => x.slug === slug)
  if (!c) redirect('/dashboard/outreach')
  const old = await store.report(c.reportSlug ?? c.slug)
  const r = buildReport(
    { slug: old?.slug ?? c.slug, title: str(form, 'title', 120) || old?.title || c.title, city: c.city, trade: c.trade, intro: str(form, 'intro', 1200), campaign: c.slug },
    await store.prospects(c.slug)
  )
  if ('error' in r) redirect(`/dashboard/outreach/${slug}?note=report`)
  await store.saveReport({ ...r, publishedAt: old?.publishedAt ?? new Date().toISOString() })
  if (!c.reportSlug) await store.saveCampaign({ ...c, reportSlug: r.slug })
  revalidatePath(`/reports/${r.slug}`)
  redirect(`/dashboard/outreach/${slug}?note=published`)
}

export async function unpublishReport(slug: string) {
  const store = await admin()
  const c = (await store.campaigns()).find((x) => x.slug === slug)
  const r = c?.reportSlug ? await store.report(c.reportSlug) : null
  if (r) {
    const { publishedAt: _gone, ...rest } = r
    await store.saveReport(rest)
  }
  redirect(`/dashboard/outreach/${slug}`)
}

// Builds the next batch of free redesigns (up to BATCH_MAX), then drafts any
// city report that now has enough sites.
// It runs after the page answers, so the button never times out; refresh to
// watch the rows fill in.
export async function buildBatch(slug: string) {
  const store = await admin()
  after(() => runOutreach(store).catch((e) => console.error('outreach batch failed', e instanceof Error ? e.message : e)))
  redirect(`/dashboard/outreach/${slug}?note=building`)
}
