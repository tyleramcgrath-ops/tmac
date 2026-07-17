// External Knowledge Graph (Phase G §7). Extends the internal model with
// competitors, brands, products, topics, and public entities, plus the search
// relationships between them. EVERYTHING references evidence — a node or edge
// with no evidence cannot exist, and its grade says whether it was observed,
// imported, estimated, or is a placeholder for unavailable data.

import type { Competitor } from '../types'
import type { Evidence } from './types'
import type { CompetitorOverlap } from './competitors'
import type { AiVisibility } from './providers/ai-search'

export type NodeKind = 'brand' | 'competitor' | 'product' | 'topic' | 'entity'
export type EdgeKind = 'competes-with' | 'covers-topic' | 'cited-by-ai' | 'mentions-entity'

export interface GraphNode {
  id: string
  kind: NodeKind
  label: string
  evidence: Evidence
}
export interface GraphEdge {
  from: string
  to: string
  kind: EdgeKind
  weight: number | null
  evidence: Evidence
}
export interface ExternalGraph {
  nodes: GraphNode[]
  edges: GraphEdge[]
}

export function buildExternalGraph(
  brandDomain: string,
  competitors: { competitor: Competitor; overlap: CompetitorOverlap }[],
  aiVisibility: AiVisibility[],
): ExternalGraph {
  const nodes: GraphNode[] = []
  const edges: GraphEdge[] = []
  const selfEvidence: Evidence = { grade: 'observed', source: 'rankforge-crawl', fetchedAt: null }
  const brandId = `brand:${brandDomain}`
  nodes.push({ id: brandId, kind: 'brand', label: brandDomain, evidence: selfEvidence })

  for (const { competitor, overlap } of competitors) {
    const cid = `competitor:${competitor.domain}`
    // The competitor node's evidence grade reflects how we know about it: the
    // human added it (imported), and overlap may be observed or unavailable.
    nodes.push({ id: cid, kind: 'competitor', label: competitor.label || competitor.domain, evidence: { grade: 'imported', source: 'user', fetchedAt: competitor.createdAt } })
    edges.push({
      from: brandId, to: cid, kind: 'competes-with',
      weight: typeof overlap.businessOverlap.value === 'number' ? overlap.businessOverlap.value : null,
      evidence: overlap.businessOverlap.evidence,
    })
  }

  // Entities + citations from AI-search observations (only what was observed).
  const seenEntity = new Set<string>()
  for (const v of aiVisibility) {
    for (const e of v.entityMentions) {
      const eid = `entity:${e.toLowerCase()}`
      if (!seenEntity.has(eid)) {
        seenEntity.add(eid)
        nodes.push({ id: eid, kind: 'entity', label: e, evidence: { grade: 'observed', source: `ai:${v.engine}`, fetchedAt: null } })
      }
      edges.push({ from: brandId, to: eid, kind: 'mentions-entity', weight: null, evidence: { grade: 'observed', source: `ai:${v.engine}`, fetchedAt: null } })
    }
    if (v.cited) {
      edges.push({ from: brandId, to: `entity:${v.engine}`, kind: 'cited-by-ai', weight: v.citationCount, evidence: { grade: 'observed', source: `ai:${v.engine}`, fetchedAt: null } })
    }
  }

  return { nodes, edges }
}
