'use server'

import { redirect } from 'next/navigation'
import { hashPassword, normalizeEmail, validEmail, verifyPassword } from '@/lib/auth'
import { endSession, requireUser, startSession } from '@/lib/session'
import { BUSINESS_TYPES, PALETTES, buildStarterSite, subdomainFor, type BusinessTypeKey } from '@/lib/starter'
import { getStore } from '@/lib/store'
import { templateFor } from '@/lib/templates'

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
  const spanish = str(form, 'language') === 'es'
  const { site, pages } = buildStarterSite(
    { name: name.slice(0, 120), type, city: city.slice(0, 60), region: region.slice(0, 40), phone, email, services, palette, language: spanish ? 'es' : 'en', ...(template ? { design: template.key } : {}) },
    user.id,
    subdomain
  )
  await store.createSite(user.id, site, pages)
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
