// Decides what an import will do: which bar members become new profiles,
// which existing imported profiles change, and which are left alone.
// Pure (no network), so a dry run and the real run produce the same plan.

import { escapeHtml, slugify } from './normalize.mjs'

export const barKey = (state, barNumber) => `${state}-${String(barNumber).replace(/^0+/, '')}`

const monthYear = (d) => d.toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' })

/** The fields a member contributes to an `attorneys` record. */
export function recordFor(m, ctx) {
  const certNames = m.certifications.map((c) => ctx.certifications[c][0])
  const practiceIds = [...new Set(m.certifications.flatMap((c) => ctx.certifications[c][1]))]
    .map((slug) => ctx.practiceIds.get(slug))
    .filter(Boolean)
    .sort()
  const where = `${m.city}, ${ctx.state.name}`
  const bio = [
    `<p>${escapeHtml(m.name)} is licensed to practice law in ${ctx.state.name} (${ctx.state.name} Bar No. ${m.barNumber})` +
      `${m.firm ? ` and practices with ${escapeHtml(m.firm)}` : ''}, with an office in ${escapeHtml(where)}.</p>`,
    certNames.length ? `<p>Board certified by ${ctx.state.bar} in ${escapeHtml(certNames.join(', '))}.</p>` : '',
    `<p>This profile was compiled from ${ctx.state.bar}'s public membership records (${monthYear(ctx.asOf)}). It has not been reviewed by the attorney.</p>`,
  ].join('')
  const rec = {
    name: m.name,
    firm_name: m.firm,
    address: m.address,
    city: m.city,
    state_code: m.stateCode,
    zip_code: m.zip,
    phone: m.phone,
    bar_number: barKey(ctx.state.code, m.barNumber),
    bar_admissions:
      `${ctx.state.name} (Bar No. ${m.barNumber}${m.admittedYear ? `, admitted ${m.admittedYear}` : ''})` +
      (certNames.length ? `; Board Certified: ${certNames.join(', ')}` : ''),
    years_experience: m.yearsExperience ?? 0,
    practice_areas: practiceIds,
    bio,
  }
  if (ctx.withEmail) rec.email = m.email
  if (ctx.fields.has('source')) rec.source = `${ctx.state.bar} membership records`
  if (ctx.fields.has('source_date')) rec.source_date = ctx.asOf.toISOString().slice(0, 10) + ' 00:00:00.000Z'
  return rec
}

const same = (a, b) => (Array.isArray(a) || Array.isArray(b) ? JSON.stringify([...(a ?? [])].sort()) === JSON.stringify([...(b ?? [])].sort()) : String(a ?? '') === String(b ?? ''))

/**
 * members: from the adapter; existing: Map barKey -> record (id, slug,
 * is_claimed + current fields); slugs: Set of every slug in use.
 */
export function buildPlan(members, existing, slugs, ctx) {
  const creates = [], updates = [], claimed = [], unchanged = [], duplicates = []
  const seen = new Set()
  const taken = new Set(slugs)
  for (const m of members) {
    const key = barKey(ctx.state.code, m.barNumber)
    if (seen.has(key)) { duplicates.push(m); continue }
    seen.add(key)
    const rec = recordFor(m, ctx)
    const cur = existing.get(key)
    if (!cur) {
      // name-city, as existing profiles do; the bar number settles collisions.
      const base = slugify(`${m.name} ${m.city}`)
      let slug = base
      if (taken.has(slug)) slug = `${base}-${m.barNumber}`
      for (let i = 2; taken.has(slug); i++) slug = `${base}-${m.barNumber}-${i}`
      taken.add(slug)
      creates.push({ ...rec, slug, is_claimed: false, featured: false, tier: 'free', tier_priority: 1, ...(ctx.fields.has('rating') ? { rating: 0, reviews_count: 0 } : {}) })
    } else if (cur.is_claimed) {
      // The attorney maintains a claimed profile; imports never overwrite it.
      claimed.push({ id: cur.id, slug: cur.slug, key })
    } else {
      const changed = Object.fromEntries(Object.entries(rec).filter(([k, v]) => k !== 'source_date' && !same(cur[k], v)))
      if (Object.keys(changed).length) {
        if ('source_date' in rec) changed.source_date = rec.source_date
        updates.push({ id: cur.id, slug: cur.slug, data: changed })
      } else unchanged.push(key)
    }
  }
  // Profiles from an earlier import of this state that aren't in this file
  // (resigned, retired, moved away, deceased...). Reported, not deleted.
  const missing = [...existing.entries()]
    .filter(([key, r]) => key.startsWith(`${ctx.state.code}-`) && !seen.has(key) && !r.is_claimed)
    .map(([key, r]) => ({ key, id: r.id, slug: r.slug, name: r.name, city: r.city }))
  return { creates, updates, claimed, unchanged, duplicates, missing }
}
