// Durable JSON file store — one file per collection under the data dir.
// Server-side persistence with no external service. Writes are atomic
// (write temp + rename) and serialized per collection to avoid lost updates.

import { promises as fs } from 'fs'
import path from 'path'
import type { FoundationStore } from './store'
import type {
  ActivityEvent,
  ActivityEventType,
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

type Collections = {
  users: User[]
  orgs: Organization[]
  members: OrgMember[]
  invitations: Invitation[]
  projects: Project[]
  scans: Scan[]
  recommendations: Recommendation[]
  competitors: Competitor[]
  atlasHistory: AtlasHistory[]
  contentBriefs: ContentBrief[]
  wpConnections: WpConnection[]
  wpDeployments: WpDeployment[]
  providerConnections: ProviderConnection[]
  jobs: Job[]
  schedules: Schedule[]
  feedback: PilotFeedback[]
  audit: AuditLogEntry[]
  activity: ActivityEvent[]
  trackedKeywords: TrackedKeyword[]
  rankSnapshots: RankSnapshot[]
  trackedAiQueries: TrackedAiQuery[]
  aiCitationSnapshots: AiCitationSnapshot[]
  backlinkSnapshots: BacklinkSnapshot[]
}

const EMPTY: Collections = {
  users: [],
  orgs: [],
  members: [],
  invitations: [],
  projects: [],
  scans: [],
  recommendations: [],
  competitors: [],
  atlasHistory: [],
  contentBriefs: [],
  wpConnections: [],
  wpDeployments: [],
  providerConnections: [],
  jobs: [],
  schedules: [],
  feedback: [],
  audit: [],
  activity: [],
  trackedKeywords: [],
  rankSnapshots: [],
  trackedAiQueries: [],
  aiCitationSnapshots: [],
  backlinkSnapshots: [],
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
  async updateUser(user: User) {
    await this.mutate('users', (users) => ({
      data: users.map((u) => (u.id === user.id ? user : u)),
    }))
  }
  async getUserByEmail(email: string) {
    return (await this.read('users')).find((u) => u.email === email.toLowerCase()) ?? null
  }
  async getUserById(id: string) {
    return (await this.read('users')).find((u) => u.id === id) ?? null
  }
  async getUserByVerifyToken(token: string) {
    return (await this.read('users')).find((u) => u.verifyToken === token) ?? null
  }
  async createOrg(org: Organization, ownerId: string) {
    await this.mutate('orgs', (orgs) => ({ data: [...orgs, org] }))
    await this.mutate('members', (members) => ({
      data: [...members, { orgId: org.id, userId: ownerId, role: 'owner' as const, createdAt: org.createdAt }],
    }))
  }
  async updateOrg(org: Organization) {
    await this.mutate('orgs', (orgs) => ({ data: orgs.map((o) => (o.id === org.id ? org : o)) }))
  }
  async getOrg(id: string) {
    return (await this.read('orgs')).find((o) => o.id === id) ?? null
  }
  async listOrgsForUser(userId: string) {
    const members = await this.read('members')
    const orgIds = new Set(members.filter((m) => m.userId === userId).map((m) => m.orgId))
    return (await this.read('orgs')).filter((o) => orgIds.has(o.id))
  }
  async listOrgs() {
    return (await this.read('orgs')).slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt))
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

  async removeMember(orgId: string, userId: string) {
    await this.mutate('members', (members) => ({
      data: members.filter((m) => !(m.orgId === orgId && m.userId === userId)),
    }))
  }

  // team invitations
  async createInvitation(invitation: Invitation) {
    await this.mutate('invitations', (all) => ({ data: [...all, invitation] }))
  }
  async updateInvitation(invitation: Invitation) {
    await this.mutate('invitations', (all) => ({
      data: all.map((i) => (i.id === invitation.id ? invitation : i)),
    }))
  }
  async getInvitationByToken(token: string) {
    return (await this.read('invitations')).find((i) => i.token === token) ?? null
  }
  async listInvitations(orgId: string) {
    return (await this.read('invitations'))
      .filter((i) => i.orgId === orgId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
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

  // competitors (Phase G)
  async createCompetitor(competitor: Competitor) {
    await this.mutate('competitors', (all) => ({ data: [...all, competitor] }))
  }
  async updateCompetitor(competitor: Competitor) {
    await this.mutate('competitors', (all) => ({ data: all.map((c) => (c.id === competitor.id ? competitor : c)) }))
  }
  async listCompetitors(projectId: string) {
    return (await this.read('competitors'))
      .filter((c) => c.projectId === projectId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }
  async getCompetitor(id: string) {
    return (await this.read('competitors')).find((c) => c.id === id) ?? null
  }
  async deleteCompetitor(id: string) {
    await this.mutate('competitors', (all) => ({ data: all.filter((c) => c.id !== id) }))
  }

  // rank tracking
  async addTrackedKeyword(kw: TrackedKeyword) {
    await this.mutate('trackedKeywords', (all) => ({ data: [...all, kw] }))
  }
  async listTrackedKeywords(projectId: string) {
    return (await this.read('trackedKeywords'))
      .filter((k) => k.projectId === projectId)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  }
  async removeTrackedKeyword(id: string) {
    await this.mutate('trackedKeywords', (all) => ({ data: all.filter((k) => k.id !== id) }))
  }
  async recordRankSnapshot(snap: RankSnapshot) {
    await this.mutate('rankSnapshots', (all) => ({ data: [...all, snap] }))
  }
  async listRankSnapshots(projectId: string, keyword?: string) {
    return (await this.read('rankSnapshots'))
      .filter((s) => s.projectId === projectId && (!keyword || s.keyword === keyword))
      .sort((a, b) => a.checkedAt.localeCompare(b.checkedAt))
  }

  // AI citation tracking
  async addTrackedAiQuery(q: TrackedAiQuery) {
    await this.mutate('trackedAiQueries', (all) => ({ data: [...all, q] }))
  }
  async listTrackedAiQueries(projectId: string) {
    return (await this.read('trackedAiQueries'))
      .filter((q) => q.projectId === projectId)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  }
  async removeTrackedAiQuery(id: string) {
    await this.mutate('trackedAiQueries', (all) => ({ data: all.filter((q) => q.id !== id) }))
  }
  async recordAiCitationSnapshot(snap: AiCitationSnapshot) {
    await this.mutate('aiCitationSnapshots', (all) => ({ data: [...all, snap] }))
  }
  async listAiCitationSnapshots(projectId: string, query?: string) {
    return (await this.read('aiCitationSnapshots'))
      .filter((s) => s.projectId === projectId && (!query || s.query === query))
      .sort((a, b) => a.checkedAt.localeCompare(b.checkedAt))
  }

  // Backlink profile snapshots
  async recordBacklinkSnapshot(snap: BacklinkSnapshot) {
    await this.mutate('backlinkSnapshots', (all) => ({ data: [...all, snap] }))
  }
  async listBacklinkSnapshots(projectId: string, limit?: number) {
    const rows = (await this.read('backlinkSnapshots'))
      .filter((s) => s.projectId === projectId)
      .sort((a, b) => b.checkedAt.localeCompare(a.checkedAt))
    return limit ? rows.slice(0, limit) : rows
  }

  // Atlas change-detection baseline (Phase G)
  async getAtlasHistory(projectId: string) {
    return (await this.read('atlasHistory')).find((h) => h.projectId === projectId) ?? null
  }
  async upsertAtlasHistory(history: AtlasHistory) {
    await this.mutate('atlasHistory', (all) => {
      const rest = all.filter((h) => h.projectId !== history.projectId)
      return { data: [...rest, history] }
    })
  }

  // content briefs (Content Studio)
  async createContentBrief(brief: ContentBrief) {
    await this.mutate('contentBriefs', (all) => ({ data: [...all, brief] }))
  }
  async updateContentBrief(brief: ContentBrief) {
    await this.mutate('contentBriefs', (all) => ({ data: all.map((b) => (b.id === brief.id ? brief : b)) }))
  }
  async listContentBriefs(projectId: string) {
    return (await this.read('contentBriefs'))
      .filter((b) => b.projectId === projectId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }
  async getContentBrief(id: string) {
    return (await this.read('contentBriefs')).find((b) => b.id === id) ?? null
  }
  async deleteContentBrief(id: string) {
    await this.mutate('contentBriefs', (all) => ({ data: all.filter((b) => b.id !== id) }))
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

  // external provider connections (Phase H)
  async upsertProviderConnection(conn: ProviderConnection) {
    await this.mutate('providerConnections', (all) => {
      const rest = all.filter((c) => !(c.projectId === conn.projectId && c.kind === conn.kind))
      return { data: [...rest, conn] }
    })
  }
  async getProviderConnection(projectId: string, kind: ProviderConnection['kind']) {
    return (await this.read('providerConnections')).find((c) => c.projectId === projectId && c.kind === kind) ?? null
  }
  async listProviderConnections(projectId: string) {
    return (await this.read('providerConnections'))
      .filter((c) => c.projectId === projectId)
      .sort((a, b) => a.kind.localeCompare(b.kind))
  }
  async deleteProviderConnection(projectId: string, kind: ProviderConnection['kind']) {
    await this.mutate('providerConnections', (all) => ({
      data: all.filter((c) => !(c.projectId === projectId && c.kind === kind)),
    }))
  }

  // scheduler: jobs + schedules
  async enqueueJob(job: Job) {
    await this.mutate('jobs', (all) => ({ data: [...all, job] }))
  }
  async getJob(id: string) {
    return (await this.read('jobs')).find((j) => j.id === id) ?? null
  }
  async updateJob(job: Job) {
    await this.mutate('jobs', (all) => ({ data: all.map((j) => (j.id === job.id ? job : j)) }))
  }
  async listJobs(projectId: string, limit = 50) {
    return (await this.read('jobs'))
      .filter((j) => j.projectId === projectId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, limit)
  }
  // Atomic claim: single-process dev store, so the collection mutex is enough to
  // guarantee a job is handed to exactly one caller (mirrors Postgres SKIP LOCKED).
  async claimDueJobs(nowIso: string, limit: number, runnerId: string) {
    const claimed = await this.mutate('jobs', (all) => {
      const due = all
        .filter((j) => j.status === 'queued' && j.runAt <= nowIso)
        .sort((a, b) => a.runAt.localeCompare(b.runAt))
        .slice(0, limit)
      const ids = new Set(due.map((j) => j.id))
      const updated = all.map((j) =>
        ids.has(j.id)
          ? { ...j, status: 'running' as const, lockedAt: nowIso, lockedBy: runnerId, attempts: j.attempts + 1, updatedAt: nowIso }
          : j
      )
      return { data: updated, result: updated.filter((j) => ids.has(j.id)) }
    })
    return claimed ?? []
  }
  // Return jobs stuck in 'running' whose lock predates the cutoff back to the
  // queue (the runner that held them died mid-flight).
  async requeueStaleJobs(cutoffIso: string) {
    const n = await this.mutate('jobs', (all) => {
      let count = 0
      const data = all.map((j) => {
        if (j.status === 'running' && j.lockedAt && j.lockedAt < cutoffIso) {
          count++
          return { ...j, status: 'queued' as const, lockedAt: null, lockedBy: null, updatedAt: cutoffIso }
        }
        return j
      })
      return { data, result: count }
    })
    return n ?? 0
  }
  async upsertSchedule(schedule: Schedule) {
    await this.mutate('schedules', (all) => {
      const rest = all.filter((s) => !(s.projectId === schedule.projectId && s.kind === schedule.kind))
      return { data: [...rest, schedule] }
    })
  }
  async getSchedule(projectId: string, kind: Schedule['kind']) {
    return (await this.read('schedules')).find((s) => s.projectId === projectId && s.kind === kind) ?? null
  }
  async listSchedules(projectId: string) {
    return (await this.read('schedules')).filter((s) => s.projectId === projectId)
  }
  async listDueSchedules(nowIso: string) {
    return (await this.read('schedules')).filter((s) => s.enabled && s.nextRunAt <= nowIso)
  }
  async deleteSchedule(projectId: string, kind: Schedule['kind']) {
    await this.mutate('schedules', (all) => ({
      data: all.filter((s) => !(s.projectId === projectId && s.kind === kind)),
    }))
  }

  // pilot feedback (RC2 P6)
  async createFeedback(entry: PilotFeedback) {
    await this.mutate('feedback', (all) => ({ data: [...all, entry] }))
  }
  async listFeedback(orgId: string, limit = 100) {
    return (await this.read('feedback'))
      .filter((f) => f.orgId === orgId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, limit)
  }
  async listAllFeedback(limit = 200) {
    return (await this.read('feedback'))
      .slice()
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, limit)
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

  // activity stream
  async appendActivity(event: ActivityEvent) {
    await this.mutate('activity', (all) => ({ data: [...all, event] }))
  }
  async listActivity(projectId: string, opts?: { limit?: number; types?: ActivityEventType[] }) {
    const limit = opts?.limit ?? 200
    const types = opts?.types
    return (await this.read('activity'))
      .filter((e) => e.projectId === projectId && (!types || types.includes(e.type)))
      .sort((a, b) => b.at.localeCompare(a.at))
      .slice(0, limit)
  }
}
