// Durable JSON file store — one file per collection under the data dir.
// Server-side persistence with no external service. Writes are atomic
// (write temp + rename) and serialized per collection to avoid lost updates.

import { promises as fs } from 'fs'
import path from 'path'
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

type Collections = {
  users: User[]
  orgs: Organization[]
  members: OrgMember[]
  projects: Project[]
  scans: Scan[]
  recommendations: Recommendation[]
  wpConnections: WpConnection[]
  wpDeployments: WpDeployment[]
  audit: AuditLogEntry[]
}

const EMPTY: Collections = {
  users: [],
  orgs: [],
  members: [],
  projects: [],
  scans: [],
  recommendations: [],
  wpConnections: [],
  wpDeployments: [],
  audit: [],
}

export class FileFoundationStore implements FoundationStore {
  private dir: string
  private locks = new Map<string, Promise<unknown>>()

  constructor(dir: string) {
    this.dir = path.resolve(dir)
  }

  private file(name: keyof Collections): string {
    return path.join(this.dir, `${name}.json`)
  }

  private async read<K extends keyof Collections>(name: K): Promise<Collections[K]> {
    try {
      const raw = await fs.readFile(this.file(name), 'utf8')
      return JSON.parse(raw) as Collections[K]
    } catch {
      return EMPTY[name].slice() as Collections[K]
    }
  }

  private async write<K extends keyof Collections>(name: K, data: Collections[K]): Promise<void> {
    await fs.mkdir(this.dir, { recursive: true })
    const tmp = this.file(name) + '.tmp'
    await fs.writeFile(tmp, JSON.stringify(data, null, 1), 'utf8')
    await fs.rename(tmp, this.file(name))
  }

  // Serialize mutations per collection so concurrent writes don't clobber.
  private mutate<K extends keyof Collections, R>(
    name: K,
    fn: (data: Collections[K]) => { data: Collections[K]; result?: R }
  ): Promise<R | undefined> {
    const prev = this.locks.get(name) ?? Promise.resolve()
    const next = prev.then(async () => {
      const data = await this.read(name)
      const { data: updated, result } = fn(data)
      await this.write(name, updated)
      return result
    })
    this.locks.set(name, next.catch(() => undefined))
    return next
  }

  // users & orgs
  async createUser(user: User) {
    await this.mutate('users', (users) => {
      if (users.some((u) => u.email === user.email)) throw new Error('email_taken')
      return { data: [...users, user] }
    })
  }
  async getUserByEmail(email: string) {
    return (await this.read('users')).find((u) => u.email === email.toLowerCase()) ?? null
  }
  async getUserById(id: string) {
    return (await this.read('users')).find((u) => u.id === id) ?? null
  }
  async createOrg(org: Organization, ownerId: string) {
    await this.mutate('orgs', (orgs) => ({ data: [...orgs, org] }))
    await this.mutate('members', (members) => ({
      data: [...members, { orgId: org.id, userId: ownerId, role: 'owner' as const, createdAt: org.createdAt }],
    }))
  }
  async getOrg(id: string) {
    return (await this.read('orgs')).find((o) => o.id === id) ?? null
  }
  async listOrgsForUser(userId: string) {
    const members = await this.read('members')
    const orgIds = new Set(members.filter((m) => m.userId === userId).map((m) => m.orgId))
    return (await this.read('orgs')).filter((o) => orgIds.has(o.id))
  }
  async getMembership(orgId: string, userId: string) {
    return (
      (await this.read('members')).find((m) => m.orgId === orgId && m.userId === userId) ?? null
    )
  }
  async listMembers(orgId: string) {
    return (await this.read('members')).filter((m) => m.orgId === orgId)
  }
  async addMember(member: OrgMember) {
    await this.mutate('members', (members) => {
      const rest = members.filter((m) => !(m.orgId === member.orgId && m.userId === member.userId))
      return { data: [...rest, member] }
    })
  }

  // projects
  async createProject(project: Project) {
    await this.mutate('projects', (projects) => ({ data: [...projects, project] }))
  }
  async getProject(id: string) {
    return (await this.read('projects')).find((p) => p.id === id) ?? null
  }
  async updateProject(project: Project) {
    await this.mutate('projects', (projects) => ({
      data: projects.map((p) => (p.id === project.id ? project : p)),
    }))
  }
  async deleteProject(id: string) {
    await this.mutate('projects', (projects) => ({ data: projects.filter((p) => p.id !== id) }))
  }
  async listProjects(orgId: string) {
    return (await this.read('projects')).filter((p) => p.orgId === orgId)
  }

  // scans
  async createScan(scan: Scan) {
    await this.mutate('scans', (scans) => ({ data: [...scans, scan] }))
  }
  async updateScan(scan: Scan) {
    await this.mutate('scans', (scans) => ({ data: scans.map((s) => (s.id === scan.id ? scan : s)) }))
  }
  async getScan(id: string) {
    return (await this.read('scans')).find((s) => s.id === id) ?? null
  }
  async listScans(projectId: string, limit = 20) {
    return (await this.read('scans'))
      .filter((s) => s.projectId === projectId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, limit)
  }

  // recommendations
  async createRecommendations(recs: Recommendation[]) {
    await this.mutate('recommendations', (all) => ({ data: [...all, ...recs] }))
  }
  async getRecommendation(id: string) {
    return (await this.read('recommendations')).find((r) => r.id === id) ?? null
  }
  async updateRecommendation(rec: Recommendation) {
    await this.mutate('recommendations', (all) => ({
      data: all.map((r) => (r.id === rec.id ? rec : r)),
    }))
  }
  async listRecommendations(projectId: string) {
    return (await this.read('recommendations'))
      .filter((r) => r.projectId === projectId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }

  // wordpress
  async upsertWpConnection(conn: WpConnection) {
    await this.mutate('wpConnections', (all) => {
      const rest = all.filter((c) => c.projectId !== conn.projectId)
      return { data: [...rest, conn] }
    })
  }
  async getWpConnection(projectId: string) {
    return (await this.read('wpConnections')).find((c) => c.projectId === projectId) ?? null
  }
  async createWpDeployment(dep: WpDeployment) {
    await this.mutate('wpDeployments', (all) => ({ data: [...all, dep] }))
  }
  async getWpDeployment(id: string) {
    return (await this.read('wpDeployments')).find((d) => d.id === id) ?? null
  }
  async updateWpDeployment(dep: WpDeployment) {
    await this.mutate('wpDeployments', (all) => ({
      data: all.map((d) => (d.id === dep.id ? dep : d)),
    }))
  }
  async listWpDeployments(projectId: string) {
    return (await this.read('wpDeployments'))
      .filter((d) => d.projectId === projectId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }

  // audit
  async appendAudit(entry: AuditLogEntry) {
    await this.mutate('audit', (all) => ({ data: [...all, entry] }))
  }
  async listAudit(orgId: string, limit = 100) {
    return (await this.read('audit'))
      .filter((e) => e.orgId === orgId)
      .sort((a, b) => b.at.localeCompare(a.at))
      .slice(0, limit)
  }
}
