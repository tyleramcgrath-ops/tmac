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

export async function getStore(): Promise<Store> {
  if (globalThis.__seoIntelStore) return globalThis.__seoIntelStore
  let store: Store
  if (process.env.DATABASE_URL) {
    const { PostgresStore } = await import('./postgres')
    store = new PostgresStore(process.env.DATABASE_URL)
  } else {
    const { FileStore } = await import('./filestore')
    store = new FileStore()
  }
  await store.init()
  globalThis.__seoIntelStore = store
  return store
}
