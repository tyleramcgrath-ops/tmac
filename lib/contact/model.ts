import { createAnthropic } from '@ai-sdk/anthropic'
import { createGatewayProvider } from '@ai-sdk/gateway'
import { APICallError, NoObjectGeneratedError, type LanguageModel } from 'ai'

// Model resolution for the visibility scanner.
//
// The scanner is a real model call on every stage — there is no canned scan
// behind these routes. It runs against whichever credential the deployment
// actually has:
//
//   AI_GATEWAY_API_KEY (or Vercel OIDC)  → Vercel AI Gateway, same as the rest
//                                          of this app, and unlocks measuring
//                                          engines other than Claude.
//   ANTHROPIC_API_KEY                    → the Anthropic API directly.
//
// Gateway wins when both are present, because that is this repo's standard.

export type EngineId = 'claude' | 'gpt' | 'grok'

export interface Engine {
  id: EngineId
  /** Shown in the UI. */
  label: string
  /** Model id on the Vercel AI Gateway. */
  gatewayModel: string
  /** Model id on the Anthropic API, when one exists. */
  directModel?: string
}

/**
 * The engines a scan can be run against. "Which assistant are we measuring?"
 * is a real product question — a brand can be first in one and absent in
 * another — so the answer call is engine-selectable wherever the credential
 * allows it.
 */
export const ENGINES: Engine[] = [
  {
    id: 'claude',
    label: 'Claude',
    gatewayModel: process.env.CONTACT_GATEWAY_MODEL ?? 'anthropic/claude-opus-4.6',
    directModel: process.env.CONTACT_MODEL ?? 'claude-opus-5',
  },
  { id: 'gpt', label: 'GPT', gatewayModel: 'openai/gpt-5.3-codex' },
  { id: 'grok', label: 'Grok', gatewayModel: 'xai/grok-4.1-fast-reasoning' },
]

export const DEFAULT_ENGINE: EngineId = 'claude'

export class MissingKeyError extends Error {
  constructor() {
    super('No model credential is configured')
    this.name = 'MissingKeyError'
  }
}

export class EngineUnavailableError extends Error {
  constructor(label: string) {
    super(`${label} needs the AI Gateway`)
    this.name = 'EngineUnavailableError'
  }
}

function hasGateway(): boolean {
  return Boolean(process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN)
}

function hasAnthropic(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY)
}

export function isConfigured(): boolean {
  return hasGateway() || hasAnthropic()
}

/** Which engines this deployment can actually run, given its credentials. */
export function availableEngines(): { id: EngineId; label: string }[] {
  if (hasGateway()) return ENGINES.map(({ id, label }) => ({ id, label }))
  if (hasAnthropic()) {
    return ENGINES.filter((engine) => engine.directModel).map(({ id, label }) => ({ id, label }))
  }
  return []
}

export interface Resolved {
  model: LanguageModel
  /** The concrete model id, surfaced in the report so the run is auditable. */
  modelId: string
}

/**
 * Resolve a language model for the given engine.
 *
 * Reasoning and analysis always run on Claude — those are our own calls, and
 * keeping them fixed keeps scans comparable. Only the simulated buyer answer
 * follows the engine the user picked.
 */
export function resolveModel(engineId: EngineId = DEFAULT_ENGINE): Resolved {
  const engine = ENGINES.find((item) => item.id === engineId) ?? ENGINES[0]

  if (hasGateway()) {
    const gateway = createGatewayProvider({
      apiKey: process.env.AI_GATEWAY_API_KEY,
      baseURL: process.env.AI_GATEWAY_BASE_URL,
    })
    return { model: gateway(engine.gatewayModel), modelId: engine.gatewayModel }
  }

  if (hasAnthropic()) {
    if (!engine.directModel) throw new EngineUnavailableError(engine.label)
    const anthropic = createAnthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
      baseURL: process.env.ANTHROPIC_BASE_URL
        ? `${process.env.ANTHROPIC_BASE_URL.replace(/\/$/, '')}/v1`
        : undefined,
    })
    return { model: anthropic(engine.directModel), modelId: engine.directModel }
  }

  throw new MissingKeyError()
}

/** Our own reasoning calls — always Claude, never the engine under test. */
export function resolveAnalyst(): Resolved {
  return resolveModel('claude')
}

interface ErrorShape {
  status: number
  body: { error: string; detail?: string; code: string }
}

