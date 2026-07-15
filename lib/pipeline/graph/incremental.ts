import { getPrismaClient } from '@/lib/db'
import type { Page } from '@prisma/client'
import { buildNodeId, NODE_TYPES } from '@/lib/pipeline/stages/knowledge-graph'
import { withLatency } from './metrics'

/**
 * Incremental graph updates.
 *
 * The full KG build rewrites everything from the latest audit. For projects
 * with thousands of pages we don't want to redo that work whenever a single
 * page changes. This module computes a content hash per page and returns the
 * subset of pages that actually differ from the graph's last observed state.
 *
 * We store the hash inside the page/money-page node's `properties` JSON blob
 * under `properties.contentHash` — that way there is no schema migration,
 * yet we can perform quick set-difference on subsequent runs.
 */

export interface IncrementalPlan {
  totalPages: number
  changedPageUrls: string[]
  unchangedPageUrls: string[]
  newPageUrls: string[]
  removedPageUrls: string[]
  fullRebuild: boolean
}

interface Ctx {
  projectId: string
}

export function pageContentHash(page: Page): string {
  const payload = JSON.stringify({
    title: page.title ?? null,
    h1: page.h1 ?? null,
    metaDescription: page.metaDescription ?? null,
    contentLength: page.contentLength,
    schemaTypes: page.schemaTypes ?? null,
    canonical: page.canonical ?? null,
    hasNoindex: page.hasNoindex,
    internalLinks: page.internalLinks,
  })
  return fnv1a32(payload).toString(36)
}

export async function planIncrementalRebuild(
  ctx: Ctx,
  currentPages: Page[],
): Promise<IncrementalPlan> {
  return withLatency('planIncrementalRebuild', async () => {
    const prisma = getPrismaClient()

    const existingPageNodes = await prisma.knowledgeGraphNode.findMany({
      where: {
        projectId: ctx.projectId,
        nodeType: { in: [NODE_TYPES.PAGE, NODE_TYPES.MONEY_PAGE] },
      },
      select: { nodeId: true, nodeUrl: true, properties: true },
    })

    const existingByUrl = new Map<string, { nodeId: string; hash: string | null }>()
    for (const n of existingPageNodes) {
      if (!n.nodeUrl) continue
      let hash: string | null = null
      if (n.properties) {
        try {
          const parsed = JSON.parse(n.properties)
          if (typeof parsed?.contentHash === 'string') hash = parsed.contentHash
        } catch {
          // ignore
        }
      }
      existingByUrl.set(n.nodeUrl, { nodeId: n.nodeId, hash })
    }

    const currentByUrl = new Map<string, Page>(currentPages.map((p) => [p.url, p]))
    const changed: string[] = []
    const unchanged: string[] = []
    const added: string[] = []

    for (const page of currentPages) {
      const existing = existingByUrl.get(page.url)
      const newHash = pageContentHash(page)
      if (!existing) {
        added.push(page.url)
      } else if (existing.hash !== newHash) {
        changed.push(page.url)
      } else {
        unchanged.push(page.url)
      }
    }

    const removed: string[] = []
    for (const [url] of existingByUrl.entries()) {
      if (!currentByUrl.has(url)) removed.push(url)
    }

    // If more than 40% of pages changed OR the graph is empty, do a full
    // rebuild — many-to-many edge recomputation is cheaper batched.
    const changeRatio =
      currentPages.length > 0 ? (changed.length + added.length) / currentPages.length : 1
    const fullRebuild = existingPageNodes.length === 0 || changeRatio >= 0.4

    return {
      totalPages: currentPages.length,
      changedPageUrls: changed,
      unchangedPageUrls: unchanged,
      newPageUrls: added,
      removedPageUrls: removed,
      fullRebuild,
    }
  })
}

/**
 * Drops nodes for pages that no longer exist and returns the count removed.
 * Safe to call before an incremental rebuild.
 */
export async function pruneRemovedPages(ctx: Ctx, removedUrls: string[]): Promise<number> {
  if (removedUrls.length === 0) return 0
  const prisma = getPrismaClient()
  const nodeIds = [
    ...removedUrls.map((u) => buildNodeId(NODE_TYPES.PAGE, u)),
    ...removedUrls.map((u) => buildNodeId(NODE_TYPES.MONEY_PAGE, u)),
  ]
  const result = await prisma.knowledgeGraphNode.deleteMany({
    where: { projectId: ctx.projectId, nodeId: { in: nodeIds } },
  })
  return result.count
}

/**
 * After the graph builder finishes, stamp the current contentHash into each
 * page node so the next run can compare deterministically.
 */
export async function persistPageHashes(ctx: Ctx, pages: Page[]): Promise<void> {
  const prisma = getPrismaClient()
  for (const page of pages) {
    const nodeIds = [
      buildNodeId(NODE_TYPES.PAGE, page.url),
      buildNodeId(NODE_TYPES.MONEY_PAGE, page.url),
    ]
    const hash = pageContentHash(page)
    for (const nodeId of nodeIds) {
      const existing = await prisma.knowledgeGraphNode.findUnique({
        where: { projectId_nodeId: { projectId: ctx.projectId, nodeId } },
        select: { id: true, properties: true },
      })
      if (!existing) continue
      let merged: Record<string, unknown> = { contentHash: hash }
      if (existing.properties) {
        try {
          const parsed = JSON.parse(existing.properties)
          if (parsed && typeof parsed === 'object') merged = { ...parsed, contentHash: hash }
        } catch {
          // fall through with fresh object
        }
      }
      await prisma.knowledgeGraphNode.update({
        where: { id: existing.id },
        data: { properties: JSON.stringify(merged) },
      })
    }
  }
}

/**
 * 32-bit FNV-1a — small, fast, dependency-free. Sufficient for change
 * detection where a cryptographic hash isn't required.
 */
function fnv1a32(input: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}
