import type { Report, ReportSummary } from '../types'

export interface Store {
  init(): Promise<void>
  saveReport(report: Report): Promise<void>
  getReport(id: string): Promise<Report | null>
  listReports(): Promise<ReportSummary[]>
  deleteReport(id: string): Promise<boolean>
  getSetting(key: string): Promise<string | null>
  setSetting(key: string, value: string): Promise<void>
  deleteSetting(key: string): Promise<void>
}

declare global {
  // Cached across hot reloads in dev and across route invocations.
  var __seoIntelStore: Store | undefined
}

// Accept the common connection-string variable names so a database provisioned
// through Vercel's Storage tab (Vercel Postgres / Neon) works without manual
// renaming. Prefer a pooled, non-prefixed URL where available.
function resolveDatabaseUrl(): string | undefined {
  return (
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.DATABASE_URL_UNPOOLED ||
    process.env.POSTGRES_URL_NON_POOLING ||
    undefined
  )
}

export async function getStore(): Promise<Store> {
  if (globalThis.__seoIntelStore) return globalThis.__seoIntelStore
  let store: Store
  const databaseUrl = resolveDatabaseUrl()
  if (databaseUrl) {
    const { PostgresStore } = await import('./postgres')
    store = new PostgresStore(databaseUrl)
  } else {
    // The file store keeps state on the local disk, which serverless runtimes
    // (Vercel, etc.) do NOT share across function invocations — progress polling
    // and the final report would never be visible. Require a database there.
    if (process.env.VERCEL) {
      throw new StoreConfigError(
        'This deployment needs a database. Add a Postgres DATABASE_URL environment variable ' +
          '(e.g. a free Neon or Vercel Postgres database) and redeploy. See DEPLOY.md.'
      )
    }
    const { FileStore } = await import('./filestore')
    store = new FileStore()
  }
  await store.init()
  globalThis.__seoIntelStore = store
  return store
}

export class StoreConfigError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'StoreConfigError'
  }
}
