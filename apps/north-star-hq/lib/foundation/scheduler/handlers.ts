// Production job-handler registry for the cron runner. Kept separate from the
// engine so the engine stays pure/testable. Add a handler here to activate a
// JobKind — none are wired yet, so `tick()` currently only reaps stale locks
// and materializes due schedules; any job that does get enqueued will fail
// honestly ("No handler registered") and retry with backoff rather than being
// silently dropped. See the root app's `lib/foundation/scheduler/handlers.ts`
// for the pattern once a real job kind (e.g. a mission/briefing refresh) needs
// to run on a schedule here.

import type { Handlers } from './engine'

export function productionHandlers(): Handlers {
  return {}
}
