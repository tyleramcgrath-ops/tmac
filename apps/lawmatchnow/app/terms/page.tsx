import type { Metadata } from 'next'
import { LegalPage } from '@/components/LegalPage'

export const metadata: Metadata = { title: 'Terms of Use', alternates: { canonical: '/terms' } }

export default function Terms() {
  return <LegalPage title="Terms of Use" path="/terms" sections={[
    ['Using the site', ['By using LawMatchNow you agree to these terms. You may use the site for your personal, lawful purposes. Don’t scrape, copy in bulk, or interfere with the site, and don’t submit false information.']],
    ['Information only', ['Content on the site is general information, not legal advice. See our disclaimer for details.']],
    ['Attorney listings', ['Attorneys are responsible for the accuracy of their claimed profiles and for complying with the rules of professional conduct in their jurisdictions. We may edit or remove listings that are inaccurate or misleading.']],
    ['Forms and messages', ['When you submit a case review or message, you ask us to share it with attorneys who may be able to help. Attorneys are independent and are not our employees or agents.']],
    ['Liability', ['The site is provided “as is”. To the extent the law allows, LawMatchNow is not liable for decisions you make based on its content or for the services of any attorney you contact through it.']],
    ['Changes', ['We may update these terms. The date at the top shows the latest version.']],
  ]} />
}
