import type { Metadata } from 'next'
import Link from 'next/link'
import { CtaBand, JsonLd, PageHero } from '@/components/ui'
import { abs } from '@/lib/site'

export const metadata: Metadata = {
  title: 'Legal Emergency? What to Do Right Now',
  description: 'Arrested, injured, served with papers or facing deportation? The first steps to take, what to avoid, and when to call a lawyer.',
  alternates: { canonical: '/emergency' },
}

const CASES = [
  { title: 'You or someone you love was arrested', practice: 'criminal-defense', guide: 'what-to-do-if-you-are-arrested', steps: [
    'Stay calm and don’t physically resist, even if you believe the arrest is wrong.',
    'Say clearly that you want to remain silent and that you want a lawyer. Then stop talking about the case.',
    'Don’t consent to searches of your phone, car or home. Saying no out loud preserves your rights.',
    'Don’t discuss the case on jail phones or by text; those are often recorded.',
    'Contact a criminal defense attorney as soon as possible, ideally before the first court appearance.',
  ] },
  { title: 'You were hurt in an accident', practice: 'personal-injury', guide: 'what-to-do-after-a-car-accident', steps: [
    'Call 911 if anyone is hurt, and get medical care even if you feel fine. Some injuries appear later.',
    'Photograph the scene, vehicles and injuries, and get names and contact details of witnesses.',
    'Exchange insurance information, but don’t admit fault or guess about what happened.',
    'Report the accident to your insurer. Be careful giving recorded statements to the other driver’s insurer.',
    'Keep every bill, record and receipt, and talk to a personal injury lawyer before signing a settlement.',
  ] },
  { title: 'You were served with court papers', practice: 'business-law', guide: 'statute-of-limitations-explained', steps: [
    'Don’t ignore them. Missing the response deadline can lead to a default judgment against you.',
    'Find the deadline on the summons. It is often measured in days, not weeks.',
    'Keep the papers and the envelope, and write down when and how you received them.',
    'Talk to a lawyer who handles this type of case right away about how to respond.',
  ] },
  { title: 'Immigration enforcement contacted you', practice: 'immigration', guide: 'attorney-client-privilege', steps: [
    'You have the right to remain silent, whatever your immigration status.',
    'Don’t open your door unless an officer shows a warrant signed by a judge. Ask them to slide it under the door.',
    'Don’t sign any document you don’t understand, and don’t carry false papers.',
    'Contact an immigration attorney or accredited representative as soon as possible.',
  ] },
]

export default function Emergency() {
  return (
    <>
      <JsonLd data={CASES.map((c) => ({ '@context': 'https://schema.org', '@type': 'HowTo', name: `What to do if ${c.title.toLowerCase()}`, url: abs('/emergency'), step: c.steps.map((s, i) => ({ '@type': 'HowToStep', position: i + 1, text: s })) }))} />
      <PageHero crumbs={[{ name: 'Legal Emergency', path: '/emergency' }]} eyebrow="Urgent help" title="Legal emergency? Start here."
        lede="If anyone is in danger, call 911 first. Then use the steps below. This is general information; a lawyer can advise you on your situation." />
      <section className="section">
        <div className="wrap grid c2">
          {CASES.map((c) => (
            <div key={c.title} className="card">
              <h2 style={{ fontSize: '1.7rem' }}>{c.title}</h2>
              <ol style={{ paddingLeft: 20 }}>{c.steps.map((s) => <li key={s} style={{ marginBottom: 8 }}>{s}</li>)}</ol>
              <p style={{ display: 'flex', gap: 18, flexWrap: 'wrap', margin: 0 }}>
                <Link className="link-arrow" href={`/practice-area/${c.practice}`}>Find a lawyer</Link>
                <Link className="link-arrow" href={`/guide/${c.guide}`}>Read the guide</Link>
              </p>
            </div>
          ))}
        </div>
      </section>
      <CtaBand title="Need someone to call you back?" text="Request a free case review and tell us about any court date or deadline." />
    </>
  )
}
