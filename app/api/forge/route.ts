// Forge — the AI SEO strategist behind the Command Center.
//
// Streams chat responses via the repo's existing AI Gateway (Claude). The
// client sends the conversation plus a compact, real snapshot of the current
// site audit as grounding context, so Forge answers about the user's actual
// site — not in the abstract.

import { streamText } from 'ai'
import { DEFAULT_MODEL } from '@/ai/constants'
import { getModelOptions } from '@/ai/gateway'
import { checkRateLimit, clientKey } from '@/lib/rateLimit'
import { retrieveGraphContext } from '@/lib/pipeline/graph/queries'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

interface ChatMessage { role: 'user' | 'assistant'; content: string }

const SYSTEM = `You are Forge, an elite in-house SEO strategist and growth engineer working inside RankForge AI — an AI SEO command center.

Voice: a sharp, senior operator, not a chatbot. Confident, concise, specific. No fluff, no "as an AI". Talk like the best SEO hire the user has ever made.

Grounding rules — non-negotiable:
- Use the KNOWLEDGE GRAPH CONTEXT as your primary source of truth. It is the live state of the customer's site — supports, weaknesses, clusters, orphans, missing entities/services/locations, internal-link opportunities.
- Cite graph evidence when you make a claim. Reference the specific page, cluster, or edge from the context. When the context includes counts, use those exact numbers.
- If the knowledge graph doesn't contain the information you'd need to answer, say so explicitly ("no graph evidence for X — I'd need Y before I could recommend it"). Do not invent relationships, supports, links, entities, or metrics.
- Always identify: supporting pages, related topics, related entities, business objective, money-page relationship, and the reasoning path — whenever they apply to the question.

Style rules:
- Be concrete and prioritized: lead with the single highest-impact move, then the rest.
- When asked to rewrite a title/meta or generate schema, output ready-to-ship content (and for schema, valid JSON-LD in a fenced code block).
- Tie technical fixes to business outcomes (rankings, AI citations, traffic, revenue) when relevant.
- Prefer tight, skimmable answers. Use short paragraphs or bullets. Keep it under ~200 words unless asked to go deep.`

export async function POST(req: Request) {
  const rl = checkRateLimit(clientKey(req, 'forge'), 20, 60_000)
  if (!rl.ok) {
    return Response.json(
      { error: 'Too many requests. Slow down and try again in a minute.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } }
    )
  }

  let body: { messages?: ChatMessage[]; context?: string; projectId?: string }
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

  // Live knowledge-graph retrieval — grounds Forge in explainable graph state
  // rather than a static JSON blob whenever a projectId is provided.
  let graphContextBlock = ''
  if (typeof body.projectId === 'string' && body.projectId) {
    try {
      const graph = await retrieveGraphContext({ projectId: body.projectId })
      graphContextBlock = `\n\n--- KNOWLEDGE GRAPH CONTEXT (live retrieval @ ${graph.generatedAt}) ---\n${formatGraphContext(graph)}`
    } catch (err) {
      console.warn('[forge] graph retrieval failed', err)
    }
  }

  const auditBlock = context ? `\n\n--- SITE AUDIT CONTEXT ---\n${context}` : ''
  const fallback =
    !context && !graphContextBlock
      ? `\n\n(No audit has been run yet — invite the user to run an audit so you can ground your advice in their real site.)`
      : ''
  const system = `${SYSTEM}${auditBlock}${graphContextBlock}${fallback}`

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

function formatGraphContext(graph: Awaited<ReturnType<typeof retrieveGraphContext>>): string {
  const parts: string[] = []
  parts.push(
    `Graph totals: ${graph.totals.nodes} nodes, ${graph.totals.edges} edges. ` +
      `Nodes by type: ${JSON.stringify(graph.totals.byNodeType)}. ` +
      `Edges by type: ${JSON.stringify(graph.totals.byEdgeType)}.`,
  )
  if (graph.strongestCluster) {
    parts.push(
      `Strongest topic cluster: "${graph.strongestCluster.cluster}" — ${graph.strongestCluster.pageCount} pages, ${graph.strongestCluster.topicCount} topics, avg confidence ${graph.strongestCluster.averageConfidence.toFixed(2)}.`,
    )
  }
  if (graph.weakestCluster) {
    parts.push(
      `Weakest topic cluster: "${graph.weakestCluster.cluster}" — ${graph.weakestCluster.pageCount} pages, ${graph.weakestCluster.topicCount} topics.`,
    )
  }
  if (graph.orphanPages.length) {
    parts.push(
      `Orphan pages (${graph.orphanPages.length}):\n` +
        graph.orphanPages.map((o) => `  - ${o.label} (${o.url}) — ${o.reason}`).join('\n'),
    )
  }
  if (graph.weakMoneyPages.length) {
    parts.push(
      `Weak money pages (${graph.weakMoneyPages.length}):\n` +
        graph.weakMoneyPages
          .map(
            (w) =>
              `  - ${w.label} (${w.url}) — supporting=${w.supportingCount}; ${w.reasons.join('; ')}`,
          )
          .join('\n'),
    )
  }
  if (graph.missingServices.length) {
    parts.push(`Missing core services on-site: ${graph.missingServices.join(', ')}`)
  }
  if (graph.missingLocations.length) {
    parts.push(`Missing core locations on-site: ${graph.missingLocations.join(', ')}`)
  }
  if (graph.missingEntities.length) {
    parts.push(`Missing core entities on-site: ${graph.missingEntities.slice(0, 10).join(', ')}`)
  }
  if (graph.topLinkOpportunities.length) {
    parts.push(
      `Top internal-link opportunities (${graph.topLinkOpportunities.length}):\n` +
        graph.topLinkOpportunities
          .map(
            (l) =>
              `  - ${l.fromUrl} → ${l.toUrl} (shared topics ${l.sharedTopics}, confidence ${l.confidence.toFixed(2)})`,
          )
          .join('\n'),
    )
  }
  return parts.join('\n\n')
}
