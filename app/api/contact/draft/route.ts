import { NextResponse } from 'next/server'
import { z } from 'zod'
import { CONTACT_MODEL, getClient, toErrorResponse } from '@/lib/contact/model'

export const runtime = 'nodejs'
export const maxDuration = 120

// POST /api/contact/draft
// Streams the actual message, token by token, so the user watches it being
// written rather than staring at a spinner. Plain text out — the client owns
// the presentation.

const Body = z.object({
  intent: z.string().max(400).default(''),
  tone: z.enum(['warm', 'direct', 'playful', 'formal']).default('warm'),
  channel: z.enum(['email', 'text', 'call', 'linkedin', 'in-person']).default('email'),
  instruction: z.string().max(400).default(''),
  user: z
    .object({ name: z.string().max(80).default(''), role: z.string().max(120).default('') })
    .default({ name: '', role: '' }),
  person: z.object({
    name: z.string().min(1).max(120),
    role: z.string().max(120).default(''),
    company: z.string().max(120).default(''),
    context: z.string().max(600).default(''),
    notes: z.string().max(1200).default(''),
    lastContact: z.string().max(20).default(''),
    daysSince: z.number().int().min(0).max(20_000).default(0),
  }),
  angle: z
    .object({
      headline: z.string().max(160).default(''),
      reason: z.string().max(800).default(''),
      talkingPoints: z.array(z.string().max(300)).max(5).default([]),
    })
    .optional(),
})

const TONE_GUIDANCE: Record<z.infer<typeof Body>['tone'], string> = {
  warm: 'Warm but unsentimental. Like writing to someone you genuinely like and have not seen in a while.',
  direct: 'Direct. Say the thing in the first sentence. No preamble at all.',
  playful: 'Lightly playful — one dry line at most. Never zany, never exclamatory.',
  formal: 'Composed and professional, but still human. No corporate boilerplate.',
}

const CHANNEL_GUIDANCE: Record<z.infer<typeof Body>['channel'], string> = {
  email: 'An email. Start with a subject line on its own first line as "Subject: ...", then a blank line, then the body. Under 120 words. Sign off with the sender first name only.',
  text: 'A text message. One short paragraph, under 45 words. No subject, no sign-off.',
  call: 'Not a message — a call plan. Give the opening line to say out loud, then two or three bullet points to cover, then the ask. Under 100 words.',
  linkedin: 'A LinkedIn message. Under 70 words, no subject line, no sign-off.',
  'in-person': 'A short prep note for seeing them in person: the opener to use, and two things to remember to ask. Under 90 words.',
}

const SYSTEM = `You write messages for Contact, on behalf of its user, to people in their network.

Absolute rules:
- Never use square-bracket placeholders. If you do not know something, write around it.
- Never invent facts about the recipient. Only use what is in the record. Anything uncertain becomes a question, not a claim.
- No "I hope this finds you well", no "I wanted to reach out", no "just circling back", no "touching base", no exclamation marks, no emoji.
- Short sentences. Concrete nouns. The specific detail is what makes the message work — lead with it.
- Sound like one person writing to another person, not like marketing.
- Output only the message itself. No preamble, no explanation, no quotation marks around it.`

export async function POST(req: Request) {
  let parsed: z.infer<typeof Body>
  try {
    parsed = Body.parse(await req.json())
  } catch (error) {
    return NextResponse.json(
      {
        code: 'bad_request',
        error: 'That draft request could not be read.',
        detail: error instanceof z.ZodError ? error.issues[0]?.message : undefined,
      },
      { status: 400 }
    )
  }

  const { person, intent, tone, channel, user, angle, instruction } = parsed

  const prompt = [
    `Write on behalf of ${user.name || 'the user'}${user.role ? `, ${user.role}` : ''}.`,
    '',
    `Recipient: ${person.name}${person.role ? `, ${person.role}` : ''}${person.company ? ` at ${person.company}` : ''}.`,
    `How they know each other: ${person.context}`,
    `What is known about them: ${person.notes}`,
    `Last spoke: ${person.lastContact || 'unknown'} (${person.daysSince} days ago).`,
    angle?.reason ? `\nWhy now: ${angle.headline}. ${angle.reason}` : '',
    angle?.talkingPoints?.length ? `Worth raising: ${angle.talkingPoints.join(' / ')}` : '',
    intent ? `\nThe sender's current goal: ${intent}` : '',
    instruction ? `\nThe sender also asked: ${instruction}` : '',
    '',
    `Format: ${CHANNEL_GUIDANCE[channel]}`,
    `Tone: ${TONE_GUIDANCE[tone]}`,
  ]
    .filter(Boolean)
    .join('\n')

  try {
    const client = getClient()
    const stream = await client.messages.create({
      model: CONTACT_MODEL,
      max_tokens: 1024,
      temperature: 0.75,
      system: SYSTEM,
      messages: [{ role: 'user', content: prompt }],
      stream: true,
    })

    const encoder = new TextEncoder()
    const body = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
              controller.enqueue(encoder.encode(event.delta.text))
            }
          }
        } catch (error) {
          // The response has already started, so surface the failure inline
          // rather than dropping the user into a silent dead end.
          const { body: errorBody } = toErrorResponse(error)
          controller.enqueue(encoder.encode(`\n\n[draft interrupted — ${errorBody.error}]`))
        } finally {
          controller.close()
        }
      },
    })

    return new Response(body, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-store',
        'X-Accel-Buffering': 'no',
      },
    })
  } catch (error) {
    const { status, body } = toErrorResponse(error)
    return NextResponse.json(body, { status })
  }
}
