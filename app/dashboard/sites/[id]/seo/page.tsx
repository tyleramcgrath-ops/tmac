import { notFound } from 'next/navigation'
import { requireUser } from '@/lib/session'
import { LIMITS, freshSeoState, intelReady, type Scores, type SeoIssue } from '@/lib/seo-intel'
import { getStore } from '@/lib/store'
import { addAiQuery, addCompetitor, addKeyword, applyFix, checkNow, paidLookupsAllowed, removeAiQuery, removeCompetitor, removeKeyword, runAudit } from './actions'

const NOTES: Record<string, { text: string; tone?: 'good' | 'bad' }> = {
  error: { text: 'Your site could not be read just now. Try again in a minute.', tone: 'bad' },
  unreachable: { text: 'That website could not be read. Check the address, or it may block visits from tools like ours.', tone: 'bad' },
  competitors: { text: `You can compare with up to ${LIMITS.competitors} websites. Remove one to add another.` },
  keywords: { text: `You can track up to ${LIMITS.keywords} searches. Remove one to add another.` },
  queries: { text: `You can track up to ${LIMITS.aiQueries} questions. Remove one to add another.` },
  fixed: { text: 'Fixed and live. Your audit has been updated.', tone: 'good' },
  nofix: { text: 'There wasn’t enough of your own writing on those pages to build from. Ask Sofie to help with this one.' },
  plan: { text: 'Ranking, AI answer and backlink checks are part of the law firm plans. Your audit and competitor comparison stay free.' },
}

const AREAS: { key: keyof Scores; label: string }[] = [
  { key: 'technical', label: 'Technical' },
  { key: 'content', label: 'Content' },
  { key: 'schema', label: 'Google data' },
  { key: 'ai', label: 'AI answers' },
]

const CATEGORY: Record<string, string> = { indexability: 'Google', schema: 'Google data', content: 'Content', technical: 'Technical', links: 'Links', performance: 'Speed', images: 'Photos', ai: 'AI answers' }

const SEVERITY = { critical: 'Fix first', warning: 'Worth fixing', info: 'Nice to have' } as const

const shortDate = (iso: string) => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
const hostOf = (url: string) => {
  try {
    return new URL(url).host.replace(/^www\./, '')
  } catch {
    return url
  }
}

