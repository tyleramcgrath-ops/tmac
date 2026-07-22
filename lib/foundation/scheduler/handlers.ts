// Production job-handler registry for the cron runner. Kept separate from the
// engine so the engine stays pure/testable and the handlers can pull the live
// store. Add a handler here to activate a new JobKind.

import type { Handlers } from './engine'
import { getStore } from '../store'
import { runScheduledScan } from './scan-runner'
import { runOutcomeCapture } from './outcome-runner'
import { runMonitorDigest } from './digest'
import { runCompetitorRefreshJob } from './competitor-refresh-runner'
import { runRankTrackingJob } from './rank-tracking-runner'
import { runAiCitationCheckJob } from './ai-citation-runner'
import { runBacklinkRefreshJob } from './backlink-runner'

export function productionHandlers(): Handlers {
  return {
    scheduled_scan: async (job) => {
      const store = await getStore()
      return runScheduledScan(store, job)
    },
    outcome_capture: async (job) => {
      const store = await getStore()
      return runOutcomeCapture(store, job)
    },
    monitor: async (job) => {
      const store = await getStore()
      return runMonitorDigest(store, job)
    },
    competitor_refresh: async (job) => {
      const store = await getStore()
      return runCompetitorRefreshJob(store, job)
    },
    rank_tracking: async (job) => {
      const store = await getStore()
      return runRankTrackingJob(store, job)
    },
    ai_citation_check: async (job) => {
      const store = await getStore()
      return runAiCitationCheckJob(store, job)
    },
    backlink_refresh: async (job) => {
      const store = await getStore()
      return runBacklinkRefreshJob(store, job)
    },
  }
}
