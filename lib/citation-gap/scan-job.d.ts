// Types for the vendored scan-job.js (apps/citation-gap).
/* eslint-disable @typescript-eslint/no-explicit-any */
export interface ScanIo {
  page(q: { url: string; keyword: string; full?: string }): Promise<any>
  serp(q: { q: string; num: number }): Promise<any>
  render(q: { url: string; wait: string; parse: string; keyword: string }): Promise<any>
}
export interface ScanJob { step: string; cursor?: number; payload: any }
export function runToCompletion(job: ScanJob, io: ScanIo, report?: (s: string) => void, maxSteps?: number): Promise<{ job: ScanJob; result: any; steps: number }>
