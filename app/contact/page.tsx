import type { Metadata } from 'next'
import { SimpleLeadForm } from '@/components/LeadForm'
import { PageHero } from '@/components/ui'
import { SITE } from '@/lib/site'

export const metadata: Metadata = { title: 'Contact Us', description: `Get in touch with the ${SITE.name} team.`, alternates: { canonical: '/contact' } }

export default function Contact() {
  return (
    <>
      <PageHero crumbs={[{ name: 'Contact', path: '/contact' }]} eyebrow="Contact" title="Get in touch"
        lede="Questions about the site, a listing, or a correction? Write to us. We can’t give legal advice; for help with a legal problem, request a free case review." />
      <section className="section">
        <div className="wrap layout">
          <div className="card"><SimpleLeadForm kind="general" submitLabel="Send message" /></div>
          <aside className="card"><h3>Email</h3><p><a href={`mailto:${SITE.email}`}>{SITE.email}</a></p></aside>
        </div>
      </section>
    </>
  )
}
