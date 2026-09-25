import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { MarketingShell } from '@/components/MarketingShell'
import { typeLabel } from '@/lib/detect'
import { getStore } from '@/lib/store'
import '../../home.css'

export const metadata: Metadata = { title: 'Your free redesign', robots: { index: false } }

const LOCAL = /LocalBusiness|LegalService|Attorney|Plumber|Electrician|HVACBusiness|RoofingContractor|LandscapingBusiness|HousekeepingService|AutoRepair|Dentist|HairSalon|BeautySalon|Restaurant|Bakery|CafeOrCoffeeShop|Store/

export default async function RedesignReport({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const p = await getStore().preview(id)
  if (!p) notFound()
  const { before: b, after: a, detected: d } = p
  const host = p.url.replace(/^https?:\/\//, '')
  const imported = p.pages.filter((pg) => pg.source).length
  const kept = p.pages.filter((pg) => pg.source && new URL(pg.source).pathname.replace(/\/+$/, '') === `/${pg.slug}`).length
  const rows: [string, string, string, boolean][] = [
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
          <p className="kicker">Your free redesign · {host}</p>
          <h1>Here’s {d.name} on SaySites.</h1>
          <p>Your own pages and words, rebuilt: {imported} page{imported === 1 ? '' : 's'} carried over{kept ? `, ${kept} at exactly the same address` : ''}{p.redirects.length ? `, and ${p.redirects.length} redirect${p.redirects.length === 1 ? '' : 's'} so old links keep working` : ''}.</p>
          <div className="ind-actions">
            <a className="b b-dark" href={`/redesign/${id}/claim`}>Claim this site free</a>
            <a className="tplrow-link" href={`/redesign/${id}/site`} target="_blank" rel="noopener">Open the full preview ↗</a>
          </div>
        </div>
      </section>

      <section className="ind-sec" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="frame redesign-frame">
            <div className="frame-bar"><i /><i /><i /><span>{host} on SaySites</span></div>
            <iframe src={`/redesign/${id}/site`} title={`${d.name} rebuilt on SaySites`} loading="lazy" />
          </div>
        </div>
      </section>

      <section className="ind-sec ind-alt">
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
      </section>

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
            <div><h3>$15 a month, no transfer fee</h3><p>Free during early access. No setup fee, no contract, and your words and domain stay yours.</p></div>
            <div><a className="b b-dark" href={`/redesign/${id}/claim`}>Claim this site free</a></div>
          </div>
        </div>
      </section>
    </MarketingShell>
  )
}
