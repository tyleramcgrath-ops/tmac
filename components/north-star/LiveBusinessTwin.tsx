'use client'

/**
 * Live Business Twin — the first office surface wired to the real engine
 * (monitoring + citations + automation), same-origin under /api/*. Every value
 * is a real, dated measurement; when nothing has run yet, it says so plainly.
 */
import { useNorthStarLive } from '@/lib/use-north-star-live'

const gold = '#c9a877'
const ink = '#f2ecdf'
const faint = '#9a8f78'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 22 }}>
      <h3 style={{ fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: faint, margin: '0 0 10px' }}>{title}</h3>
      {children}
    </section>
  )
}

export function LiveBusinessTwin({ onClose }: { onClose?: () => void }) {
  const live = useNorthStarLive()

  return (
    <div
      role="dialog"
      aria-label="Live Business Twin"
      style={{
        position: 'absolute', inset: 0, zIndex: 40, display: 'flex', justifyContent: 'center', alignItems: 'flex-start',
        background: 'rgba(4,4,6,0.72)', backdropFilter: 'blur(6px)', overflowY: 'auto', padding: '6vh 4vw',
      }}
    >
      <div style={{ width: 'min(720px, 100%)', color: ink, fontFamily: 'system-ui,-apple-system,Segoe UI,Roboto,sans-serif' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 18 }}>
          <div>
            <p style={{ fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: gold, margin: 0 }}>North Star · Business Twin</p>
            <h2 style={{ fontSize: 24, margin: '4px 0 0', fontFamily: 'Iowan Old Style, Georgia, serif' }}>
              {live.activeSite ? live.activeSite.label : 'Your company, watched live'}
            </h2>
          </div>
          {onClose && (
            <button onClick={onClose} aria-label="Close" style={{ background: 'transparent', border: `1px solid ${gold}55`, color: gold, borderRadius: 999, padding: '6px 14px', cursor: 'pointer' }}>
              Close
            </button>
          )}
        </div>

        {live.loading && <p style={{ color: faint }}>Loading the twin…</p>}
        {live.error && <p style={{ color: '#e6a07a' }}>{live.error}</p>}

        {!live.loading && !live.activeSite && (
          <p style={{ color: faint, lineHeight: 1.6 }}>
            No monitored site yet. Register one via <code style={{ color: gold }}>POST /api/monitor/sites</code> with the pages and
            keywords to watch, then run a cycle — the Compass starts recording snapshots and surfacing what moves.
          </p>
        )}

        {live.activeSite && (
          <>
            <Section title="While you were away">
              {!live.brief && <p style={{ color: faint }}>No monitor run yet. Run a cycle to establish the first baseline.</p>}
              {live.brief && (
                <div>
                  <p style={{ fontSize: 18, margin: '0 0 4px' }}>{live.brief.headline}</p>
                  {live.brief.siteScore != null && (
                    <p style={{ color: faint, margin: '0 0 10px' }}>
                      Site score {live.brief.siteScore}/100
                      {live.brief.siteScoreChange ? ` (${live.brief.siteScoreChange > 0 ? '+' : ''}${live.brief.siteScoreChange})` : ''}
                    </p>
                  )}
                  <ul style={{ margin: 0, paddingLeft: 18 }}>
                    {live.brief.items.map((it, i) => (
                      <li key={i} style={{ margin: '6px 0', color: it.good ? '#bfe3c0' : '#e6c07a' }}>
                        <strong>{it.good ? '▲' : '▼'}</strong> {it.headline} <span style={{ color: faint }}>— {it.detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </Section>

            <Section title="AI citation share">
              {!live.citations && <p style={{ color: faint }}>No citation check yet. Connect Perplexity (PERPLEXITY_API_KEY) and run one to track AI-answer visibility.</p>}
              {live.citations && (
                <div>
                  <p style={{ fontSize: 22, margin: 0 }}>
                    {Math.round(live.citations.citationShare * 100)}%{' '}
                    <span style={{ fontSize: 13, color: faint }}>
                      of {live.citations.queriesChecked} checked {live.citations.queriesChecked === 1 ? 'query' : 'queries'} cite you
                    </span>
                  </p>
                  <div style={{ display: 'flex', gap: 14, marginTop: 8, flexWrap: 'wrap' }}>
                    {live.citations.byEngine.map((e) => (
                      <span key={e.engine} style={{ color: faint, fontSize: 13 }}>
                        {e.engine}: <span style={{ color: ink }}>{Math.round(e.share * 100)}%</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </Section>

            <Section title="Pending fixes the Compass can publish">
              {live.proposals.length === 0 && <p style={{ color: faint }}>No proposals queued. Run analysis, then let the Compass draft title/meta/schema fixes for approval.</p>}
              {live.proposals.map((p) => (
                <div key={p.id} style={{ border: `1px solid ${gold}33`, borderRadius: 10, padding: '10px 14px', margin: '8px 0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: gold, fontSize: 13 }}>{safePath(p.url)}</span>
                    <span style={{ color: faint, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{p.status}</span>
                  </div>
                  <ul style={{ margin: '6px 0 0', paddingLeft: 18 }}>
                    {p.changes.map((c, i) => (
                      <li key={i} style={{ color: ink, fontSize: 14, margin: '3px 0' }}>
                        {c.label}
                        {c.applied != null && <span style={{ color: c.applied ? '#bfe3c0' : '#e6a07a' }}> — {c.applied ? 'published' : 'needs manual step'}</span>}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </Section>
          </>
        )}
      </div>
    </div>
  )
}

function safePath(url: string): string {
  try {
    const u = new URL(url)
    return u.pathname === '/' ? u.hostname : u.pathname
  } catch {
    return url
  }
}
