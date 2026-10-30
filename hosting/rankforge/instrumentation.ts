// Runs once when the server starts (SiteGround host branch only).

export async function register() {
  // The import must sit inside this check, not after an early return: that's what lets Next
  // drop it from the edge bundle, where 'fs' and 'path' don't exist.
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Old SiteGround release folders fill the hosting plan's file limit. Tidy
    // them a minute after a successful start, off the startup path.
    const { pruneReleases } = await import('./lib/prune-releases')
    setTimeout(() => pruneReleases(), 60_000).unref()
  }
}
