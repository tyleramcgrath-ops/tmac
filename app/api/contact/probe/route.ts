import { NextResponse } from 'next/server'
import { z } from 'zod'
import { CONTACT_MODEL, getClient, toErrorResponse } from '@/lib/contact/model'

export const runtime = 'nodejs'
export const maxDuration = 120

// POST /api/contact/probe
// The measurement itself, and the honest part of the product.
//
// Two calls, deliberately kept apart:
//   1. ANSWER — the model answers the buyer's question cold. It is never told
//      which brand is being tracked, so the answer is not steered.
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
})

const SENTIMENTS = ['positive', 'neutral', 'negative', 'absent'] as const

const Reading = z.object({
  mentioned: z.boolean(),
  position: z.number().nullable(),
  sentiment: z.enum(SENTIMENTS),
  brandsNamed: z.array(z.string()),
  evidence: z.string(),
  note: z.string(),
})

const READ_TOOL = {
  name: 'read_answer',
  description: 'Report what the answer said about the tracked brand.',
  input_schema: {
    type: 'object' as const,
    properties: {
      mentioned: {
        type: 'boolean',
        description: 'True only if the tracked brand itself is named in the answer.',
      },
      position: {
        type: ['integer', 'null'],
        description:
          'Where the tracked brand appears in the order brands are recommended, starting at 1. Null when it is not mentioned.',
      },
      sentiment: {
        type: 'string',
        enum: [...SENTIMENTS],
        description:
          'positive = actively recommended; neutral = listed without enthusiasm; negative = mentioned with a caveat or warning; absent = not mentioned.',
      },
      brandsNamed: {
        type: 'array',
        items: { type: 'string' },
        description:
          'Every brand or company named in the answer, in the order they appear. Products count as their brand. No generic categories.',
      },
      evidence: {
        type: 'string',
        description:
          'The sentence from the answer that mentions the tracked brand, quoted exactly. Empty string when absent.',
      },
      note: {
        type: 'string',
        description:
          'One short sentence on why the brand landed where it did — what the answer rewarded. Written to the brand owner.',
      },
    },
    required: ['mentioned', 'position', 'sentiment', 'brandsNamed', 'evidence', 'note'],
  },
}

/** No mention of any tracked brand — this has to be a normal assistant answer. */
const ANSWER_SYSTEM = `You are a helpful AI assistant answering a shopper's question, exactly as you normally would.

Recommend specific, real, named brands or products — that is what makes the answer useful. Give a short ranked list with a line on each. Be concrete and honest, including about trade-offs. Keep it under 220 words. Do not add disclaimers about being an AI.`

const READ_SYSTEM = `You are an analyst at Contact Studios. You read an AI assistant's answer and report, precisely and without spin, how a particular brand appeared in it.

Be strict:
- Only count the tracked brand if that brand is actually named. A similar name, a parent company, or the category is not a mention.
- Position is the order of recommendation, not the order of characters on the page.
- brandsNamed must list every real brand in the answer, including the tracked one when present.
- Never flatter the brand. If it is absent, say so plainly and let the note explain who won instead.`

export async function POST(req: Request) {
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

  const { prompt, brand, domain, market } = parsed

  try {
    const client = getClient()

    // 1. The unprimed answer.
    const answerMessage = await client.messages.create({
      model: CONTACT_MODEL,
      max_tokens: 900,
      temperature: 1,
      system: ANSWER_SYSTEM,
      messages: [
        { role: 'user', content: market ? `${prompt} (${market})` : prompt },
      ],
    })

    const answer = answerMessage.content
      .filter((block) => block.type === 'text')
      .map((block) => (block.type === 'text' ? block.text : ''))
      .join('\n')
      .trim()

    if (!answer) {
      return NextResponse.json(
        { code: 'no_output', error: 'The assistant returned nothing.', detail: 'Retry this question.' },
        { status: 502 }
      )
    }

    // 2. Read that answer back.
    const readMessage = await client.messages.create({
      model: CONTACT_MODEL,
      max_tokens: 1200,
      temperature: 0,
      system: READ_SYSTEM,
      tools: [READ_TOOL],
      tool_choice: { type: 'tool', name: READ_TOOL.name },
      messages: [
        {
          role: 'user',
          content: [
            `Tracked brand: ${brand}${domain ? ` (${domain})` : ''}`,
            `The question asked: ${prompt}`,
            '',
            'The answer given:',
            '"""',
            answer,
            '"""',
          ].join('\n'),
        },
      ],
    })

    const toolUse = readMessage.content.find((block) => block.type === 'tool_use')
    if (!toolUse || toolUse.type !== 'tool_use') {
      return NextResponse.json(
        { code: 'no_output', error: 'The answer could not be read.', detail: 'Retry this question.' },
        { status: 502 }
      )
    }

    const reading = Reading.safeParse(toolUse.input)
    if (!reading.success) {
      return NextResponse.json(
        {
          code: 'bad_output',
          error: 'The reading came back malformed.',
          detail: reading.error.issues[0]?.message,
        },
        { status: 502 }
      )
    }

    // Trust the text over the flag: if the brand is not in the answer, it is
    // not mentioned, whatever the reader claimed.
    const inAnswer = answer.toLowerCase().includes(brand.toLowerCase())
    const mentioned = reading.data.mentioned && inAnswer

    return NextResponse.json({
      answer,
      mentioned,
      position: mentioned ? reading.data.position : null,
      sentiment: mentioned ? reading.data.sentiment : 'absent',
      brandsNamed: reading.data.brandsNamed.filter(Boolean).slice(0, 12),
      evidence: mentioned ? reading.data.evidence : '',
      note: reading.data.note,
      model: answerMessage.model,
    })
  } catch (error) {
    const { status, body } = toErrorResponse(error)
    return NextResponse.json(body, { status })
  }
}
