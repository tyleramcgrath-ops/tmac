'use client'

// The interactive part of each state tool. All the law comes in as props from
// the server (verified, cited facts); this file only does the arithmetic.

import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { track } from '@/components/Tracker'
import type { Dur, FaultRule, Rule, ToolData } from '@/lib/law/tools'

type Props = { tool: string; toolName: string; state: string; stateSlug: string; data: ToolData; states: { slug: string; name: string }[] }

const DAY = 86400000
const iso = (d: Date) => d.toISOString().slice(0, 10)
const parse = (s: string) => (/^\d{4}-\d{2}-\d{2}$/.test(s) ? new Date(`${s}T00:00:00Z`) : null)
const nice = (d: Date) => d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
const usd = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: n % 1 ? 2 : 0 })

function addDur(start: Date, d: Dur): Date {
  const r = new Date(start)
  if (d.unit === 'years' || d.unit === 'months') {
    const months = Math.round(d.n * (d.unit === 'years' ? 12 : 1))
    const day = r.getUTCDate()
    r.setUTCDate(1)
    r.setUTCMonth(r.getUTCMonth() + months)
    // Same day of the month, or the last day if that month is shorter.
    const last = new Date(Date.UTC(r.getUTCFullYear(), r.getUTCMonth() + 1, 0)).getUTCDate()
    r.setUTCDate(Math.min(day, last))
  } else if (d.unit === 'days') r.setTime(r.getTime() + d.n * DAY)
  else if (d.unit === 'hours') r.setTime(r.getTime() + Math.ceil(d.n / 24) * DAY)
  else {
    let left = d.n
    while (left > 0) {
      r.setTime(r.getTime() + DAY)
      const w = r.getUTCDay()
      if (w !== 0 && w !== 6) left--
    }
  }
  return r
}

function todayUtc() {
  const n = new Date()
  return new Date(Date.UTC(n.getFullYear(), n.getMonth(), n.getDate()))
}

function icsFile(title: string, date: Date, note: string) {
  const d = iso(date).replace(/-/g, '')
  const next = iso(new Date(date.getTime() + DAY)).replace(/-/g, '')
  const esc = (s: string) => s.replace(/[\\,;]/g, (m) => `\\${m}`).replace(/\n/g, '\\n')
  const body = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//LawMatchNow//Deadline//EN', 'BEGIN:VEVENT',
    `UID:${d}-${Math.random().toString(36).slice(2)}@lawmatchnow.com`, `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').slice(0, 15)}Z`,
    `DTSTART;VALUE=DATE:${d}`, `DTEND;VALUE=DATE:${next}`, `SUMMARY:${esc(title)}`, `DESCRIPTION:${esc(note)}`,
    'BEGIN:VALARM', 'TRIGGER:-P30D', 'ACTION:DISPLAY', `DESCRIPTION:${esc(title)} in 30 days`, 'END:VALARM',
    'END:VEVENT', 'END:VCALENDAR',
  ].join('\r\n')
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([body], { type: 'text/calendar' }))
  a.download = 'deadline.ics'
  a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 1000)
}

function Cite({ r }: { r?: Rule | null }) {
  if (!r?.cite) return null
  return r.source ? <a className="lf-c" href={r.source} target="_blank" rel="nofollow noopener">{r.cite}</a> : <span className="lf-c">{r.cite}</span>
}

function StatePicker({ tool, current, states }: { tool: string; current: string; states: Props['states'] }) {
  const router = useRouter()
  return (
    <div className="field tool-state">
      <label htmlFor="tool-state">State</label>
      <select id="tool-state" value={current} onChange={(e) => router.push(`/calculators/${tool}/${e.target.value}`)}>
        {states.map((s) => <option key={s.slug} value={s.slug}>{s.name}</option>)}
      </select>
    </div>
  )
}

function useUsed(tool: string, state: string) {
  const [done, setDone] = useState(false)
  return () => { if (!done) { setDone(true); track('tool_use', `${tool}:${state}`) } }
}

