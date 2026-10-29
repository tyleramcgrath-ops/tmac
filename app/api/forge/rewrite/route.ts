// Forge AI rewrite — generates an optimized SEO title, meta description, and
// JSON-LD schema for a page, as structured output. Used by the WordPress
// optimizer's "Write with AI" action; the result flows into the same
// preview → confirm → deploy path.

import { generateObject } from 'ai'
import { z } from 'zod'
import { DEFAULT_MODEL } from '@/ai/constants'
import { getModelOptions } from '@/ai/gateway'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 45

const schema = z.object({
  seoTitle: z.string().describe('An optimized SEO title tag, 50-60 characters, compelling and keyword-led.'),
  metaDescription: z.string().describe('A compelling meta description, 140-160 characters, with an implicit call to action.'),
  jsonLd: z.string().describe('Valid JSON-LD structured data as a JSON string (schema.org), appropriate for this page type.'),
  schemaType: z.string().describe('The primary schema.org @type chosen, e.g. Article, Product, LocalBusiness.'),
  rationale: z.string().describe('One or two sentences on why these choices will improve rankings and AI visibility.'),
})

export async function POST(req: Request) {
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const url = String(body.url ?? '')
  const currentTitle = String(body.currentTitle ?? '').slice(0, 300)
  const currentMeta = String(body.currentMeta ?? '').slice(0, 600)
  const keyword = String(body.keyword ?? '').slice(0, 120)
  const excerpt = String(body.excerpt ?? '').slice(0, 2000)

  const prompt = `Optimize the on-page SEO for this page.

URL: ${url}
Current title: ${currentTitle || '(none)'}
Current meta description: ${currentMeta || '(none)'}
${keyword ? `Primary keyword to target: ${keyword}` : ''}
Page content excerpt: ${excerpt || '(not available)'}

Write a better SEO title and meta description, and generate appropriate JSON-LD structured data for this page. Keep the brand/topic intent intact.`

  try {
    const { object } = await generateObject({
      ...getModelOptions(DEFAULT_MODEL),
      schema,
      prompt,
      system: 'You are Forge, an elite SEO strategist. Produce ready-to-ship, on-brand output. Titles 50-60 chars, meta descriptions 140-160 chars. JSON-LD must be valid schema.org and reflect the real page type.',
    })
    // Validate the JSON-LD parses; if not, drop it rather than ship broken markup.
    let jsonLd = object.jsonLd
    try { JSON.parse(jsonLd) } catch { jsonLd = '' }
    return Response.json({ ...object, jsonLd })
  } catch (err) {
    console.error('[forge/rewrite] error', err)
    return Response.json(
      { error: 'AI generation failed. Ensure AI Gateway (AI_GATEWAY_API_KEY) is configured in your environment.' },
      { status: 502 }
    )
  }
}
