'use client'

// Last resort when the root layout itself fails: a plain page instead of a blank screen.
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: 'system-ui, sans-serif', padding: 32, color: '#15284a' }}>
        <h1>LawMatchNow hit an error</h1>
        <p>Please reload the page. If it keeps happening, try a private window or turn off browser extensions.</p>
        <pre style={{ whiteSpace: 'pre-wrap', background: '#f6f3ee', padding: 12 }}>{error.message}{error.digest ? `\nDigest: ${error.digest}` : ''}</pre>
        <button type="button" onClick={() => reset()}>Try again</button>
      </body>
    </html>
  )
}
