'use client'

import Link from 'next/link'

// Keeps the site's header and footer on screen when one page fails, instead of a blank page.
export default function PageError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <section className="section">
      <div className="wrap" style={{ maxWidth: 640 }}>
        <div className="eyebrow">Something went wrong</div>
        <h1>This page didn&apos;t load properly</h1>
        <p className="muted">Please try again. If it keeps happening, try a private window or turn off browser extensions such as translators.</p>
        {error.digest && <p className="muted">Reference: <code>{error.digest}</code></p>}
        <p style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button type="button" className="btn btn-primary" onClick={() => reset()}>Try again</button>
          <Link className="btn btn-outline" href="/">Go to the home page</Link>
        </p>
      </div>
    </section>
  )
}
