import type { Metadata } from 'next'
import { LegalPage } from '@/components/LegalPage'

export const metadata: Metadata = { title: 'Disclaimer', alternates: { canonical: '/disclaimer' } }

export default function Disclaimer() {
  return <LegalPage title="Disclaimer" path="/disclaimer" sections={[
    ['Not legal advice', ['The information on LawMatchNow is general legal information. It is not legal advice and may not reflect the law in your state or the latest changes. Talk to a licensed attorney about your situation.']],
    ['No attorney-client relationship', ['Using this site, submitting a form, or contacting an attorney listed here does not create an attorney-client relationship. Don’t send confidential information until an attorney has agreed to represent you.']],
    ['Not a law firm or referral service', ['LawMatchNow is a directory. We do not recommend or endorse any attorney, and we don’t evaluate attorneys’ skills. Choosing a lawyer is your decision.']],
    ['Attorney advertising', ['Some listings are paid advertising and are labeled “Featured”. Listings and attorney profiles may constitute attorney advertising in some states. Past results do not guarantee a similar outcome.']],
    ['Listing accuracy', ['Unclaimed listings are compiled from public sources and may be out of date. Attorneys can claim their profile to correct it, and anyone can report an error through our contact page.']],
  ]} />
}
