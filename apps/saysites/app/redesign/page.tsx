import type { Metadata } from 'next'
import { MarketingShell } from '@/components/MarketingShell'
import { RedesignForm } from '@/components/RedesignForm'
import '../home.css'

export const maxDuration = 60

export const metadata: Metadata = {
  title: 'See your website redesigned, free',
  description: 'Paste your current website’s address and see it rebuilt on SaySites in seconds: faster, lighter, with the details Google reads, and every page at the same address.',
  alternates: { canonical: '/redesign' },
}

const FAQ: [string, string][] = [
  ['Is the redesign really free?', 'Yes. Paste your address and you see your site rebuilt, with no account and no card. You only talk to us if you want us to finish it and put it live.'],
  ['Will anything change on my current website?', 'No. We only read the pages anyone can see. Your current site, hosting and domain stay exactly as they are until you decide to point your domain somewhere new.'],
  ['What happens to the pages I already rank for?', 'Every page keeps its address wherever we can, and old links that moved get a redirect, so the search results and links you have built up keep working when you switch.'],
  ['Why does page speed matter so much?', 'People searching on a phone leave pages that are slow to appear, and Google measures how pages load for real visitors. A lighter page with fewer scripts shows your phone number and request form sooner, which is where leads start.'],
  ['What if my current site is built on a website builder or by an agency?', 'It works the same way. We read the public pages, whatever built them, and rebuild your words, photos and structure so you can compare them side by side.'],
]

export default function RedesignPage() {
  const jsonLd = { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: FAQ.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) }
  return (
    <MarketingShell>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
      <section className="page-hero redesign-hero">
        <div className="wrap">
          <p className="kicker">Free redesign preview</p>
          <h1>Paying too much for your website? See it rebuilt, free.</h1>
          <p>Paste your current website’s address. In about twenty seconds you’ll see your own site on SaySites, looking the way it does now, with every page, word and photo kept. Then see a fresh redesign of the same content, and a side-by-side of what changes: how heavy it is, what Google can read, and whether it passes a 95+ speed check.</p>
          <div className="redesign-form"><RedesignForm /></div>
          <p className="fine">No account needed. We only read public pages, and nothing changes on your current site.</p>
        </div>
      </section>
      <section className="ind-sec ind-alt">
        <div className="wrap">
          <ol className="ind-pages">
            <li><div><h3>We read your site</h3><p>Your pages, headings and words, and the business details you already publish: name, phone, address and colours.</p></div></li>
            <li><div><h3>We rebuild it, twice</h3><p>Your site as it is: the same sections, photos, colours and menu. And a fresh redesign of the same content. Every page keeps its address and the details Google looks for.</p></div></li>
            <li><div><h3>You compare</h3><p>A before and after of page weight, scripts, missing image descriptions and speed. Pick the version you like and claim it free.</p></div></li>
          </ol>
        </div>
      </section>
      <section className="ind-sec">
        <div className="wrap ind-two">
          <div>
            <p className="kicker">What the comparison shows</p>
            <h2>The things that decide whether a visit becomes a call.</h2>
          </div>
          <div className="ind-guide-body">
            <p>Most websites are judged by how they look on a large screen. The people who become clients judge them on a phone, often in a hurry, and usually after comparing two or three businesses from the same search. The comparison measures what they actually experience: how heavy your home page is, how many scripts it loads before anything appears, and whether your photos describe themselves to people using screen readers and to search engines.</p>
            <p>It also checks what Google can read about your business. Your name, phone, address and the kind of business you are should be marked up in a way search engines understand, and the questions you answer on the page can be marked up too. When these are missing, Google has to guess, and a guess rarely works in your favour.</p>
            <p>Finally, every rebuilt page has to pass a 95 or better speed check before it could go live. You see your current site and the rebuilt one side by side, page by page, and decide for yourself whether the difference is worth it.</p>
          </div>
        </div>
      </section>
      <section className="faq ind-faq">
        <div className="wrap faq-in">
          <div className="head">
            <p className="kicker">Questions</p>
            <h2>About the free redesign.</h2>
          </div>
          <div className="qa">
            {FAQ.map(([q, a]) => <details key={q}><summary>{q}</summary><p>{a}</p></details>)}
          </div>
        </div>
      </section>
    </MarketingShell>
  )
}
