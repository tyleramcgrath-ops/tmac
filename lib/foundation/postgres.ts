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
  AuditLogEntry,
  Organization,
  OrgMember,
  Project,
  Recommendation,
  Scan,
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
  audit: {
    name: 'rf_audit',
    pk: ['id'],
    keys: (a: AuditLogEntry) => ({ id: a.id, org_id: a.orgId, at: a.at }),
  } as TableDesc<AuditLogEntry>,
}

export class PostgresFoundationStore implements FoundationStore {
  private pool: Pool

  private constructor(pool: Pool) {
    this.pool = pool
  }

  static async create(url: string): Promise<PostgresFoundationStore> {
    const ssl = /localhost|127\.0\.0\.1/.test(url) ? undefined : { rejectUnauthorized: false }
    const pool = new Pool({ connectionString: url, ssl, max: 5 })
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
  async createOrg(org: Organization, ownerId: string) {
    await this.ins(TABLES.orgs, org)
    await this.ins(TABLES.members, { orgId: org.id, userId: ownerId, role: 'owner', createdAt: org.createdAt })
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
