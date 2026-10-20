import type { Metadata } from 'next'
import { LegalPage } from '@/components/LegalPage'

export const metadata: Metadata = { title: 'Privacy Policy', alternates: { canonical: '/privacy' } }

export default function Privacy() {
  return <LegalPage title="Privacy Policy" path="/privacy" sections={[
    ['What we collect', ['When you submit a form we collect what you enter: your name, email, phone, location, legal issue and description. We also collect standard technical data such as pages visited and browser type.']],
    ['How we use it', ['We use your details to respond to you and, when you request a case review or message an attorney, to share them with the attorneys who may help. We don’t sell your personal information.']],
    ['Who we share it with', ['Attorneys you contact or who handle your type of case, and the service providers that run our site and email, under confidentiality obligations. We may disclose information when the law requires it.']],
    ['Analytics and cookies', ['We use Google Analytics to understand how visitors use the site, such as which pages are viewed and how people arrive. It sets cookies and sends usage data, including your IP address and device details, to Google, which processes it under its own privacy policy (policies.google.com/privacy). We use this only in aggregate and don’t use it to identify you. You can block these cookies in your browser or install Google’s opt-out add-on (tools.google.com/dlpage/gaoptout).']],
    ['How long we keep it', ['We keep form submissions only as long as needed to handle your request and meet legal obligations, then delete them.']],
    ['Your choices', ['You can ask us to access, correct or delete your information by emailing us. Residents of some states, including California, have additional rights, which we honor.']],
  ]} />
}
