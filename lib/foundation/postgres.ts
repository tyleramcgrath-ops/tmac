// Postgres implementation of FoundationStore.
//
// Entities are stored as JSONB documents with indexed key columns —
// the same store contract as the file store, backed by a real database.
// Schema is created automatically on first connect.

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

export class PostgresFoundationStore implements FoundationStore {
  private pool: Pool

  private constructor(pool: Pool) {
    this.pool = pool
  }

  static async create(url: string): Promise<PostgresFoundationStore> {
    const ssl = /localhost|127\.0\.0\.1/.test(url) ? undefined : { rejectUnauthorized: false }
    const pool = new Pool({ connectionString: url, ssl, max: 5 })
    // Schema comes from versioned migrations, not request-time DDL. Running
    // here is idempotent (skips already-applied) and safe on cold start; the
    // authoritative path is the `pnpm db:migrate` CLI in deploy.
    if (process.env.RF_SKIP_MIGRATE_ON_CONNECT !== '1') {
      await runMigrations(pool)
    }
    return new PostgresFoundationStore(pool)
  }

  private async rows<T>(sql: string, params: unknown[]): Promise<T[]> {
    const res = await this.pool.query(sql, params)
    return res.rows.map((r) => r.data as T)
  }

  async createUser(user: User) {
    await this.pool.query('INSERT INTO rf_users (id, email, data) VALUES ($1,$2,$3)', [
      user.id,
      user.email,
      user,
    ])
  }
  async updateUser(user: User) {
    await this.pool.query('UPDATE rf_users SET email=$2, data=$3 WHERE id=$1', [user.id, user.email, user])
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
    await this.pool.query('INSERT INTO rf_orgs (id, data) VALUES ($1,$2)', [org.id, org])
    const member: OrgMember = { orgId: org.id, userId: ownerId, role: 'owner', createdAt: org.createdAt }
    await this.pool.query('INSERT INTO rf_members (org_id, user_id, role, data) VALUES ($1,$2,$3,$4)', [
      org.id,
      ownerId,
      member.role,
      member,
    ])
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
    const r = await this.rows<OrgMember>(
      'SELECT data FROM rf_members WHERE org_id=$1 AND user_id=$2',
      [orgId, userId]
    )
    return r[0] ?? null
  }
  async listMembers(orgId: string) {
    return this.rows<OrgMember>('SELECT data FROM rf_members WHERE org_id=$1', [orgId])
  }
  async addMember(member: OrgMember) {
    await this.pool.query(
      `INSERT INTO rf_members (org_id, user_id, role, data) VALUES ($1,$2,$3,$4)
       ON CONFLICT (org_id, user_id) DO UPDATE SET role=$3, data=$4`,
      [member.orgId, member.userId, member.role, member]
    )
  }

  async createProject(project: Project) {
    await this.pool.query('INSERT INTO rf_projects (id, org_id, domain, data) VALUES ($1,$2,$3,$4)', [
      project.id,
      project.orgId,
      project.domain,
      project,
    ])
  }
  async getProject(id: string) {
    const r = await this.rows<Project>('SELECT data FROM rf_projects WHERE id=$1', [id])
    return r[0] ?? null
  }
  async updateProject(project: Project) {
    await this.pool.query('UPDATE rf_projects SET domain=$2, data=$3 WHERE id=$1', [project.id, project.domain, project])
  }
  async deleteProject(id: string) {
    await this.pool.query('DELETE FROM rf_projects WHERE id=$1', [id])
  }
  async listProjects(orgId: string) {
    return this.rows<Project>('SELECT data FROM rf_projects WHERE org_id=$1', [orgId])
  }

  async createScan(scan: Scan) {
    await this.pool.query(
      'INSERT INTO rf_scans (id, project_id, status, created_at, data) VALUES ($1,$2,$3,$4,$5)',
      [scan.id, scan.projectId, scan.status, scan.createdAt, scan]
    )
  }
  async updateScan(scan: Scan) {
    await this.pool.query('UPDATE rf_scans SET status=$2, data=$3 WHERE id=$1', [
      scan.id,
      scan.status,
      scan,
    ])
  }
  async getScan(id: string) {
    const r = await this.rows<Scan>('SELECT data FROM rf_scans WHERE id=$1', [id])
    return r[0] ?? null
  }
  async listScans(projectId: string, limit = 20) {
    return this.rows<Scan>(
      'SELECT data FROM rf_scans WHERE project_id=$1 ORDER BY created_at DESC LIMIT $2',
      [projectId, limit]
    )
  }

  async createRecommendations(recs: Recommendation[]) {
    for (const rec of recs) {
      await this.pool.query(
        'INSERT INTO rf_recommendations (id, project_id, scan_id, status, created_at, data) VALUES ($1,$2,$3,$4,$5,$6)',
        [rec.id, rec.projectId, rec.scanId, rec.status, rec.createdAt, rec]
      )
    }
  }
  async getRecommendation(id: string) {
    const r = await this.rows<Recommendation>('SELECT data FROM rf_recommendations WHERE id=$1', [id])
    return r[0] ?? null
  }
  async updateRecommendation(rec: Recommendation) {
    await this.pool.query('UPDATE rf_recommendations SET status=$2, data=$3 WHERE id=$1', [rec.id, rec.status, rec])
  }
  async listRecommendations(projectId: string) {
    return this.rows<Recommendation>(
      'SELECT data FROM rf_recommendations WHERE project_id=$1 ORDER BY created_at DESC',
      [projectId]
    )
  }

  async upsertWpConnection(conn: WpConnection) {
    await this.pool.query(
      `INSERT INTO rf_wp_connections (project_id, data) VALUES ($1,$2)
       ON CONFLICT (project_id) DO UPDATE SET data=$2`,
      [conn.projectId, conn]
    )
  }
  async getWpConnection(projectId: string) {
    const r = await this.rows<WpConnection>('SELECT data FROM rf_wp_connections WHERE project_id=$1', [
      projectId,
    ])
    return r[0] ?? null
  }
  async createWpDeployment(dep: WpDeployment) {
    await this.pool.query(
      'INSERT INTO rf_wp_deployments (id, project_id, status, created_at, data) VALUES ($1,$2,$3,$4,$5)',
      [dep.id, dep.projectId, dep.status, dep.createdAt, dep]
    )
  }
  async getWpDeployment(id: string) {
    const r = await this.rows<WpDeployment>('SELECT data FROM rf_wp_deployments WHERE id=$1', [id])
    return r[0] ?? null
  }
  async updateWpDeployment(dep: WpDeployment) {
    await this.pool.query('UPDATE rf_wp_deployments SET status=$2, data=$3 WHERE id=$1', [dep.id, dep.status, dep])
  }
  async listWpDeployments(projectId: string) {
    return this.rows<WpDeployment>(
      'SELECT data FROM rf_wp_deployments WHERE project_id=$1 ORDER BY created_at DESC',
      [projectId]
    )
  }

  async appendAudit(entry: AuditLogEntry) {
    await this.pool.query('INSERT INTO rf_audit (id, org_id, at, data) VALUES ($1,$2,$3,$4)', [
      entry.id,
      entry.orgId,
      entry.at,
      entry,
    ])
  }
  async listAudit(orgId: string, limit = 100) {
    return this.rows<AuditLogEntry>(
      'SELECT data FROM rf_audit WHERE org_id=$1 ORDER BY at DESC LIMIT $2',
      [orgId, limit]
    )
  }
}
