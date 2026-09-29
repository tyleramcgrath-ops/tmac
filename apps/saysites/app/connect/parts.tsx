import Image from 'next/image'

// Shared pieces for the /connect pages: step pictures drawn in HTML (sharp at
// any size, a few hundred bytes each) and the FAQ with its structured data.

const U = (id: string) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&q=75&w=900`

export function Pic({ id, alt, sizes }: { id: string; alt: string; sizes: string }) {
  return <Image src={U(id)} alt={alt} fill sizes={sizes} style={{ objectFit: 'cover' }} />
}

export type QA = { q: string; a: string }

export function Faq({ items, title }: { items: QA[]; title: string }) {
  return (
    <section className="faq ind-faq">
      <div className="wrap faq-in">
        <div className="head">
          <p className="kicker">Questions</p>
          <h2>{title}</h2>
        </div>
        <div className="qa">
          {items.map((f) => (
            <details key={f.q}><summary>{f.q}</summary><p>{f.a}</p></details>
          ))}
        </div>
      </div>
    </section>
  )
}

export function JsonLd({ faq, crumbs }: { faq: QA[]; crumbs: [string, string][] }) {
  const data = [
    { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: crumbs.map(([name, path], i) => ({ '@type': 'ListItem', position: i + 1, name, item: `https://saysites.com${path}` })),
    },
  ]
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }} />
}

export function Steps({ steps }: { steps: { title: string; text: string; pic: React.ReactNode }[] }) {
  return (
    <ol className="cx-steps">
      {steps.map((s, i) => (
        <li key={s.title}>
          <div className="cx-pic" aria-hidden="true">{s.pic}</div>
          <span className="cx-n">{String(i + 1).padStart(2, '0')}</span>
          <h3>{s.title}</h3>
          <p>{s.text}</p>
        </li>
      ))}
    </ol>
  )
}

export function More({ here }: { here: string }) {
  const all = [
    ['/connect/google-business-profile', 'Start from your Google Business Profile'],
    ['/connect/booking', 'Add a Book online button'],
    ['/connect', 'Everything you can connect'],
    ['/redesign', 'See your current website redesigned, free'],
  ].filter(([h]) => h !== here)
  return (
    <section className="ind-sec ind-more">
      <div className="wrap">
        <h2>Keep going</h2>
        <ul>{all.map(([h, t]) => <li key={h}><a href={h}>{t}</a></li>)}</ul>
      </div>
    </section>
  )
}
