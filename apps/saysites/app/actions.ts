'use server'

import { after } from 'next/server'
import { cleanPromo, loadAccess, newBilling } from '@/lib/billing'
import { googleReviewUrl } from '@/lib/reviews'
import { redirect } from 'next/navigation'
import { hashPassword, normalizeEmail, validEmail, verifyPassword } from '@/lib/auth'
import { endSession, requireUser, startSession } from '@/lib/session'
import { BUSINESS_TYPES, PALETTES, buildStarterSite, subdomainFor, type BusinessTypeKey } from '@/lib/starter'
import { creditsInUse, syncSitePhotos } from '@/lib/sites'
import { photoSetFor, reportUse } from '@/lib/unsplash'
import { getStore } from '@/lib/store'
import { APPROVE_CODE, CLAIM_CODE, approvePath, claimPath } from '@/lib/urls'
import { INVITE_CODE, invitePath } from '@/lib/team'
import { templateFor } from '@/lib/templates'
import { randomUUID } from 'crypto'
import { writeContent } from '@/lib/writer'
import { costMicros } from '@/lib/usage'
import { dayString } from '@/lib/visits'
import type { Site } from '@/lib/schema'
import type { StarterInput } from '@/lib/starter'

export interface FormState {
  error?: string
}

const str = (f: FormData, k: string) => String(f.get(k) ?? '').trim()
// A redesign preview to claim after signing up or in.
const claimId = (f: FormData) => (CLAIM_CODE.test(str(f, 'claim')) ? str(f, 'claim') : '')
// A site the team built, to approve after signing up or in.
const approveId = (f: FormData) => (APPROVE_CODE.test(str(f, 'approve')) ? str(f, 'approve') : '')
// A team invite to accept after signing up or in.
const inviteId = (f: FormData) => (INVITE_CODE.test(str(f, 'invite')) ? str(f, 'invite') : '')

export async function signUp(_prev: FormState, form: FormData): Promise<FormState> {
  const name = str(form, 'name')
  const email = normalizeEmail(str(form, 'email'))
  const password = String(form.get('password') ?? '')
  if (!name) return { error: 'Please enter your name.' }
  if (!validEmail(email)) return { error: 'Please enter a valid email address.' }
  if (password.length < 8) return { error: 'Your password needs at least 8 characters.' }
  const store = getStore()
  if (await store.userByEmail(email)) return { error: 'There is already an account with that email. Try logging in.' }
  const user = await store.createUser({ email, name: name.slice(0, 80), passwordHash: await hashPassword(password) })
  await store.saveBilling(user.id, newBilling(Date.now(), cleanPromo(str(form, 'promo'))))
  await startSession(user.id)
  const claim = claimId(form)
  if (claim) redirect(claimPath(claim))
  const approve = approveId(form)
  if (approve) redirect(approvePath(approve))
  const invite = inviteId(form)
  if (invite) redirect(invitePath(invite))
  const idea = str(form, 'idea').slice(0, 200)
  const template = str(form, 'template').slice(0, 20)
  const q = new URLSearchParams({ ...(idea ? { idea } : {}), ...(template ? { template } : {}) }).toString()
  redirect(q ? `/dashboard/new?${q}` : '/dashboard/new')
}

export async function logIn(_prev: FormState, form: FormData): Promise<FormState> {
  const email = normalizeEmail(str(form, 'email'))
  const password = String(form.get('password') ?? '')
  const user = await getStore().userByEmail(email)
  // Same message either way, so the form doesn't reveal which emails exist.
  if (!user || !(await verifyPassword(password, user.passwordHash))) return { error: 'That email and password don’t match.' }
  await startSession(user.id)
  const claim = claimId(form)
  const approve = approveId(form)
  const invite = inviteId(form)
  redirect(claim ? claimPath(claim) : approve ? approvePath(approve) : invite ? invitePath(invite) : '/dashboard')
}

export async function logOut(): Promise<void> {
  await endSession()
  redirect('/')
}

