import type { Metadata } from 'next'
import Image from 'next/image'
import { MarketingShell } from '@/components/MarketingShell'
import { photosFor } from '@/lib/photos'
import { SHOWCASE, SHOWCASE_INFO } from '@/lib/showcase'
import { BUSINESS_TYPES } from '@/lib/starter'
import '../home.css'

export const metadata: Metadata = {
  title: 'Website templates for local businesses',
  description: 'Real, working example sites for plumbers, electricians, salons, dentists, restaurants, bakeries and more. Pick one, tell Sofie about your business, and it’s yours.',
  alternates: { canonical: '/templates' },
}

const GROUPS = [
  { design: 'bold', title: 'Bold & Local', note: 'A full photo header, a phone number you can’t miss and strong type. Built for trades that get calls.' },
  { design: 'editorial', title: 'Calm & Refined', note: 'Serif headings, generous space and a split photo. For practices and studios people book with care.' },
  { design: 'warm', title: 'Warm & Handmade', note: 'Cream backgrounds, rounded photos and soft buttons. For food, drink and shops with a story.' },
] as const

const TEMPLATE_KEY = { bold: 'bold', editorial: 'editorial', warm: 'warm' } as const

export default function TemplatesPage() {
  const entries = Object.keys(SHOWCASE_INFO).map((sub) => ({ sub, ...SHOWCASE_INFO[sub], site: SHOWCASE[sub].site }))
  return (
    <MarketingShell>
      <section className="page-hero">
        <div className="wrap">
          <p className="kicker">Templates</p>
          <h1>Real sites, not mockups. Click any one.</h1>
          <p>Every example below is a working website built by the same code that builds yours: live pages, a contact form, SEO-optimized titles and a 95+ speed score. Pick a style and Sofie fills it in with your business.</p>
        </div>
      </section>
      <section className="gallery">
        <div className="wrap">
          <nav className="gal-filter" aria-label="Styles">
            {GROUPS.map((g) => <a key={g.design} href={`#${g.design}`}>{g.title}</a>)}
          </nav>
          {GROUPS.map((g) => (
            <div key={g.design} className="gal-group" id={g.design}>
              <header>
                <h2>{g.title}</h2>
                <p>{g.note}</p>
              </header>
              <div className="gal-grid">
                {entries
                  .filter((e) => BUSINESS_TYPES[e.type].design === g.design)
                  .map((e) => {
                    const photo = photosFor(e.type).hero
                    return (
                      <a key={e.sub} className="gal-card" href={`/preview/${e.sub}`}>
                        <div className="gal-shot">
                          <Image src={photo.src} alt={photo.alt} fill sizes="(max-width: 760px) 100vw, 400px" style={{ objectFit: 'cover' }} />
                          <span className="gal-plaque"><img src={`/media/logos/${e.sub}.svg`} alt="" /></span>
                          <div className="gal-over">
                            <small>{e.kind} · {e.place}</small>
                            <strong className={g.design === 'bold' ? '' : 'serif'}>{e.site.business.name}</strong>
                          </div>
                        </div>
                        <div className="gal-meta"><b>See the live site →</b><span>{g.title}</span></div>
                      </a>
                    )
                  })}
              </div>
              <p style={{ marginTop: 22 }}><a className="b b-line b-sm" href={`/signup?template=${TEMPLATE_KEY[g.design]}`}>Use {g.title}</a></p>
            </div>
          ))}
          <div className="gal-cta">
            <div>
              <h2>Don’t see your business? It still works.</h2>
              <p>Pick the style you like best. Sofie writes the words for your trade, your town and your services, and you change anything by asking.</p>
            </div>
            <form className="say" action="/signup" method="get">
              <label htmlFor="idea-tpl" className="visually-hidden">What does your business do?</label>
              <input id="idea-tpl" name="idea" placeholder="A dog groomer in Tulsa…" autoComplete="off" maxLength={200} />
              <button className="b b-light" type="submit">Build my site</button>
            </form>
          </div>
        </div>
      </section>
    </MarketingShell>
  )
}
