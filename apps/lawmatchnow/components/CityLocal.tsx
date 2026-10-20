import type { CityLocal } from '@/lib/law/cities'
import { unsplash, unsplashSet } from '@/lib/law/cities'

const Ext = ({ href, children }: { href?: string | null; children: React.ReactNode }) =>
  href ? <a href={href} rel="nofollow noopener" target="_blank">{children}</a> : <>{children}</>

/** The courts, referral service and legal aid for a city, as cards. */
export function LocalCards({ loc, city }: { loc: CityLocal; city: string }) {
  const cards: { k: string; title: string; body: React.ReactNode }[] = []
  if (loc.stateCourt) cards.push({ k: 'state', title: 'State trial court', body: <><b><Ext href={loc.stateCourt.url}>{loc.stateCourt.name}</Ext></b>{loc.stateCourt.courthouse && <span>{loc.stateCourt.courthouse}</span>}{loc.stateCourt.address && <span className="muted">{loc.stateCourt.address}</span>}</> })
  if (loc.smallClaims) cards.push({ k: 'small', title: 'Small claims', body: <><b><Ext href={loc.smallClaims.url}>{loc.smallClaims.court}</Ext></b>{loc.smallClaims.address && <span className="muted">{loc.smallClaims.address}</span>}</> })
  if (loc.federalCourt) cards.push({ k: 'fed', title: 'Federal court', body: <><b><Ext href={loc.federalCourt.url}>{loc.federalCourt.name}</Ext></b>{loc.federalCourt.courthouse && <span>{loc.federalCourt.courthouse}</span>}{loc.federalCourt.address && <span className="muted">{loc.federalCourt.address}</span>}</> })
  if (loc.immigrationCourt) cards.push({ k: 'imm', title: 'Immigration court', body: <><b><Ext href={loc.immigrationCourt.url}>{loc.immigrationCourt.name}</Ext></b>{loc.immigrationCourt.address && <span className="muted">{loc.immigrationCourt.address}</span>}</> })
  if (loc.bar) cards.push({ k: 'bar', title: 'Local bar & referrals', body: <><b><Ext href={loc.bar.url}>{loc.bar.name}</Ext></b>{loc.bar.referral && <span><Ext href={loc.bar.referral.url}>{loc.bar.referral.name}</Ext>{loc.bar.referral.phone ? ` · ${loc.bar.referral.phone}` : ''}</span>}</> })
  if (loc.legalAid.length) cards.push({ k: 'aid', title: `Free legal help in ${city}`, body: <>{loc.legalAid.map((a) => <span key={a.name}><b><Ext href={a.url}>{a.name}</Ext></b>{a.serves ? <span className="muted"> · {a.serves}</span> : null}</span>)}</> })
  if (!cards.length) return null
  return (
    <div className="local-cards">
      {cards.map((c) => (
        <div key={c.k} className="local-card">
          <div className="kicker">{c.title}</div>
          <div className="local-body">{c.body}</div>
        </div>
      ))}
    </div>
  )
}

/** The city's photo with its Unsplash credit. */
export function CityPhoto({ loc, priority = false }: { loc: CityLocal; priority?: boolean }) {
  if (!loc.photo) return null
  const p = loc.photo
  return (
    <figure className="city-photo">
      <img src={unsplash(p.id, 1200)} srcSet={unsplashSet(p.id)} sizes="(min-width: 1000px) 40vw, 100vw" alt={p.alt}
        loading={priority ? 'eager' : 'lazy'} fetchPriority={priority ? 'high' : 'auto'} decoding="async" />
      {p.photographer && <figcaption>Photo: {p.pageUrl ? <a href={p.pageUrl} rel="nofollow noopener" target="_blank">{p.photographer}</a> : p.photographer} / Unsplash</figcaption>}
    </figure>
  )
}

/** Courthouses as schema.org entities. */
export function courtsLd(loc: CityLocal) {
  return [loc.stateCourt, loc.federalCourt, loc.immigrationCourt]
    .filter((c): c is NonNullable<typeof c> => !!c && !!c.address)
    .map((c) => ({ '@type': 'Courthouse', name: c.courthouse || c.name, address: c.address, ...(c.url ? { url: c.url } : {}) }))
}
