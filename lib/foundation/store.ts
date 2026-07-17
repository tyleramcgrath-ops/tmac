// Persistent store for the foundation layer.
//
// Postgres (`pg`) when DATABASE_URL/POSTGRES_URL is set — the production
// path. Otherwise a durable JSON file store under .data/ (same pattern the
// seo-intel app ships with): real server-side persistence with no external
// service, suitable for a single-node deployment and for tests. localStorage
// is never the source of truth for any entity defined here.

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

export interface FoundationStore {
  // users & orgs
  createUser(user: User): Promise<void>
  getUserByEmail(email: string): Promise<User | null>
  getUserById(id: string): Promise<User | null>
  createOrg(org: Organization, ownerId: string): Promise<void>
  getOrg(id: string): Promise<Organization | null>
  listOrgsForUser(userId: string): Promise<Organization[]>
  getMembership(orgId: string, userId: string): Promise<OrgMember | null>
  listMembers(orgId: string): Promise<OrgMember[]>
  addMember(member: OrgMember): Promise<void>
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
