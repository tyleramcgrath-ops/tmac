import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { MarketingShell } from '@/components/MarketingShell'
import { after } from 'next/server'
import { audit } from '@/lib/audit'
import { offersCopy, offersFresh, rebuildPreview, rebuiltOf, type PreviewVersion } from '@/lib/redesign'
import { renderPage } from '@/lib/render'
import { typeLabel } from '@/lib/detect'
import { getStore } from '@/lib/store'
import '../../home.css'

export const metadata: Metadata = { title: 'Your free redesign', robots: { index: false } }

const VERSION_LABEL: Record<PreviewVersion, [string, string]> = {
  'as-is': ['Your site, as it is', 'Exactly as it looks today'],
  fresh: ['A fresh redesign', 'Same content, a new look'],
  rebuilt: ['Your site, rebuilt', 'Your pages in our design, change anything by asking'],
}

const LOCAL = /LocalBusiness|LegalService|Attorney|Plumber|Electrician|HVACBusiness|RoofingContractor|LandscapingBusiness|HousekeepingService|AutoRepair|Dentist|HairSalon|BeautySalon|Restaurant|Bakery|CafeOrCoffeeShop|Store/

export default async function RedesignReport({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ v?: string }> }) {
  const { id } = await params
  const store = getStore()
  const p = await store.preview(id)
  if (!p) notFound()
  // A preview from our outreach: claiming it starts with a free first month.
  const fromOutreach = !p.claimed && !!(await store.prospectByPreview(id))
  // Previews made before the exact copy existed are rebuilt in place (same
  // address, same links); meanwhile they show nothing of the old versions.
  const legacy = p.asIs === undefined && !p.claimed
  if (legacy) after(() => rebuildPreview(id, p.url).catch((e) => console.error('[redesign] rebuild failed', e)))
  // Up to three versions, each shown only when it's right: their site
  // exactly as it is (once a browser check has confirmed it matches their
  // site), a hand-made redesign, and their pages rebuilt in SaySites' own
  // design. The last two need enough of their own substance to be better
  // than their site. The owner always gets a choice when there is one.
  const asIs = !legacy && offersCopy(p)
  const freshOk = !legacy && offersFresh(p)
  const versions: PreviewVersion[] = [...(asIs ? ['as-is' as const] : []), ...(freshOk ? ['fresh' as const, 'rebuilt' as const] : [])]
  const asked = (await searchParams).v
  const view: PreviewVersion | undefined = versions.find((v) => v === asked) ?? versions[0]
  const fresh = view === 'fresh'
  const showing = !!view
  const src = `/redesign/${id}/${view === 'fresh' ? 'fresh' : view === 'rebuilt' ? 'rebuilt' : 'site'}`
  const claim = `/redesign/${id}/claim${view && view !== 'as-is' ? `?v=${view}` : ''}`
  const { before: b, detected: d } = p
  const kept = view === 'as-is' ? p.pages.find((pg) => pg.slug === '')?.classic : undefined
  const copy = kept ? audit(kept.html) : undefined
  // The rebuilt version is measured from its own home page.
  const rebuilt = view === 'rebuilt' ? rebuiltOf(p) : undefined
  const rebuiltHome = rebuilt?.pages.find((pg) => pg.slug === '')
  const a = rebuilt && rebuiltHome ? { ...p.after, ...audit(renderPage(rebuilt.site, rebuiltHome, rebuilt.pages).html) } : p.after
  const host = p.url.replace(/^https?:\/\//, '')
  const shownPages = view !== 'as-is' && p.fresh ? p.fresh.pages : p.pages
  const shownRedirects = view !== 'as-is' && p.fresh ? p.fresh.redirects : p.redirects
  const imported = shownPages.filter((pg) => pg.source).length
  const same = shownPages.filter((pg) => pg.source && new URL(pg.source).pathname.replace(/\/+$/, '') === `/${pg.slug}`).length
  // Their site as it is keeps their own design and code, minus the scripts
  // and separate stylesheet files; only those are claimed for it.
  const rows: [string, string, string, boolean][] = copy ? [
    ['Scripts loaded', String(b.scripts), String(copy.scripts), copy.scripts < b.scripts],
    ['Stylesheet files loaded', String(b.stylesheets), 'Built in', b.stylesheets > 0],
    ['Images missing a description', `${b.imagesNoAlt} of ${b.images}`, `${copy.imagesNoAlt} of ${copy.images}`, copy.imagesNoAlt < b.imagesNoAlt],
  ] : [
    ['Home page weight', `${b.kb} KB`, `${a.kb} KB`, a.kb < b.kb],
    ['Scripts loaded', String(b.scripts), String(a.scripts), a.scripts < b.scripts],
    ['Stylesheets loaded', String(b.stylesheets), 'Built in', b.stylesheets > 0],
    ['Images missing a description', `${b.imagesNoAlt} of ${b.images}`, `${a.imagesNoAlt} of ${a.images}`, a.imagesNoAlt < b.imagesNoAlt],
    ['Business details Google reads', b.schema.some((t) => LOCAL.test(t)) ? 'Yes' : 'Not found', 'Yes, as a ' + (p.site.business.schemaType === 'LocalBusiness' ? 'local business' : p.site.business.schemaType.replace(/([a-z])([A-Z])/g, '$1 $2')), !b.schema.some((t) => LOCAL.test(t))],
    ['Questions marked up for Google', b.schema.includes('FAQPage') ? 'Yes' : 'No', a.schema.includes('FAQPage') ? 'Yes' : 'No', !b.schema.includes('FAQPage') && a.schema.includes('FAQPage')],
    ['95+ speed check before going live', 'Not required', a.speedPass ? 'Passes, on every page' : 'Checked', true],
  ]
  const facts = [
    ['Business', d.name],
    ['Kind', typeLabel(d.type)],
    ['Phone', d.phone],
    ['Address', [d.street, d.city, d.region, d.postalCode].filter(Boolean).join(', ')],
  ].filter((f): f is [string, string] => !!f[1])

  return (
    <MarketingShell>
      <section className="page-hero redesign-hero">
        <div className="wrap">
          <p className="kicker">Your free redesign, {host}</p>
          <h1>Here’s {d.name} on SaySites.</h1>
          {showing && <p>{fresh ? 'A fresh design, made from your own pages and words' : view === 'rebuilt' ? 'Your site rebuilt on SaySites: your own pages and words in our design, fast and built for phones, and you can change any of it by asking Sofie' : 'Your site exactly as it looks today: the same pages, words, photos and design, without the scripts that slow it down'}: {imported} page{imported === 1 ? '' : 's'} carried over{same ? `, ${same} at exactly the same address` : ''}{shownRedirects.length ? `, and ${shownRedirects.length} redirect${shownRedirects.length === 1 ? '' : 's'} so old links keep working` : ''}.</p>}
          {legacy ? (
            <p className="rd-note">We’ve improved free previews since this one was made, and it’s being rebuilt now. Refresh in a minute to see the new version.</p>
          ) : !showing ? (
            <p className="rd-note">We read your site, but we couldn’t find enough of your services on it to redesign it well, and we only show a redesign that’s better than your site. You can build yours from your business details in about two minutes instead.</p>
          ) : !asIs ? (
            <p className="rd-note">{p.asIs === false ? 'Parts of your current site are drawn by scripts, so a copy of it wouldn’t look exactly the same, and we only show exact copies.' : 'An exact copy of your current site appears here once our check confirms it looks the same as your site.'} Pick the version you like below: a fresh redesign, or your site rebuilt on SaySites.</p>
          ) : null}
          <div className="ind-actions">
            {showing ? (
              <>
                <a className="b b-dark" href={claim}>{fromOutreach ? 'Claim it, first month free' : 'Claim this site free'}</a>
                <a className="tplrow-link" href={src} target="_blank" rel="noopener">Open the full preview ↗</a>
                <a className="tplrow-link" href="/#talk">Or have us build it for you</a>
              </>
            ) : !legacy ? (
              <a className="b b-dark" href="/signup">Build it from your details</a>
            ) : null}
          </div>
        </div>
      </section>

      {showing && <section className="ind-sec" style={{ paddingTop: 0 }}>
        <div className="wrap">
          {versions.length > 1 && (
            <nav className="rd-switch" aria-label="Choose a version">
              {versions.map((v) => (
                <a key={v} href={`/redesign/${id}${v === versions[0] ? '' : `?v=${v}`}`} aria-current={v === view ? 'page' : undefined}>
                  <strong>{VERSION_LABEL[v][0]}</strong>
                  <span>{VERSION_LABEL[v][1]}</span>
                </a>
              ))}
            </nav>
          )}
          <div className="frame redesign-frame">
            <div className="frame-bar"><i /><i /><i /><span>{host} on SaySites</span></div>
            <iframe src={src} title={`${d.name} rebuilt on SaySites`} loading="lazy" />
          </div>
        </div>
      </section>}

      {showing && <section className="ind-sec ind-alt">
        <div className="wrap">
          <div className="head split">
            <div>
              <p className="kicker">Before and after</p>
              <h2>What changes on your home page.</h2>
            </div>
            <p>Measured from the page’s code, not a guess. For Google’s own speed test of your current site, run it through <a href={`https://pagespeed.web.dev/analysis?url=${encodeURIComponent(p.url)}`} target="_blank" rel="noopener">PageSpeed Insights</a>.</p>
          </div>
          <div className="cmp-wrap">
            <table className="cmp">
              <thead><tr><th scope="col"><span className="visually-hidden">Measure</span></th><th scope="col">Your site today</th><th scope="col">On SaySites</th></tr></thead>
              <tbody>
                {rows.map(([what, before, after, better]) => (
                  <tr key={what}>
                    <th scope="row">{what}</th>
                    <td>{before}</td>
                    <td className={better ? 'cmp-win' : undefined}>{after}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>}

      <section className="ind-sec">
        <div className="wrap ind-two">
          <div>
            <p className="kicker">What we found</p>
            <h2>Read from your current site.</h2>
            <dl className="redesign-facts">
              {facts.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}
            </dl>
          </div>
          <div className="ind-seo">
            <div><h3>Claim it free</h3><p>It’s saved to your account with every page. Imported pages wait as drafts until you point your domain here, so nothing changes on your current site until you’re ready.</p></div>
            <div><h3>Make it yours by asking</h3><p>Sofie can fix anything we read wrong, add your photos, write new pages and polish the imported ones. You see every change before it goes live.</p></div>
            <div><h3>Want us to finish it?</h3><p>We build it out with you, you approve every page from one private link, and it goes live on your own domain. No setup fee, no long contract, and your words and domain stay yours. <a href="/#talk">Let’s talk</a>.</p></div>
            {showing && <div><a className="b b-dark" href={claim}>Claim this site free</a></div>}
          </div>
        </div>
      </section>
    </MarketingShell>
  )
}
