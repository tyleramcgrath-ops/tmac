// What Sofie costs, and the caps that stop a runaway bill. Every request's
// token counts are priced and recorded per site per day (ss_usage).
//
// Caps (dollars; override with env):
// - Trial accounts, per site, ever: SAYSITES_SITE_TOTAL_AI (default 10), and
//   SAYSITES_TRIAL_AI (default 10) during the trial.
// - Paying accounts, per site, per calendar month: SAYSITES_SITE_MONTHLY_AI
//   (Site plan, default 5) or SAYSITES_STORE_MONTHLY_AI (Store plan, default
//   8); comped accounts SAYSITES_COMP_MONTHLY_AI (default 50). Sized so a plan
//   stays profitable even when the whole allowance is used: $15 - Stripe
//   ($0.74) - hosting (~$0.50) - $5 still leaves ~$8.75 a month.
// - Per site per day: SAYSITES_SITE_DAILY_AI (default 10)
// - Everything, per day: SAYSITES_DAILY_AI_BUDGET (default 150), the circuit
//   breaker if something goes wrong at scale.

import type { BillingStatus, Plan } from './billing'
import { dayString } from './visits'

export type { Plan }

// Claude Opus 5, dollars per million tokens.
export const PRICE = { input: 5, output: 25, cacheWrite: 6.25, cacheRead: 0.5 }

export interface Tokens {
  input_tokens?: number | null
  output_tokens?: number | null
  cache_creation_input_tokens?: number | null
  cache_read_input_tokens?: number | null
}

// Millionths of a dollar.
export function costMicros(u: Tokens): number {
  return (
    (u.input_tokens ?? 0) * PRICE.input +
    (u.output_tokens ?? 0) * PRICE.output +
    (u.cache_creation_input_tokens ?? 0) * PRICE.cacheWrite +
    (u.cache_read_input_tokens ?? 0) * PRICE.cacheRead
  )
}

const dollars = (name: string, fallback: number) => {
  const v = Number(process.env[name])
  return Number.isFinite(v) && v > 0 ? v : fallback
}

export function caps() {
  return {
    siteTotal: dollars('SAYSITES_SITE_TOTAL_AI', 10) * 1e6,
    siteDaily: dollars('SAYSITES_SITE_DAILY_AI', 10) * 1e6,
    trial: dollars('SAYSITES_TRIAL_AI', 10) * 1e6,
    allDaily: dollars('SAYSITES_DAILY_AI_BUDGET', 150) * 1e6,
    month: {
      site: dollars('SAYSITES_SITE_MONTHLY_AI', 5) * 1e6,
      store: dollars('SAYSITES_STORE_MONTHLY_AI', 8) * 1e6,
      comp: dollars('SAYSITES_COMP_MONTHLY_AI', 50) * 1e6,
    },
  }
}

export type CapKind = 'site-total' | 'site-day' | 'trial' | 'month' | 'all'

// What one site has spent, in micros.
export interface Spend {
  siteTotal: number
  siteToday: number
  siteTrial: number
  // Since the first of this calendar month.
  siteMonth: number
  allToday: number
}

export interface Payer {
  status: BillingStatus
  plan?: Plan
}

const paying = (p: Payer) => p.status === 'active' || p.status === 'past_due' || p.status === 'comp'

export function monthlyAllowance(p: Payer): number {
  const m = caps().month
  return p.status === 'comp' ? m.comp : p.plan === 'store' ? m.store : m.site
}

// The first day of next month, when a monthly allowance refills.
export function refillDate(now = new Date()): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1))
}

export function monthStart(now = new Date()): string {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString().slice(0, 10)
}

const longDate = (d: Date) => d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', timeZone: 'UTC' })

// Why Sofie can't take a message right now, or null.
export function overCap(spend: Spend, payer: Payer, now = new Date()): { kind: CapKind; message: string } | null {
  const c = caps()
  if (spend.allToday >= c.allDaily) return { kind: 'all', message: 'Sofie is taking a short break. She’ll be back shortly; your site is safe and live.' }
  if (paying(payer)) {
    if (spend.siteMonth >= monthlyAllowance(payer)) {
      const more = payer.plan !== 'store' && payer.status !== 'comp' ? ', or move to the Store plan for a bigger allowance' : ''
      return { kind: 'month', message: `You’ve used this month’s Sofie allowance. It refills on ${longDate(refillDate(now))}. You can still change everything yourself in Pages${more}.` }
    }
    if (spend.siteToday >= c.siteDaily) return { kind: 'site-day', message: 'You’ve done a lot with Sofie today. She’ll be ready again tomorrow; everything you’ve made is saved.' }
    return null
  }
  if (spend.siteTotal >= c.siteTotal) return { kind: 'site-total', message: LIMIT_NOTE }
  if (spend.siteToday >= c.siteDaily) return { kind: 'site-day', message: 'You’ve done a lot with Sofie today. She’ll be ready again tomorrow; everything you’ve made is saved.' }
  if (payer.status === 'trial' && spend.siteTrial >= c.trial) return { kind: 'trial', message: 'You’ve used all of Sofie’s trial help. Start your plan to keep going; everything you’ve made is saved.' }
  return null
}

// What one more request may spend, in micros: what's left of the monthly
// allowance for paying accounts, or of the lifetime cap otherwise, and never
// more than what's left of today's per-site cap.
export function siteBudget(spend: Spend, payer: Payer): number {
  const c = caps()
  const left = paying(payer) ? monthlyAllowance(payer) - spend.siteMonth : c.siteTotal - spend.siteTotal
  return Math.max(0, Math.min(left, c.siteDaily - spend.siteToday))
}

// Share of this month's allowance used (0-1), or null when not on a plan.
export function monthShare(spend: Spend, payer: Payer): number | null {
  return paying(payer) ? Math.min(1, spend.siteMonth / monthlyAllowance(payer)) : null
}

export const LIMIT_NOTE =
  'Sofie has done all she can for this site during the friends-and-family test. Everything you made is saved and still yours.'

// Everything overCap needs for one site, read in parallel.
export async function loadSpend(
  store: { siteUsage(siteId: string, since: string): Promise<{ micros: number }>; dayUsage(day: string): Promise<{ micros: number }> },
  siteId: string,
  userCreatedAt: string,
  now = new Date()
): Promise<Spend> {
  const today = dayString(now)
  const [siteTotal, siteToday, siteTrial, siteMonth, allToday] = await Promise.all([
    store.siteUsage(siteId, '2000-01-01'),
    store.siteUsage(siteId, today),
    store.siteUsage(siteId, dayString(new Date(userCreatedAt))),
    store.siteUsage(siteId, monthStart(now)),
    store.dayUsage(today),
  ])
  return { siteTotal: siteTotal.micros, siteToday: siteToday.micros, siteTrial: siteTrial.micros, siteMonth: siteMonth.micros, allToday: allToday.micros }
}