/** Turn any upstream failure into something the UI can say out loud. */
export function toErrorResponse(error: unknown): ErrorShape {
  if (error instanceof MissingKeyError) {
    return {
      status: 503,
      body: {
        code: 'no_key',
        error: 'The scanner is not connected to a model yet.',
        detail:
          'Set AI_GATEWAY_API_KEY or ANTHROPIC_API_KEY in the environment. Saved scans keep working without it.',
      },
    }
  }

  if (error instanceof EngineUnavailableError) {
    return {
      status: 400,
      body: {
        code: 'engine_unavailable',
        error: `${error.message}.`,
        detail: 'This deployment can only measure Claude. Add AI_GATEWAY_API_KEY for the others.',
      },
    }
  }

  if (NoObjectGeneratedError.isInstance(error)) {
    return {
      status: 502,
      body: {
        code: 'bad_output',
        error: 'The model did not return usable output.',
        detail: 'It usually clears on a retry.',
      },
    }
  }

  if (APICallError.isInstance(error)) {
    const status = error.statusCode ?? 502
    if (status === 401 || status === 403) {
      return {
        status: 502,
        body: {
          code: 'auth',
          error: 'The model rejected our credentials.',
          detail: 'The key is present but not accepted. Check it has access to this model.',
        },
      }
    }
    if (status === 404) {
      return {
        status: 502,
        body: {
          code: 'model_not_found',
          error: 'That model is not available on this account.',
          detail: 'Set CONTACT_MODEL to a model id your credential can reach.',
        },
      }
    }
    if (status === 429) {
      return {
        status: 429,
        body: {
          code: 'rate_limit',
          error: 'Rate limited by the model.',
          detail: 'Too many questions at once. Wait a few seconds and run it again.',
        },
      }
    }
    if (status >= 500) {
      return {
        status: 502,
        body: {
          code: 'upstream',
          error: 'The model is having a moment.',
          detail: 'Upstream returned an error. Running the scan again usually clears it.',
        },
      }
    }
    return {
      status: 400,
      body: { code: 'request', error: 'The model rejected the request.', detail: error.message },
    }
  }

  if (error instanceof Error && (error.name === 'AbortError' || error.name === 'TimeoutError')) {
    return {
      status: 504,
      body: {
        code: 'timeout',
        error: 'That took too long.',
        detail: 'The model did not answer in time. Try the scan again.',
      },
    }
  }

  return {
    status: 500,
    body: {
      code: 'unknown',
      error: 'Something went wrong running the scan.',
      detail: error instanceof Error ? error.message : undefined,
    },
  }
}

/* ---------------------------------------------------------------------
   Abuse guard
   ---------------------------------------------------------------------
   These routes spend money on every call and need no account, so they get
   a small in-memory token bucket per client. It resets when the process
   does, which is the right trade for a single-region study app — the point
   is to stop a loop hammering the endpoint, not to build a billing system.
   ------------------------------------------------------------------ */

const BUCKETS = new Map<string, { tokens: number; updated: number }>()
/**
 * One full scan costs 22 (2 for the questions, 3 per probe, 2 for the plan),
 * so the budget is sized to let someone try a handful of brands back to back
 * before it starts pushing back — while still stopping a loop.
 */
const CAPACITY = 120
const REFILL_PER_MS = CAPACITY / (15 * 60_000) // a full bucket every 15 minutes

export function clientKey(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for')
  return forwarded?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'local'
}

export function rateLimit(req: Request, cost = 1): { ok: true } | { ok: false; retryAfter: number } {
  const key = clientKey(req)
  const now = Date.now()
  const bucket = BUCKETS.get(key) ?? { tokens: CAPACITY, updated: now }

  bucket.tokens = Math.min(CAPACITY, bucket.tokens + (now - bucket.updated) * REFILL_PER_MS)
  bucket.updated = now

  if (bucket.tokens < cost) {
    BUCKETS.set(key, bucket)
    return { ok: false, retryAfter: Math.ceil((cost - bucket.tokens) / REFILL_PER_MS / 1000) }
  }

  bucket.tokens -= cost
  BUCKETS.set(key, bucket)

  // Keep the map from growing without bound on a long-lived process.
  if (BUCKETS.size > 5000) {
    for (const [id, entry] of BUCKETS) {
      if (now - entry.updated > 30 * 60_000) BUCKETS.delete(id)
    }
  }

  return { ok: true }
}

/** Test seam — lets the suite start from a clean bucket. */
export function resetRateLimit(): void {
  BUCKETS.clear()
}

export function rateLimitResponse(retryAfter: number): ErrorShape & { headers: HeadersInit } {
  return {
    status: 429,
    headers: { 'Retry-After': String(retryAfter) },
    body: {
      code: 'rate_limit',
      error: 'Slow down a moment.',
      detail: `That is a lot of scanning. Try again in ${retryAfter}s.`,
    },
  }
}
