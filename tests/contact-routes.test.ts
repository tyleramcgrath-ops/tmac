import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MockLanguageModelV3 } from 'ai/test'
import type { LanguageModelV3GenerateResult } from '@ai-sdk/provider'

// Route tests for the visibility scanner. The model layer is mocked, so these
// exercise the parts a live model cannot be trusted to exercise on demand:
// the brand-leak guard, the two-call probe separation, the "trust the text
// over the flag" rule, error mapping and the rate limiter.

const resolveAnalyst = vi.fn()
const resolveModel = vi.fn()
let configured = true

vi.mock('@/lib/contact/model', async () => {
  const actual = await vi.importActual<typeof import('@/lib/contact/model')>('@/lib/contact/model')
  return {
    ...actual,
    isConfigured: () => configured,
    availableEngines: () => (configured ? [{ id: 'claude', label: 'Claude' }] : []),
    resolveAnalyst: () => resolveAnalyst(),
    resolveModel: (engine?: string) => resolveModel(engine),
  }
})

const { resetRateLimit } = await import('@/lib/contact/model')
const { POST: promptsRoute } = await import('@/app/api/contact/prompts/route')
const { POST: probeRoute } = await import('@/app/api/contact/probe/route')
const { POST: planRoute } = await import('@/app/api/contact/plan/route')
const { GET: enginesRoute } = await import('@/app/api/contact/engines/route')

/** One completed generation, in the shape the provider contract requires. */
function result(text: string): LanguageModelV3GenerateResult {
  return {
    finishReason: { unified: 'stop', raw: 'end_turn' },
    usage: {
      inputTokens: { total: 10, noCache: 10, cacheRead: 0, cacheWrite: 0 },
      outputTokens: { total: 10, text: 10, reasoning: 0 },
    },
    content: [{ type: 'text', text }],
    warnings: [],
  }
}

/** A mock standing in for our analyst: returns structured JSON. */
function objectModel(value: unknown) {
  return {
    model: new MockLanguageModelV3({ doGenerate: async () => result(JSON.stringify(value)) }),
    modelId: 'mock-analyst',
  }
}

/** A mock standing in for the engine under test: returns plain prose. */
function textModel(text: string) {
  return {
    model: new MockLanguageModelV3({ doGenerate: async () => result(text) }),
    modelId: 'mock-engine',
  }
}

function post(body: unknown, ip = '203.0.113.1') {
  return new Request('http://localhost/api', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-forwarded-for': ip },
    body: JSON.stringify(body),
  })
}

let ipCounter = 0
/** A fresh client each time, so one test's spend cannot rate-limit the next. */
function freshIp() {
  ipCounter += 1
  return `198.51.100.${ipCounter % 250}`
}

