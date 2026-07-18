'use client'

// Automation: schedule a recurring re-audit for this project. v1 re-runs the
// recommendation + multi-agent pipeline on the latest scan on a daily/weekly
// cadence (a server-side re-crawl is a planned follow-up). Honest about state:
// shows the next run, last run, and any failed job — never a fabricated status.

import { useCallback, useEffect, useState } from 'react'
import { CalendarClock, Loader2 } from 'lucide-react'
import { api, ApiError, type ScheduleDTO, type JobDTO } from '../../../lib/client'

type Freq = 'off' | 'daily' | 'weekly'

function freqOf(s: ScheduleDTO | undefined): Freq {
  if (!s || !s.enabled) return 'off'
  return s.cron.endsWith('* * 1') ? 'weekly' : 'daily'
}

export function AutomationCard({ projectId }: { projectId: string }) {
  const [schedule, setSchedule] = useState<ScheduleDTO | undefined>()
  const [jobs, setJobs] = useState<JobDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    try {
      const { schedules, jobs } = await api.getSchedule(projectId)
      setSchedule(schedules.find((s) => s.kind === 'scheduled_scan'))
      setJobs(jobs)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not load automation.')
    } finally {
      setLoading(false)
    }
  }, [projectId])
  useEffect(() => { void load() }, [load])

  async function choose(freq: Freq) {
    setSaving(true); setError('')
    try {
      if (freq === 'off') await api.clearSchedule(projectId)
      else await api.setSchedule(projectId, freq, true)
      await load()
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not update automation.')
    } finally { setSaving(false) }
  }

  const current = freqOf(schedule)

  return (
    <div className="rf-card p-5">
      <div className="flex items-center gap-2">
        <CalendarClock className="h-4 w-4 text-[var(--rf-blue-bright)]" />
        <p className="text-sm font-semibold text-white">Automatic re-audit</p>
        {(loading || saving) && <Loader2 className="h-3.5 w-3.5 animate-spin text-[var(--rf-faint)]" />}
      </div>
      <p className="mt-1 text-xs text-[var(--rf-muted)]">Re-run recommendations &amp; the agent consensus on a schedule so this project stays fresh without you clicking.</p>

      <div className="mt-3 inline-flex rounded-lg border border-[var(--rf-card-line)] p-0.5">
        {(['off', 'daily', 'weekly'] as Freq[]).map((f) => (
          <button
            key={f}
            onClick={() => choose(f)}
            disabled={saving}
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
