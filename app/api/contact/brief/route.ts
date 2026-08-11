import { NextResponse } from 'next/server'
import { z } from 'zod'
import { CONTACT_MODEL, getClient, toErrorResponse } from '@/lib/contact/model'

export const runtime = 'nodejs'
export const maxDuration = 120

// POST /api/contact/brief
// The core of the product: hand Claude the whole network plus what the user is
// trying to do, and get back a ranked, reasoned shortlist of who to reconnect
// with. The shape is enforced with a tool schema so the UI always gets real
// structured output instead of prose it has to guess at.

const PersonInput = z.object({
  id: z.string().min(1).max(64),
  name: z.string().min(1).max(120),
  role: z.string().max(120).default(''),
  company: z.string().max(120).default(''),
  context: z.string().max(600).default(''),
  notes: z.string().max(1200).default(''),
  tags: z.array(z.string().max(40)).max(12).default([]),
  lastContact: z.string().max(20).default(''),
  channel: z.string().max(20).default('email'),
  circle: z.string().max(20).default('active'),
  location: z.string().max(80).optional(),
  daysSince: z.number().int().min(0).max(20_000).default(0),
})

const Body = z.object({
  intent: z.string().max(400).default(''),
  count: z.number().int().min(3).max(8).default(5),
  user: z
    .object({
      name: z.string().max(80).default(''),
      role: z.string().max(120).default(''),
    })
    .default({ name: '', role: '' }),
  people: z.array(PersonInput).min(1).max(200),
})

const CHANNELS = ['email', 'text', 'call', 'linkedin', 'in-person'] as const
const URGENCIES = ['now', 'this-week', 'soon'] as const

const PickSchema = z.object({
  personId: z.string(),
  warmth: z.number(),
  urgency: z.enum(URGENCIES),
  headline: z.string(),
  reason: z.string(),
  talkingPoints: z.array(z.string()),
  channel: z.enum(CHANNELS),
  opener: z.string(),
})

const ToolResult = z.object({
  summary: z.string(),
  passedOver: z.string().optional(),
  picks: z.array(PickSchema).min(1),
})

/** JSON Schema handed to the model as a tool — this is what forces the shape. */
const BRIEF_TOOL = {
  name: 'deliver_brief',
  description: 'Return the ranked reconnection brief for this network.',
  input_schema: {
    type: 'object' as const,
    properties: {
      summary: {
        type: 'string',
        description:
          'One or two sentences addressed to the user about the state of their network right now, in relation to their intent. Specific, never generic.',
      },
      picks: {
        type: 'array',
        description: 'The people to reach out to, best first.',
        items: {
          type: 'object',
          properties: {
            personId: { type: 'string', description: 'The exact id from the input network.' },
            warmth: {
              type: 'integer',
              description:
                '0-100. How alive this relationship is today, judging recency, closeness and the notes.',
            },
            urgency: { type: 'string', enum: [...URGENCIES] },
            headline: {
              type: 'string',
              description: 'Up to eight words. The reason at a glance, e.g. "Said to ask again in a year".',
            },
            reason: {
              type: 'string',
              description:
                'Two or three sentences: why this person and why now. Cite the specific detail from their notes or context that makes this the moment.',
            },
            talkingPoints: {
              type: 'array',
              items: { type: 'string' },
              description: 'Two or three concrete things to raise, drawn from what is known about them.',
            },
            channel: { type: 'string', enum: [...CHANNELS] },
            opener: {
              type: 'string',
              description:
                'One or two sentences the user could actually send, in their voice. No greeting line, no sign-off, no placeholders in brackets.',
            },
          },
          required: ['personId', 'warmth', 'urgency', 'headline', 'reason', 'talkingPoints', 'channel', 'opener'],
        },
      },
      passedOver: {
        type: 'string',
        description:
          'One sentence naming someone notable you deliberately left out, and why they can wait.',
      },
    },
    required: ['summary', 'picks'],
  },
}

