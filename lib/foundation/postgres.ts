// Postgres implementation of FoundationStore.
//
// Entities are stored as JSONB documents with indexed key columns —
// the same store contract as the file store, backed by a real database.
// Schema comes from versioned migrations (see migrate.ts).
//
// Phase D.6 P7 — anti-drift: every table's projected (non-`data`) columns are
// declared ONCE in TABLES via a single key-extractor. insert/update/upsert are
// generic and build their SQL from that extractor, so an INSERT and an UPDATE
// can never disagree about the column set, and adding a projected column is a
// one-line edit — eliminating the A12 "the INSERT forgot a NOT-NULL column"
// bug class.

import { Pool } from 'pg'
import { runMigrations } from './migrate'
import type { FoundationStore } from './store'
import type {
  AiCitationSnapshot,
  AtlasHistory,
  AuditLogEntry,
  BacklinkSnapshot,
  Competitor,
  ContentBrief,
  Invitation,
  Job,
  Organization,
  OrgMember,
  PilotFeedback,
  Project,
  ProviderConnection,
  RankSnapshot,
  Recommendation,
  Scan,
  Schedule,
  TrackedAiQuery,
  TrackedKeyword,
  User,
  WpConnection,
  WpDeployment,
} from './types'

// A table descriptor: the physical name, the primary-key columns, and the ONE
// function that projects an entity onto its indexed columns. Both insert and
// update read the column set from here, so they cannot drift.
interface TableDesc<T> {
  name: string
  pk: string[]
  keys: (e: T) => Record<string, unknown>
}

const TABLES = {
  users: { name: 'rf_users', pk: ['id'], keys: (u: User) => ({ id: u.id, email: u.email }) } as TableDesc<User>,
  orgs: { name: 'rf_orgs', pk: ['id'], keys: (o: Organization) => ({ id: o.id }) } as TableDesc<Organization>,
  members: {
    name: 'rf_members',
    pk: ['org_id', 'user_id'],
    keys: (m: OrgMember) => ({ org_id: m.orgId, user_id: m.userId, role: m.role }),
  } as TableDesc<OrgMember>,
  invitations: {
    name: 'rf_invitations',
    pk: ['id'],
    keys: (i: Invitation) => ({ id: i.id, org_id: i.orgId, email: i.email, token: i.token, status: i.status, created_at: i.createdAt }),
  } as TableDesc<Invitation>,
  projects: {
    name: 'rf_projects',
    pk: ['id'],
    keys: (p: Project) => ({ id: p.id, org_id: p.orgId, domain: p.domain }),
  } as TableDesc<Project>,
  scans: {
    name: 'rf_scans',
    pk: ['id'],
    keys: (s: Scan) => ({ id: s.id, project_id: s.projectId, status: s.status, created_at: s.createdAt }),
  } as TableDesc<Scan>,
  recs: {
    name: 'rf_recommendations',
    pk: ['id'],
    keys: (r: Recommendation) => ({ id: r.id, project_id: r.projectId, scan_id: r.scanId, status: r.status, created_at: r.createdAt }),
  } as TableDesc<Recommendation>,
  competitors: {
    name: 'rf_competitors',
    pk: ['id'],
    keys: (c: Competitor) => ({ id: c.id, project_id: c.projectId, domain: c.domain, created_at: c.createdAt }),
  } as TableDesc<Competitor>,
  atlasHistory: {
    name: 'rf_atlas_history',
    pk: ['project_id'],
    keys: (h: AtlasHistory) => ({ project_id: h.projectId, captured_at: h.capturedAt }),
  } as TableDesc<AtlasHistory>,
  contentBriefs: {
    name: 'rf_content_briefs',
    pk: ['id'],
    keys: (b: ContentBrief) => ({ id: b.id, project_id: b.projectId, status: b.status, created_at: b.createdAt }),
  } as TableDesc<ContentBrief>,
  wpConn: {
    name: 'rf_wp_connections',
    pk: ['project_id'],
    keys: (c: WpConnection) => ({ project_id: c.projectId }),
  } as TableDesc<WpConnection>,
  wpDep: {
    name: 'rf_wp_deployments',
    pk: ['id'],
    keys: (d: WpDeployment) => ({ id: d.id, project_id: d.projectId, status: d.status, created_at: d.createdAt }),
  } as TableDesc<WpDeployment>,
  providerConn: {
    name: 'rf_provider_connections',
    pk: ['project_id', 'kind'],
    keys: (c: ProviderConnection) => ({ project_id: c.projectId, kind: c.kind, created_at: c.createdAt }),
  } as TableDesc<ProviderConnection>,
  audit: {
    name: 'rf_audit',
    pk: ['id'],
    keys: (a: AuditLogEntry) => ({ id: a.id, org_id: a.orgId, at: a.at }),
  } as TableDesc<AuditLogEntry>,
  feedback: {
    name: 'rf_feedback',
    pk: ['id'],
    keys: (f: PilotFeedback) => ({ id: f.id, org_id: f.orgId, created_at: f.createdAt }),
  } as TableDesc<PilotFeedback>,
  jobs: {
    name: 'rf_jobs',
    pk: ['id'],
    keys: (j: Job) => ({ id: j.id, project_id: j.projectId, status: j.status, run_at: j.runAt, locked_at: j.lockedAt, created_at: j.createdAt }),
  } as TableDesc<Job>,
  schedules: {
    name: 'rf_schedules',
    pk: ['project_id', 'kind'],
    keys: (s: Schedule) => ({ project_id: s.projectId, kind: s.kind, enabled: s.enabled, next_run_at: s.nextRunAt, created_at: s.createdAt }),
  } as TableDesc<Schedule>,
  trackedKeywords: {
    name: 'rf_tracked_keywords',
    pk: ['id'],
    keys: (k: TrackedKeyword) => ({ id: k.id, project_id: k.projectId, keyword: k.keyword, created_at: k.createdAt }),
  } as TableDesc<TrackedKeyword>,
  rankSnapshots: {
    name: 'rf_rank_snapshots',
    pk: ['id'],
    keys: (s: RankSnapshot) => ({ id: s.id, project_id: s.projectId, keyword: s.keyword, checked_at: s.checkedAt }),
  } as TableDesc<RankSnapshot>,
  trackedAiQueries: {
    name: 'rf_tracked_ai_queries',
    pk: ['id'],
    keys: (q: TrackedAiQuery) => ({ id: q.id, project_id: q.projectId, query: q.query, created_at: q.createdAt }),
  } as TableDesc<TrackedAiQuery>,
  aiCitationSnapshots: {
    name: 'rf_ai_citation_snapshots',
    pk: ['id'],
    keys: (s: AiCitationSnapshot) => ({ id: s.id, project_id: s.projectId, query: s.query, checked_at: s.checkedAt }),
  } as TableDesc<AiCitationSnapshot>,
  backlinkSnapshots: {
    name: 'rf_backlink_snapshots',
    pk: ['id'],
    keys: (s: BacklinkSnapshot) => ({ id: s.id, project_id: s.projectId, checked_at: s.checkedAt }),
  } as TableDesc<BacklinkSnapshot>,
}