beforeEach(() => {
  configured = true
  resetRateLimit()
  resolveAnalyst.mockReset()
  resolveModel.mockReset()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('POST /api/contact/prompts', () => {
  const body = {
    brand: 'Botany Farms',
    category: 'hemp-derived CBD gummies',
    market: 'United States',
    competitors: ['FOCL'],
    count: 6,
  }

  it('drops any question that names the tracked brand', async () => {
    resolveAnalyst.mockReturnValue(
      objectModel({
        prompts: [
          { prompt: 'best cbd gummies for sleep', intent: 'discovery', why: 'high intent' },
          { prompt: 'is botany farms legit', intent: 'reputation', why: 'reputation' },
          { prompt: 'BOTANY FARMS vs focl', intent: 'comparison', why: 'comparison' },
        ],
      })
    )

    const response = await promptsRoute(post(body, freshIp()))
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.prompts).toHaveLength(1)
    expect(payload.prompts[0].prompt).toBe('best cbd gummies for sleep')
  })

  it('fails loudly rather than returning a rigged question set', async () => {
    resolveAnalyst.mockReturnValue(
      objectModel({
        prompts: [{ prompt: 'is Botany Farms any good', intent: 'reputation', why: 'x' }],
      })
    )

    const response = await promptsRoute(post(body, freshIp()))
    expect(response.status).toBe(502)
    expect((await response.json()).code).toBe('no_matches')
  })

  it('rejects a request with no brand', async () => {
    const response = await promptsRoute(post({ ...body, brand: '' }, freshIp()))
    expect(response.status).toBe(400)
    expect(resolveAnalyst).not.toHaveBeenCalled()
  })

  it('reports a missing credential as a configuration problem, not a crash', async () => {
    const { MissingKeyError } = await import('@/lib/contact/model')
    resolveAnalyst.mockImplementation(() => {
      throw new MissingKeyError()
    })

    const response = await promptsRoute(post(body, freshIp()))
    const payload = await response.json()

    expect(response.status).toBe(503)
    expect(payload.code).toBe('no_key')
    expect(payload.error).toMatch(/not connected/i)
  })
})

describe('POST /api/contact/probe', () => {
  const body = {
    prompt: 'best cbd gummies for sleep',
    brand: 'Botany Farms',
    domain: 'botanyfarms.com',
    market: 'United States',
    engine: 'claude',
  }

  it('asks the engine cold, then reads the answer with a separate call', async () => {
    const answer = '1. FOCL is great. 2. Botany Farms is a solid pick.'
    resolveModel.mockReturnValue(textModel(answer))
    resolveAnalyst.mockReturnValue(
      objectModel({
        mentioned: true,
        position: 2,
        sentiment: 'neutral',
        brandsNamed: ['FOCL', 'Botany Farms'],
        evidence: 'Botany Farms is a solid pick.',
        note: 'FOCL is framed as the default.',
      })
    )

    const response = await probeRoute(post(body, freshIp()))
    const payload = await response.json()

    expect(response.status).toBe(200)
    // Two distinct models: the engine under test, and our own analyst.
    expect(resolveModel).toHaveBeenCalledWith('claude')
    expect(resolveAnalyst).toHaveBeenCalledTimes(1)
    expect(payload.answer).toBe(answer)
    expect(payload.mentioned).toBe(true)
    expect(payload.position).toBe(2)
  })

  it('never leaks the tracked brand into the answer call', async () => {
    const engine = textModel('1. FOCL. 2. cbdMD.')
    const seen: string[] = []
    engine.model = new MockLanguageModelV3({
      doGenerate: async (options) => {
        seen.push(JSON.stringify(options.prompt))
        return result('1. FOCL. 2. cbdMD.')
      },
    })
    resolveModel.mockReturnValue(engine)
    resolveAnalyst.mockReturnValue(
      objectModel({
        mentioned: false,
        position: 0,
        sentiment: 'absent',
        brandsNamed: ['FOCL', 'cbdMD'],
        evidence: '',
        note: 'FOCL owns this answer.',
      })
    )

    await probeRoute(post(body, freshIp()))

    expect(seen).toHaveLength(1)
    expect(seen[0].toLowerCase()).not.toContain('botany farms')
  })

  it('overrules the reader when the brand is not actually in the answer', async () => {
    resolveModel.mockReturnValue(textModel('1. FOCL. 2. cbdMD. Nothing else worth buying.'))
    // A reader that hallucinates a mention.
    resolveAnalyst.mockReturnValue(
      objectModel({
        mentioned: true,
        position: 1,
        sentiment: 'positive',
        brandsNamed: ['FOCL', 'cbdMD'],
        evidence: 'Botany Farms is the best.',
        note: 'x',
      })
    )

    const payload = await (await probeRoute(post(body, freshIp()))).json()

    expect(payload.mentioned).toBe(false)
    expect(payload.position).toBeNull()
    expect(payload.sentiment).toBe('absent')
    expect(payload.evidence).toBe('')
  })

  it('turns the position sentinel into null when absent', async () => {
    resolveModel.mockReturnValue(textModel('1. FOCL only.'))
    resolveAnalyst.mockReturnValue(
      objectModel({
        mentioned: false,
        position: 0,
        sentiment: 'absent',
        brandsNamed: ['FOCL'],
        evidence: '',
        note: 'absent',
      })
    )

    const payload = await (await probeRoute(post(body, freshIp()))).json()
    expect(payload.position).toBeNull()
  })

  it('surfaces an empty answer instead of scoring it as a miss', async () => {
    resolveModel.mockReturnValue(textModel('   '))
    resolveAnalyst.mockReturnValue(objectModel({}))

    const response = await probeRoute(post(body, freshIp()))
    expect(response.status).toBe(502)
    expect((await response.json()).code).toBe('no_output')
    // The reader must not run on an answer that does not exist.
    expect(resolveAnalyst).not.toHaveBeenCalled()
  })

  it('maps an upstream rate limit to a retryable error', async () => {
    const { APICallError } = await import('ai')
    resolveModel.mockImplementation(() => {
      throw new APICallError({
        message: 'too many requests',
        url: 'https://example.test',
        requestBodyValues: {},
        statusCode: 429,
      })
    })

    const response = await probeRoute(post(body, freshIp()))
    expect(response.status).toBe(429)
    expect((await response.json()).code).toBe('rate_limit')
  })

  it('rejects an unknown engine before spending anything', async () => {
    const response = await probeRoute(post({ ...body, engine: 'gemini' }, freshIp()))
    expect(response.status).toBe(400)
    expect(resolveModel).not.toHaveBeenCalled()
  })
})

describe('POST /api/contact/plan', () => {
  const body = {
    brand: 'Botany Farms',
    category: 'cbd gummies',
    engine: 'claude',
    score: 42,
    results: [
      {
        prompt: 'best cbd gummies',
        intent: 'discovery',
        mentioned: false,
        position: null,
        sentiment: 'absent',
        brandsNamed: ['FOCL'],
        note: 'FOCL wins',
      },
    ],
  }

  it('returns a verdict and capped actions', async () => {
    resolveAnalyst.mockReturnValue(
      objectModel({
        verdict: 'You are absent where it counts.',
        actions: Array.from({ length: 8 }, (_, i) => ({
          title: `Action ${i}`,
          why: 'because',
          effort: 'low',
          impact: 'high',
        })),
      })
    )

    const payload = await (await planRoute(post(body, freshIp()))).json()
    expect(payload.verdict).toMatch(/absent/)
    expect(payload.actions).toHaveLength(5)
  })

  it('will not build a plan from an empty scan', async () => {
    const response = await planRoute(post({ ...body, results: [] }, freshIp()))
    expect(response.status).toBe(400)
  })
})

describe('GET /api/contact/engines', () => {
  it('reports what the deployment can measure', async () => {
    const payload = await (await enginesRoute()).json()
    expect(payload.configured).toBe(true)
    expect(payload.engines[0].id).toBe('claude')
  })

  it('says plainly when nothing is configured', async () => {
    configured = false
    const payload = await (await enginesRoute()).json()
    expect(payload.configured).toBe(false)
    expect(payload.engines).toEqual([])
  })
})

describe('rate limiting', () => {
  it('cuts off a client that hammers the endpoint, with a retry hint', async () => {
    resolveAnalyst.mockReturnValue(
      objectModel({ prompts: [{ prompt: 'best gummies', intent: 'discovery', why: 'x' }] })
    )
    const ip = freshIp()
    const body = { brand: 'Acme', category: 'widgets for teams', count: 3 }

    let limited: Response | null = null
    for (let i = 0; i < 200; i++) {
      const response = await promptsRoute(post(body, ip))
      if (response.status === 429) {
        limited = response
        break
      }
    }

    expect(limited).not.toBeNull()
    expect(limited!.headers.get('Retry-After')).toBeTruthy()
    expect((await limited!.json()).code).toBe('rate_limit')
  })

  it('meters clients independently', async () => {
    resolveAnalyst.mockReturnValue(
      objectModel({ prompts: [{ prompt: 'best gummies', intent: 'discovery', why: 'x' }] })
    )
    const body = { brand: 'Acme', category: 'widgets for teams', count: 3 }
    const noisy = freshIp()
    for (let i = 0; i < 200; i++) await promptsRoute(post(body, noisy))

    const quiet = await promptsRoute(post(body, freshIp()))
    expect(quiet.status).toBe(200)
  })
})