function Deadline({ data, tool, toolName, state, used }: { data: Extract<ToolData, { kind: 'deadline' }>; tool: string; toolName: string; state: string; used: () => void }) {
  const [pick, setPick] = useState(0)
  const [date, setDate] = useState('')
  const [rent, setRent] = useState('')
  const [today, setToday] = useState<Date | null>(null)
  useEffect(() => setToday(todayUtc()), [])
  const rules = data.mode === 'pick' ? [data.rules[pick]] : data.rules
  const start = parse(date)
  const startLabel = rules[0].start
  const results = rules.map((r) => ({ r, due: start && r.dur ? addDur(start, r.dur) : null }))
  const rentN = Number(rent.replace(/[$,]/g, ''))

  return (
    <>
      <div className="tool-form">
        {data.mode === 'pick' && (
          <div className="field">
            <label htmlFor="tool-claim">Type of claim</label>
            <select id="tool-claim" value={pick} onChange={(e) => { setPick(Number(e.target.value)); used() }}>
              {data.rules.map((r, i) => <option key={r.key} value={i}>{r.label}</option>)}
            </select>
          </div>
        )}
        <div className="field">
          <label htmlFor="tool-date">{startLabel}</label>
          <input id="tool-date" type="date" value={date} max="2100-12-31" onChange={(e) => { setDate(e.target.value); used() }} />
        </div>
        {data.capMonths ? (
          <div className="field">
            <label htmlFor="tool-rent">Monthly rent (optional)</label>
            <input id="tool-rent" inputMode="decimal" placeholder="$1,500" value={rent} onChange={(e) => setRent(e.target.value)} />
          </div>
        ) : null}
      </div>
      {rules[0].hint && <p className="tool-hint">{rules[0].hint}</p>}

      <div className="tool-results" aria-live="polite">
        {results.map(({ r, due }) => {
          const left = due && today ? Math.round((due.getTime() - today.getTime()) / DAY) : null
          return (
            <div key={r.key} className={`tool-result${left !== null && left < 0 ? ' past' : left !== null && left <= 60 ? ' soon' : ''}`}>
              <div className="tool-result-k">{r.label} · {state}</div>
              <div className="tool-rule"><b>{r.value}</b> <Cite r={r} /></div>
              {r.detail && <p className="tool-detail">{r.detail}</p>}
              {r.dur ? (
                due ? (
                  <>
                    <div className="tool-big">{nice(due)}</div>
                    {left !== null && (
                      <div className="tool-left">
                        {left < 0 ? `This date passed ${-left} day${left === -1 ? '' : 's'} ago. Talk to a lawyer now: an exception may still apply.` : left === 0 ? 'That is today.' : `${left.toLocaleString()} day${left === 1 ? '' : 's'} from today`}
                      </div>
                    )}
                    {left !== null && left >= 0 && (
                      <button type="button" className="btn btn-outline btn-sm" onClick={() => icsFile(`${r.label} deadline (${state})`, due, `${r.value}${r.cite ? ` — ${r.cite}` : ''}. Estimated by LawMatchNow from ${date}. Confirm with a lawyer.`)}>
                        Add to my calendar
                      </button>
                    )}
                  </>
                ) : <div className="tool-wait">Enter a date to count the deadline.</div>
              ) : (
                <div className="tool-wait">This rule depends on the details of your case, so we can’t count it automatically. Read the rule above, or ask a lawyer to calculate it.</div>
              )}
            </div>
          )
        })}
        {data.cap && (
          <div className="tool-result">
            <div className="tool-result-k">{data.cap.label} · {state}</div>
            <div className="tool-rule"><b>{data.cap.value}</b> <Cite r={data.cap} /></div>
            {data.capMonths && rentN > 0 ? <div className="tool-big">Up to {usd(rentN * data.capMonths)}</div> : null}
          </div>
        )}
      </div>
      <p className="tool-fine">Deadlines are counted in calendar days unless the rule says business days (weekends skipped, holidays not). Court rules can move a deadline that falls on a weekend or holiday, and exceptions can shorten or extend it. Treat this as an estimate and file early. {toolName} for {state}.</p>
    </>
  )
}

const FAULT_RULE: Record<FaultRule, string> = {
  pure: 'Pure comparative fault',
  bar51: 'Modified comparative fault (51% bar)',
  bar50: 'Modified comparative fault (50% bar)',
  contributory: 'Contributory negligence',
  slight: 'Slight/gross negligence',
}

