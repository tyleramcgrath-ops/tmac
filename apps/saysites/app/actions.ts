'use server'

import { redirect } from 'next/navigation'
import { hashPassword, normalizeEmail, validEmail, verifyPassword } from '@/lib/auth'
import { endSession, requireUser, startSession } from '@/lib/session'
import { BUSINESS_TYPES, PALETTES, buildStarterSite, subdomainFor, type BusinessTypeKey } from '@/lib/starter'
import { getStore } from '@/lib/store'

export interface FormState {
  error?: string
}

const str = (f: FormData, k: string) => String(f.get(k) ?? '').trim()

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
  await startSession(user.id)
  const idea = str(form, 'idea').slice(0, 200)
  redirect(idea ? `/dashboard/new?idea=${encodeURIComponent(idea)}` : '/dashboard/new')
}

export async function logIn(_prev: FormState, form: FormData): Promise<FormState> {
  const email = normalizeEmail(str(form, 'email'))
  const password = String(form.get('password') ?? '')
  const user = await getStore().userByEmail(email)
  // Same message either way, so the form doesn't reveal which emails exist.
  if (!user || !(await verifyPassword(password, user.passwordHash))) return { error: 'That email and password don’t match.' }
  await startSession(user.id)
  redirect('/dashboard')
}

export async function logOut(): Promise<void> {
  await endSession()
  redirect('/')
}

export async function createSite(_prev: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser()
  const store = getStore()
  const name = str(form, 'name')
  const type = str(form, 'type') as BusinessTypeKey
  const city = str(form, 'city')
  const region = str(form, 'region')
  const palette = str(form, 'palette')
  if (!name) return { error: 'What is your business called?' }
  if (!(type in BUSINESS_TYPES)) return { error: 'Please pick the kind of business.' }
  if (!city || !region) return { error: 'Which city and state are you in?' }
  if (!(palette in PALETTES)) return { error: 'Please pick a color style.' }
  const email = str(form, 'email')
  if (email && !validEmail(email)) return { error: 'That email address doesn’t look right.' }
  const services = str(form, 'services').split(/\n|,/).map((s) => s.trim().slice(0, 80)).filter(Boolean)

  // A readable, unique address: rivertown-plumbing, rivertown-plumbing-2, ...
  const base = subdomainFor(name)
  let subdomain = base
  for (let n = 2; await store.subdomainTaken(subdomain); n++) subdomain = `${base}-${n}`

  const { site, pages } = buildStarterSite(
    { name: name.slice(0, 120), type, city: city.slice(0, 60), region: region.slice(0, 40), phone: str(form, 'phone').slice(0, 30), email, services, palette },
    user.id,
    subdomain
  )
  await store.createSite(user.id, site, pages)
  redirect(`/dashboard/sites/${site.id}?new=1`)
}
