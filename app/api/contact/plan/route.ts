import { NextResponse } from 'next/server'
import { generateObject } from 'ai'
import { z } from 'zod'
import { rateLimit, rateLimitResponse, resolveAnalyst, toErrorResponse } from '@/lib/contact/model'

export const runtime = 'nodejs'
export const maxDuration = 120

// POST /api/contact/plan
// Step three: read the finished scan and say what to do about it. This is the
// agency's actual product — the measurement is only the argument for the work.

const Body = z.object({
  brand: z.string().min(1).max(80),
  category: z.string().max(200).default(''),
  engine: z.string().max(20).default('claude'),
  score: z.number().min(0).max(100),
  results: z
    .array(
      z.object({
        prompt: z.string().max(400),
        intent: z.string().max(40),
        mentioned: z.boolean(),
        position: z.number().nullable(),
        sentiment: z.string().max(20),
        brandsNamed: z.array(z.string().max(80)).max(12),
        note: z.string().max(400).default(''),
      })
    )
    .min(1)
    .max(12),
})

const EFFORT = ['low', 'medium', 'high'] as const

const Result = z.object({
  verdict: z
    .string()
    .describe(
      'Two or three sentences to the brand owner: where they actually stand, who is beating them, and the single biggest reason why. Direct, specific, no cheerleading.'
    ),
  actions: z
    .array(
      z.object({
        title: z.string().describe('The job, stated as work to be done. Under ten words.'),
        why: z
          .string()
          .describe('One or two sentences tying this to what the scan found. Cite the pattern, not a generality.'),
        effort: z.enum(EFFORT),
        impact: z.enum(EFFORT),
      })
    )
    .min(1)
    .describe('Three to five pieces of work, most valuable first.'),
})

const SYSTEM = `You are a senior strategist at Contact Studios, a search agency that gets brands cited inside AI assistant answers.

You are handed the results of a live visibility scan. You tell the client the truth about it, then what you would do.

How this visibility is actually won — reason from this, do not recite it:
- Models repeat what the wider web already agrees on. Being named in listicles, roundups, comparisons and reviews on sources the model trusts is what puts a brand in the answer.
- Third-party corroboration beats owned content. A brand's own pages rarely make it into a recommendation; being the brand others name does.
- Structured, specific, comparable facts get quoted: prices, specs, use cases, who it is for.
- Reputation questions are won by review presence and by the absence of unanswered complaints.
- Category framing matters: a brand only surfaces for the phrasing buyers actually use.

Rules:
- Ground every action in what this scan found. Name the competitor that keeps winning, or the intent where the brand vanishes.
- If the brand is doing well somewhere, say so once, briefly, then move on.
- No filler like "improve SEO" or "create quality content". Each action should be something a team could start on Monday.
- Never promise rankings or revenue.`

export async function POST(req: Request) {
  const limit = rateLimit(req, 2)
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
        error: 'That plan request could not be read.',
        detail: error instanceof z.ZodError ? error.issues[0]?.message : undefined,
      },
      { status: 400 }
    )
  }

  const { brand, category, score, results, engine } = parsed

  const table = results
    .map((row, index) =>
      [
        `${index + 1}. "${row.prompt}" [${row.intent}]`,
        `   brand mentioned: ${row.mentioned ? `yes, position ${row.position ?? 'unclear'}, framed as ${row.sentiment}` : 'no'}`,
        `   brands the answer named: ${row.brandsNamed.join(', ') || 'none'}`,
        row.note ? `   analyst note: ${row.note}` : '',
      ]
        .filter(Boolean)
        .join('\n')
    )
    .join('\n\n')

  const mentions = results.filter((row) => row.mentioned).length

  const prompt = [
    `Brand: ${brand}`,
    category ? `Category: ${category}` : '',
    `Assistant measured: ${engine}`,
    `Visibility score: ${score}/100. Mentioned in ${mentions} of ${results.length} answers.`,
    '',
    'The scan:',
    '',
    table,
  ]
    .filter(Boolean)
    .join('\n')

  try {
    const { model, modelId } = resolveAnalyst()
    const { object } = await generateObject({
      model,
      schema: Result,
      system: SYSTEM,
      prompt,
      temperature: 0.5,
      maxRetries: 2,
    })

    return NextResponse.json({
      verdict: object.verdict,
      actions: object.actions.slice(0, 5),
      model: modelId,
    })
  } catch (error) {
    const { status, body } = toErrorResponse(error)
    return NextResponse.json(body, { status })
  }
}
