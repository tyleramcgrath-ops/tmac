// What Sofie costs, and the caps that stop a runaway bill. Every request's
// token counts are priced and recorded per site per day (ss_usage).
//
// Caps (dollars; override with env):
// - per site per day: SAYSITES_SITE_DAILY_AI (default 5)
// - per site during the trial: SAYSITES_TRIAL_AI (default 4)
// - everything, per day: SAYSITES_DAILY_AI_BUDGET (default 75), the
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
    siteDaily: dollars('SAYSITES_SITE_DAILY_AI', 5) * 1e6,
    trial: dollars('SAYSITES_TRIAL_AI', 4) * 1e6,
    allDaily: dollars('SAYSITES_DAILY_AI_BUDGET', 75) * 1e6,
  }
}

// Why Sofie can't take a message right now, in words for the owner, or null.
export function overCap(input: { siteToday: number; siteTrial: number; allToday: number; trial: boolean }): string | null {
  const c = caps()
  if (input.allToday >= c.allDaily) return 'Sofie is taking a short break. She’ll be back shortly; your site is safe and live.'
  if (input.siteToday >= c.siteDaily) return 'You’ve done a lot with Sofie today. She’ll be ready again tomorrow; everything you’ve made is saved.'
  if (input.trial && input.siteTrial >= c.trial) return 'You’ve used all of Sofie’s trial help. Start your plan to keep going; everything you’ve made is saved.'
  return null
}
