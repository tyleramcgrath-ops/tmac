// Platform-aware wrapper around Vercel BotID.
//
// Why this exists: `checkBotId()` from botid/server is backed by a Vercel-only
// service. With NODE_ENV=production it resolves an OIDC token from the
// `x-vercel-oidc-token` request header (or VERCEL_OIDC_TOKEN) and THROWS when
// neither is present, and it further throws "Must be deployed on Vercel to
// access response headers" when the @vercel/request-context global is absent.
// In a self-hosted container (Coolify/Docker) none of those exist, so calling
// it directly turns every request to a protected route into an unhandled 500
// rather than a bot decision.
//
// There is no off-Vercel implementation of BotID to fall back to, so on a
// self-hosted deployment this degrades OPEN: requests are treated as human.
// That is a deliberate, visible trade-off, not an oversight — see
// COOLIFY_DEPLOYMENT.md. If a self-hosted deployment needs real abuse
// protection on these routes, put it in front of them (Coolify/Traefik rate
// limiting, or lib/foundation/rate-limit.ts); do not read a `false` from here
// as evidence a request was screened.
//
// On Vercel the behaviour is unchanged: the real checkBotId() runs and its
// verdict is returned verbatim.

import { checkBotId } from 'botid/server'

export interface BotCheckResult {
  isBot: boolean
  /** True when no bot screening actually ran (self-hosted deployment). */
  unavailable: boolean
}

// Vercel injects the OIDC token per-request; VERCEL is set on every Vercel
// runtime. Either one means the real check can run.
function botIdAvailable(): boolean {
  return process.env.VERCEL !== undefined || process.env.VERCEL_OIDC_TOKEN !== undefined
}

let warned = false

export async function checkBot(): Promise<BotCheckResult> {
  if (!botIdAvailable()) {
    if (!warned) {
      warned = true
      console.warn(
        '[bot-protection] Vercel BotID is unavailable on this deployment ' +
          '(not running on Vercel). Bot screening is DISABLED for the routes ' +
          'that use it; requests are treated as human. Apply rate limiting at ' +
          'the proxy if these endpoints are publicly reachable.'
      )
    }
    return { isBot: false, unavailable: true }
  }

  try {
    const result = await checkBotId()
    return { isBot: result.isBot, unavailable: false }
  } catch (err) {
    // A misconfigured-but-present Vercel environment (e.g. OIDC disabled in
    // project settings) should not take the route down either. Fail open, but
    // say so loudly — this one is a real misconfiguration worth fixing.
    console.error(
      '[bot-protection] BotID check failed; treating the request as human. ' +
        'Verify the OIDC option is enabled in the Vercel project settings.',
      err
    )
    return { isBot: false, unavailable: true }
  }
}
