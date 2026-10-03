// Runs once when the server starts.

export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return
  // Old SiteGround release folders fill the hosting plan's file limit. Tidy
  // them a minute after a successful start, off the startup path.
  const { pruneReleases } = await import('./lib/prune-releases')
  setTimeout(() => pruneReleases(), 60_000).unref()
  // Leads: follow-up emails, reminders and follow-up dates, every 10 minutes.
  const { runDue } = await import('./lib/leads')
  const { getStore } = await import('./lib/store')
  const { recordSchedulerRun } = await import('./lib/hosting-health')
  setInterval(
    () =>
      void runDue(getStore())
        .then((sent) => recordSchedulerRun(sent))
        .catch((e) => recordSchedulerRun(0, e instanceof Error ? e.message : 'failed')),
    10 * 60_000
  ).unref()
}
