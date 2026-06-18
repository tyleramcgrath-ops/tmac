// Browser-side handoff for the no-database (streaming) mode. The form stashes
// the analysis input under a generated id and navigates to the report page,
// which runs the streaming analysis and caches the finished report so a refresh
// re-shows it within the session. sessionStorage is per-tab and cleared on close.

import type { Report, ReportInput } from './types'

const INPUT_PREFIX = 'seo-input:'
const REPORT_PREFIX = 'seo-report:'

function safe<T>(fn: () => T, fallback: T): T {
  try {
    return fn()
  } catch {
    return fallback
  }
}

export function stashInput(id: string, input: ReportInput): void {
  safe(() => sessionStorage.setItem(INPUT_PREFIX + id, JSON.stringify(input)), undefined)
}

export function takeInput(id: string): ReportInput | null {
  return safe(() => {
    const raw = sessionStorage.getItem(INPUT_PREFIX + id)
    return raw ? (JSON.parse(raw) as ReportInput) : null
  }, null)
}

export function clearInput(id: string): void {
  safe(() => sessionStorage.removeItem(INPUT_PREFIX + id), undefined)
}

export function cacheReport(report: Report): void {
  safe(() => sessionStorage.setItem(REPORT_PREFIX + report.id, JSON.stringify(report)), undefined)
}

export function readCachedReport(id: string): Report | null {
  return safe(() => {
    const raw = sessionStorage.getItem(REPORT_PREFIX + id)
    return raw ? (JSON.parse(raw) as Report) : null
  }, null)
}
