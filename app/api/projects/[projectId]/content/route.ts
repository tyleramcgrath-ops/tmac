// Content Studio — AI blog-post drafts researched from real live SERP results
// and real tracked-competitor domains. A brief is always just a draft: it only
// becomes a live WordPress post when the user explicitly deploys it (action
// 'publish'), which creates a real WordPress DRAFT (never auto-published) and
// verifies by read-back — the same honesty guarantee every other WP write here
// makes.

import { randomUUID } from 'crypto'
import { generateObject } from 'ai'
import { z } from 'zod'
import { DEFAULT_MODEL } from '@/ai/constants'
import { getModelOptions } from '@/ai/gateway'
import { audit, enforceRateLimit, handled, HttpError, requireProjectRole, requireUser } from '@/lib/foundation/auth'
import { getStore } from '@/lib/foundation/store'
import { latestScanPages } from '@/lib/foundation/operator/context'
import { buildContentPrompt, fetchSerpForKeyword, findContentGaps, markCompetitors, sanitizeContentHtml } from '@/lib/foundation/content/brief'
import { createWpDraftPost } from '@/lib/foundation/wp-execution'
import type { ContentBrief } from '@/lib/foundation/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

const draftSchema = z.object({
  title: z.string().describe('An SEO title for the post, 50-60 characters, keyword-led.'),
  metaDescription: z.string().describe('A compelling meta description, 140-160 characters.'),
  outline: z.array(z.string()).describe('The H2/H3 section headings used in the post, in order.'),
  contentHtml: z.string().describe('The full post body as semantic HTML (h2/h3/p/ul/li), no html/head/body wrapper.'),
  rationale: z.string().describe('One or two sentences on why this angle serves the search intent and beats what currently ranks.'),
})

export const GET = handled(async (request, { params }) => {
  const user = await requireUser(request)
  const { projectId } = await params
  await requireProjectRole(user, projectId, 'member')
  const store = await getStore()

  // Content gaps: real competitor pages we have nothing comparable to, ranked
  // by topic distinctness. Pure token-overlap over already-crawled data — no
  // extra network call, so it's cheap to compute on every load.
  if (new URL(request.url).searchParams.get('gaps') === '1') {
    const [rawPages, competitors] = await Promise.all([latestScanPages(store, projectId), store.listCompetitors(projectId)])
    const ourPages = rawPages.map((p) => ({ title: typeof p.title === 'string' ? p.title : undefined }))
    const gaps = findContentGaps(ourPages, competitors)
    return Response.json({ gaps })
  }

  return Response.json({ briefs: await store.listContentBriefs(projectId) })
})

export const POST = handled(async (request, { params }) => {
  const user = await requireUser(request)
  const { projectId } = await params
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>

  if (body.action === 'generate') {
    const { project } = await requireProjectRole(user, projectId, 'member')
    enforceRateLimit(request, 'content-generate', 10)
    const keyword = String(body.keyword ?? '').trim().slice(0, 120)
    if (!keyword) throw new HttpError(400, 'Enter a target keyword.')

    const store = await getStore()
    const competitors = await store.listCompetitors(projectId)
    const competitorDomains = competitors.map((c) => c.domain)

    const serp = await fetchSerpForKeyword(keyword)
    const marked = markCompetitors(serp.results, competitorDomains)
    const competitorsConsidered = [...new Set(marked.map((r) => r.competitorDomain).filter((d): d is string => !!d))]

    const prompt = buildContentPrompt({
      keyword,
      domain: project.domain,
      serpAvailable: serp.available,
      serpResults: marked,
      competitorsConsidered,
    })

    let object: z.infer<typeof draftSchema>
    try {
      const result = await generateObject({
        ...getModelOptions(DEFAULT_MODEL),
        schema: draftSchema,
        prompt,
        system:
          'You are Forge, an elite SEO content strategist. Write genuinely useful, original blog posts that satisfy real search intent — never thin, generic, or copied from competitors. Titles 50-60 chars, meta descriptions 140-160 chars. Body HTML must be clean and semantic.',
      })
      object = result.object
    } catch (err) {
      console.error('[content/generate] error', err)
      throw new HttpError(502, 'AI generation failed. Ensure AI Gateway (AI_GATEWAY_API_KEY) is configured in your environment.')
    }

    const brief: ContentBrief = {
      id: randomUUID(),
      projectId,
      keyword,
      createdBy: user.id,
      createdAt: new Date().toISOString(),
      status: 'draft',
      serpAvailable: serp.available,
      serpResults: marked,
      competitorsConsidered,
      title: object.title,
      metaDescription: object.metaDescription,
      outline: object.outline,
      contentHtml: sanitizeContentHtml(object.contentHtml),
      rationale: object.rationale,
    }
    await store.createContentBrief(brief)
    await audit(project.orgId, user.id, 'content.generate', brief.id, keyword)
    return Response.json({ brief }, { status: 201 })
  }

  if (body.action === 'publish') {
    const { project } = await requireProjectRole(user, projectId, 'admin')
    enforceRateLimit(request, 'content-publish', 10)
    const store = await getStore()
    const brief = await store.getContentBrief(String(body.id ?? ''))
    if (!brief || brief.projectId !== projectId) throw new HttpError(404, 'Content brief not found.')
    if (brief.status === 'published') throw new HttpError(400, 'This brief is already published as a WordPress draft.')

    const connection = await store.getWpConnection(projectId)
    if (!connection) throw new HttpError(400, 'Connect WordPress for this project first.')

    const postType = body.postType === 'pages' ? ('pages' as const) : ('posts' as const)
    let result
    try {
      result = await createWpDraftPost(connection, postType, {
        title: brief.title,
        content: brief.contentHtml,
        metaDescription: brief.metaDescription,
      })
    } catch (err) {
      throw new HttpError(502, err instanceof Error ? err.message : 'Could not create the WordPress draft.')
    }

    const updated: ContentBrief = {
      ...brief,
      status: 'published',
      wpPostId: result.postId,
      wpPostType: result.postType,
      wpLink: result.link,
      publishedAt: new Date().toISOString(),
    }
    await store.updateContentBrief(updated)
    await audit(project.orgId, user.id, 'content.publish', brief.id, `${postType}/${result.postId}: ${result.note}`)
    return Response.json({ brief: updated, verified: result.verified, note: result.note })
  }

  throw new HttpError(400, 'Unknown action.')
})

export const DELETE = handled(async (request, { params }) => {
  const user = await requireUser(request)
  const { projectId } = await params
  const { project } = await requireProjectRole(user, projectId, 'member')
  const id = new URL(request.url).searchParams.get('id') ?? ''
  const store = await getStore()
  const brief = await store.getContentBrief(id)
  if (!brief || brief.projectId !== projectId) throw new HttpError(404, 'Content brief not found.')
  await store.deleteContentBrief(id)
  await audit(project.orgId, user.id, 'content.discard', id, brief.keyword)
  return Response.json({ ok: true })
})
