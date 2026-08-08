'use client'

// The one control that gives the agent roster something to report.
//
// Every agent in the roster is a read-time projection over real records — a
// scan, a job, a deployment. Until a scan exists, all five honestly say
// "Nothing yet", and there is no way to change that from inside the room.
// This is the missing verb.
//
// The crawl runs client-side in batches (see app/lib/crawl-runner.ts) so a
// long site audit is not bounded by one serverless request timeout. The scan
// row is created BEFORE the crawl starts and finalized after, so a crawl that
// dies halfway leaves an honest 'failed' record rather than silently nothing.

import { useState } from 'react'
import { api, ApiError } from '../../lib/client'
import { runCrawl } from '../../lib/crawl-runner'
import type { CompassState } from '../../compass'

type Phase = 'idle' | 'crawling' | 'saving' | 'done' | 'error'

export default function RunScanButton({
  projectId,
  domain,
  onCompassState,
  onFinished,
}: {
  projectId: string | null
  domain: string | null
  onCompassState?: (s: CompassState) => void
  onFinished?: () => void
}) {
  const [phase, setPhase] = useState<Phase>('idle')
  const [note, setNote] = useState<string | null>(null)

  async function run() {
    if (!projectId || !domain || phase === 'crawling' || phase === 'saving') return
    setPhase('crawling')
    setNote('Starting…')
    onCompassState?.('thinking')

    let scanId: string | null = null
    try {
      const started = await api.startScan(projectId)
      scanId = started.scan.id

      // Real progress, reported per batch — the page count is a fact the
      // crawler returns, not an animated percentage.
      const { pages, blocked, discovered } = await runCrawl(domain, (msg) => setNote(msg))

      setPhase('saving')
      setNote(`Analyzing ${pages.length} pages…`)
      const res = await api.completeScan(projectId, scanId, pages, blocked, discovered)

      setPhase('done')
      setNote(
        `${res.scan.summary.pagesCrawled} pages, ${res.recommendationCount} findings` +
          (blocked.length ? ` · ${blocked.length} blocked` : '')
      )
      onCompassState?.('success')
      onFinished?.()
    } catch (err) {
      const message = err instanceof ApiError ? err.message : err instanceof Error ? err.message : 'The crawl failed.'
      // Close the scan row out honestly rather than leaving it 'running'
      // forever — a stuck 'running' scan makes Scout claim to be working.
      if (scanId) {
        try {
          await api.failScan(projectId, scanId, message)
        } catch {}
      }
      setPhase('error')
      setNote(message)
      onCompassState?.('error')
    }
  }

  if (!projectId || !domain) return null

  const busy = phase === 'crawling' || phase === 'saving'

  return (
    <div className="ns-runscan">
      <button type="button" className="ns-console-btn" onClick={run} disabled={busy}>
        {busy ? 'Scanning…' : phase === 'done' ? 'Scan again' : 'Run a scan'}
      </button>
      {note && (
        <span className="ns-runscan-note" data-phase={phase}>
          {note}
        </span>
      )}
    </div>
  )
}
