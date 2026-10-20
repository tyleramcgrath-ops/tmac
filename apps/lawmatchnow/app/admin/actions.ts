'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { checkCredentials, endSession, requireAdmin, startSession } from '@/lib/admin/auth'
import { STAGES, type Stage, addActivity, getLead } from '@/lib/admin/leads'
import { gscInspect, gscSubmitSitemap } from '@/lib/admin/google'
import { runAudit, runPageSpeed, submitIndexNow } from '@/lib/admin/seo'
import { SITE } from '@/lib/site'

// Simple brute-force brake: 5 tries per 15 minutes per instance.
const tries: number[] = []

export async function login(_: unknown, form: FormData) {
  const now = Date.now()
  while (tries.length && now - tries[0] > 15 * 60_000) tries.shift()
  const email = String(form.get('email') ?? '').slice(0, 200)
  if (tries.length >= 5) return { error: 'Too many attempts. Try again in 15 minutes.', email }
  if (!checkCredentials(email, String(form.get('password') ?? ''))) {
    tries.push(now)
    return { error: 'That email and password don’t match.', email }
  }
  await startSession()
  redirect('/admin')
}

export async function logout() {
  await endSession()
  redirect('/admin/login')
}

export async function updateLead(form: FormData) {
  await requireAdmin()
  const id = String(form.get('id'))
  const lead = await getLead(id)
  if (!lead) return
  const stage = String(form.get('stage') ?? '') as Stage
  const note = String(form.get('note') ?? '').trim().slice(0, 4000)
  if (stage && stage !== lead.stage && STAGES.some((s) => s.key === stage)) await addActivity(id, { kind: 'stage', text: `Moved to ${stage}` }, stage)
  if (note) await addActivity(id, { kind: 'note', text: note })
  revalidatePath(`/admin/leads/${id}`)
  revalidatePath('/admin/leads')
}

export async function pageSpeed(_: unknown, form: FormData) {
  await requireAdmin()
  const path = String(form.get('path') || '/')
  const strategy = form.get('strategy') === 'desktop' ? 'desktop' : 'mobile'
  try {
    await runPageSpeed(`${SITE.url}${path.startsWith('/') ? path : `/${path}`}`, strategy)
    revalidatePath('/admin/seo')
    return { ok: `Tested ${path} (${strategy}).` }
  } catch (err) {
    return { error: (err as Error).message }
  }
}

export async function audit() {
  await requireAdmin()
  try {
    const a = await runAudit()
    revalidatePath('/admin/seo')
    return { ok: `Checked ${a.checked} of ${a.total} pages.` }
  } catch (err) {
    return { error: (err as Error).message }
  }
}

export async function indexNow() {
  await requireAdmin()
  try {
    const base = `http://127.0.0.1:${process.env.PORT || 3000}`
    const sm = await fetch(`${base}/sitemap.xml`, { cache: 'no-store' }).then((r) => r.text())
    const urls = [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1])
    const sent = await submitIndexNow(urls)
    revalidatePath('/admin/seo')
    return { ok: `Sent ${sent.toLocaleString()} URLs to IndexNow (Bing, Yandex and partners).` }
  } catch (err) {
    return { error: (err as Error).message }
  }
}

export async function submitSitemap() {
  await requireAdmin()
  try {
    await gscSubmitSitemap(`${SITE.url}/sitemap.xml`)
    revalidatePath('/admin/seo')
    return { ok: 'Sitemap submitted to Google Search Console.' }
  } catch (err) {
    return { error: (err as Error).message }
  }
}

export async function inspectUrl(_: unknown, form: FormData) {
  await requireAdmin()
  const path = String(form.get('path') || '/')
  try {
    const r = await gscInspect(`${SITE.url}${path.startsWith('/') ? path : `/${path}`}`)
    const s = r?.indexStatusResult
    return { ok: s ? `${path}: ${s.verdict ?? '?'} · ${s.coverageState ?? ''}${s.lastCrawlTime ? ` · last crawled ${s.lastCrawlTime.slice(0, 10)}` : ''}${s.googleCanonical ? ` · Google canonical ${s.googleCanonical}` : ''}${r?.richResultsResult?.detectedItems?.length ? ` · rich results: ${r.richResultsResult.detectedItems.map((d) => d.richResultType).join(', ')}` : ''}` : 'No result.' }
  } catch (err) {
    return { error: (err as Error).message }
  }
}
