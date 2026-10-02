// Runs once when the server starts.

export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return
  // Old SiteGround release folders fill the hosting plan's file limit. Tidy
  // them a minute after a successful start, off the startup path.
  const { pruneReleases } = await import('./lib/prune-releases')
  setTimeout(() => pruneReleases(), 60_000).unref()
}
