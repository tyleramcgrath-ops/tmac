// What Sofie costs, and the caps that stop a runaway bill. Every request's
// token counts are priced and recorded per site per day (ss_usage).
//
// Caps (dollars; override with env):
// - per site, ever: SAYSITES_SITE_TOTAL_AI (default 10). The friends-and-
//   family rule: no site costs more than this. Enforced before each message
//   and inside Sofie's loop, so one request can't run past it.
// - per site per day: SAYSITES_SITE_DAILY_AI (default 10)
// - per site during the trial: SAYSITES_TRIAL_AI (default 10)
// - everything, per day: SAYSITES_DAILY_AI_BUDGET (default 150), the
//   circuit breaker if something goes wrong at scale.

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
  }
}

export type CapKind = 'site-total' | 'site-day' | 'trial' | 'all'

// Why Sofie can't take a message right now, or null.
export function overCap(input: { siteTotal: number; siteToday: number; siteTrial: number; allToday: number; trial: boolean }): { kind: CapKind; message: string } | null {
  const c = caps()
  if (input.allToday >= c.allDaily) return { kind: 'all', message: 'Sofie is taking a short break. She’ll be back shortly; your site is safe and live.' }
  if (input.siteTotal >= c.siteTotal) return { kind: 'site-total', message: LIMIT_NOTE }
  if (input.siteToday >= c.siteDaily) return { kind: 'site-day', message: 'You’ve done a lot with Sofie today. She’ll be ready again tomorrow; everything you’ve made is saved.' }
  if (input.trial && input.siteTrial >= c.trial) return { kind: 'trial', message: 'You’ve used all of Sofie’s trial help. Start your plan to keep going; everything you’ve made is saved.' }
  return null
}

// What's left under the lifetime cap for one site, in micros.
export function siteBudget(siteTotal: number): number {
  return Math.max(0, caps().siteTotal - siteTotal)
}

export const LIMIT_NOTE =
  'Sofie has done all she can for this site during the friends-and-family test. Everything you made is saved and still yours.'