export default async function SeoPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ note?: string }> }) {
  const [{ id }, { note }] = await Promise.all([params, searchParams])
  const user = await requireUser()
  const store = getStore()
  const site = await store.siteForUser(user.id, id)
  if (!site) notFound()
  const [state, paid] = await Promise.all([freshSeoState(store, site), paidLookupsAllowed(site.id)])
  const { audit } = state
  const ready = { rankings: intelReady.rankings(), ai: intelReady.ai(), backlinks: intelReady.backlinks() }
  const anyReady = ready.rankings || ready.ai || ready.backlinks
  const flash = note ? NOTES[note] : undefined
  const sofie = (text: string) => `/dashboard/sites/${site.id}/sofie?fill=${encodeURIComponent(text)}`
  const settings = `/dashboard/sites/${site.id}/settings`
  const audit$ = runAudit.bind(null, site.id)
  const act = (i: SeoIssue) =>
    i.action.kind === 'auto' ? (
      <form action={applyFix.bind(null, site.id, i.id)}>
        <button className="btn btn-sm btn-primary" type="submit">{i.action.label}</button>
      </form>
    ) : i.action.kind === 'settings' ? (
      <a className="btn btn-sm btn-ghost" href={settings}>{i.action.label}</a>
    ) : (
      <a className="btn btn-sm btn-ghost" href={sofie(i.action.ask)}>Fix with Sofie</a>
    )
  const check$ = checkNow.bind(null, site.id)

  return (
    <section className="stack seo">
      <div className="sec-head">
        <div>
          <h2>SEO</h2>
          <p className="muted">A full search audit of every page on your site, side by side with the websites you compete with, plus where you show up on Google and in AI answers.</p>
        </div>
      </div>

      {flash && <p className={`notice${flash.tone ? ` ${flash.tone}` : ''}`}>{flash.text}</p>}

      <div className="card">
        <div className="card-head">
          <h3>Site audit</h3>
          <span className="muted small">{audit ? `Checked ${shortDate(audit.at)}, ${audit.pages.length} pages` : 'Not run yet'}</span>
        </div>
        {audit ? (
          <div className="seo-top">
            <div className="seo-score">
              <strong>{audit.siteScore}</strong>
              <span className="muted small">out of 100</span>
            </div>
            <ul className="vis-areas">
              {AREAS.map((a) => (
                <li key={a.key}>
                  <span>{a.label}</span>
                  <span className="vis-bar" aria-hidden="true"><i style={{ width: `${audit.scores[a.key]}%` }} /></span>
                  <span className="muted small">{audit.scores[a.key]}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="muted">Publish a page and your audit appears here.</p>
        )}
        <p className="muted small">Checks every published page the way Google reads it: titles, descriptions, headings, links, photos, Google data and how easy it is for AI tools to quote you. It runs by itself after every change and once a week.</p>
        <form action={audit$}>
          <button className="btn btn-ghost btn-sm" type="submit">Check again now</button>
        </form>
      </div>

      {audit && (
        <div className="card">
          <div className="card-head">
            <h3>What to fix</h3>
            <span className="muted small">{audit.issues.length ? `${audit.issues.length} found, most important first` : 'Nothing found'}</span>
          </div>
          {audit.issues.length === 0 ? (
            <p className="muted">Every check passed. Run the audit again after you change your site.</p>
          ) : (
            <ol className="quests seo-issues">
              {audit.issues.map((i) => (
                <li key={i.id} className="quest">
                  <span className={`seo-sev seo-${i.severity}`}>{SEVERITY[i.severity]}</span>
                  <div className="quest-body">
                    <strong>{i.title}</strong>
                    <span className="muted small">{i.why}</span>
                    {i.pages.length > 0 && <span className="small seo-pages">{i.pages.join(', ')}</span>}
                  </div>
                  <span className="quest-area muted small">{CATEGORY[i.category] ?? i.category.charAt(0).toUpperCase() + i.category.slice(1)}</span>
                  {act(i)}
                </li>
              ))}
            </ol>
          )}
        </div>
      )}

      <div className="card">
        <div className="card-head">
          <h3>You and your competitors</h3>
          <span className="muted small">{state.competitors.length}/{LIMITS.competitors}</span>
        </div>
        <p className="muted small">Add the websites you lose clients to. Each one is read (up to {LIMITS.competitorPages} pages) and scored the same way as yours.</p>
        {(audit || state.competitors.length > 0) && (
          <div className="seo-table-wrap">
            <table className="seo-table">
              <thead>
                <tr>
                  <th scope="col">Website</th>
                  <th scope="col">Score</th>
                  {AREAS.map((a) => (
                    <th key={a.key} scope="col">{a.label}</th>
                  ))}
                  <th scope="col"><span className="sr-only">Remove</span></th>
                </tr>
              </thead>
              <tbody>
                {audit && (
                  <tr className="is-me">
                    <th scope="row">{site.business.name} (you)</th>
                    <td><strong>{audit.siteScore}</strong></td>
                    {AREAS.map((a) => (
                      <td key={a.key}>{audit.scores[a.key]}</td>
                    ))}
                    <td />
                  </tr>
                )}
                {state.competitors.map((c) => (
                  <tr key={c.url}>
                    <th scope="row">{hostOf(c.url)}</th>
                    {c.error ? (
                      <td colSpan={AREAS.length + 1} className="muted small">Could not be read</td>
                    ) : (
                      <>
                        <td><strong>{c.siteScore}</strong></td>
                        {AREAS.map((a) => (
                          <td key={a.key}>{c.scores[a.key]}</td>
                        ))}
                      </>
                    )}
                    <td>
                      <form action={removeCompetitor.bind(null, site.id, c.url)}>
                        <button className="btn btn-ghost btn-sm" type="submit" aria-label={`Remove ${hostOf(c.url)}`}>Remove</button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {state.competitors.length < LIMITS.competitors && (
          <form action={addCompetitor.bind(null, site.id)} className="seo-add">
            <label className="sr-only" htmlFor="seo-comp">Competitor website</label>
            <input className="input" id="seo-comp" name="url" type="text" inputMode="url" placeholder="competitor.com" required maxLength={200} />
            <button className="btn btn-primary" type="submit">Compare</button>
          </form>
        )}
      </div>

      <div className="card">
        <div className="card-head">
          <h3>Tracking</h3>
          {paid && anyReady && (state.keywords.length > 0 || state.aiQueries.length > 0 || ready.backlinks) && (
            <form action={check$}>
              <button className="btn btn-primary btn-sm" type="submit">Check now</button>
            </form>
          )}
        </div>
        {!paid ? (
          <p className="muted small">Google positions, AI answers and backlinks are part of the law firm plans. Add what you want to track now and checks start when your plan includes them.</p>
        ) : !anyReady ? (
          <p className="muted small">Live checks aren’t switched on yet. Add what you want to track now and they’ll be checked once they are.</p>
        ) : (
          <p className="muted small">Each search and question is checked once a day at most. Results are exactly what Google and Perplexity returned.</p>
        )}

        <h4 className="seo-sub">Google searches</h4>
        {state.keywords.length > 0 && (
          <ul className="seo-list">
            {state.keywords.map((k) => {
              const last = k.checks.at(-1)
              const prev = k.checks.at(-2)
              const moved = last?.position && prev?.position ? prev.position - last.position : 0
              return (
                <li key={k.keyword}>
                  <span className="seo-term">{k.keyword}</span>
                  <span className="small">
                    {!last ? <span className="muted">Not checked yet</span> : last.position ? <>Position <strong>{last.position}</strong>{moved ? <span className="muted"> ({moved > 0 ? `up ${moved}` : `down ${-moved}`})</span> : null}</> : <span className="muted">Not in the top 100</span>}
                  </span>
                  <form action={removeKeyword.bind(null, site.id, k.keyword)}>
                    <button className="btn btn-ghost btn-sm" type="submit" aria-label={`Stop tracking ${k.keyword}`}>Remove</button>
                  </form>
                </li>
              )
            })}
          </ul>
        )}
        {state.keywords.length < LIMITS.keywords && (
          <form action={addKeyword.bind(null, site.id)} className="seo-add">
            <label className="sr-only" htmlFor="seo-kw">Search to track</label>
            <input className="input" id="seo-kw" name="keyword" type="text" placeholder="personal injury lawyer in Austin" required maxLength={80} />
            <button className="btn btn-ghost" type="submit">Track</button>
          </form>
        )}

        <h4 className="seo-sub">Questions people ask AI</h4>
        {state.aiQueries.length > 0 && (
          <ul className="seo-list">
            {state.aiQueries.map((q) => {
              const last = q.checks.at(-1)
              return (
                <li key={q.query}>
                  <span className="seo-term">{q.query}</span>
                  <span className="small">
                    {!last ? <span className="muted">Not checked yet</span> : last.cited ? <>You’re cited, <strong>source {last.position}</strong></> : <span className="muted">Not cited{last.sources.length ? `. Cited instead: ${last.sources.slice(0, 3).join(', ')}` : ''}</span>}
                  </span>
                  <form action={removeAiQuery.bind(null, site.id, q.query)}>
                    <button className="btn btn-ghost btn-sm" type="submit" aria-label={`Stop tracking ${q.query}`}>Remove</button>
                  </form>
                </li>
              )
            })}
          </ul>
        )}
        {state.aiQueries.length < LIMITS.aiQueries && (
          <form action={addAiQuery.bind(null, site.id)} className="seo-add">
            <label className="sr-only" htmlFor="seo-ai">Question to track</label>
            <input className="input" id="seo-ai" name="query" type="text" placeholder="Who is the best car accident lawyer in Austin?" required maxLength={160} />
            <button className="btn btn-ghost" type="submit">Track</button>
          </form>
        )}

        <h4 className="seo-sub">Backlinks</h4>
        {state.backlinks ? (
          <dl className="seo-links">
            <div><dt className="muted small">Sites linking to you</dt><dd>{state.backlinks.referringDomains ?? 'Unknown'}</dd></div>
            <div><dt className="muted small">Links in total</dt><dd>{state.backlinks.totalBacklinks ?? 'Unknown'}</dd></div>
            <div><dt className="muted small">Trust Flow</dt><dd>{state.backlinks.trustFlow ?? 'Unknown'}</dd></div>
            <div><dt className="muted small">Checked</dt><dd>{shortDate(state.backlinks.at)}</dd></div>
          </dl>
        ) : (
          <p className="muted small">The websites that link to yours, from Majestic’s index. Checked with “Check now”, once a day.</p>
        )}
      </div>
    </section>
  )
}