export class PostgresFoundationStore implements FoundationStore {
  private pool: Pool

  private constructor(pool: Pool) {
    this.pool = pool
  }

  static async create(url: string): Promise<PostgresFoundationStore> {
    const ssl = /localhost|127\.0\.0\.1/.test(url) ? undefined : { rejectUnauthorized: false }
    const pool = new Pool({ connectionString: url, ssl, max: 5 })
    // RC1 reliability fix: node-pg emits 'error' on IDLE clients when the
    // backend drops them (exactly what a Postgres restart / failover does). An
    // unhandled 'error' on the pool's EventEmitter would crash the Node process.
    // We swallow it here — the pool transparently opens fresh connections on the
    // next query, so a routine DB restart degrades to a few failed in-flight
    // requests (mapped to 500s) instead of taking the whole server down.
    pool.on('error', (err) => {
      console.warn('[postgres] idle client error (pool will recover):', err instanceof Error ? err.message : err)
    })
    if (process.env.RF_SKIP_MIGRATE_ON_CONNECT !== '1') {
      await runMigrations(pool)
    }
    return new PostgresFoundationStore(pool)
  }

  private async rows<T>(sql: string, params: unknown[]): Promise<T[]> {
    const res = await this.pool.query(sql, params)
    return res.rows.map((r) => r.data as T)
  }

  // ── Generic blob writers (single source of column truth) ───────────────────
  private async ins<T>(t: TableDesc<T>, e: T): Promise<void> {
    const k = t.keys(e)
    const cols = Object.keys(k)
    const placeholders = cols.map((_, i) => `$${i + 1}`).join(', ')
    await this.pool.query(
      `INSERT INTO ${t.name} (${cols.join(', ')}, data) VALUES (${placeholders}, $${cols.length + 1})`,
      [...Object.values(k), e]
    )
  }

