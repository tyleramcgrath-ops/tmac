'use client'

import { useMemo, useState } from 'react'

type Opt = { value: string; label: string }

const initials = (s: string) => s.replace(/[^A-Za-z ]/g, '').split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || '§'

/**
 * Lets an attorney type their details and watch their listing, its city page
 * and a search-result snippet build live. Purely illustrative: nothing is saved.
 */
export function ProfilePreview({ cities, practices, siteHost }: { cities: (Opt & { state: string })[]; practices: (Opt & { title: string })[]; siteHost: string }) {
  const [name, setName] = useState('Jordan Ellis')
  const [firm, setFirm] = useState('Ellis Injury Law')
  const [city, setCity] = useState(cities.find((c) => c.value === 'miami')?.value ?? cities[0].value)
  const [practice, setPractice] = useState(practices[0].value)
  const [years, setYears] = useState(12)
  const [featured, setFeatured] = useState(true)

  const c = cities.find((x) => x.value === city)!
  const p = practices.find((x) => x.value === practice)!
  const path = `/${c.value}/${p.value}`
  const title = useMemo(() => `${c.label} ${p.title} | ${c.state}`, [c, p])

  return (
    <div className="pp">
      <form className="pp-form" onSubmit={(e) => e.preventDefault()} aria-label="Preview your listing">
        <div className="pp-kicker">Try it: type your details</div>
        <label>Your name<input value={name} onChange={(e) => setName(e.target.value.slice(0, 40))} /></label>
        <label>Firm<input value={firm} onChange={(e) => setFirm(e.target.value.slice(0, 50))} /></label>
        <div className="pp-row">
          <label>City
            <select value={city} onChange={(e) => setCity(e.target.value)}>
              {cities.map((o) => <option key={o.value} value={o.value}>{o.label}, {o.state}</option>)}
            </select>
          </label>
          <label>Practice
            <select value={practice} onChange={(e) => setPractice(e.target.value)}>
              {practices.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </label>
        </div>
        <label>Years in practice: <b>{years}</b>
          <input type="range" min={1} max={45} value={years} onChange={(e) => setYears(Number(e.target.value))} />
        </label>
        <label className="pp-toggle">
          <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} />
          <span /> Show as a Featured listing
        </label>
      </form>

      <div className="pp-stage" aria-live="polite">
        <div className="pp-browser">
          <div className="pp-bar"><i /><i /><i /><span>{siteHost}{path}</span></div>
          <div className="pp-page">
            <div className="pp-crumb">{c.label}, {c.state} · {p.label}</div>
            <div className="pp-h">{p.title} in {c.label}</div>
            <article className={`atty${featured ? ' featured' : ''} pp-card`}>
              <div className="avatar" aria-hidden="true">{initials(name)}</div>
              <div>
                <div style={{ display: 'flex', gap: 6, marginBottom: 6, flexWrap: 'wrap' }}>
                  {featured && <span className="badge featured">Featured</span>}
                  <span className="badge verified">✓ Claimed profile</span>
                </div>
                <h3>{name || 'Your name'}</h3>
                {firm && <p className="firm">{firm}</p>}
                <div className="meta"><span>{c.label}, {c.state}</span><span>{years}+ years</span></div>
                <div className="tags"><span className="tag">{p.label}</span></div>
              </div>
              <div className="actions"><span className="btn btn-dark btn-sm">View profile</span></div>
            </article>
            <div className="pp-ghost" /><div className="pp-ghost short" />
          </div>
        </div>
        <div className="pp-serp">
          <div className="pp-kicker dark">How your page can look in Google</div>
          <div className="serp-url">{siteHost} › {c.value} › {p.value}</div>
          <div className="serp-title">{title}</div>
          <div className="serp-desc">Find {p.title.toLowerCase()} in {c.label}. Compare {name || 'local attorneys'}{firm ? ` of ${firm}` : ''} and others, then request a free case review.</div>
        </div>
        <p className="pp-note">Illustration only. Placement depends on your plan and on search engines.</p>
      </div>
    </div>
  )
}
