import { NextResponse } from 'next/server'
import { generateObject } from 'ai'
import { z } from 'zod'
import { rateLimit, rateLimitResponse, resolveAnalyst, toErrorResponse } from '@/lib/contact/model'

export const runtime = 'nodejs'
export const maxDuration = 120

// POST /api/contact/prompts
// Step one of a visibility scan: work out what a real buyer would actually
// type into an assistant in this category. These are the questions the brand
// needs to show up in, so realistic beats flattering — and none of them may
// name the brand, or the test measures nothing.

const Body = z.object({
  brand: z.string().min(1).max(80),
  category: z.string().min(1).max(200),
  market: z.string().max(80).default(''),
  competitors: z.array(z.string().max(80)).max(10).default([]),
  count: z.number().int().min(3).max(10).default(6),
})

const INTENTS = ['discovery', 'comparison', 'transactional', 'reputation'] as const

// One schema, used both to constrain the model and to validate what comes
// back — they cannot drift apart.
const Result = z.object({
  prompts: z
    .array(
      z.object({
        prompt: z
          .string()
          .describe(
            'The question exactly as a buyer would type it. Lowercase, conversational, and it must never contain the tracked brand name.'
          ),
        intent: z.enum(INTENTS),
        why: z.string().describe('One short line on why this question is commercially worth winning.'),
      })
    )
    .min(1),
})

const SYSTEM = `You work at Contact Studios, a search agency that measures how brands show up inside AI assistant answers.

Given a brand's category, produce the questions real buyers ask an assistant when they are close to spending money in that category.

Rules:
- Never include the tracked brand's name in a prompt. The whole point is to see whether it surfaces unprompted.
- Write how people actually type: lowercase, direct, often with a constraint ("under $50", "for sensitive skin", "for a small team").
- Spread across the intents: open discovery, head-to-head comparison, ready-to-buy, and reputation checking.
- Favour questions with commercial weight. "what is CBD" is worthless; "best cbd gummies for sleep" is the one that sells.
- Be specific to the category described, not generic marketing filler.`

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
        error: 'That scan could not be read.',
        detail: error instanceof z.ZodError ? error.issues[0]?.message : undefined,
      },
      { status: 400 }
    )
  }

  const { brand, category, market, competitors, count } = parsed

  const prompt = [
    `Tracked brand: ${brand} (never name it in a prompt).`,
    `What they sell: ${category}`,
    market ? `Market: ${market}` : '',
    competitors.length ? `Known competitors: ${competitors.join(', ')}` : '',
    '',
    `Return exactly ${count} buyer questions.`,
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
      temperature: 0.8,
      maxRetries: 2,
    })

    // Drop any prompt that leaked the brand name — it would invalidate the
    // measurement, so it is better to return fewer questions than a rigged one.
    const needle = brand.toLowerCase()
    const prompts = object.prompts
      .filter((item) => item.prompt.trim() && !item.prompt.toLowerCase().includes(needle))
      .slice(0, count)

    if (prompts.length === 0) {
      return NextResponse.json(
        {
          code: 'no_matches',
          error: 'Every question named the brand.',
          detail: 'That would rig the test. Run it again.',
        },
        { status: 502 }
      )
    }

    return NextResponse.json({ prompts, model: modelId })
  } catch (error) {
    const { status, body } = toErrorResponse(error)
    return NextResponse.json(body, { status })
  }
}
