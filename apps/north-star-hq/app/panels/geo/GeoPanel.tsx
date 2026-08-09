'use client'

// UI layer (Engine -> API -> UI): pure presentation of the GEO audit. Every
// number and verdict below is read straight off GeoAuditDTO — nothing is
// derived here, and nothing is filled in when the API says it doesn't know.
//
// The one rule this panel exists to honor: a null score renders as "unknown",
// never as a zero or a dash that reads like a bad number. A site whose
// robots.txt could not be fetched has *unknown* crawler access, and showing
// "0" there would be a lie the user would act on.

import { Bot, ShieldAlert, ShieldCheck, HelpCircle } from 'lucide-react'
import { api, ApiError, type CrawlerAccessDTO, type GeoAuditDTO } from '../../lib/client'
import { useLivePoll } from '../../_lib/use-live-poll'

// Slow on purpose: every refresh makes a real outbound request to the
// customer's own server for robots.txt. This is not a dashboard metric to
// tick every fifteen seconds.
const POLL_MS = 5 * 60_000

const ACCESS_ICON: Record<CrawlerAccessDTO, typeof Bot> = {
  allowed: ShieldCheck,
  blocked: ShieldAlert,
  unlisted: HelpCircle,
}

const ACCESS_LABEL: Record<CrawlerAccessDTO, string> = {
  allowed: 'Allowed',
  blocked: 'Blocked',
  // Distinct from allowed on purpose: "no rule mentions this bot and there is
  // no wildcard group" is a different fact from "a rule permits it".
  unlisted: 'No rule',
}

const ROBOTS_LABEL: Record<GeoAuditDTO['robots']['status'], string> = {
  found: 'robots.txt found',
  absent: 'No robots.txt (nothing restricted)',
  unreachable: 'robots.txt unreadable',
}

function Score({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="ns-geo-score">
      <span className="ns-geo-score-value" data-unknown={value === null ? true : undefined}>
        {value === null ? 'Unknown' : `${value}%`}
      </span>
      <span className="ns-geo-score-label">{label}</span>
    </div>
  )
}

export default function GeoPanel({ projectId, enabled }: { projectId: string | null; enabled: boolean }) {
  const { data, error, loading } = useLivePoll<GeoAuditDTO>(
    async () => {
      if (!projectId) throw new ApiError(0, 'No project.')
      return api.getGeoAudit(projectId)
    },
    { enabled: Boolean(projectId) && enabled, intervalMs: POLL_MS }
  )

  if (!projectId) {
    return (
      <>
        <p className="ns-panel-eyebrow">AI access</p>
        <h2>No project yet.</h2>
        <p className="ns-panel-body">Create a project to check whether AI engines can read your site.</p>
      </>
    )
  }

  if (loading && !data && !error) {
    return (
      <>
        <p className="ns-panel-eyebrow">AI access</p>
        <span className="ns-skeleton-line" style={{ width: '60%' }} aria-hidden />
        <span className="ns-skeleton-line" style={{ width: '100%', marginTop: '0.9rem' }} aria-hidden />
        <p className="ns-panel-body">Reading robots.txt from your site…</p>
      </>
    )
  }

  if (error || !data) {
    return (
      <>
        <p className="ns-panel-eyebrow">AI access</p>
        <h2>Could not run the audit.</h2>
        <p className="ns-panel-body">{error ?? 'No result.'}</p>
      </>
    )
  }

  const blocked = data.crawlers.filter((c) => c.access === 'blocked')
  const critical = data.findings.filter((f) => f.severity === 'critical')

  return (
    <>
      <div className="ns-panel-head">
        <p className="ns-panel-eyebrow">AI access</p>
        <p className="ns-panel-status">{ROBOTS_LABEL[data.robots.status]}</p>
      </div>

      <h2>
        {data.robots.status === 'unreachable'
          ? 'Crawler access is unknown.'
          : blocked.length === 0
            ? 'No AI crawler is blocked.'
            : `${blocked.length} AI crawler${blocked.length === 1 ? ' is' : 's are'} blocked.`}
      </h2>

      <div className="ns-geo-scores">
        <Score label="Crawler access" value={data.scores.access} />
        <Score label="Entity grounding" value={data.scores.grounding} />
        <Score label="Overall" value={data.scores.overall} />
      </div>
      {/* The arithmetic, shown rather than asserted — so a number nobody can
          explain never appears on this screen. */}
      <p className="ns-geo-formula">{data.scores.formula}</p>

      <hr className="ns-panel-divider" />

      {data.crawlers.length > 0 ? (
        <ul className="ns-row-list">
          {data.crawlers.map((c) => {
            const Icon = ACCESS_ICON[c.access]
            return (
              <li key={c.bot} className="ns-row" data-access={c.access}>
                <Icon className="ns-row-icon" strokeWidth={1.5} aria-hidden />
                <span className="ns-row-text">
                  <b className="ns-row-title">{c.bot}</b>
                  <span className="ns-row-desc">
                    {c.matchedRule
                      ? `${c.matchedGroup ? `User-agent: ${c.matchedGroup} — ` : ''}${c.matchedRule}`
                      : 'No group in robots.txt applies to this bot.'}
                  </span>
                </span>
                <span className="ns-row-dot" aria-hidden title={ACCESS_LABEL[c.access]} />
              </li>
            )
          })}
        </ul>
      ) : (
        <p className="ns-panel-body">
          {data.robots.url} could not be read{data.robots.detail ? ` (${data.robots.detail})` : ''}, so no crawler
          verdict can be given. This is reported as unknown rather than clear — a failed fetch is not permission.
        </p>
      )}

      {data.schema && (
        <>
          <hr className="ns-panel-divider" />
          <ul className="ns-kv-list">
            <li className="ns-kv-row">
              <span className="ns-kv-label">Pages with structured data</span>
              <span className="ns-kv-value">
                {data.schema.pagesWithAnySchema} of {data.schema.pagesAnalyzed}
              </span>
            </li>
            <li className="ns-kv-row">
              <span className="ns-kv-label">Most common type</span>
              <span className="ns-kv-value" data-unavailable={data.schema.types.length ? undefined : true}>
                {data.schema.types.length ? `${data.schema.types[0].type} (${data.schema.types[0].pages})` : 'None found'}
              </span>
            </li>
            <li className="ns-kv-row">
              <span className="ns-kv-label">Missing entity types</span>
              <span className="ns-kv-value" data-unavailable={data.schema.missingEntityTypes.length ? true : undefined}>
                {data.schema.missingEntityTypes.length ? data.schema.missingEntityTypes.join(', ') : 'None'}
              </span>
            </li>
          </ul>
        </>
      )}

      {data.findings.length > 0 && (
        <>
          <hr className="ns-panel-divider" />
          <ul className="ns-geo-findings">
            {data.findings.map((f) => (
              <li key={f.id} data-severity={f.severity}>
                <b>{f.title}</b>
                <span>{f.detail}</span>
                {/* Quoted evidence, so a finding can be checked rather than believed. */}
                <code>{f.evidence}</code>
              </li>
            ))}
          </ul>
        </>
      )}

      <p className="ns-panel-body">
        {critical.length > 0
          ? 'A blocked crawler cannot cite you no matter how good the page is. Fix these first.'
          : 'Checked against your live robots.txt, not a stored copy.'}
      </p>
    </>
  )
}
