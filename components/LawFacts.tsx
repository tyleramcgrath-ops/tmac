import Link from 'next/link'
import { type Fact, FIELDS, type FieldKey } from '@/lib/law/facts'

/** Label · value · plain-English detail · citation, for verified facts only. */
export function FactTable({ rows, caption }: { rows: { key: FieldKey; f: Fact; href?: string; label?: string }[]; caption?: string }) {
  if (!rows.length) return null
  return (
    <div className="lawfacts">
      {caption && <div className="lawfacts-cap">{caption}</div>}
      <dl>
        {rows.map(({ key, f, href, label }) => (
          <div key={`${key}${href ?? ''}`} className="lf">
            <dt>{label ?? FIELDS[key].label}</dt>
            <dd>
              <b>{href ? <Link href={href}>{f.value}</Link> : f.value}</b>
              {f.detail && <span className="lf-d">{f.detail}</span>}
              {f.cite && (f.source ? <a className="lf-c" href={f.source} rel="nofollow noopener" target="_blank">{f.cite}</a> : <span className="lf-c">{f.cite}</span>)}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

/** Numbered source list for the bottom of a law page. */
export function Sources({ facts }: { facts: Fact[] }) {
  const seen = new Map<string, Fact>()
  for (const f of facts) if (f.cite && !seen.has(f.cite)) seen.set(f.cite, f)
  if (!seen.size) return null
  return (
    <ol className="sources">
      {[...seen.values()].map((f) => (
        <li key={f.cite}>{f.source ? <a href={f.source} rel="nofollow noopener" target="_blank">{f.cite}</a> : f.cite}</li>
      ))}
    </ol>
  )
}
