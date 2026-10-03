'use server'

import { createHash } from 'crypto'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { ImportError } from '@/lib/importer'
import { buildPreview } from '@/lib/redesign'
import { getStore } from '@/lib/store'

export interface RedesignState {
  error?: string
}

// Each preview reads a dozen pages; limits keep it from being used as a crawler.
const PER_HOUR = 6
const PER_DAY_ALL = 1500

export async function createRedesign(_prev: RedesignState, form: FormData): Promise<RedesignState> {
  const url = String(form.get('url') ?? '').trim().slice(0, 300)
  if (!url) return { error: 'Enter your website’s address.' }
  const h = await headers()
  const ip = (h.get('x-forwarded-for') ?? '').split(',')[0].trim() || h.get('x-real-ip') || 'unknown'
  const who = createHash('sha256').update(`${ip}|${process.env.SAYSITES_SECRET ?? ''}`).digest('hex').slice(0, 24)
  const store = getStore()
  if ((await store.previewCount(new Date(Date.now() - 3600_000), who)) >= PER_HOUR) return { error: 'You’ve made a few previews already. Please try again in an hour.' }
  if ((await store.previewCount(new Date(Date.now() - 86_400_000))) >= PER_DAY_ALL) return { error: 'Previews are very busy today. Please try again tomorrow.' }
  let id: string
  try {
    const p = await buildPreview(url)
    await store.savePreview(p, who)
    id = p.id
  } catch (e) {
    if (e instanceof ImportError) return { error: e.message }
    console.error('redesign preview failed', e)
    return { error: 'We couldn’t build a preview of that site. Please check the address and try again.' }
  }
  redirect(`/redesign/${id}`)
}
