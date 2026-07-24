// Simulated WordPress execution.
//
// North Star Headquarters runs on seeded, self-contained demo data — it never
// holds credentials for a real WordPress site. The real `wp-execution.ts` (in
// the RankForge app this was forked from) captures a live BEFORE, applies the
// write, and re-reads to VERIFY against an actual site. Here every step is
// simulated in the same shape (before/after/approver/reason/verification) so
// the Operator/Mission panels behave identically, but nothing ever leaves this
// process — there is no real site to write to.

import { randomUUID } from 'crypto'
import { getStore } from './store'
import { applyContentTransform, type ContentTransform } from './operator/content-fix'
import { emitActivity } from './activity/emit'
import type { SeoPlugin, WpConnection, WpDeployment } from './types'

export function pluginOf(conn: WpConnection): SeoPlugin {
  return conn.seoPlugin ?? (conn.aioseo ? 'aioseo' : 'core')
}

export interface WpChanges {
  title?: string
  metaDescription?: string
  content?: string
  contentTransform?: ContentTransform
}

// Resolves a page URL to a simulated post id/type, deterministically derived
// from the URL so the same page always resolves to the same fake post.
export async function resolveWpTarget(
  _conn: WpConnection,
  pageUrl: string
): Promise<{ postId: number; postType: 'posts' | 'pages'; title: string } | null> {
  let slug = ''
  try {
    const path = new URL(pageUrl).pathname.replace(/\/+$/, '')
    slug = path.split('/').filter(Boolean).pop() ?? ''
  } catch {
    return null
  }
  if (!slug) return null
  let h = 0
  for (let i = 0; i < slug.length; i++) h = (h * 31 + slug.charCodeAt(i)) >>> 0
  return { postId: (h % 9000) + 1000, postType: 'pages', title: slug.replace(/-/g, ' ') }
}

function contentHash(text: string): string {
  let h = 0
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) >>> 0
  return h.toString(16).padStart(8, '0')
}

// Simulates a deploy: no network call, always succeeds and verifies — the
// "live" before-state is fabricated rather than read from a real site.
export async function executeWpDeployment(opts: {
  projectId: string
  orgId: string
  connection: WpConnection
  postId: number
  postType: 'posts' | 'pages'
  changes: WpChanges
  approvedBy: string
  reason: string
  recommendationId?: string
}): Promise<WpDeployment> {
  const store = await getStore()
  const now = new Date().toISOString()

  const beforeContent = `Simulated live content for post #${opts.postId}.`
  const transform = opts.changes.contentTransform
  const changes: WpChanges = { title: opts.changes.title, metaDescription: opts.changes.metaDescription }
  if (transform) {
    const t = applyContentTransform(beforeContent, transform)
    if (t.changed) changes.content = t.content
  }

  const dep: WpDeployment = {
    id: randomUUID(),
    projectId: opts.projectId,
    connectionId: opts.connection.id,
    postId: opts.postId,
    postType: opts.postType,
    postUrl: opts.connection.siteUrl ? `${opts.connection.siteUrl}/post-${opts.postId}` : `https://example-site.test/post-${opts.postId}`,
    before: {
      title: `Untitled post #${opts.postId}`,
      metaDescription: '',
      contentHash: contentHash(beforeContent),
      content: beforeContent,
    },
    after: changes,
    approvedBy: opts.approvedBy,
    approvedAt: now,
    reason: opts.reason,
    recommendationId: opts.recommendationId,
    status: 'verified',
    verification: {
      checkedAt: now,
      titleMatches: changes.title === undefined ? null : true,
      metaMatches: changes.metaDescription === undefined ? null : true,
      note: 'Simulated deployment (demo data) — no real site was written to.',
    },
    result: 'Applied and verified (simulated).',
    createdAt: now,
  }

  await store.createWpDeployment(dep)
  return dep
}

export async function rollbackWpDeployment(opts: {
  deployment: WpDeployment
  connection: WpConnection
  actorId: string
}): Promise<WpDeployment> {
  const store = await getStore()
  const dep = opts.deployment
  const project = await store.getProject(dep.projectId)

  if (project) {
    await emitActivity(store, {
      orgId: project.orgId,
      projectId: dep.projectId,
      type: 'rollback.started',
      summary: `Operator is rolling back the simulated deployment on ${dep.postUrl}.`,
      recommendationId: dep.recommendationId ?? null,
      agentRole: 'operator',
      actorId: opts.actorId,
    })
  }

  dep.status = 'rolled_back'
  dep.rolledBackAt = new Date().toISOString()
  dep.rolledBackBy = opts.actorId
  await store.updateWpDeployment(dep)

  if (project) {
    await emitActivity(store, {
      orgId: project.orgId,
      projectId: dep.projectId,
      type: 'rollback.finished',
      summary: `Rollback on ${dep.postUrl} finished (simulated).`,
      recommendationId: dep.recommendationId ?? null,
      agentRole: 'operator',
      actorId: opts.actorId,
    })
  }

  return dep
}
