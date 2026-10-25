import { NextResponse } from 'next/server'
import { generateObject, generateText } from 'ai'
import { z } from 'zod'
import {
  DEFAULT_ENGINE,
  rateLimit,
  rateLimitResponse,
  resolveAnalyst,
  resolveModel,
  toErrorResponse,
} from '@/lib/contact/model'

export const runtime = 'nodejs'
export const maxDuration = 120

// POST /api/contact/probe
// The measurement itself, and the honest part of the product.
//
// Two calls, deliberately kept apart:
//   1. ANSWER — the assistant answers the buyer's question cold. It is never
//      told which brand is being tracked, so the answer is not steered.
//   2. READ   — a second call reads that answer back and extracts what
//      happened: who got named, in what order, and how the brand was framed.
//
// Collapsing these into one call would let the grader see the brand it is
// grading for, which is exactly the bias this tool exists to avoid.

const Body = z.object({
  prompt: z.string().min(1).max(400),
  brand: z.string().min(1).max(80),
  domain: z.string().max(120).default(''),
  market: z.string().max(80).default(''),
  engine: z.enum(['claude', 'gpt', 'grok']).default(DEFAULT_ENGINE),
})

const SENTIMENTS = ['positive', 'neutral', 'negative', 'absent'] as const

const Reading = z.object({
  mentioned: z.boolean().describe('True only if the tracked brand itself is named in the answer.'),
  // A plain integer rather than a nullable one: unions are the first thing to
  // go wrong across providers, and 0 carries the same meaning safely.
  position: z
    .number()
    .int()
    .min(0)
    .max(50)
    .describe(
      'Where the tracked brand appears in the order brands are recommended, starting at 1. Use 0 when it is not mentioned.'
    ),
  sentiment: z
    .enum(SENTIMENTS)
    .describe(
      'positive = actively recommended; neutral = listed without enthusiasm; negative = mentioned with a caveat; absent = not mentioned.'
    ),
  brandsNamed: z
    .array(z.string())
    .describe(
      'Every brand or company named in the answer, in the order they appear. Products count as their brand. No generic categories.'
    ),
  evidence: z
    .string()
    .describe('The sentence from the answer that mentions the tracked brand, quoted exactly. Empty when absent.'),
  note: z
    .string()
    .describe('One short sentence to the brand owner on why the brand landed where it did.'),
})

/** No mention of any tracked brand — this must be a normal assistant answer. */
const ANSWER_SYSTEM = `You are a helpful AI assistant answering a shopper's question, exactly as you normally would.

Recommend specific, real, named brands or products — that is what makes the answer useful. Give a short ranked list with a line on each. Be concrete and honest, including about trade-offs. Keep it under 220 words. Do not add disclaimers about being an AI.`

const READ_SYSTEM = `You are an analyst at Contact Studios. You read an AI assistant's answer and report, precisely and without spin, how a particular brand appeared in it.

Be strict:
- Only count the tracked brand if that brand is actually named. A similar name, a parent company, or the category is not a mention.
- Position is the order of recommendation, not the order of characters on the page.
- brandsNamed must list every real brand in the answer, including the tracked one when present.
- Never flatter the brand. If it is absent, say so plainly and let the note explain who won instead.`

export async function POST(req: Request) {
  const limit = rateLimit(req, 3)
  if (!limit.ok) {
    const { status, body, headers } = rateLimitResponse(limit.retryAfter)
    return NextResponse.json(body, { status, headers })
  }

  let parsed: z.infer<typeof Body>
  try {
    parsed = Body.parse(await req.json())
  } catch (error) {
    return NextResponse.json(
      {
        code: 'bad_request',
        error: 'That probe could not be read.',
        detail: error instanceof z.ZodError ? error.issues[0]?.message : undefined,
      },
      { status: 400 }
    )
  }

  const { prompt, brand, domain, market, engine } = parsed

  try {
    // 1. The unprimed answer, from the engine under test.
    const { model, modelId } = resolveModel(engine)
    const { text: answer } = await generateText({
      model,
      system: ANSWER_SYSTEM,
      prompt: market ? `${prompt} (${market})` : prompt,
      temperature: 1,
      maxRetries: 2,
    })

    if (!answer.trim()) {
      return NextResponse.json(
        {
          code: 'no_output',
          error: 'The assistant returned nothing.',
          detail: 'Retry this question.',
        },
        { status: 502 }
      )
    }

    // 2. Read that answer back — always with our own analyst model, so the
    //    reading stays comparable no matter which engine was measured.
    const analyst = resolveAnalyst()
    const { object: reading } = await generateObject({
      model: analyst.model,
      schema: Reading,
      system: READ_SYSTEM,
      temperature: 0,
      maxRetries: 2,
      prompt: [
        `Tracked brand: ${brand}${domain ? ` (${domain})` : ''}`,
        `The question asked: ${prompt}`,
        '',
        'The answer given:',
        '"""',
        answer,
        '"""',
      ].join('\n'),
    })

    // Trust the text over the flag: if the brand is not in the answer, it is
    // not mentioned, whatever the reader claimed.
    const inAnswer = answer.toLowerCase().includes(brand.toLowerCase())
    const mentioned = reading.mentioned && inAnswer
    const position = mentioned && reading.position > 0 ? reading.position : null

    return NextResponse.json({
      answer,
      mentioned,
      position,
      sentiment: mentioned ? reading.sentiment : 'absent',
      brandsNamed: reading.brandsNamed.map((name) => name.trim()).filter(Boolean).slice(0, 12),
      evidence: mentioned ? reading.evidence : '',
      note: reading.note,
      model: modelId,
      engine,
    })
  } catch (error) {
    const { status, body } = toErrorResponse(error)
    return NextResponse.json(body, { status })
  }
}
