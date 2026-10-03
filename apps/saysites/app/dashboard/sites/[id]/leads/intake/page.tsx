import { notFound } from 'next/navigation'
import { LeadsNav } from '@/components/LeadsNav'
import { INTAKE_SETS, suggestIntake } from '@/lib/intake'
import { pagePath, walk } from '@/lib/schema'
import { requireUser } from '@/lib/session'
import { getStore } from '@/lib/store'
import { saveIntake } from '../actions'

const GROUPS = ['Law', 'Medical', 'Med spa', 'Home services'] as const
const KIND: Record<string, string> = { text: 'Short answer', choice: 'Pick one', date: 'Date', yesno: 'Yes or no' }

// Intake questions: a few extra questions on each page's request form, so
// the first call starts informed.
export default async function IntakePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ note?: string }> }) {
  const [{ id }, { note }] = await Promise.all([params, searchParams])
  const user = await requireUser()
  const store = getStore()
  const site = await store.siteForUser(user.id, id)
  if (!site) notFound()
  const pages = (await store.pagesForSite(site.id)).filter((p) => !p.post && [...walk(p.body)].some((el) => el.type === 'form'))

  return (
    <section className="stack leads">
      <div className="sec-head">
        <div>
          <h2>Leads</h2>
          <p className="muted">Ask a few questions on your request forms, so you know what each lead needs before you call.</p>
        </div>
      </div>
      <LeadsNav siteId={site.id} on="intake" />
      {note === 'saved' && <p className="notice good">Saved. Your forms show these questions now.</p>}
      {site.language === 'es' && <p className="notice">Intake questions are in English, so they don’t show on Spanish sites yet.</p>}

      {pages.length === 0 ? (
        <div className="card"><p className="muted">None of your pages has a request form yet. Add one on the Pages tab, then come back here.</p></div>
      ) : (
        <form action={saveIntake.bind(null, site.id)} className="stack">
          <div className="card stack">
            <p className="muted small">Every question is optional for your visitors, so they never stop anyone from sending the form. Answers arrive with the lead.</p>
            {pages.map((p) => {
              const tip = suggestIntake(p.slug, p.name)
              return (
                <label key={p.id} className="field intake-row">
                  <span>
                    <strong>{p.name}</strong> <span className="muted small">{pagePath(p)}</span>
                  </span>
                  <select className="input" name={`p_${p.id}`} defaultValue={site.intake?.[p.id] ?? ''}>
                    <option value="">No extra questions</option>
                    {GROUPS.map((g) => (
                      <optgroup key={g} label={g}>
                        {Object.entries(INTAKE_SETS)
                          .filter(([, s]) => s.group === g)
                          .map(([key, s]) => (
                            <option key={key} value={key}>{s.label}{key === tip ? ' (suggested)' : ''}</option>
                          ))}
                      </optgroup>
                    ))}
                  </select>
                </label>
              )
            })}
            <div><button className="btn">Save</button></div>
          </div>
        </form>
      )}

      <h3>The question sets</h3>
      <div className="intake-sets">
        {Object.entries(INTAKE_SETS).map(([key, s]) => (
          <details key={key} className="card">
            <summary><strong>{s.label}</strong> <span className="muted small">{s.group}</span></summary>
            <ul className="intake-qs">
              {s.questions.map((q) => (
                <li key={q.id}>
                  {q.label} <span className="muted small">{KIND[q.kind]}{q.options ? `: ${q.options.join(', ')}` : ''}</span>
                </li>
              ))}
            </ul>
            {s.note && <p className="muted small">Shown above the questions: “{s.note}”</p>}
            {s.questions.some((q) => q.id === 'other_party') && <p className="muted small">The other party’s name lets you check for a conflict of interest before you call back.</p>}
          </details>
        ))}
      </div>
    </section>
  )
}
