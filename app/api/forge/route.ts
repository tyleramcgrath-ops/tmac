// Forge — the AI SEO strategist behind the Command Center.
//
// Streams chat responses via the repo's existing AI Gateway (Claude). The
// client sends the conversation plus a compact, real snapshot of the current
// site audit as grounding context, so Forge answers about the user's actual
// site — not in the abstract.

import { streamText } from 'ai'
import { DEFAULT_MODEL } from '@/ai/constants'
import { getModelOptions } from '@/ai/gateway'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

interface ChatMessage { role: 'user' | 'assistant'; content: string }

const SYSTEM = `You are Forge, an elite in-house SEO strategist and growth engineer working inside RankForge AI — an AI SEO command center.

Voice: a sharp, senior operator, not a chatbot. Confident, concise, specific. No fluff, no "as an AI". Talk like the best SEO hire the user has ever made.

Rules:
- Ground every answer in the SITE AUDIT CONTEXT provided. Reference the user's real pages, scores, and issues.
- Be concrete and prioritized: lead with the single highest-impact move, then the rest.
- When asked to rewrite a title/meta or generate schema, output ready-to-ship content (and for schema, valid JSON-LD in a fenced code block).
- Tie technical fixes to business outcomes (rankings, AI citations, traffic, revenue) when relevant.
- Never invent metrics you weren't given (e.g. exact backlink counts or live rankings). If data isn't in context, say what you'd need and how to get it.
- Prefer tight, skimmable answers. Use short paragraphs or bullets. Keep it under ~200 words unless asked to go deep.`

export async function POST(req: Request) {
  let body: { messages?: ChatMessage[]; context?: string }
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const messages = (Array.isArray(body.messages) ? body.messages : [])
    .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .slice(-16)
  if (messages.length === 0) {
    return Response.json({ error: 'No messages.' }, { status: 400 })
  }

  const context = typeof body.context === 'string' ? body.context.slice(0, 6000) : ''
  const system = context ? `${SYSTEM}\n\n--- SITE AUDIT CONTEXT ---\n${context}` : `${SYSTEM}\n\n(No audit has been run yet — invite the user to run an audit so you can ground your advice in their real site.)`

  try {
    const result = streamText({
      ...getModelOptions(DEFAULT_MODEL),
      system,
      messages,
      onError: (e) => console.error('[forge] stream error', e),
    })
    return result.toTextStreamResponse()
  } catch (err) {
    console.error('[forge] error', err)
    return Response.json(
      { error: 'Forge is unavailable. Ensure AI Gateway is configured (AI_GATEWAY_API_KEY) in your environment.' },
      { status: 502 }
    )
  }
}