  private async upd<T>(t: TableDesc<T>, e: T): Promise<void> {
    const k = t.keys(e)
    const params: unknown[] = []
    const setParts: string[] = []
    let i = 1
    for (const [col, val] of Object.entries(k)) {
      if (t.pk.includes(col)) continue // never re-assign the primary key
      setParts.push(`${col}=$${i++}`)
      params.push(val)
    }
    setParts.push(`data=$${i++}`)
    params.push(e)
    const where = t.pk.map((col) => `${col}=$${i++}`)
    for (const col of t.pk) params.push(k[col])
    await this.pool.query(`UPDATE ${t.name} SET ${setParts.join(', ')} WHERE ${where.join(' AND ')}`, params)
  }

  private async ups<T>(t: TableDesc<T>, e: T): Promise<void> {
    const k = t.keys(e)
    const cols = Object.keys(k)
    const placeholders = cols.map((_, i) => `$${i + 1}`).join(', ')
    const setParts = cols.filter((c) => !t.pk.includes(c)).map((c) => `${c}=EXCLUDED.${c}`)
    setParts.push('data=EXCLUDED.data')
    await this.pool.query(
      `INSERT INTO ${t.name} (${cols.join(', ')}, data) VALUES (${placeholders}, $${cols.length + 1})
       ON CONFLICT (${t.pk.join(', ')}) DO UPDATE SET ${setParts.join(', ')}`,
      [...Object.values(k), e]
    )
  }

  // ── Users & orgs ───────────────────────────────────────────────────────────
  async createUser(user: User) {
    await this.ins(TABLES.users, user)
  }
  async updateUser(user: User) {
    await this.upd(TABLES.users, user)
  }
  async getUserByEmail(email: string) {
    const r = await this.rows<User>('SELECT data FROM rf_users WHERE email=$1', [email.toLowerCase()])
    return r[0] ?? null
  }
  async getUserById(id: string) {
    const r = await this.rows<User>('SELECT data FROM rf_users WHERE id=$1', [id])
    return r[0] ?? null
  }
  async getUserByVerifyToken(token: string) {
    const r = await this.rows<User>("SELECT data FROM rf_users WHERE data->>'verifyToken'=$1", [token])
    return r[0] ?? null
  }
  async createOrg(org: Organization, ownerId: string) {
    await this.ins(TABLES.orgs, org)
    await this.ins(TABLES.members, { orgId: org.id, userId: ownerId, role: 'owner', createdAt: org.createdAt })
  }
  async updateOrg(org: Organization) {
    await this.upd(TABLES.orgs, org)
  }
  async getOrg(id: string) {
    const r = await this.rows<Organization>('SELECT data FROM rf_orgs WHERE id=$1', [id])
    return r[0] ?? null
  }
  async listOrgsForUser(userId: string) {
    return this.rows<Organization>(
      'SELECT o.data FROM rf_orgs o JOIN rf_members m ON m.org_id=o.id WHERE m.user_id=$1',
      [userId]
    )
  }
  async listOrgs() {
    const orgs = await this.rows<Organization>('SELECT data FROM rf_orgs', [])
    return orgs.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }
  async getMembership(orgId: string, userId: string) {
    const r = await this.rows<OrgMember>('SELECT data FROM rf_members WHERE org_id=$1 AND user_id=$2', [orgId, userId])
    return r[0] ?? null
  }
  async listMembers(orgId: string) {
    return this.rows<OrgMember>('SELECT data FROM rf_members WHERE org_id=$1', [orgId])
  }
  async addMember(member: OrgMember) {
    await this.ups(TABLES.members, member)
  }

  async removeMember(orgId: string, userId: string) {
    await this.pool.query('DELETE FROM rf_members WHERE org_id=$1 AND user_id=$2', [orgId, userId])
  }

  // ── Team invitations ─────────────────────────────────────────────────────────
  async createInvitation(invitation: Invitation) {
    await this.ins(TABLES.invitations, invitation)
  }
  async updateInvitation(invitation: Invitation) {
    await this.upd(TABLES.invitations, invitation)
  }
  async getInvitationByToken(token: string) {
    const r = await this.rows<Invitation>('SELECT data FROM rf_invitations WHERE token=$1', [token])
    return r[0] ?? null
  }
  async listInvitations(orgId: string) {
    return this.rows<Invitation>('SELECT data FROM rf_invitations WHERE org_id=$1 ORDER BY created_at DESC', [orgId])
  }

