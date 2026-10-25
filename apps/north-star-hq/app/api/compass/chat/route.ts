import { handled, HttpError, requireUser } from '@/lib/foundation/auth'

export const runtime = 'nodejs'

// The Compass's brain lives in a Hermes gateway (an OpenAI-compatible
// /v1/chat/completions endpoint). This route is the only thing that talks to
// it, for one reason: HERMES_API_KEY must never reach the browser. A direct
// fetch from the client would ship the key to every visitor's devtools, and
// that key authenticates an agent with tool access — not just a chat model.
//
// It also means the Hermes gateway can stay bound to 127.0.0.1 on its own
// host and never be exposed publicly; only this server process needs to reach
// it.

const TIMEOUT_MS = 60_000

// Session continuity is keyed off the authenticated user, not off anything the
// client sends. Hermes scopes long-term memory by this header, so letting the
// browser choose it would let one account read another's remembered context.
const sessionIdFor = (userId: string) => `ns-hq-${userId}`

interface ChatTurn {
  role: 'user' | 'assistant'
  content: string
}

// Prepended to a spoken turn. Two jobs: correct the agent's reasonable but
// wrong assumption that it is text-only, and get it to write for the ear.
// Markdown, bullet lists and URLs are fine on a screen and unlistenable when
// a text-to-speech voice reads them out character by character.
const SPOKEN_CONTEXT = {
  role: 'system' as const,
  content: [
    'This is a spoken conversation. The user is talking to you out loud: their words were transcribed',
    'from a microphone, and your reply will be read aloud in the room by a text-to-speech voice.',
    'You are not a text-only interface here — you are being heard, and you will be heard.',
    '',
    'Write for the ear. Short sentences. No markdown, asterisks, bullet lists, headings, code blocks,',
    'or URLs — a voice reads those literally and they sound like noise. Say a page by its name, never',
    'its address. Keep it to a few sentences unless asked for more.',
    '',
    'The transcript can contain speech-recognition errors. If a word looks garbled, ask rather than',
    'guessing at what it meant.',
  ].join(' '),
}

export const POST = handled(async (request) => {
  const user = await requireUser(request)

  const base = process.env.HERMES_URL?.replace(/\/+$/, '')
  const key = process.env.HERMES_API_KEY
  // Unset ⇒ say so plainly. A generic 500 here reads as "Compass is broken"
  // when the real answer is "Compass was never wired up on this deployment."
  if (!base || !key) {
    throw new HttpError(
      503,
      'Compass is not configured on this deployment (HERMES_URL / HERMES_API_KEY are unset).',
    )
  }

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
  const messages = Array.isArray(body.messages) ? (body.messages as ChatTurn[]) : []

  // Keep only well-formed turns, and cap history so a long room session can't
  // grow the prompt until every reply costs a fortune and eventually 400s on
  // context length.
  const clean = messages
    .filter(
      (m): m is ChatTurn =>
        !!m &&
        (m.role === 'user' || m.role === 'assistant') &&
        typeof m.content === 'string' &&
        m.content.trim().length > 0,
    )
    .slice(-12)

  if (clean.length === 0) throw new HttpError(400, 'Nothing to send.')

  // A spoken turn arrives here as plain text, which is all the agent would
  // otherwise see — so it concludes it is a text-only interface and says so,
  // while the user is talking to it out loud. This says what the transport
  // cannot: the words were heard, the reply will be heard, and prose written
  // for a screen sounds like noise when a voice reads it.
  const outgoing = body.spoken === true ? [SPOKEN_CONTEXT, ...clean] : clean

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

  let res: Response
  try {
    res = await fetch(`${base}/v1/chat/completions`, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
        'X-Hermes-Session-Id': sessionIdFor(user.id),
      },
      body: JSON.stringify({ model: 'hermes-agent', messages: outgoing }),
    })
  } catch (err) {
    // An agent turn that runs tools can legitimately take a while; distinguish
    // "still thinking when we gave up" from "gateway is down" so the room can
    // show the right compass state instead of a blanket error.
    const aborted = err instanceof Error && err.name === 'AbortError'
    throw new HttpError(
      aborted ? 504 : 502,
      aborted ? 'Compass took too long to answer.' : 'Could not reach the Compass gateway.',
    )
  } finally {
    clearTimeout(timer)
  }

  if (!res.ok) {
    // Surface the gateway's own message when it has one — a 429 from the model
    // provider is actionable ("out of credit"), a bare 502 is not.
    const detail = await res.text().catch(() => '')
    throw new HttpError(res.status === 429 ? 429 : 502, detail.slice(0, 300) || 'Compass gateway error.')
  }

  const data = (await res.json().catch(() => null)) as {
    choices?: { message?: { content?: string } }[]
  } | null

  const reply = data?.choices?.[0]?.message?.content?.trim()
  if (!reply) throw new HttpError(502, 'Compass returned an empty reply.')

  return Response.json({ reply })
})
