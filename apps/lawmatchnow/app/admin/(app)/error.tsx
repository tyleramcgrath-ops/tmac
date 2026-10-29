'use client'

// Shown instead of a blank page when something on a dashboard page fails.
// The message and digest let us find the cause.
export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="ad-start" role="alert">
      <h2>This dashboard page hit an error</h2>
      <p className="muted">Nothing is lost. Try again, or send this message to whoever maintains the site:</p>
      <pre className="ad-err">{error.message || 'Unknown error'}{error.digest ? `\nDigest: ${error.digest}` : ''}</pre>
      <p className="muted">If it keeps happening, try a private/incognito window: browser extensions (translators, grammar checkers, ad blockers) sometimes change the page in ways that break it.</p>
      <button type="button" className="btn btn-primary btn-sm" onClick={() => reset()}>Try again</button>
    </div>
  )
}
