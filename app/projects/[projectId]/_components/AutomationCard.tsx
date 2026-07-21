'use client'

// Automation: schedule a recurring re-audit for this project. Drives a real
// server-side re-crawl on a daily/weekly cadence, then refreshes
// recommendations + the multi-agent consensus from it. Honest about state:
// shows the next run, last run, and any failed job — never a fabricated status.

import { useCallback, useEffect, useState } from 'react'
import { CalendarClock, Loader2, Mail, Swords, TrendingUp } from 'lucide-react'
import { api, ApiError, type ScheduleDTO, type JobDTO } from '../../../lib/client'

type Freq = 'off' | 'daily' | 'weekly'
type Kind = 'scheduled_scan' | 'monitor' | 'competitor_refresh' | 'rank_tracking'

function freqOf(s: ScheduleDTO | undefined): Freq {
  if (!s || !s.enabled) return 'off'
  return s.cron.endsWith('* * 1') ? 'weekly' : 'daily'
}

export function AutomationCard({ projectId }: { projectId: string }) {
  const [schedules, setSchedules] = useState<ScheduleDTO[]>([])
  const [jobs, setJobs] = useState<JobDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<Kind | null>(null)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    try {
      const { schedules, jobs } = await api.getSchedule(projectId)
      setSchedules(schedules)
      setJobs(jobs)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not load automation.')
    } finally {
      setLoading(false)
    }
  }, [projectId])
  useEffect(() => { void load() }, [load])

  async function choose(kind: Kind, freq: Freq) {
    setSaving(kind); setError('')
    try {
      if (freq === 'off') await api.clearSchedule(projectId, kind)
      else await api.setSchedule(projectId, freq, true, kind)
      await load()
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not update automation.')
    } finally { setSaving(null) }
  }

  const schedule = schedules.find((s) => s.kind === 'scheduled_scan')
  const digestSchedule = schedules.find((s) => s.kind === 'monitor')
  const competitorSchedule = schedules.find((s) => s.kind === 'competitor_refresh')
  const rankSchedule = schedules.find((s) => s.kind === 'rank_tracking')
  const current = freqOf(schedule)
  const digestCurrent = freqOf(digestSchedule)
  const competitorCurrent = freqOf(competitorSchedule)
  const rankCurrent = freqOf(rankSchedule)

  return (
    <div className="rf-card p-5">
      <div className="flex items-center gap-2">
        <CalendarClock className="h-4 w-4 text-[var(--rf-blue-bright)]" />
        <p className="text-sm font-semibold text-white">Automatic re-audit</p>
        {(loading || saving === 'scheduled_scan') && <Loader2 className="h-3.5 w-3.5 animate-spin text-[var(--rf-faint)]" />}
      </div>
      <p className="mt-1 text-xs text-[var(--rf-muted)]">Re-run recommendations &amp; the agent consensus on a schedule so this project stays fresh without you clicking.</p>

      <div className="mt-3 inline-flex rounded-lg border border-[var(--rf-card-line)] p-0.5">
        {(['off', 'daily', 'weekly'] as Freq[]).map((f) => (
          <button
            key={f}
            onClick={() => choose('scheduled_scan', f)}
            disabled={!!saving}
            className={`rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-colors disabled:opacity-60 ${current === f ? 'rf-btn-primary' : 'text-[var(--rf-muted)] hover:text-white'}`}
          >
            {f}
          </button>
        ))}
      </div>

      {schedule?.enabled && (
        <p className="mt-3 text-[11px] text-[var(--rf-faint)]">
          Next run {new Date(schedule.nextRunAt).toLocaleString()}
          {schedule.lastRunAt ? ` · last ran ${new Date(schedule.lastRunAt).toLocaleString()}` : ' · not run yet'}
        </p>
      )}

      <div className="mt-4 border-t border-[var(--rf-card-line)] pt-4">
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-[var(--rf-blue-bright)]" />
          <p className="text-sm font-semibold text-white">Weekly summary email</p>
          {saving === 'monitor' && <Loader2 className="h-3.5 w-3.5 animate-spin text-[var(--rf-faint)]" />}
        </div>
        <p className="mt-1 text-xs text-[var(--rf-muted)]">Email the org owner site score, verified fixes, and any regressions — no need to open the app to know things are on track.</p>
        <div className="mt-3 inline-flex rounded-lg border border-[var(--rf-card-line)] p-0.5">
          {(['off', 'daily', 'weekly'] as Freq[]).map((f) => (
            <button
              key={f}
              onClick={() => choose('monitor', f)}
              disabled={!!saving}
              className={`rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-colors disabled:opacity-60 ${digestCurrent === f ? 'rf-btn-primary' : 'text-[var(--rf-muted)] hover:text-white'}`}
            >
              {f}
            </button>
          ))}
        </div>
        {digestSchedule?.enabled && (
          <p className="mt-3 text-[11px] text-[var(--rf-faint)]">
            Next send {new Date(digestSchedule.nextRunAt).toLocaleString()}
            {digestSchedule.lastRunAt ? ` · last sent ${new Date(digestSchedule.lastRunAt).toLocaleString()}` : ' · not sent yet'}
          </p>
        )}
      </div>

      <div className="mt-4 border-t border-[var(--rf-card-line)] pt-4">
        <div className="flex items-center gap-2">
          <Swords className="h-4 w-4 text-[var(--rf-blue-bright)]" />
          <p className="text-sm font-semibold text-white">Auto-refresh competitors</p>
          {saving === 'competitor_refresh' && <Loader2 className="h-3.5 w-3.5 animate-spin text-[var(--rf-faint)]" />}
        </div>
        <p className="mt-1 text-xs text-[var(--rf-muted)]">Re-crawl every tracked competitor and recompute overlap on a schedule, so it stays current without clicking Refresh.</p>
        <div className="mt-3 inline-flex rounded-lg border border-[var(--rf-card-line)] p-0.5">
          {(['off', 'daily', 'weekly'] as Freq[]).map((f) => (
            <button
              key={f}
              onClick={() => choose('competitor_refresh', f)}
              disabled={!!saving}
              className={`rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-colors disabled:opacity-60 ${competitorCurrent === f ? 'rf-btn-primary' : 'text-[var(--rf-muted)] hover:text-white'}`}
            >
              {f}
            </button>
          ))}
        </div>
        {competitorSchedule?.enabled && (
          <p className="mt-3 text-[11px] text-[var(--rf-faint)]">
            Next refresh {new Date(competitorSchedule.nextRunAt).toLocaleString()}
            {competitorSchedule.lastRunAt ? ` · last ran ${new Date(competitorSchedule.lastRunAt).toLocaleString()}` : ' · not run yet'}
          </p>
        )}
      </div>

      <div className="mt-4 border-t border-[var(--rf-card-line)] pt-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-[var(--rf-blue-bright)]" />
          <p className="text-sm font-semibold text-white">Rank tracking history</p>
          {saving === 'rank_tracking' && <Loader2 className="h-3.5 w-3.5 animate-spin text-[var(--rf-faint)]" />}
        </div>
        <p className="mt-1 text-xs text-[var(--rf-muted)]">Snapshot every tracked keyword's Google position on a schedule, so Rankings shows a real trend instead of only right-now. Requires SERPAPI_KEY.</p>
        <div className="mt-3 inline-flex rounded-lg border border-[var(--rf-card-line)] p-0.5">
          {(['off', 'daily', 'weekly'] as Freq[]).map((f) => (
            <button
              key={f}
              onClick={() => choose('rank_tracking', f)}
              disabled={!!saving}
              className={`rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-colors disabled:opacity-60 ${rankCurrent === f ? 'rf-btn-primary' : 'text-[var(--rf-muted)] hover:text-white'}`}
            >
              {f}
            </button>
          ))}
        </div>
        {rankSchedule?.enabled && (
          <p className="mt-3 text-[11px] text-[var(--rf-faint)]">
            Next check {new Date(rankSchedule.nextRunAt).toLocaleString()}
            {rankSchedule.lastRunAt ? ` · last ran ${new Date(rankSchedule.lastRunAt).toLocaleString()}` : ' · not run yet'}
          </p>
        )}
      </div>

      {error && <p className="mt-2 text-[11px] text-[var(--rf-red)]">{error}</p>}

      {jobs.length > 0 && (
        <div className="mt-3 border-t border-[var(--rf-card-line)] pt-3">
          <p className="text-[11px] font-medium text-[var(--rf-muted)]">Recent runs</p>
          <div className="mt-1.5 space-y-1">
            {jobs.slice(0, 5).map((j) => (
              <div key={j.id} className="flex items-center justify-between text-[11px]">
                <span className="text-[var(--rf-faint)]">{new Date(j.createdAt).toLocaleString()}</span>
                <span className={j.status === 'succeeded' ? 'text-[var(--rf-green)]' : j.status === 'failed' ? 'text-[var(--rf-red)]' : 'text-[var(--rf-muted)]'}>
                  {j.status}{j.lastError ? ` — ${j.lastError}` : ''}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
