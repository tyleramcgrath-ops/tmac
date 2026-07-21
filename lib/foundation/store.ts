// Persistent store for the foundation layer.
//
// Postgres (`pg`) when DATABASE_URL/POSTGRES_URL is set — the production
// path. Otherwise a durable JSON file store under .data/ (same pattern the
// seo-intel app ships with): real server-side persistence with no external
// service, suitable for a single-node deployment and for tests. localStorage
// is never the source of truth for any entity defined here.

import type {
  AtlasHistory,
  AuditLogEntry,
  Competitor,
  ContentBrief,
  Invitation,
  Job,
  Organization,
  OrgMember,
  PilotFeedback,
  Project,
  ProviderConnection,
  Recommendation,
  Scan,
  Schedule,
  User,
  WpConnection,
  WpDeployment,
} from './types'

export interface FoundationStore {
  // users & orgs
  createUser(user: User): Promise<void>
  updateUser(user: User): Promise<void>
  getUserByEmail(email: string): Promise<User | null>
  getUserById(id: string): Promise<User | null>
  getUserByVerifyToken(token: string): Promise<User | null>
  createOrg(org: Organization, ownerId: string): Promise<void>
  updateOrg(org: Organization): Promise<void>
  getOrg(id: string): Promise<Organization | null>
  listOrgsForUser(userId: string): Promise<Organization[]>
  // Global org list — pilot-admin only (see requireStaff); never exposed to
  // regular tenant-scoped routes.
  listOrgs(): Promise<Organization[]>
  getMembership(orgId: string, userId: string): Promise<OrgMember | null>
  listMembers(orgId: string): Promise<OrgMember[]>
  addMember(member: OrgMember): Promise<void>
  removeMember(orgId: string, userId: string): Promise<void>
  // team invitations
  createInvitation(invitation: Invitation): Promise<void>
  updateInvitation(invitation: Invitation): Promise<void>
  getInvitationByToken(token: string): Promise<Invitation | null>
  listInvitations(orgId: string): Promise<Invitation[]>
  // projects
  createProject(project: Project): Promise<void>
  getProject(id: string): Promise<Project | null>
  updateProject(project: Project): Promise<void>
  deleteProject(id: string): Promise<void>
  listProjects(orgId: string): Promise<Project[]>
  // scans
  createScan(scan: Scan): Promise<void>
  updateScan(scan: Scan): Promise<void>
  getScan(id: string): Promise<Scan | null>
  listScans(projectId: string, limit?: number): Promise<Scan[]>
  // recommendations
  // competitors (Phase G)
  createCompetitor(competitor: Competitor): Promise<void>
  updateCompetitor(competitor: Competitor): Promise<void>
  listCompetitors(projectId: string): Promise<Competitor[]>
  getCompetitor(id: string): Promise<Competitor | null>
  deleteCompetitor(id: string): Promise<void>
  // Atlas change-detection baseline (Phase G)
  getAtlasHistory(projectId: string): Promise<AtlasHistory | null>
  upsertAtlasHistory(history: AtlasHistory): Promise<void>
  // content briefs (Content Studio)
  createContentBrief(brief: ContentBrief): Promise<void>
  updateContentBrief(brief: ContentBrief): Promise<void>
  listContentBriefs(projectId: string): Promise<ContentBrief[]>
  getContentBrief(id: string): Promise<ContentBrief | null>
  deleteContentBrief(id: string): Promise<void>

  createRecommendations(recs: Recommendation[]): Promise<void>
  getRecommendation(id: string): Promise<Recommendation | null>
  updateRecommendation(rec: Recommendation): Promise<void>
  listRecommendations(projectId: string): Promise<Recommendation[]>
  // wordpress
  upsertWpConnection(conn: WpConnection): Promise<void>
  getWpConnection(projectId: string): Promise<WpConnection | null>
  createWpDeployment(dep: WpDeployment): Promise<void>
  getWpDeployment(id: string): Promise<WpDeployment | null>
  updateWpDeployment(dep: WpDeployment): Promise<void>
  listWpDeployments(projectId: string): Promise<WpDeployment[]>
  // external provider connections (Phase H — encrypted OAuth credentials)
  upsertProviderConnection(conn: ProviderConnection): Promise<void>
  getProviderConnection(projectId: string, kind: ProviderConnection['kind']): Promise<ProviderConnection | null>
  listProviderConnections(projectId: string): Promise<ProviderConnection[]>
  deleteProviderConnection(projectId: string, kind: ProviderConnection['kind']): Promise<void>
  // scheduler: jobs + recurring schedules
  enqueueJob(job: Job): Promise<void>
  getJob(id: string): Promise<Job | null>
  updateJob(job: Job): Promise<void>
  listJobs(projectId: string, limit?: number): Promise<Job[]>
  claimDueJobs(nowIso: string, limit: number, runnerId: string): Promise<Job[]>
  requeueStaleJobs(cutoffIso: string): Promise<number>
  upsertSchedule(schedule: Schedule): Promise<void>
  getSchedule(projectId: string, kind: Schedule['kind']): Promise<Schedule | null>
  listSchedules(projectId: string): Promise<Schedule[]>
  listDueSchedules(nowIso: string): Promise<Schedule[]>
  deleteSchedule(projectId: string, kind: Schedule['kind']): Promise<void>

  // pilot feedback / issues (RC2 P6)
  createFeedback(entry: PilotFeedback): Promise<void>
  listFeedback(orgId: string, limit?: number): Promise<PilotFeedback[]>
  // Cross-org feedback — pilot-admin only.
  listAllFeedback(limit?: number): Promise<PilotFeedback[]>
  // audit log
  appendAudit(entry: AuditLogEntry): Promise<void>
  listAudit(orgId: string, limit?: number): Promise<AuditLogEntry[]>
}

let cached: FoundationStore | null = null

export async function getStore(): Promise<FoundationStore> {
  if (cached) return cached
  // resolveStoreEnv throws in production when DATABASE_URL/APP_SECRET are
  // missing — no silent file fallback that would lose data on Vercel.
  const { resolveStoreEnv } = await import('./env')
  const env = resolveStoreEnv()
  if (env.kind === 'postgres') {
    const { PostgresFoundationStore } = await import('./postgres')
    cached = await PostgresFoundationStore.create(env.databaseUrl!)
  } else {
    const { FileFoundationStore } = await import('./filestore')
    cached = new FileFoundationStore(process.env.FOUNDATION_DATA_DIR || '.data/foundation')
  }
  return cached
}

// Test seam: lets tests construct an isolated store.
export function __setStoreForTests(store: FoundationStore | null) {
  cached = store
}
