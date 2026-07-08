import type { Metadata } from 'next'
import { Questionnaire } from './components/questionnaire'

export const metadata: Metadata = {
  title: 'True Point — Systems Assessment',
  description:
    'A short, honest look at how your business actually runs today — and where the leverage is hiding. Find your true point in about 3 minutes.',
}

export default function QuestionnairePage() {
  return <Questionnaire />
}
