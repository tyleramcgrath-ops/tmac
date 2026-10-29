// Schedules background work (the analysis pipeline) so it survives after the
// HTTP response is sent.
//
// On a long-running Node server the function just runs as a detached promise.
// On Vercel (and other serverless runtimes) the function instance is frozen
// once the response is returned, so a detached promise would never finish —
// `waitUntil()` tells the runtime to keep the instance alive until the work
// completes. Pair this with `export const maxDuration` on the route.

export async function scheduleBackground(job: Promise<unknown>): Promise<void> {
  // Never let a rejection become an unhandled promise rejection.
  const safe = job.catch((err) => {
    console.error('[background] job failed:', err)
  })

  if (process.env.VERCEL) {
    try {
      const { waitUntil } = await import('@vercel/functions')
      waitUntil(safe)
      return
    } catch (err) {
      console.error('[background] waitUntil unavailable, falling back to detached:', err)
    }
  }
  // Local / long-running host: the promise runs in the background on its own.
  void safe
}