const SYSTEM = `You are the intelligence inside Contact, a tool that keeps track of the people someone already knows and tells them who to reconnect with.

You are given a person's whole network as structured records, and what they are trying to do right now. You return a short, ranked brief.

How to think:
- Relevance to the stated intent comes first. A dormant contact who unlocks the goal beats a close friend who does not.
- Decay matters, but recency is not the goal. Someone spoken to last week can still be the right call; someone silent for a year may be better left alone.
- Look hardest at the notes. The best reason to reach out is almost always a specific, half-forgotten detail: a promise made, a date mentioned, an offer never taken up, a change in their situation.
- Prefer the reconnection that is easy to justify to the other person. If there is no honest reason to write, do not manufacture one.
- Balance the list. Do not return five investors when the intent is hiring.
- Read the human situation. Someone whose company just failed gets a check-in, not a pitch.

Voice for anything the user might send:
- Plain, specific, adult. Short sentences.
- Reference the real detail. No flattery, no "hope this finds you well", no "I wanted to reach out", no exclamation marks.
- Never invent facts that are not in the record. If you are inferring, phrase it as a question.
- No square-bracket placeholders. Ever.

Rank the picks best-first and return exactly the number asked for, unless the network is too small.`

export async function POST(req: Request) {
  let parsed: z.infer<typeof Body>
  try {
    parsed = Body.parse(await req.json())
  } catch (error) {
    return NextResponse.json(
      {
        code: 'bad_request',
        error: 'That network could not be read.',
        detail: error instanceof z.ZodError ? error.issues[0]?.message : undefined,
      },
      { status: 400 }
    )
  }

  const { intent, people, count, user } = parsed
  const validIds = new Set(people.map((p) => p.id))

  const roster = people
    .map((p) =>
      [
        `<person id="${p.id}">`,
        `name: ${p.name}`,
        `role: ${p.role}${p.company ? ` at ${p.company}` : ''}`,
        p.location ? `location: ${p.location}` : null,
        `how they know each other: ${p.context}`,
        `notes: ${p.notes}`,
        `tags: ${p.tags.join(', ') || 'none'}`,
        `last spoke: ${p.lastContact} (${p.daysSince} days ago)`,
        `usual channel: ${p.channel}`,
        `closeness: ${p.circle}`,
        `</person>`,
      ]
        .filter(Boolean)
        .join('\n')
    )
    .join('\n\n')

  const userLine =
    user.name || user.role
      ? `The user is ${[user.name, user.role].filter(Boolean).join(', ')}.`
      : 'The user has not filled in their profile.'

  const prompt = [
    userLine,
    `Today is ${new Date().toISOString().slice(0, 10)}.`,
    '',
    intent
      ? `What they are trying to do right now:\n"""${intent}"""`
      : 'They have not named a goal. Find the relationships that are quietly decaying and worth saving.',
    '',
    `Their network (${people.length} people):`,
    '',
    roster,
    '',
    `Return exactly ${Math.min(count, people.length)} picks via the deliver_brief tool.`,
  ].join('\n')

  try {
    const client = getClient()
    const message = await client.messages.create({
      model: CONTACT_MODEL,
      max_tokens: 4096,
      temperature: 0.6,
      system: SYSTEM,
      tools: [BRIEF_TOOL],
      tool_choice: { type: 'tool', name: BRIEF_TOOL.name },
      messages: [{ role: 'user', content: prompt }],
    })

    const toolUse = message.content.find((block) => block.type === 'tool_use')
    if (!toolUse || toolUse.type !== 'tool_use') {
      return NextResponse.json(
        {
          code: 'no_output',
          error: 'The model did not return a brief.',
          detail: 'Run it again — this usually clears on a retry.',
        },
        { status: 502 }
      )
    }

    const result = ToolResult.safeParse(toolUse.input)
    if (!result.success) {
      return NextResponse.json(
        {
          code: 'bad_output',
          error: 'The brief came back malformed.',
          detail: result.error.issues[0]?.message,
        },
        { status: 502 }
      )
    }

    // Drop hallucinated ids, clamp scores, and rank by position.
    const picks = result.data.picks
      .filter((pick) => validIds.has(pick.personId))
      .slice(0, count)
      .map((pick, index) => ({
        ...pick,
        rank: index + 1,
        warmth: Math.max(0, Math.min(100, Math.round(pick.warmth))),
        talkingPoints: pick.talkingPoints.filter(Boolean).slice(0, 4),
      }))

    if (picks.length === 0) {
      return NextResponse.json(
        {
          code: 'no_matches',
          error: 'The brief came back empty.',
          detail: 'The model did not match anyone in your network. Try rephrasing your intent.',
        },
        { status: 502 }
      )
    }

    return NextResponse.json({
      summary: result.data.summary,
      passedOver: result.data.passedOver,
      picks,
      model: message.model,
    })
  } catch (error) {
    const { status, body } = toErrorResponse(error)
    return NextResponse.json(body, { status })
  }
}