  // ── Projects ───────────────────────────────────────────────────────────────
  async createProject(project: Project) {
    await this.ins(TABLES.projects, project)
  }
  async getProject(id: string) {
    const r = await this.rows<Project>('SELECT data FROM rf_projects WHERE id=$1', [id])
    return r[0] ?? null
  }
  async updateProject(project: Project) {
    await this.upd(TABLES.projects, project)
  }
  async deleteProject(id: string) {
    await this.pool.query('DELETE FROM rf_projects WHERE id=$1', [id])
  }
  async listProjects(orgId: string) {
    return this.rows<Project>('SELECT data FROM rf_projects WHERE org_id=$1', [orgId])
  }

  // ── Scans ──────────────────────────────────────────────────────────────────
  async createScan(scan: Scan) {
    await this.ins(TABLES.scans, scan)
  }
  async updateScan(scan: Scan) {
    await this.upd(TABLES.scans, scan)
  }
  async getScan(id: string) {
    const r = await this.rows<Scan>('SELECT data FROM rf_scans WHERE id=$1', [id])
    return r[0] ?? null
  }
  async listScans(projectId: string, limit = 20) {
    return this.rows<Scan>('SELECT data FROM rf_scans WHERE project_id=$1 ORDER BY created_at DESC LIMIT $2', [
      projectId,
      limit,
    ])
  }

  // ── Recommendations ────────────────────────────────────────────────────────
  async createRecommendations(recs: Recommendation[]) {
    for (const rec of recs) await this.ins(TABLES.recs, rec)
  }
  async getRecommendation(id: string) {
    const r = await this.rows<Recommendation>('SELECT data FROM rf_recommendations WHERE id=$1', [id])
    return r[0] ?? null
  }
  async updateRecommendation(rec: Recommendation) {
    await this.upd(TABLES.recs, rec)
  }
  async listRecommendations(projectId: string) {
    return this.rows<Recommendation>(
      'SELECT data FROM rf_recommendations WHERE project_id=$1 ORDER BY created_at DESC',
      [projectId]
    )
  }

  // ── Competitors (Phase G) ────────────────────────────────────────────────
  async createCompetitor(competitor: Competitor) {
    await this.ins(TABLES.competitors, competitor)
  }
  async updateCompetitor(competitor: Competitor) {
    await this.upd(TABLES.competitors, competitor)
  }
  async listCompetitors(projectId: string) {
    return this.rows<Competitor>('SELECT data FROM rf_competitors WHERE project_id=$1 ORDER BY created_at DESC', [projectId])
  }
  async getCompetitor(id: string) {
    const r = await this.rows<Competitor>('SELECT data FROM rf_competitors WHERE id=$1', [id])
    return r[0] ?? null
  }
  async deleteCompetitor(id: string) {
    await this.pool.query('DELETE FROM rf_competitors WHERE id=$1', [id])
  }

  // ── Rank tracking ────────────────────────────────────────────────────────
  async addTrackedKeyword(kw: TrackedKeyword) {
    await this.ins(TABLES.trackedKeywords, kw)
  }
  async listTrackedKeywords(projectId: string) {
    return this.rows<TrackedKeyword>('SELECT data FROM rf_tracked_keywords WHERE project_id=$1 ORDER BY created_at', [projectId])
  }
  async removeTrackedKeyword(id: string) {
    await this.pool.query('DELETE FROM rf_tracked_keywords WHERE id=$1', [id])
  }
  async recordRankSnapshot(snap: RankSnapshot) {
    await this.ins(TABLES.rankSnapshots, snap)
  }
  async listRankSnapshots(projectId: string, keyword?: string) {
    if (keyword) {
      return this.rows<RankSnapshot>(
        'SELECT data FROM rf_rank_snapshots WHERE project_id=$1 AND keyword=$2 ORDER BY checked_at',
        [projectId, keyword]
      )
    }
    return this.rows<RankSnapshot>('SELECT data FROM rf_rank_snapshots WHERE project_id=$1 ORDER BY checked_at', [projectId])
  }

