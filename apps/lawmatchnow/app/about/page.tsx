import type { Metadata } from 'next'
import Link from 'next/link'
import { CtaBand, PageHero } from '@/components/ui'
import { SITE } from '@/lib/site'

export const metadata: Metadata = {
  title: 'About LawMatchNow',
  description: 'Why we built LawMatchNow, how the directory works, how we make money, and how we write and review our legal guides.',
  alternates: { canonical: '/about' },
}

export default function About() {
  return (
    <>
      <PageHero crumbs={[{ name: 'About', path: '/about' }]} eyebrow="About us" title="Finding a lawyer shouldn’t be the hard part."
        lede="LawMatchNow is a free directory and legal library for people across the United States." />
      <section className="section">
        <div className="wrap prose">
          <h2 className="mt-0">What we do</h2>
          <p>Most people look for a lawyer only a few times in their lives, usually under stress. We help you name your legal issue, understand your options in plain English, and find attorneys near you who handle that kind of case.</p>
          <h2>How the directory works</h2>
          <p>Listings come from public sources and from attorneys who claim their profiles. We hide listings we can&apos;t show accurate details for, and we mark claimed profiles once an attorney&apos;s bar license has been checked. We don&apos;t publish star ratings until reviews are collected and verified on the site.</p>
          <h2>How we make money</h2>
          <p>Using {SITE.name} is free for you. Attorneys can pay for featured placement, which is always labeled &ldquo;Featured&rdquo;. Featured status never changes what our guides say. We do not take a share of any legal fee.</p>
          <h2>How we write our guides</h2>
          <p>Our guides explain how the law generally works in the U.S., say where rules vary by state, and avoid statistics we can&apos;t source. Each shows the date it was last reviewed. If you spot an error, <Link href="/contact">tell us</Link> and we&apos;ll fix it.</p>
          <h2>What we are not</h2>
          <p>{SITE.name} is not a law firm and does not give legal advice. Reading this site or contacting an attorney through it doesn&apos;t create an attorney-client relationship.</p>
        </div>
      </section>
      <CtaBand />
    </>
  )
}
