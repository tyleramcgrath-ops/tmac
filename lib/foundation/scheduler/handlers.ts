// Production job-handler registry for the cron runner. Kept separate from the
// engine so the engine stays pure/testable and the handlers can pull the live
// store. Add a handler here to activate a new JobKind.

import type { Handlers } from './engine'
import { getStore } from '../store'
import { runScheduledScan } from './scan-runner'

export function productionHandlers(): Handlers {
  return {
    scheduled_scan: async (job) => {
      const store = await getStore()
      return runScheduledScan(store, job)
    },
  }
}