  // ── AI citation tracking ─────────────────────────────────────────────────
  async addTrackedAiQuery(q: TrackedAiQuery) {
    await this.ins(TABLES.trackedAiQueries, q)
  }
  async listTrackedAiQueries(projectId: string) {
    return this.rows<TrackedAiQuery>('SELECT data FROM rf_tracked_ai_queries WHERE project_id=$1 ORDER BY created_at', [projectId])
  }
  async removeTrackedAiQuery(id: string) {
    await this.pool.query('DELETE FROM rf_tracked_ai_queries WHERE id=$1', [id])
  }
  async recordAiCitationSnapshot(snap: AiCitationSnapshot) {
    await this.ins(TABLES.aiCitationSnapshots, snap)
  }
  async listAiCitationSnapshots(projectId: string, query?: string) {
    if (query) {
      return this.rows<AiCitationSnapshot>(
        'SELECT data FROM rf_ai_citation_snapshots WHERE project_id=$1 AND query=$2 ORDER BY checked_at',
        [projectId, query]
      )
    }
    return this.rows<AiCitationSnapshot>('SELECT data FROM rf_ai_citation_snapshots WHERE project_id=$1 ORDER BY checked_at', [projectId])
  }

  // ── Backlink profile snapshots ───────────────────────────────────────────
  async recordBacklinkSnapshot(snap: BacklinkSnapshot) {
    await this.ins(TABLES.backlinkSnapshots, snap)
  }
  async listBacklinkSnapshots(projectId: string, limit?: number) {
    const rows = await this.rows<BacklinkSnapshot>(
      `SELECT data FROM rf_backlink_snapshots WHERE project_id=$1 ORDER BY checked_at DESC${limit ? ` LIMIT ${Number(limit)}` : ''}`,
      [projectId]
    )
    return rows
  }

  // ── Atlas change-detection baseline (Phase G) ───────────────────────────────
  async getAtlasHistory(projectId: string) {
    const r = await this.rows<AtlasHistory>('SELECT data FROM rf_atlas_history WHERE project_id=$1', [projectId])
    return r[0] ?? null
  }
  async upsertAtlasHistory(history: AtlasHistory) {
    await this.ups(TABLES.atlasHistory, history)
  }

  // ── Content briefs (Content Studio) ─────────────────────────────────────────
  async createContentBrief(brief: ContentBrief) {
    await this.ins(TABLES.contentBriefs, brief)
  }
  async updateContentBrief(brief: ContentBrief) {
    await this.upd(TABLES.contentBriefs, brief)
  }
  async listContentBriefs(projectId: string) {
    return this.rows<ContentBrief>('SELECT data FROM rf_content_briefs WHERE project_id=$1 ORDER BY created_at DESC', [projectId])
  }
  async getContentBrief(id: string) {
    const r = await this.rows<ContentBrief>('SELECT data FROM rf_content_briefs WHERE id=$1', [id])
    return r[0] ?? null
  }
  async deleteContentBrief(id: string) {
    await this.pool.query('DELETE FROM rf_content_briefs WHERE id=$1', [id])
  }

  // ── WordPress ──────────────────────────────────────────────────────────────
  async upsertWpConnection(conn: WpConnection) {
    await this.ups(TABLES.wpConn, conn)
  }
  async getWpConnection(projectId: string) {
    const r = await this.rows<WpConnection>('SELECT data FROM rf_wp_connections WHERE project_id=$1', [projectId])
    return r[0] ?? null
  }
  async createWpDeployment(dep: WpDeployment) {
    await this.ins(TABLES.wpDep, dep)
  }
  async getWpDeployment(id: string) {
    const r = await this.rows<WpDeployment>('SELECT data FROM rf_wp_deployments WHERE id=$1', [id])
    return r[0] ?? null
  }
  async updateWpDeployment(dep: WpDeployment) {
    await this.upd(TABLES.wpDep, dep)
  }
  async listWpDeployments(projectId: string) {
    return this.rows<WpDeployment>(
      'SELECT data FROM rf_wp_deployments WHERE project_id=$1 ORDER BY created_at DESC',
      [projectId]
    )
  }

  // ── External provider connections (Phase H) ────────────────────────────────
  async upsertProviderConnection(conn: ProviderConnection) {
    await this.ups(TABLES.providerConn, conn)
  }
  async getProviderConnection(projectId: string, kind: ProviderConnection['kind']) {
    const r = await this.rows<ProviderConnection>(
      'SELECT data FROM rf_provider_connections WHERE project_id=$1 AND kind=$2',
      [projectId, kind]
    )
    return r[0] ?? null
  }
  async listProviderConnections(projectId: string) {
    return this.rows<ProviderConnection>(
      'SELECT data FROM rf_provider_connections WHERE project_id=$1 ORDER BY kind',
      [projectId]
    )
  }
  async deleteProviderConnection(projectId: string, kind: ProviderConnection['kind']) {
    await this.pool.query('DELETE FROM rf_provider_connections WHERE project_id=$1 AND kind=$2', [projectId, kind])
  }

