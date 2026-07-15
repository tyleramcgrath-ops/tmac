import { getPrismaClient } from '@/lib/db'
import { classifyPages } from './stages/classification'
import { extractEntities } from './stages/entity-extraction'
import { detectTopics } from './stages/topic-detection'
import { buildKnowledgeGraph } from './stages/knowledge-graph'
import { analyzeGaps } from './stages/gap-analysis'
import { scorePages } from './stages/content-scoring'
import { calculateDecisionEngine } from './stages/decision-engine'
import { selectDailyMission } from './stages/mission-selection'
import { verifyGraph } from './graph/verifier'
import { retrieveGraphContext, internalLinkOpportunities } from './graph/queries'
import type { Page } from '@prisma/client'

interface PipelineConfig {
  organizationId: string
  projectId: string
  auditId: string
  skipUnchangedPages?: boolean
}

interface PageAnalysisResult {
  url: string
  status: 'success' | 'failed' | 'skipped'
  error?: string
  contentHash?: string
}

export async function executePipeline(config: PipelineConfig) {
  const { organizationId, projectId, auditId } = config
  const prisma = getPrismaClient()

  // Create pipeline run record
  const run = await prisma.pipelineRun.create({
    data: {
      organizationId,
      projectId,
      auditId,
      status: 'running',
      startedAt: new Date(),
    },
  })

  const startTime = Date.now()
  let pagesProcessed = 0
  let pagesFailed = 0
  let pagesSkipped = 0

  try {
    // Get audit and pages to process
    const audit = await prisma.audit.findUnique({
      where: { id: auditId },
      include: { pages: true },
    })

    if (!audit) {
      throw new Error(`Audit ${auditId} not found`)
    }

    const pages = audit.pages
    const totalPages = pages.length

    await prisma.pipelineRun.update({
      where: { id: run.id },
      data: { pagesQueued: totalPages },
    })

    // ─────────────────────────────────────────────────────────────────────────────
    // STAGE 1: CONTENT INVENTORY (create/update inventory records)
    // ─────────────────────────────────────────────────────────────────────────────

    await createStageRecord(prisma, run.id, 'content_inventory')
    console.log(`[Pipeline] Stage 1/8: Content Inventory...`)

    const inventoryResults = await createContentInventory(prisma, pages, {
      organizationId,
      projectId,
      auditId,
    })

    await updateStageRecord(prisma, run.id, 'content_inventory', 'completed', {
      itemsProcessed: inventoryResults.filter((r) => r.status === 'success').length,
      itemsFailed: inventoryResults.filter((r) => r.status === 'failed').length,
      itemsSkipped: inventoryResults.filter((r) => r.status === 'skipped').length,
    })

    pagesProcessed += inventoryResults.filter((r) => r.status === 'success').length
    pagesFailed += inventoryResults.filter((r) => r.status === 'failed').length
    pagesSkipped += inventoryResults.filter((r) => r.status === 'skipped').length

    // ─────────────────────────────────────────────────────────────────────────────
    // STAGE 2: PAGE CLASSIFICATION
    // ─────────────────────────────────────────────────────────────────────────────

    await createStageRecord(prisma, run.id, 'classification')
    console.log(`[Pipeline] Stage 2/8: Page Classification...`)

    const classificationResults = await classifyPages(pages, {
      organizationId,
      projectId,
    })

    await updateStageRecord(prisma, run.id, 'classification', 'completed', {
      itemsProcessed: classificationResults.filter((r) => r.status === 'success').length,
    })

    // ─────────────────────────────────────────────────────────────────────────────
    // STAGE 3: ENTITY EXTRACTION
    // ─────────────────────────────────────────────────────────────────────────────

    await createStageRecord(prisma, run.id, 'entity_extraction')
    console.log(`[Pipeline] Stage 3/8: Entity Extraction...`)

    const entityResults = await extractEntities(pages, {
      organizationId,
      projectId,
    })

    await updateStageRecord(prisma, run.id, 'entity_extraction', 'completed', {
      itemsProcessed: entityResults.filter((r) => r.status === 'success').length,
    })

    // ─────────────────────────────────────────────────────────────────────────────
    // STAGE 4: TOPIC DETECTION
    // ─────────────────────────────────────────────────────────────────────────────

    await createStageRecord(prisma, run.id, 'topic_detection')
    console.log(`[Pipeline] Stage 4/8: Topic Detection...`)

    const topicResults = await detectTopics(pages, {
      organizationId,
      projectId,
    })

    await updateStageRecord(prisma, run.id, 'topic_detection', 'completed', {
      itemsProcessed: topicResults.filter((r) => r.status === 'success').length,
    })

    // ─────────────────────────────────────────────────────────────────────────────
    // STAGE 5: KNOWLEDGE GRAPH CONSTRUCTION
    // ─────────────────────────────────────────────────────────────────────────────

    await createStageRecord(prisma, run.id, 'knowledge_graph')
    console.log(`[Pipeline] Stage 5/8: Knowledge Graph...`)

    const kgResults = await buildKnowledgeGraph(
      { organizationId, projectId },
      entityResults,
      topicResults,
    )

    // Verify + repair the graph immediately after construction so downstream
    // stages consume a clean graph.
    const kgVerification = await verifyGraph({ projectId }, { repair: true })

    await updateStageRecord(prisma, run.id, 'knowledge_graph', 'completed', {
      itemsProcessed: kgResults.nodesCreated + kgResults.edgesCreated,
    })

    await prisma.pipelineStage.update({
      where: { runId_stageName: { runId: run.id, stageName: 'knowledge_graph' } },
      data: {
        evidence: JSON.stringify({
          build: kgResults,
          verification: {
            totals: kgVerification.totals,
            findings: kgVerification.findings.length,
            repaired: kgVerification.repaired,
          },
        }),
      },
    })

    // Materialize internal-link opportunities from the graph so they show up
    // in the recommendation UI without waiting for a separate stage.
    const linkOps = await internalLinkOpportunities({ projectId }, 100)
    for (const op of linkOps) {
      if (!op.fromPage.nodeUrl || !op.toPage.nodeUrl) continue
      try {
        await prisma.internalLinkRecommendation.upsert({
          where: {
            projectId_fromPageUrl_toPageUrl: {
              projectId,
              fromPageUrl: op.fromPage.nodeUrl,
              toPageUrl: op.toPage.nodeUrl,
            },
          },
          create: {
            organizationId,
            projectId,
            fromPageUrl: op.fromPage.nodeUrl,
            toPageUrl: op.toPage.nodeUrl,
            suggestedAnchorText: op.toPage.nodeLabel.slice(0, 120),
            rationale: op.reason,
            priority: op.confidence > 0.8 ? 'high' : op.confidence > 0.6 ? 'medium' : 'low',
            estimatedBenefit: 'improves_topical_relevance',
            isTopicallyRelevant: true,
          },
          update: {
            suggestedAnchorText: op.toPage.nodeLabel.slice(0, 120),
            rationale: op.reason,
            priority: op.confidence > 0.8 ? 'high' : op.confidence > 0.6 ? 'medium' : 'low',
          },
        })
      } catch (e) {
        console.warn('[pipeline] internal-link recommendation failed', e)
      }
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // STAGE 6: CONTENT QUALITY SCORING
    // ─────────────────────────────────────────────────────────────────────────────

    await createStageRecord(prisma, run.id, 'content_scoring')
    console.log(`[Pipeline] Stage 6/8: Content Scoring...`)

    const scoringResults = await scorePages(pages, {
      organizationId,
      projectId,
    })

    await updateStageRecord(prisma, run.id, 'content_scoring', 'completed', {
      itemsProcessed: scoringResults.filter((r) => r.status === 'success').length,
    })

    // ─────────────────────────────────────────────────────────────────────────────
    // STAGE 7: CONTENT GAP ANALYSIS
    // ─────────────────────────────────────────────────────────────────────────────

    await createStageRecord(prisma, run.id, 'gap_analysis')
    console.log(`[Pipeline] Stage 7/8: Content Gap Analysis...`)

    const gapResults = await analyzeGaps(pages, {
      organizationId,
      projectId,
    })

    await updateStageRecord(prisma, run.id, 'gap_analysis', 'completed', {
      itemsProcessed: gapResults.gapsFound,
    })

    // ─────────────────────────────────────────────────────────────────────────────
    // STAGE 8: DECISION ENGINE & DAILY MISSION
    // ─────────────────────────────────────────────────────────────────────────────

    await createStageRecord(prisma, run.id, 'decision_engine')
    console.log(`[Pipeline] Stage 8/8: Decision Engine...`)

    const decisionResults = await calculateDecisionEngine(pages, {
      organizationId,
      projectId,
      auditId,
    })

    const missionResult = await selectDailyMission({ organizationId, projectId })

    await updateStageRecord(prisma, run.id, 'decision_engine', 'completed', {
      itemsProcessed: decisionResults.pagesScored,
    })

    // ─────────────────────────────────────────────────────────────────────────────
    // FINALIZE
    // ─────────────────────────────────────────────────────────────────────────────

    const duration = Date.now() - startTime

    const graphContext = await retrieveGraphContext({ projectId })

    const forgeContext = {
      runId: run.id,
      audit: {
        id: auditId,
        pages: totalPages,
        processed: pagesProcessed,
        skipped: pagesSkipped,
        failed: pagesFailed,
      },
      findings: {
        entities: entityResults.length,
        topics: topicResults.length,
        gaps: gapResults.gapsFound,
        recommendations: decisionResults.pagesScored,
      },
      knowledgeGraph: {
        build: kgResults,
        verification: {
          totals: kgVerification.totals,
          findings: kgVerification.findings.length,
          repaired: kgVerification.repaired,
        },
        totals: graphContext.totals,
        strongestCluster: graphContext.strongestCluster?.cluster ?? null,
        weakestCluster: graphContext.weakestCluster?.cluster ?? null,
        orphanPages: graphContext.orphanPages.length,
        weakMoneyPages: graphContext.weakMoneyPages.length,
        internalLinkOpportunities: graphContext.topLinkOpportunities.length,
      },
      mission: missionResult,
      evidenceAvailable: true,
      executedAt: new Date().toISOString(),
    }

    await prisma.pipelineRun.update({
      where: { id: run.id },
      data: {
        status: pagesFailed === 0 ? 'completed' : 'partial',
        completedAt: new Date(),
        duration,
        pagesProcessed,
        pagesFailed,
        pagesSkipped,
        forgeContext: JSON.stringify(forgeContext),
      },
    })

    console.log(`\n✅ Pipeline completed in ${(duration / 1000).toFixed(2)}s`)
    console.log(`   Pages processed: ${pagesProcessed}/${totalPages}`)
    console.log(`   Pages skipped: ${pagesSkipped}`)
    console.log(`   Pages failed: ${pagesFailed}`)

    return {
      runId: run.id,
      status: pagesFailed === 0 ? 'completed' : 'partial',
      duration,
      summary: {
        pagesQueued: totalPages,
        pagesProcessed,
        pagesSkipped,
        pagesFailed,
      },
      forgeContext,
    }
  } catch (error) {
    const duration = Date.now() - startTime

    await prisma.pipelineRun.update({
      where: { id: run.id },
      data: {
        status: 'failed',
        completedAt: new Date(),
        duration,
        reason: error instanceof Error ? error.message : 'Unknown error',
      },
    })

    console.error(`❌ Pipeline failed after ${(duration / 1000).toFixed(2)}s:`, error)
    throw error
  }
}

async function createStageRecord(
  prisma: ReturnType<typeof getPrismaClient>,
  runId: string,
  stageName: string,
): Promise<void> {
  await prisma.pipelineStage.create({
    data: {
      runId,
      stageName,
      status: 'running',
      startedAt: new Date(),
    },
  })
}

async function updateStageRecord(
  prisma: ReturnType<typeof getPrismaClient>,
  runId: string,
  stageName: string,
  status: string,
  data: { itemsProcessed?: number; itemsFailed?: number; itemsSkipped?: number },
): Promise<void> {
  await prisma.pipelineStage.update({
    where: {
      runId_stageName: { runId, stageName },
    },
    data: {
      status,
      completedAt: new Date(),
      itemsProcessed: data.itemsProcessed ?? 0,
      itemsFailed: data.itemsFailed ?? 0,
      itemsSkipped: data.itemsSkipped ?? 0,
    },
  })
}

async function createContentInventory(
  prisma: ReturnType<typeof getPrismaClient>,
  pages: Page[],
  context: { organizationId: string; projectId: string; auditId: string },
): Promise<PageAnalysisResult[]> {
  const results: PageAnalysisResult[] = []

  for (const page of pages) {
    try {
      // Hash the current page content to detect changes
      const contentHash = generateHash(
        JSON.stringify({ title: page.title, contentLength: page.contentLength }),
      )

      // Check if inventory already exists
      const existing = await prisma.contentInventory.findUnique({
        where: {
          projectId_pageUrl: { projectId: context.projectId, pageUrl: page.url },
        },
      })

      // Skip if unchanged
      if (existing && existing.updatedAt && Date.now() - existing.updatedAt.getTime() < 3600000) {
        results.push({ url: page.url, status: 'skipped', contentHash })
        continue
      }

      // Create or update inventory
      await prisma.contentInventory.upsert({
        where: {
          projectId_pageUrl: { projectId: context.projectId, pageUrl: page.url },
        },
        create: {
          organizationId: context.organizationId,
          projectId: context.projectId,
          pageUrl: page.url,
          contentType: 'page',
          wordCount: page.contentLength,
          schemaTypes: page.schemaTypes ? JSON.parse(page.schemaTypes) : [],
          internalLinkCount: page.internalLinks,
          gscAverageCtr: 0,
          gscAveragePosition: 0,
        },
        update: {
          contentType: 'page',
          wordCount: page.contentLength,
          schemaTypes: page.schemaTypes ? JSON.parse(page.schemaTypes) : [],
          internalLinkCount: page.internalLinks,
          updatedAt: new Date(),
        },
      })

      results.push({ url: page.url, status: 'success', contentHash })
    } catch (error) {
      results.push({
        url: page.url,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  return results
}

function generateHash(content: string): string {
  let hash = 0
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash
  }
  return Math.abs(hash).toString(36)
}
