'use client'

/**
 * Live Digital DNA — the office surface wired to the real engine (monitoring +
 * citations + automation), same-origin under /api/*. Read AND act: register a
 * site, run a monitor cycle, check AI-answer citations. Every value is a real,
 * dated measurement; when nothing has run yet, it says so plainly.
 *
 * "Digital DNA" is the current name for the connected understanding of the
 * business (formerly "Business Twin"); the backend keeps the neutral
 * MonitoredSite naming.
 */
import { useState } from 'react'
import { createSite, runCitations, runMonitor } from '@/lib/north-star-api'
import { useNorthStarLive } from '@/lib/use-north-star-live'

const gold = '#c9a877'
const ink = '#f2ecdf'
const faint = '#9a8f78'

function Section({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 22 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <h3 style={{ fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: faint, margin: 0 }}>{title}</h3>
        {action}
      </div>
      {children}
    </section>
  )
}

function Btn({ onClick, busy, children }: { onClick: () => void; busy?: boolean; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      disabled={busy}
      style={{
        background: 'rgba(201,168,119,0.1)', border: `1px solid ${gold}55`, color: gold, borderRadius: 999,
        padding: '5px 13px', fontSize: 12, cursor: busy ? 'default' : 'pointer', opacity: busy ? 0.5 : 1,
      }}
    >
      {busy ? 'Working…' : children}
    </button>
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

export function LiveDigitalDna({ onClose }: { onClose?: () => void }) {
  const live = useNorthStarLive()
  const site = live.activeSite
  const [busy, setBusy] = useState<string | null>(null)
  const [note, setNote] = useState<string | null>(null)
  const [form, setForm] = useState({ label: '', url: '', keyword: '' })

  async function act(name: string, fn: () => Promise<string | void>) {
    setBusy(name); setNote(null)
    try {
      const msg = await fn()
      if (msg) setNote(msg)
      live.refresh()
    } catch (err) {
      setNote(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setBusy(null)
    }
  }

  const input = { background: 'rgba(255,255,255,0.05)', border: `1px solid ${gold}33`, color: ink, borderRadius: 8, padding: '8px 10px', fontSize: 14, width: '100%' } as const

  return (
    <div
      role="dialog"
      aria-label="Digital DNA"
      style={{
        position: 'absolute', inset: 0, zIndex: 40, display: 'flex', justifyContent: 'center', alignItems: 'flex-start',
        background: 'rgba(4,4,6,0.74)', backdropFilter: 'blur(6px)', overflowY: 'auto', padding: '6vh 4vw',
      }}
    >
      <div style={{ width: 'min(720px, 100%)', color: ink, fontFamily: 'system-ui,-apple-system,Segoe UI,Roboto,sans-serif' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 18 }}>
          <div>
            <p style={{ fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: gold, margin: 0 }}>North Star · Digital DNA</p>
            <h2 style={{ fontSize: 24, margin: '4px 0 0', fontFamily: 'Iowan Old Style, Georgia, serif' }}>
              {site ? site.label : 'Your company, watched live'}
            </h2>
          </div>
          {onClose && (
            <button onClick={onClose} aria-label="Close" style={{ background: 'transparent', border: `1px solid ${gold}55`, color: gold, borderRadius: 999, padding: '6px 14px', cursor: 'pointer' }}>Close</button>
          )}
        </div>

        {note && <p style={{ color: gold, background: 'rgba(201,168,119,0.08)', borderRadius: 8, padding: '8px 12px', marginBottom: 16 }}>{note}</p>}
        {live.loading && <p style={{ color: faint }}>Loading the Digital DNA…</p>}
        {live.error && <p style={{ color: '#e6a07a' }}>{live.error}</p>}

        {!live.loading && !site && (
          <Section title="Start watching a page">
            <p style={{ color: faint, lineHeight: 1.6, marginTop: 0 }}>
              Add the page and keyword the Compass should watch. It records a dated baseline, then surfaces what moves.
            </p>
            <div style={{ display: 'grid', gap: 10, maxWidth: 520 }}>
              <input aria-label="Company name" placeholder="Company name (e.g. Acme)" style={input} value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} />
              <input aria-label="Page URL" placeholder="https://acme.com/pricing" style={input} value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} />
              <input aria-label="Target keyword" placeholder="Target keyword (e.g. crm pricing)" style={input} value={form.keyword} onChange={(e) => setForm({ ...form, keyword: e.target.value })} />
              <div>
                <Btn
                  busy={busy === 'add'}
                  onClick={() =>
                    act('add', async () => {
                      if (!form.url || !form.keyword) return 'Add a page URL and a target keyword first.'
                      await createSite({ label: form.label || undefined, pages: [{ url: form.url, keyword: form.keyword, country: 'us', device: 'desktop' }] })
                      return 'Site added. Run a monitor cycle to record the first baseline.'
                    })
                  }
                >
                  Add site
                </Btn>
              </div>
            </div>
          </Section>
        )}

        {site && (
          <>
            <Section
              title="While you were away"
              action={<Btn busy={busy === 'run'} onClick={() => act('run', async () => { const r = await runMonitor(site.id); return r.brief.headline })}>Run monitor cycle</Btn>}
            >
              {!live.brief && <p style={{ color: faint }}>No monitor run yet. Run a cycle to establish the first baseline.</p>}
              {live.brief && (
                <div>
                  <p style={{ fontSize: 18, margin: '0 0 4px' }}>{live.brief.headline}</p>
                  {live.brief.siteScore != null && (
                    <p style={{ color: faint, margin: '0 0 10px' }}>
                      Site score {live.brief.siteScore}/100{live.brief.siteScoreChange ? ` (${live.brief.siteScoreChange > 0 ? '+' : ''}${live.brief.siteScoreChange})` : ''}
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

            <Section
              title="AI citation share"
              action={<Btn busy={busy === 'cite'} onClick={() => act('cite', async () => { const r = await runCitations(site.id); return r.snapshot.queriesChecked === 0 ? (r.snapshot.results[0]?.message ?? 'No AI engine is connected yet.') : `Checked ${r.snapshot.queriesChecked} ${r.snapshot.queriesChecked === 1 ? 'query' : 'queries'} — ${r.snapshot.queriesCited} cite you.` })}>Check now</Btn>}
            >
              {!live.citations && <p style={{ color: faint }}>No citation check yet. Connect Perplexity (PERPLEXITY_API_KEY) and check to track AI-answer visibility.</p>}
              {live.citations && live.citations.queriesChecked === 0 && (
                <p style={{ color: faint }}>{live.citations.results[0]?.message ?? 'No AI answer engine is connected yet. Add PERPLEXITY_API_KEY to track citations.'}</p>
              )}
              {live.citations && live.citations.queriesChecked > 0 && (
                <div>
                  <p style={{ fontSize: 22, margin: 0 }}>
                    {Math.round(live.citations.citationShare * 100)}%{' '}
                    <span style={{ fontSize: 13, color: faint }}>of {live.citations.queriesChecked} checked {live.citations.queriesChecked === 1 ? 'query' : 'queries'} cite you</span>
                  </p>
                  <div style={{ display: 'flex', gap: 14, marginTop: 8, flexWrap: 'wrap' }}>
                    {live.citations.byEngine.map((e) => (
                      <span key={e.engine} style={{ color: faint, fontSize: 13 }}>{e.engine}: <span style={{ color: ink }}>{Math.round(e.share * 100)}%</span></span>
                    ))}
                  </div>
                </div>
              )}
            </Section>

            <Section title="Pending fixes the Compass can publish">
              {live.proposals.length === 0 && <p style={{ color: faint }}>No proposals queued. After a run, the Compass drafts title/meta/schema fixes here for your approval.</p>}
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
