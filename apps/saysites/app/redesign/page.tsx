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

export default function RedesignPage() {
  return (
    <MarketingShell>
      <section className="page-hero redesign-hero">
        <div className="wrap">
          <p className="kicker">Free redesign preview</p>
          <h1>Paying too much for your website? See it rebuilt, free.</h1>
          <p>Paste your current website’s address. In about ten seconds you’ll see it rebuilt on SaySites, with your own pages and words, and a side-by-side of what changes: how heavy it is, what Google can read, and whether it passes a 95+ speed check.</p>
          <div className="redesign-form"><RedesignForm dark /></div>
          <p className="fine">No account needed. We only read public pages, and nothing changes on your current site.</p>
        </div>
      </section>
      <section className="ind-sec ind-alt">
        <div className="wrap">
          <ol className="ind-pages">
            <li><span>01</span><div><h3>We read your site</h3><p>Your pages, headings and words, and the business details you already publish: name, phone, address and colours.</p></div></li>
            <li><span>02</span><div><h3>We rebuild it</h3><p>A clean SaySites design with your content, every page kept at the same address, and the details Google looks for.</p></div></li>
            <li><span>03</span><div><h3>You compare</h3><p>A before and after of page weight, scripts, missing image descriptions and speed. Like it? Claim it free and make it yours.</p></div></li>
          </ol>
        </div>
      </section>
    </MarketingShell>
  )
}
