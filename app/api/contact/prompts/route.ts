import { NextResponse } from 'next/server'
import { z } from 'zod'
import { CONTACT_MODEL, getClient, toErrorResponse } from '@/lib/contact/model'

export const runtime = 'nodejs'
export const maxDuration = 120

// POST /api/contact/prompts
// Step one of a visibility scan: work out what a real buyer would actually
// type into ChatGPT in this category. These are the questions the brand needs
// to show up in, so getting them realistic matters more than getting them
// flattering — none of them may name the brand.

const Body = z.object({
  brand: z.string().min(1).max(80),
  category: z.string().min(1).max(200),
  market: z.string().max(80).default(''),
  competitors: z.array(z.string().max(80)).max(10).default([]),
  count: z.number().int().min(3).max(10).default(6),
})

const INTENTS = ['discovery', 'comparison', 'transactional', 'reputation'] as const

const Result = z.object({
  prompts: z
    .array(
      z.object({
        prompt: z.string(),
        intent: z.enum(INTENTS),
        why: z.string(),
      })
    )
    .min(1),
})

const PROMPTS_TOOL = {
  name: 'deliver_prompts',
  description: 'Return the buyer questions to test this brand against.',
  input_schema: {
    type: 'object' as const,
    properties: {
      prompts: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            prompt: {
              type: 'string',
              description:
                'The question exactly as a buyer would type it into ChatGPT. Lowercase, conversational, no brand name from the tracked brand.',
            },
            intent: { type: 'string', enum: [...INTENTS] },
            why: {
              type: 'string',
              description: 'One short line on why this question is commercially worth winning.',
            },
          },
          required: ['prompt', 'intent', 'why'],
        },
      },
    },
    required: ['prompts'],
  },
}

const SYSTEM = `You work at Contact Studios, a search agency that measures how brands show up inside LLM answers.

Given a brand's category, produce the questions real buyers ask an AI assistant when they are close to spending money in that category.

Rules:
- Never include the tracked brand's name in a prompt. The whole point is to see whether it surfaces unprompted.
- Write how people actually type: lowercase, direct, sometimes with a constraint ("under $50", "for sensitive skin", "for a small team").
- Spread across the intents you are given: some open discovery, some head-to-head comparison, some ready-to-buy, some reputation checking ("is X legit", "what do people say about").
- Favour questions with commercial weight. "what is CBD" is worthless; "best cbd gummies for sleep" is the one that sells.
- Be specific to the category described, not generic marketing filler.`

export async function POST(req: Request) {
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
    `Return exactly ${count} buyer questions via the deliver_prompts tool.`,
  ]
    .filter(Boolean)
    .join('\n')

  try {
    const client = getClient()
    const message = await client.messages.create({
      model: CONTACT_MODEL,
      max_tokens: 2048,
      temperature: 0.8,
      system: SYSTEM,
      tools: [PROMPTS_TOOL],
      tool_choice: { type: 'tool', name: PROMPTS_TOOL.name },
      messages: [{ role: 'user', content: prompt }],
    })

    const toolUse = message.content.find((block) => block.type === 'tool_use')
    if (!toolUse || toolUse.type !== 'tool_use') {
      return NextResponse.json(
        { code: 'no_output', error: 'No questions came back.', detail: 'Run the scan again.' },
        { status: 502 }
      )
    }

    const result = Result.safeParse(toolUse.input)
    if (!result.success) {
      return NextResponse.json(
        {
          code: 'bad_output',
          error: 'The questions came back malformed.',
          detail: result.error.issues[0]?.message,
        },
        { status: 502 }
      )
    }

    // Drop any prompt that leaked the brand name — it would invalidate the test.
    const needle = brand.toLowerCase()
    const prompts = result.data.prompts
      .filter((item) => !item.prompt.toLowerCase().includes(needle))
      .slice(0, count)

    if (prompts.length === 0) {
      return NextResponse.json(
        {
          code: 'no_matches',
          error: 'Every question named the brand.',
          detail: 'That invalidates the test. Run it again.',
        },
        { status: 502 }
      )
    }

    return NextResponse.json({ prompts, model: message.model })
  } catch (error) {
    const { status, body } = toErrorResponse(error)
    return NextResponse.json(body, { status })
  }
}