export async function createSite(_prev: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser()
  const store = getStore()
  if ((await loadAccess(store, user)).locked) return { error: 'Your free trial has ended. Start your plan on the Account page to build more websites.' }
  const name = str(form, 'name')
  const type = str(form, 'type') as BusinessTypeKey
  const city = str(form, 'city')
  const region = str(form, 'region')
  const palette = str(form, 'palette')
  if (!name) return { error: 'What is your business called?' }
  if (!(type in BUSINESS_TYPES)) return { error: 'Please pick the kind of business.' }
  if (!city || !region) return { error: 'Which city and state (or province) are you in?' }
  if (!(palette in PALETTES)) return { error: 'Please pick a color style.' }
  const email = str(form, 'email')
  if (email && !validEmail(email)) return { error: 'That email address doesn’t look right.' }
  const services = str(form, 'services').split(/\n|,/).map((s) => s.trim().slice(0, 80)).filter(Boolean)

  // A readable, unique address: rivertown-plumbing, rivertown-plumbing-2, ...
  const base = subdomainFor(name)
  let subdomain = base
  for (let n = 2; await store.subdomainTaken(subdomain); n++) subdomain = `${base}-${n}`

  const template = templateFor(str(form, 'template'))
  const phone = str(form, 'phone').slice(0, 30)
  // Filled in from the owner's Google listing (lib/places), when they used it.
  const street = str(form, 'street').slice(0, 120)
  const postalCode = str(form, 'postalCode').slice(0, 20)
  const hours = str(form, 'hours').split('\n').map((h) => h.trim()).filter((h) => /^[A-Za-z,-]+ \d{2}:\d{2}-\d{2}:\d{2}$/.test(h)).slice(0, 7)
  const placeId = /^[\w-]{10,300}$/.test(str(form, 'placeId')) ? str(form, 'placeId') : ''
  const spanish = str(form, 'language') === 'es'
  const taken = await store.photosTaken()
  const found = await photoSetFor(store, type, taken, 12, str(form, 'photoHint').slice(0, 60))
  const starterInput = { name: name.slice(0, 120), type, city: city.slice(0, 60), region: region.slice(0, 40), phone, email, services, palette, ...(street && postalCode ? { street, postalCode } : {}), ...(hours.length ? { hours } : {}), language: spanish ? 'es' : 'en', ...(template ? { design: template.key } : {}), ...(found ? { photos: found } : {}) }
  // A fixed site id keeps page ids stable when the writer fills it in below.
  const siteId = `site_${randomUUID()}`
  const built = buildStarterSite(starterInput, user.id, subdomain, { taken, siteId })
  const credits = found ? creditsInUse(built.pages, found.credits) : []
  const withCredits = credits.length ? { ...built.site, credits } : built.site
  const site = placeId ? { ...withCredits, business: { ...withCredits.business, reviewUrl: googleReviewUrl(placeId) } } : withCredits
  const pages = built.pages
  await store.createSite(user.id, site, pages)
  await syncSitePhotos(site.id, store)
  after(() => reportUse(credits))
  // Sofie's writer fills in the site: a longer story for the home page and a
  // page for each service, in words written for this business. It runs after
  // the owner lands in the dashboard and only touches a site still exactly
  // as it was built. (Talk & Design and Spanish sites go to Sofie instead.)
  if (!template && !spanish && process.env.ANTHROPIC_API_KEY && services.length) {
    after(() => fillIn(site, starterInput, user.id, subdomain, taken, found?.credits ?? []).catch((e) => console.error('content writer', e)))
  }
  // Talk & Design: open Sofie with the filled-in prompt, so the owner watches
  // her design the site. A Spanish site starts the same way: Sofie rewrites
  // the starter pages in Spanish. Without Sofie switched on, the site is ready as is.
  if ((template || spanish) && process.env.ANTHROPIC_API_KEY) {
    const parts = [
      template ? template.prompt({ name, typeLabel: BUSINESS_TYPES[type].label, city, region, phone, services }) : '',
      spanish ? 'Escribe todo el sitio web en español: cada página, título, botón, pregunta frecuente, menú, formulario y la descripción para Google. Mantén el nombre del negocio, el teléfono y la dirección tal como están.' : '',
    ]
    redirect(`/dashboard/sites/${site.id}/sofie?talk=${encodeURIComponent(parts.filter(Boolean).join('\n\n'))}`)
  }
  redirect(`/dashboard/sites/${site.id}?new=1`)
}

async function fillIn(site: Site, input: StarterInput, userId: string, subdomain: string, taken: Set<string>, photoCredits: Parameters<typeof creditsInUse>[1]) {
  const store = getStore()
  const { content, usage } = await writeContent({ name: input.name, kind: BUSINESS_TYPES[input.type].label, city: input.city, region: input.region, services: input.services })
  await store.recordUsage(site.id, dayString(new Date()), costMicros(usage))
  const now = await store.siteForUser(userId, site.id)
  if (!now || now.updatedAt !== site.updatedAt) return
  const before = await store.pagesForSite(site.id)
  if (before.some((p) => p.updatedAt !== site.updatedAt)) return
  const full = buildStarterSite({ ...input, content }, userId, subdomain, { taken, siteId: site.id, now: site.updatedAt })
  const keep = new Set(before.map((p) => p.id))
  for (const p of full.pages) await store.savePage({ ...p, updatedAt: new Date().toISOString() }, 'sofie', null, keep.has(p.id) ? 'Sofie wrote more for this page' : 'Sofie wrote this page')
  // New pages may show more stock photos: credit their photographers and
  // mark the photos as this site's.
  const credits = creditsInUse(full.pages, photoCredits)
  await store.updateSite({ ...now, ...(credits.length ? { credits } : {}), updatedAt: new Date().toISOString() })
  await syncSitePhotos(site.id, store)
}

// ---------------------------------------------------------------------------
// Account
// ---------------------------------------------------------------------------

export interface AccountState {
  error?: string
  saved?: string
}

export async function updateName(_prev: AccountState, form: FormData): Promise<AccountState> {
  const user = await requireUser()
  const name = str(form, 'name').slice(0, 80)
  if (!name) return { error: 'Please enter your name.' }
  await getStore().updateUser(user.id, { name })
  return { saved: 'Name saved.' }
}

export async function changePassword(_prev: AccountState, form: FormData): Promise<AccountState> {
  const user = await requireUser()
  const current = String(form.get('current') ?? '')
  const next = String(form.get('next') ?? '')
  if (!(await verifyPassword(current, user.passwordHash))) return { error: 'Your current password isn’t right.' }
  if (next.length < 8) return { error: 'Your new password needs at least 8 characters.' }
  await getStore().updateUser(user.id, { passwordHash: await hashPassword(next) })
  return { saved: 'Password changed.' }
}

export async function deleteAccount(_prev: AccountState, form: FormData): Promise<AccountState> {
  const user = await requireUser()
  if (!(await verifyPassword(String(form.get('password') ?? ''), user.passwordHash))) return { error: 'That password isn’t right.' }
  await getStore().deleteUser(user.id)
  await endSession()
  redirect('/?goodbye=1')
}