function Fault({ data, state, used }: { data: Extract<ToolData, { kind: 'fault' }>; state: string; used: () => void }) {
  const [damages, setDamages] = useState('100000')
  const [fault, setFault] = useState(20)
  const d = Number(damages.replace(/[$,]/g, '')) || 0
  const got = useMemo(() => {
    const r = data.rule
    if (fault <= 0) return d
    if (r === 'slight') return null
    if (r === 'contributory') return 0
    if ((r === 'bar51' && fault >= 51) || (r === 'bar50' && fault >= 50) || fault >= 100) return 0
    return d * (1 - fault / 100)
  }, [d, fault, data.rule])
  const barred = got === 0 && d > 0
  return (
    <>
      <div className="tool-form">
        <div className="field">
          <label htmlFor="tool-damages">Total damages</label>
          <input id="tool-damages" inputMode="decimal" value={damages} onChange={(e) => { setDamages(e.target.value); used() }} />
        </div>
        <div className="field">
          <label htmlFor="tool-fault">Your share of the fault: <b>{fault}%</b></label>
          <input id="tool-fault" type="range" min={0} max={100} step={1} value={fault} onChange={(e) => { setFault(Number(e.target.value)); used() }} />
        </div>
      </div>
      <div className="tool-results" aria-live="polite">
        <div className={`tool-result${barred ? ' past' : ''}`}>
          <div className="tool-result-k">What you could recover in {state}</div>
          <div className="tool-big">{got === null ? 'Depends on the comparison' : usd(got)}</div>
          <div className="tool-left">
            {got === null
              ? `${state} lets you recover only if your fault was “slight” compared with the other side’s. A jury decides that; there is no fixed percentage.`
              : barred
                ? fault > 0 && data.rule === 'contributory'
                  ? `Under ${state}’s contributory negligence rule, any fault on your part can bar recovery.`
                  : `At ${fault}% fault you are over ${state}’s bar, so you would recover nothing.`
                : fault > 0 ? `Your ${usd(d)} reduced by your ${fault}% share.` : 'With no fault on your side, you can claim your full damages.'}
          </div>
          <div className="tool-rule"><b>{FAULT_RULE[data.rule]}</b> <Cite r={data.fact} /></div>
          {data.fact.detail && <p className="tool-detail">{data.fact.detail}</p>}
        </div>
        <FaultBar rule={data.rule} fault={fault} />
        {data.joint && (
          <div className="tool-result">
            <div className="tool-result-k">If more than one party is at fault</div>
            <div className="tool-rule"><b>{data.joint.value}</b> <Cite r={data.joint} /></div>
            {data.joint.detail && <p className="tool-detail">{data.joint.detail}</p>}
          </div>
        )}
      </div>
      <p className="tool-fine">Before insurance policy limits, medical liens and attorney’s fees. Exceptions exist (for example, the last-clear-chance doctrine in some contributory negligence states). This is an illustration, not a prediction of your case.</p>
    </>
  )
}

/** A 0–100% strip showing where recovery stops under the state's rule. */
function FaultBar({ rule, fault }: { rule: FaultRule; fault: number }) {
  const stop = rule === 'bar51' ? 51 : rule === 'bar50' ? 50 : rule === 'contributory' ? 0.5 : rule === 'pure' ? 100 : null
  return (
    <div className="fault-bar" aria-hidden="true">
      <div className="fault-track">
        {stop !== null && <div className="fault-ok" style={{ width: `${stop}%` }} />}
        <div className="fault-me" style={{ left: `${fault}%` }} />
      </div>
      <div className="fault-scale"><span>0% your fault</span>{stop !== null && stop > 0.5 && stop < 100 && <span style={{ left: `${stop}%` }}>{stop}%</span>}<span>100%</span></div>
    </div>
  )
}

function SmallClaims({ data, state, used }: { data: Extract<ToolData, { kind: 'smallclaims' }>; state: string; used: () => void }) {
  const [amount, setAmount] = useState('')
  const a = Number(amount.replace(/[$,]/g, ''))
  const fits = data.limit !== null && a > 0 ? a <= data.limit : null
  return (
    <>
      <div className="tool-form">
        <div className="field">
          <label htmlFor="tool-amount">How much are you owed?</label>
          <input id="tool-amount" inputMode="decimal" placeholder="$3,500" value={amount} onChange={(e) => { setAmount(e.target.value); used() }} />
        </div>
      </div>
      <div className="tool-results" aria-live="polite">
        <div className={`tool-result${fits === false ? ' soon' : ''}`}>
          <div className="tool-result-k">Small claims in {state}</div>
          {fits === null ? <div className="tool-wait">Enter an amount to check it against the limit.</div> : (
            <>
              <div className="tool-big">{fits ? 'Yes, it fits' : 'Over the limit'}</div>
              <div className="tool-left">
                {fits
                  ? `${usd(a)} is within ${state}’s ${usd(data.limit!)} small claims limit.`
                  : `${usd(a)} is ${usd(a - data.limit!)} over the limit. You could give up the extra ${usd(a - data.limit!)} to stay in small claims, or file in regular civil court, where a lawyer is more useful.`}
              </div>
            </>
          )}
          <div className="tool-rule"><b>Limit: {data.fact.value}</b> <Cite r={data.fact} /></div>
          {data.fact.detail && <p className="tool-detail">{data.fact.detail}</p>}
        </div>
        {[data.court, data.lawyers].filter(Boolean).map((r) => (
          <div key={r!.key} className="tool-result">
            <div className="tool-result-k">{r!.label}</div>
            <div className="tool-rule"><b>{r!.value}</b> <Cite r={r} /></div>
            {r!.detail && <p className="tool-detail">{r!.detail}</p>}
          </div>
        ))}
      </div>
    </>
  )
}

