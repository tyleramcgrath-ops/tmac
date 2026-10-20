import type { Metadata } from 'next'
import { CaseEvaluation } from '@/components/LeadForm'
import { PageHero } from '@/components/ui'
import { PRACTICE_AREAS } from '@/lib/content/practice-areas'

export const metadata: Metadata = {
  title: 'Free Case Review: Tell Us What Happened',
  description: 'Answer three short questions and we’ll help you reach attorneys who handle cases like yours. Free, private, and no obligation.',
  alternates: { canonical: '/get-started' },
}

type Props = { searchParams: Promise<{ practice?: string; location?: string }> }

export default async function GetStarted({ searchParams }: Props) {
  const sp = await searchParams
  const top = PRACTICE_AREAS.filter((p) => p.guide).map((p) => ({ value: p.slug, label: p.name }))
  const areas = [...top, { value: 'other', label: 'Something else' }]
  const initial = PRACTICE_AREAS.some((p) => p.slug === sp.practice) ? sp.practice! : ''
  if (initial && !areas.some((a) => a.value === initial)) areas.unshift({ value: initial, label: PRACTICE_AREAS.find((p) => p.slug === initial)!.name })
  return (
    <>
      <PageHero crumbs={[{ name: 'Free Case Review', path: '/get-started' }]} eyebrow="Free case review" title={<>Tell us once. <em>We’ll</em> do the searching.</>}
        lede="Three short steps, about two minutes. Free, private, and you’re never obligated to hire anyone." />
      <section className="section">
        <div className="wrap" style={{ maxWidth: 860 }}>
          <CaseEvaluation areas={areas} initialPractice={initial} initialLocation={sp.location?.slice(0, 80) ?? ''} />
          <p className="muted center" style={{ fontSize: '0.85rem', marginTop: 20 }}>If you are in danger, call 911. LawMatchNow is not a law firm and does not give legal advice.</p>
        </div>
      </section>
    </>
  )
}
