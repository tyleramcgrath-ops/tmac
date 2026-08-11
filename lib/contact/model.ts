import Anthropic from '@anthropic-ai/sdk'

// Shared model configuration for Contact's two AI endpoints.
//
// Contact's core feature is a real model call: the network you send is the
// network it reasons over. There is no canned brief and no template library
// behind these routes — if the key is missing, the UI says so plainly rather
// than pretending to think.

/** Latest capable Claude model; override per-deploy without a code change. */
export const CONTACT_MODEL = process.env.CONTACT_MODEL ?? 'claude-opus-5'

export class MissingKeyError extends Error {
  constructor() {
    super('ANTHROPIC_API_KEY is not configured')
    this.name = 'MissingKeyError'
  }
}

export function getClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new MissingKeyError()
  return new Anthropic({
    apiKey,
    // Honoured when a deployment fronts the API with a gateway.
    baseURL: process.env.ANTHROPIC_BASE_URL || undefined,
    maxRetries: 2,
    timeout: 90_000,
  })
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
        error: 'Contact is not connected to a model yet.',
        detail:
          'Set ANTHROPIC_API_KEY in the environment to switch the brief on. Everything else in the workspace works without it.',
      },
    }
  }

  if (error instanceof Anthropic.APIError) {
    const status = error.status ?? 502
    if (status === 401 || status === 403) {
      return {
        status: 502,
        body: {
          code: 'auth',
          error: 'The model rejected our credentials.',
          detail: 'Check ANTHROPIC_API_KEY — the key is present but not accepted.',
        },
      }
    }
    if (status === 429) {
      return {
        status: 429,
        body: {
          code: 'rate_limit',
          error: 'Rate limited by the model.',
          detail: 'Too many briefs at once. Wait a few seconds and run it again.',
        },
      }
    }
    if (status >= 500) {
      return {
        status: 502,
        body: {
          code: 'upstream',
          error: 'The model is having a moment.',
          detail: 'Upstream returned an error. Running the brief again usually clears it.',
        },
      }
    }
    return {
      status: 400,
      body: { code: 'request', error: 'The model rejected the request.', detail: error.message },
    }
  }

  if (error instanceof Error && error.name === 'AbortError') {
    return {
      status: 504,
      body: {
        code: 'timeout',
        error: 'That took too long.',
        detail: 'The brief timed out. Try again, or narrow your network with a filter.',
      },
    }
  }

  return {
    status: 500,
    body: {
      code: 'unknown',
      error: 'Something went wrong building the brief.',
      detail: error instanceof Error ? error.message : undefined,
    },
  }
}