function Wage({ data, state, used }: { data: Extract<ToolData, { kind: 'wage' }>; state: string; used: () => void }) {
  const [hours, setHours] = useState('40')
  const [pay, setPay] = useState('')
  const h = Number(hours) || 0
  const p = Number(pay.replace(/[$,]/g, '')) || 0
  const floor = data.min !== null ? data.min * Math.min(h, 40) + data.min * 1.5 * Math.max(h - 40, 0) : null
  const short = floor !== null && p > 0 ? Math.round((floor - p) * 100) / 100 : null
  return (
    <>
      <div className="tool-form">
        <div className="field">
          <label htmlFor="tool-hours">Hours worked this week</label>
          <input id="tool-hours" inputMode="decimal" value={hours} onChange={(e) => { setHours(e.target.value); used() }} />
        </div>
        <div className="field">
          <label htmlFor="tool-pay">Total pay for the week, before taxes{data.tippedFact ? ' (with tips)' : ''}</label>
          <input id="tool-pay" inputMode="decimal" placeholder="$600" value={pay} onChange={(e) => { setPay(e.target.value); used() }} />
        </div>
      </div>
      <div className="tool-results" aria-live="polite">
        <div className={`tool-result${short !== null && short > 0 ? ' past' : ''}`}>
          <div className="tool-result-k">Your paycheck vs. {state} law</div>
          {floor === null ? (
            <div className="tool-wait">{state}’s minimum wage depends on where you work, so check the rule below.</div>
          ) : short === null || h <= 0 ? (
            <div className="tool-wait">Enter your hours and pay. The least you could be paid for {h || 0} hours is {usd(floor)}.</div>
          ) : (
            <>
              <div className="tool-big">{short > 0 ? `Possibly ${usd(short)} short` : 'At or above the minimum'}</div>
              <div className="tool-left">
                Effective rate {usd(p / h)}/hour. The least you could be paid for {h} hours is {usd(floor)}
                {h > 40 ? ` (40 hours at ${usd(data.min!)} plus ${h - 40} overtime hours at ${usd(data.min! * 1.5)})` : ''}.
              </div>
            </>
          )}
          <div className="tool-rule"><b>Minimum wage: {data.fact.value}</b> <Cite r={data.fact} /></div>
          {data.fact.detail && <p className="tool-detail">{data.fact.detail}</p>}
        </div>
        {data.tippedFact && (
          <div className="tool-result">
            <div className="tool-result-k">Tipped workers</div>
            <div className="tool-rule"><b>{data.tippedFact.value}</b> <Cite r={data.tippedFact} /></div>
            <p className="tool-detail">{data.tipCredit ? 'Your employer may pay this lower cash wage only if your tips bring you up to the full minimum wage every week.' : `${state} does not allow a tip credit: tipped workers get the full minimum wage before tips.`}</p>
          </div>
        )}
      </div>
      <p className="tool-fine">Uses the state minimum wage and federal overtime (time and a half over 40 hours a week). Local minimum wages, daily overtime and exemptions are not included.</p>
    </>
  )
}

export function Calculator({ tool, toolName, state, stateSlug, data, states }: Props) {
  const used = useUsed(tool, stateSlug)
  return (
    <div className="tool-card">
      <StatePicker tool={tool} current={stateSlug} states={states} />
      {data.kind === 'deadline' && <Deadline data={data} tool={tool} toolName={toolName} state={state} used={used} />}
      {data.kind === 'fault' && <Fault data={data} state={state} used={used} />}
      {data.kind === 'smallclaims' && <SmallClaims data={data} state={state} used={used} />}
      {data.kind === 'wage' && <Wage data={data} state={state} used={used} />}
    </div>
  )
}

/** Hub-page picker: choose a state, go to its calculator. */
export function ToolStateJump({ tool, states }: { tool: string; states: { slug: string; name: string }[] }) {
  const router = useRouter()
  return (
    <div className="field tool-state tool-jump">
      <label htmlFor="tool-jump">Choose your state</label>
      <select id="tool-jump" defaultValue="" onChange={(e) => e.target.value && router.push(`/calculators/${tool}/${e.target.value}`)}>
        <option value="" disabled>Select a state…</option>
        {states.map((s) => <option key={s.slug} value={s.slug}>{s.name}</option>)}
      </select>
    </div>
  )
}