  // ── Scheduler: jobs + schedules ────────────────────────────────────────────
  async enqueueJob(job: Job) {
    await this.ins(TABLES.jobs, job)
  }
  async getJob(id: string) {
    const r = await this.rows<Job>('SELECT data FROM rf_jobs WHERE id=$1', [id])
    return r[0] ?? null
  }
  async updateJob(job: Job) {
    await this.upd(TABLES.jobs, job)
  }
  async listJobs(projectId: string, limit = 50) {
    return this.rows<Job>('SELECT data FROM rf_jobs WHERE project_id=$1 ORDER BY created_at DESC LIMIT $2', [projectId, limit])
  }
  // Atomic multi-runner claim via FOR UPDATE SKIP LOCKED: concurrent runners
  // never receive the same job. Done in one transaction so the row lock is held
  // across the UPDATE that flips it to 'running'.
  async claimDueJobs(nowIso: string, limit: number, runnerId: string) {
    const client = await this.pool.connect()
    try {
      await client.query('BEGIN')
      const sel = await client.query<{ data: Job }>(
        `SELECT data FROM rf_jobs WHERE status='queued' AND run_at <= $1 ORDER BY run_at LIMIT $2 FOR UPDATE SKIP LOCKED`,
        [nowIso, limit]
      )
      const claimed: Job[] = []
      for (const row of sel.rows) {
        const job = { ...row.data, status: 'running' as const, lockedAt: nowIso, lockedBy: runnerId, attempts: row.data.attempts + 1, updatedAt: nowIso }
        await client.query('UPDATE rf_jobs SET status=$2, run_at=$3, locked_at=$4, data=$5 WHERE id=$1', [
          job.id, job.status, job.runAt, job.lockedAt, JSON.stringify(job),
        ])
        claimed.push(job)
      }
      await client.query('COMMIT')
      return claimed
    } catch (e) {
      await client.query('ROLLBACK')
      throw e
    } finally {
      client.release()
    }
  }
  async requeueStaleJobs(cutoffIso: string) {
    const r = await this.pool.query(
      `UPDATE rf_jobs SET status='queued', locked_at=NULL,
         data = data || '{"status":"queued","lockedAt":null,"lockedBy":null}'::jsonb
       WHERE status='running' AND locked_at < $1`,
      [cutoffIso]
    )
    return r.rowCount ?? 0
  }
  async upsertSchedule(schedule: Schedule) {
    await this.ups(TABLES.schedules, schedule)
  }
  async getSchedule(projectId: string, kind: Schedule['kind']) {
    const r = await this.rows<Schedule>('SELECT data FROM rf_schedules WHERE project_id=$1 AND kind=$2', [projectId, kind])
    return r[0] ?? null
  }
  async listSchedules(projectId: string) {
    return this.rows<Schedule>('SELECT data FROM rf_schedules WHERE project_id=$1 ORDER BY kind', [projectId])
  }
  async listDueSchedules(nowIso: string) {
    return this.rows<Schedule>("SELECT data FROM rf_schedules WHERE enabled=true AND next_run_at <= $1", [nowIso])
  }
  async deleteSchedule(projectId: string, kind: Schedule['kind']) {
    await this.pool.query('DELETE FROM rf_schedules WHERE project_id=$1 AND kind=$2', [projectId, kind])
  }

  // ── Pilot feedback (RC2 P6) ────────────────────────────────────────────────
  async createFeedback(entry: PilotFeedback) {
    await this.ins(TABLES.feedback, entry)
  }
  async listFeedback(orgId: string, limit = 100) {
    return this.rows<PilotFeedback>('SELECT data FROM rf_feedback WHERE org_id=$1 ORDER BY created_at DESC LIMIT $2', [orgId, limit])
  }
  async listAllFeedback(limit = 200) {
    return this.rows<PilotFeedback>('SELECT data FROM rf_feedback ORDER BY created_at DESC LIMIT $1', [limit])
  }

  // ── Audit ──────────────────────────────────────────────────────────────────
  async appendAudit(entry: AuditLogEntry) {
    await this.ins(TABLES.audit, entry)
  }
  async listAudit(orgId: string, limit = 100) {
    return this.rows<AuditLogEntry>('SELECT data FROM rf_audit WHERE org_id=$1 ORDER BY at DESC LIMIT $2', [
      orgId,
      limit,
    ])
  }
}
